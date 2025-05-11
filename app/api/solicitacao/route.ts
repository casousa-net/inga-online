import { NextRequest, NextResponse } from "next/server";
import { prisma, safeDbOperation, checkDatabaseConnection } from "@/lib/prisma";
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    // Verificar a conexão com o banco de dados
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      console.error('Banco de dados não disponível:', dbStatus.error);
      return NextResponse.json({ 
        error: "Serviço temporariamente indisponível", 
        details: "Erro de conexão com o banco de dados"
      }, { status: 503 });
    }
    
    // Pegue o ID do usuário autenticado pela query string
    const utenteId = Number(req.nextUrl.searchParams.get("utenteId"));
    if (!utenteId) {
      return NextResponse.json({ error: "Utente não autenticado" }, { status: 401 });
    }

    // Verificar se o utente existe usando operação segura
    const utente = await safeDbOperation(
      () => prisma.utente.findUnique({
        where: { id: utenteId },
        select: { id: true }
      }),
      null
    );

    if (!utente) {
      console.error(`Utente com ID ${utenteId} não encontrado ou erro de conexão`);
      return NextResponse.json({ error: "Utente não encontrado" }, { status: 404 });
    }

    // Busque as solicitações desse utente com tratamento de erro
    const solicitacoes = await safeDbOperation(
      () => prisma.solicitacaoautorizacao.findMany({
        where: { utenteId },
        include: {
          moeda: true,
          solicitacaoitem: true,
          utente: {
            select: {
              id: true,
              nome: true,
              nif: true,
              email: true,
              telefone: true,
              endereco: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
      }),
      []
    );

    return NextResponse.json(solicitacoes);
  } catch (error) {
    console.error('Erro geral na API de solicitações:', error);
    return NextResponse.json({ 
      error: "Erro ao processar solicitações", 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Extrair e validar dados básicos
    const tipo = formData.get("tipo");
    const moedaId = formData.get("moeda");
    const utenteId = formData.get("utenteId");
    const itensJson = formData.get("itens");

    console.log('Dados recebidos:', { tipo, moedaId, utenteId, itensJson });

    if (!tipo || !moedaId || !utenteId || !itensJson) {
      return NextResponse.json({
        error: "Dados incompletos",
        details: { tipo, moedaId, utenteId, itensJson }
      }, { status: 400 });
    }

    // Validar e converter dados
    const itens = JSON.parse(itensJson as string);
    if (!Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({
        error: "Lista de itens inválida",
        details: { itens }
      }, { status: 400 });
    }

    // Validar utente
    const utente = await prisma.utente.findUnique({
      where: { id: Number(utenteId) }
    });
    if (!utente) {
      return NextResponse.json({
        error: "Utente não encontrado",
        details: { utenteId }
      }, { status: 400 });
    }

    // Validar moeda
    const moeda = await prisma.moeda.findUnique({
      where: { id: Number(moedaId) }
    });
    if (!moeda) {
      return NextResponse.json({
        error: "Moeda não encontrada",
        details: { moedaId }
      }, { status: 400 });
    }

    // Validar e calcular itens
    let valorTotalKz = 0;
    const itensCriados = [];

    for (const item of itens) {
      if (!item.codigoPautalId || !item.quantidade || !item.precoUnitario) {
        return NextResponse.json({
          error: "Dados do item incompletos",
          details: { item }
        }, { status: 400 });
      }

      const codigo = await prisma.codigopautal.findUnique({
        where: { id: item.codigoPautalId }
      });
      if (!codigo) {
        return NextResponse.json({
          error: "Código pautal não encontrado",
          details: { codigoPautalId: item.codigoPautalId }
        }, { status: 400 });
      }

      const valorTotal = Number(item.precoUnitario) * moeda.taxaCambio;
      const valorItemKz = Number(item.quantidade) * valorTotal;
      valorTotalKz += valorItemKz;

      itensCriados.push({
        codigoPautalId: item.codigoPautalId,
        quantidade: Number(item.quantidade),
        valorUnitario: Number(item.precoUnitario),
        valorTotal,
        descricao: ""
      });
    }

    // Validar documentos
    const documentos = [
      { campo: 'carta', arquivo: formData.get('carta') },
      { campo: 'factura', arquivo: formData.get('factura') },
      { campo: 'comprovativo', arquivo: formData.get('comprovativo') },
      { campo: 'especificacao', arquivo: formData.get('especificacao') }
    ];

    for (const doc of documentos) {
      if (!doc.arquivo || !(doc.arquivo instanceof File)) {
        return NextResponse.json({
          error: "Documento inválido ou não encontrado",
          details: { campo: doc.campo }
        }, { status: 400 });
      }
    }

    const fotos = formData.getAll('fotos');
    if (!fotos.length || !fotos.every(f => f instanceof File)) {
      return NextResponse.json({
        error: "É necessário enviar pelo menos uma foto válida",
        details: { fotos: fotos.length }
      }, { status: 400 });
    }

    // Criar solicitação
    console.log('Criando solicitação com dados:', {
      tipo,
      utenteId: Number(utenteId),
      moedaId: Number(moedaId),
      valorTotalKz,
      itens: itensCriados
    });

    // Criar a solicitação primeiro sem os itens
    const solicitacao = await prisma.solicitacaoautorizacao.create({
      data: {
        tipo: tipo as string,
        utenteId: Number(utenteId),
        moedaId: Number(moedaId),
        valorTotalKz,
        status: "Pendente",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        moeda: true
      }
    });
    
    // Adicionar os itens separadamente
    for (const item of itensCriados) {
      await prisma.solicitacaoitem.create({
        data: {
          solicitacaoId: solicitacao.id,
          codigoPautalId: item.codigoPautalId,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          valorTotal: item.valorTotal,
          descricao: item.descricao || ""
        } as any
      });
    }
    
    // Criar pasta para documentos se não existir
    const documentosDir = path.join(process.cwd(), 'public', 'uploads', 'documentos');
    if (!fs.existsSync(documentosDir)) {
      fs.mkdirSync(documentosDir, { recursive: true });
    }
    
    // Criar documentos
    for (const doc of documentos) {
      const fileName = (doc.arquivo as File).name;
      const filePath = `/uploads/documentos/${fileName}`;
      
      // Salvar o arquivo fisicamente
      const fileArrayBuffer = await (doc.arquivo as File).arrayBuffer();
      const fileBuffer = Buffer.from(fileArrayBuffer);
      fs.writeFileSync(path.join(process.cwd(), 'public', filePath), fileBuffer);
      
      await prisma.documentosolicitacao.create({
        data: {
          solicitacaoId: solicitacao.id,
          tipo: doc.campo,
          nome: fileName,
          url: filePath,
          nomeArquivo: fileName,
          caminhoArquivo: filePath
        } as any
      });
    }
    
    // Criar pasta para fotos se não existir
    const fotosDir = path.join(process.cwd(), 'public', 'uploads', 'fotos');
    if (!fs.existsSync(fotosDir)) {
      fs.mkdirSync(fotosDir, { recursive: true });
    }
    
    // Criar documentos de fotos
    for (const foto of fotos) {
      const fileName = (foto as File).name;
      const filePath = `/uploads/fotos/${fileName}`;
      
      // Salvar o arquivo fisicamente
      const fileArrayBuffer = await (foto as File).arrayBuffer();
      const fileBuffer = Buffer.from(fileArrayBuffer);
      fs.writeFileSync(path.join(process.cwd(), 'public', filePath), fileBuffer);
      
      await prisma.documentosolicitacao.create({
        data: {
          solicitacaoId: solicitacao.id,
          tipo: 'foto',
          nome: fileName,
          url: filePath,
          nomeArquivo: fileName,
          caminhoArquivo: filePath
        } as any
      });
    }
    
    // Buscar a solicitação completa com todos os relacionamentos
    const solicitacaoCompleta = await prisma.solicitacaoautorizacao.findUnique({
      where: { id: solicitacao.id },
      include: {
        moeda: true,
        solicitacaoitem: {
          include: {
            codigopautal: true
          }
        },
        documentosolicitacao: true,
        utente: true
      }
    });
    
    console.log('Solicitação criada com sucesso:', solicitacaoCompleta);
    return NextResponse.json(solicitacaoCompleta);


  } catch (error) {
    console.error('Erro detalhado ao criar solicitação:', error);
    let errorMessage = "Erro ao criar solicitação";
    let errorDetails = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = error;
    }

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}
