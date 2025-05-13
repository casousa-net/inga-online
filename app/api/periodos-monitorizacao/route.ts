import { NextResponse } from "next/server";
import { PrismaClient, estado_periodo } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET - Buscar períodos de monitorização do utente logado
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    // Se for admin, pode ver todos os períodos
    if (session.user.role === "admin") {
      const periodos = await prisma.periodoMonitorizacao.findMany({
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
          monitorizacoes: true,
        },
      });
      
      return NextResponse.json(periodos);
    }
    
    // Se for utente, só pode ver seus próprios períodos
    if (session.user.role === "utente") {
      const userId = session.user.id;
      
      // Buscar a configuração do utente
      const configuracao = await prisma.configuracaoMonitorizacao.findUnique({
        where: { utenteId: userId },
        include: {
          periodos: {
            orderBy: { numeroPeriodo: 'asc' },
            include: {
              monitorizacoes: true,
            },
          },
        },
      });
      
      if (!configuracao) {
        return NextResponse.json({ error: "Nenhuma configuração de monitorização encontrada" }, { status: 404 });
      }
      
      return NextResponse.json(configuracao);
    }
    
    return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  } catch (error) {
    console.error("Erro ao buscar períodos:", error);
    return NextResponse.json({ error: "Erro ao buscar períodos" }, { status: 500 });
  }
}

// POST - Solicitar reabertura de um período
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "utente") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    const body = await request.json();
    const { periodoId } = body;
    
    if (!periodoId) {
      return NextResponse.json({ error: "ID do período é obrigatório" }, { status: 400 });
    }
    
    // Verificar se o período existe e pertence ao utente
    const periodo = await prisma.periodoMonitorizacao.findFirst({
      where: {
        id: periodoId,
        configuracao: {
          utenteId: session.user.id,
        },
      },
      include: {
        configuracao: true,
      },
    });
    
    if (!periodo) {
      return NextResponse.json({ error: "Período não encontrado ou não pertence ao utente" }, { status: 404 });
    }
    
    // Verificar se o período está fechado
    if (periodo.estado !== "FECHADO") {
      return NextResponse.json({ 
        error: "Só é possível solicitar reabertura de períodos fechados",
        estadoAtual: periodo.estado
      }, { status: 400 });
    }
    
    // Atualizar o estado do período
    const periodoAtualizado = await prisma.periodoMonitorizacao.update({
      where: { id: periodoId },
      data: {
        estado: "REABERTURA_SOLICITADA" as estado_periodo,
      },
    });
    
    return NextResponse.json(periodoAtualizado);
  } catch (error) {
    console.error("Erro ao solicitar reabertura:", error);
    return NextResponse.json({ error: "Erro ao solicitar reabertura" }, { status: 500 });
  }
}
