import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Listar todas as configurações de monitorização
export async function GET(req: NextRequest) {
  console.log('Listando configurações de monitorização...');
  try {
    // Buscar todas as configurações com utentes e períodos
    const configuracoes = await prisma.configuracaoMonitorizacao.findMany({
      include: {
        utente: {
          select: {
            id: true,
            nome: true,
            nif: true,
            email: true
          }
        },
        periodos: {
          orderBy: {
            numeroPeriodo: 'asc'
          }
        }
      }
    });
    
    return NextResponse.json(configuracoes);
  } catch (error) {
    console.error("Erro ao listar configurações de monitorização:", error);
    return NextResponse.json(
      { error: "Erro ao listar configurações de monitorização" },
      { status: 500 }
    );
  }
}

// POST - Criar nova configuração de monitorização
export async function POST(req: NextRequest) {
  console.log('Criando configuração de monitorização...');
  try {
    const data = await req.json();
    const { utenteId, tipoPeriodo, dataInicio } = data;
    
    console.log('Dados recebidos:', { utenteId, tipoPeriodo, dataInicio });
    
    if (!utenteId || !tipoPeriodo || !dataInicio) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }
    
    // Verificar se o utente existe
    const utente = await prisma.utente.findUnique({
      where: { id: utenteId }
    });
    
    if (!utente) {
      return NextResponse.json(
        { error: "Utente não encontrado" },
        { status: 404 }
      );
    }
    
    // Verificar se já existe configuração para este utente
    const existingConfig = await prisma.configuracaoMonitorizacao.findFirst({
      where: { utenteId }
    });
    
    if (existingConfig) {
      return NextResponse.json(
        { error: "Já existe uma configuração para este utente" },
        { status: 400 }
      );
    }
    
    console.log('Criando configuração...');
    
    // Criar configuração
    const configuracao = await prisma.configuracaoMonitorizacao.create({
      data: {
        utenteId,
        tipoPeriodo,
        dataInicio: new Date(dataInicio)
      }
    });
    
    console.log('Configuração criada:', configuracao);
    
    // Criar períodos com base no tipo de período
    const periodos: { id: number; dataInicio: Date; numeroPeriodo: number; configuracaoId: number; dataFim: Date; estado: string; }[] = [];
    const dataInicioObj = new Date(dataInicio);
    let numeroPeriodo = 1;
    
    // Função para criar períodos
    const criarPeriodos = async () => {
      const periodosMeses = tipoPeriodo === 'ANUAL' ? 12 : tipoPeriodo === 'SEMESTRAL' ? 6 : 3;
      const quantidadePeriodos = 12 / periodosMeses; // Quantos períodos em um ano
      
      for (let i = 0; i < quantidadePeriodos; i++) {
        const inicio = new Date(dataInicioObj);
        inicio.setMonth(dataInicioObj.getMonth() + (i * periodosMeses));
        
        const fim = new Date(inicio);
        fim.setMonth(inicio.getMonth() + periodosMeses - 1);
        fim.setDate(new Date(fim.getFullYear(), fim.getMonth() + 1, 0).getDate()); // Último dia do mês
        
        console.log(`Criando período ${numeroPeriodo}:`, { inicio, fim });
        
        const periodo = await prisma.periodoMonitorizacao.create({
          data: {
            configuracaoId: configuracao.id,
            numeroPeriodo,
            dataInicio: inicio,
            dataFim: fim,
            estado: 'ABERTO'
          }
        });
        
        periodos.push(periodo);
        numeroPeriodo++;
      }
    };
    
    await criarPeriodos();
    
    return NextResponse.json({
      configuracao,
      periodos
    });
    
  } catch (error) {
    console.error("Erro ao criar configuração de monitorização:", error);
    return NextResponse.json(
      { error: "Erro ao criar configuração de monitorização" },
      { status: 500 }
    );
  }
}
