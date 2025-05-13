import { NextResponse } from "next/server";
import { PrismaClient, periodo_monitorizacao } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET - Listar todas as configurações de monitorização
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    const configuracoes = await prisma.configuracaoMonitorizacao.findMany({
      include: {
        utente: {
          select: {
            id: true,
            nome: true,
            nif: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(configuracoes);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
  }
}

// POST - Criar uma nova configuração de monitorização
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    const body = await request.json();
    const { utenteId, tipoPeriodo, dataInicio } = body;
    
    if (!utenteId || !tipoPeriodo || !dataInicio) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }
    
    // Verificar se já existe uma configuração para este utente
    const existingConfig = await prisma.configuracaoMonitorizacao.findUnique({
      where: { utenteId: parseInt(utenteId) },
    });
    
    if (existingConfig) {
      return NextResponse.json({ error: "Já existe uma configuração para este utente" }, { status: 400 });
    }
    
    // Criar a configuração
    const novaConfiguracao = await prisma.configuracaoMonitorizacao.create({
      data: {
        utenteId: parseInt(utenteId),
        tipoPeriodo: tipoPeriodo as periodo_monitorizacao,
        dataInicio: new Date(dataInicio),
      },
      include: {
        utente: {
          select: {
            id: true,
            nome: true,
            nif: true,
            email: true,
          },
        },
      },
    });
    
    // Gerar os períodos com base no tipo
    await gerarPeriodos(novaConfiguracao.id, tipoPeriodo as periodo_monitorizacao, new Date(dataInicio));
    
    return NextResponse.json(novaConfiguracao);
  } catch (error) {
    console.error("Erro ao criar configuração:", error);
    return NextResponse.json({ error: "Erro ao criar configuração" }, { status: 500 });
  }
}

// Função auxiliar para gerar períodos
async function gerarPeriodos(configuracaoId: number, tipoPeriodo: periodo_monitorizacao, dataInicio: Date) {
  const periodos = [];
  const dataInicioAno = new Date(dataInicio.getFullYear(), 0, 1); // 1º de janeiro do ano da data de início
  
  switch (tipoPeriodo) {
    case "ANUAL":
      // Um período por ano
      periodos.push({
        configuracaoId,
        numeroPeriodo: 1,
        dataInicio: dataInicioAno,
        dataFim: new Date(dataInicioAno.getFullYear(), 11, 31), // 31 de dezembro
        estado: "ABERTO",
      });
      break;
      
    case "SEMESTRAL":
      // Dois períodos por ano
      periodos.push({
        configuracaoId,
        numeroPeriodo: 1,
        dataInicio: dataInicioAno,
        dataFim: new Date(dataInicioAno.getFullYear(), 5, 30), // 30 de junho
        estado: "ABERTO",
      });
      
      periodos.push({
        configuracaoId,
        numeroPeriodo: 2,
        dataInicio: new Date(dataInicioAno.getFullYear(), 6, 1), // 1º de julho
        dataFim: new Date(dataInicioAno.getFullYear(), 11, 31), // 31 de dezembro
        estado: "FECHADO",
      });
      break;
      
    case "TRIMESTRAL":
      // Quatro períodos por ano
      periodos.push({
        configuracaoId,
        numeroPeriodo: 1,
        dataInicio: dataInicioAno,
        dataFim: new Date(dataInicioAno.getFullYear(), 2, 31), // 31 de março
        estado: "ABERTO",
      });
      
      periodos.push({
        configuracaoId,
        numeroPeriodo: 2,
        dataInicio: new Date(dataInicioAno.getFullYear(), 3, 1), // 1º de abril
        dataFim: new Date(dataInicioAno.getFullYear(), 5, 30), // 30 de junho
        estado: "FECHADO",
      });
      
      periodos.push({
        configuracaoId,
        numeroPeriodo: 3,
        dataInicio: new Date(dataInicioAno.getFullYear(), 6, 1), // 1º de julho
        dataFim: new Date(dataInicioAno.getFullYear(), 8, 30), // 30 de setembro
        estado: "FECHADO",
      });
      
      periodos.push({
        configuracaoId,
        numeroPeriodo: 4,
        dataInicio: new Date(dataInicioAno.getFullYear(), 9, 1), // 1º de outubro
        dataFim: new Date(dataInicioAno.getFullYear(), 11, 31), // 31 de dezembro
        estado: "FECHADO",
      });
      break;
  }
  
  // Inserir os períodos no banco de dados
  await prisma.periodoMonitorizacao.createMany({
    data: periodos,
  });
}
