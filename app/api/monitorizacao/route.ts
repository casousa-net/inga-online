import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "app/api/auth/[...nextauth]/route";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// GET - Buscar monitorizações do utente logado
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const periodoId = searchParams.get("periodoId");
    
    // Se for admin ou técnico, pode ver todas as monitorizações
    if (session.user.role === "admin" || session.user.role === "tecnico" || session.user.role === "chefe" || session.user.role === "direccao") {
      const monitorizacoes = await prisma.monitorizacao.findMany({
        where: periodoId ? { periodoId: parseInt(periodoId) } : {},
        include: {
          utente: {
            select: {
              id: true,
              nome: true,
              nif: true,
              email: true,
            },
          },
          periodo: true,
        },
        orderBy: { dataSubmissao: 'desc' },
      });
      
      return NextResponse.json(monitorizacoes);
    }
    
    // Se for utente, só pode ver suas próprias monitorizações
    if (session.user.role === "utente") {
      const userId = session.user.id;
      
      const monitorizacoes = await prisma.monitorizacao.findMany({
        where: {
          utenteId: userId,
          ...(periodoId ? { periodoId: parseInt(periodoId) } : {}),
        },
        include: {
          periodo: true,
        },
        orderBy: { dataSubmissao: 'desc' },
      });
      
      return NextResponse.json(monitorizacoes);
    }
    
    return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  } catch (error) {
    console.error("Erro ao buscar monitorizações:", error);
    return NextResponse.json({ error: "Erro ao buscar monitorizações" }, { status: 500 });
  }
}

// POST - Enviar um novo relatório de monitorização
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "utente") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    const formData = await request.formData();
    const periodoId = formData.get("periodoId") as string;
    const relatorio = formData.get("relatorio") as File;
    
    if (!periodoId || !relatorio) {
      return NextResponse.json({ error: "Período e relatório são obrigatórios" }, { status: 400 });
    }
    
    // Verificar se o período existe e pertence ao utente
    const periodo = await prisma.periodoMonitorizacao.findFirst({
      where: {
        id: parseInt(periodoId),
        configuracao: {
          utenteId: session.user.id,
        },
      },
    });
    
    if (!periodo) {
      return NextResponse.json({ error: "Período não encontrado ou não pertence ao utente" }, { status: 404 });
    }
    
    // Verificar se o período está aberto
    if (periodo.estado !== "ABERTO") {
      return NextResponse.json({ 
        error: "Só é possível enviar relatórios em períodos abertos",
        estadoAtual: periodo.estado
      }, { status: 400 });
    }
    
    // Verificar se já existe uma monitorização para este período
    const existingMonitorizacao = await prisma.monitorizacao.findFirst({
      where: {
        utenteId: session.user.id,
        periodoId: parseInt(periodoId),
      },
    });
    
    if (existingMonitorizacao) {
      return NextResponse.json({ error: "Já existe um relatório enviado para este período" }, { status: 400 });
    }
    
    // Salvar o arquivo
    const bytes = await relatorio.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Criar diretório de uploads se não existir
    const uploadDir = path.join(process.cwd(), "public", "uploads", "monitorizacao");
    
    // Gerar nome único para o arquivo
    const fileName = `${uuidv4()}_${relatorio.name}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Salvar o arquivo
    await writeFile(filePath, buffer);
    
    // Gerar número de processo
    const totalMonitorizacoes = await prisma.monitorizacao.count();
    const numeroProcesso = `MO-${(totalMonitorizacoes + 1).toString().padStart(6, '0')}`;
    
    // Criar a monitorização no banco de dados
    const novaMonitorizacao = await prisma.monitorizacao.create({
      data: {
        utenteId: session.user.id,
        periodoId: parseInt(periodoId),
        numeroProcesso,
        dataSubmissao: new Date(),
        estado: "Pendente",
        relatorioPath: `/uploads/monitorizacao/${fileName}`,
      },
    });
    
    return NextResponse.json(novaMonitorizacao);
  } catch (error) {
    console.error("Erro ao enviar relatório:", error);
    return NextResponse.json({ error: "Erro ao enviar relatório" }, { status: 500 });
  }
}
