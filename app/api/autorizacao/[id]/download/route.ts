import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import QRCode from 'qrcode';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('Iniciando download da autorização...');
  try {
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Buscar a autorização usando SQL bruto para evitar problemas de tipagem
    const [autorizacao] = await prisma.$queryRaw<any[]>`
      SELECT 
        a.*,
        u.nome as entidadeNome,
        u.nif as entidadeNif,
        sa.numeroFactura as numeroFactura
      FROM autorizacao a
      JOIN solicitacaoautorizacao sa ON a.solicitacaoId = sa.id
      JOIN utente u ON sa.utenteId = u.id
      WHERE a.id = ${id}
    `;
    
    // Formatar o número do processo no formato PA-000000
    const numeroProcesso = `PA-${String(autorizacao.solicitacaoId).padStart(6, '0')}`;

    if (!autorizacao) {
      return NextResponse.json({ error: 'Autorização não encontrada' }, { status: 404 });
    }

    // Buscar códigos pautais
    const codigosPautais = await prisma.$queryRaw<any[]>`
      SELECT codigo, descricao FROM codigopautalautorizacao
      WHERE autorizacaoId = ${id}
    `;
    
    // Obter a descrição dos códigos pautais
    const descricaoCodigosPautais = Array.isArray(codigosPautais) 
      ? codigosPautais.map((cp: any) => cp.descricao).join(', ')
      : '';

    console.log('Dados da autorização:', autorizacao);
    console.log('Códigos pautais:', codigosPautais);
    console.log('Descrição dos códigos pautais:', descricaoCodigosPautais);
    
    // Gerar QR Code para a autorização
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const verificationUrl = `${baseUrl}/verificar/${autorizacao.numeroProcesso}`;
    console.log('URL de verificação:', verificationUrl);
    
    // Gerar QR Code como data URL
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      console.log('QR Code gerado com sucesso');
    } catch (qrError) {
      console.error('Erro ao gerar QR Code:', qrError);
      // Continuar mesmo sem o QR Code
    }
    
    // Abordagem alternativa: Armazenar os dados em uma sessão temporária
    // e redirecionar para a página de visualização com apenas o ID
    try {
      // Criar um objeto com os dados necessários para o PDF
      const pdfData = {
        id: autorizacao.id,
        numeroAutorizacao: autorizacao.numeroAutorizacao,
        tipoAutorizacao: autorizacao.tipoAutorizacao,
        entidade: autorizacao.entidadeNome,
        nif: autorizacao.entidadeNif,
        numeroFactura: autorizacao.numeroFactura,
        produtos: descricaoCodigosPautais || autorizacao.produtos,
        quantidade: autorizacao.quantidade,
        codigosPautais: codigosPautais.map((cp: any) => cp.codigo).join(', '),
        dataEmissao: autorizacao.dataEmissao,
        numeroProcesso: numeroProcesso,
        assinadoPor: autorizacao.assinadoPor
      };
      
      console.log('Dados do PDF preparados:', pdfData);
      
      // Gerar o PDF usando @react-pdf/renderer (via servidor)
      try {
        console.log('Gerando PDF no servidor...');
        
        // Import dynamically to avoid SSR issues
        const { renderToBuffer } = await import('@react-pdf/renderer');
        const { default: AutorizacaoAmbientalPDF } = await import('@/components/pdf/AutorizacaoAmbientalPDF');
        
        // Gerar o PDF
        const pdfBuffer = await renderToBuffer(
          AutorizacaoAmbientalPDF({ data: pdfData, qrCodeUrl: qrCodeDataUrl })
        );
        
        // Configurar headers para download do arquivo
        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `attachment; filename="autorizacao-ambiental-${numeroProcesso}.pdf"`);
        
        // Retornar o PDF como um arquivo para download
        return new NextResponse(pdfBuffer, {
          status: 200,
          headers
        });
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 });
      }
    } catch (error) {
      console.error('Erro ao processar autorização:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'Sem stack trace');
      return NextResponse.json({ 
        error: 'Erro ao processar autorização',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 });
    }
  
  } catch (error) {
    console.error('Erro ao processar autorização:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Sem stack trace');
    return NextResponse.json({ 
      error: 'Erro ao processar autorização',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
