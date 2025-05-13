import { NextResponse } from "next/server";
import { PrismaClient, estado_periodo } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET - Listar todas as solicitações de reabertura pendentes
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== "admin" && session.user.role !== "direccao")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    const solicitacoes = await prisma.periodoMonitorizacao.findMany({
      where: {
        estado: "REABERTURA_SOLICITADA",
      },
      include: {
        configuracao: {
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
        },
      },
      orderBy: {
        dataFim: 'desc',
      },
    });
    
    return NextResponse.json(solicitacoes);
  } catch (error) {
    console.error("Erro ao listar solicitações de reabertura:", error);
    return NextResponse.json({ error: "Erro ao listar solicitações de reabertura" }, { status: 500 });
  }
}

// POST - Aprovar ou rejeitar uma solicitação de reabertura
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== "admin" && session.user.role !== "direccao")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    const body = await request.json();
    const { periodoId, acao } = body;
    
    if (!periodoId || !acao) {
      return NextResponse.json({ error: "ID do período e ação são obrigatórios" }, { status: 400 });
    }
    
    if (acao !== "aprovar" && acao !== "rejeitar") {
      return NextResponse.json({ error: "Ação inválida. Use 'aprovar' ou 'rejeitar'" }, { status: 400 });
    }
    
    // Verificar se o período existe e está com solicitação de reabertura
    const periodo = await prisma.periodoMonitorizacao.findFirst({
      where: {
        id: periodoId,
        estado: "REABERTURA_SOLICITADA",
      },
    });
    
    if (!periodo) {
      return NextResponse.json({ 
        error: "Período não encontrado ou não está com solicitação de reabertura" 
      }, { status: 404 });
    }
    
    // Atualizar o estado do período
    const novoEstado = acao === "aprovar" ? "ABERTO" : "FECHADO";
    
    const periodoAtualizado = await prisma.periodoMonitorizacao.update({
      where: { id: periodoId },
      data: {
        estado: novoEstado as estado_periodo,
      },
    });
    
    return NextResponse.json({
      mensagem: acao === "aprovar" 
        ? "Solicitação de reabertura aprovada com sucesso" 
        : "Solicitação de reabertura rejeitada",
      periodo: periodoAtualizado
    });
  } catch (error) {
    console.error("Erro ao processar solicitação de reabertura:", error);
    return NextResponse.json({ error: "Erro ao processar solicitação de reabertura" }, { status: 500 });
  }
}
