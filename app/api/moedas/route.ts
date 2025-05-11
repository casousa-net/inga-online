import { NextResponse } from "next/server";
import { prisma, safeDbOperation, checkDatabaseConnection } from "@/lib/prisma";

export async function GET() {
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
    
    // Usar operação segura para buscar moedas
    const moedas = await safeDbOperation(
      () => prisma.moeda.findMany(),
      []
    );
    
    return NextResponse.json(moedas);
  } catch (error) {
    console.error('Erro ao buscar moedas:', error);
    return NextResponse.json({ 
      error: "Erro ao buscar moedas", 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validação básica
    if (!body.nome || !body.simbolo || body.taxaCambio === undefined) {
      return NextResponse.json(
        { error: "Nome, símbolo e taxa de câmbio são obrigatórios" },
        { status: 400 }
      );
    }
    
    // Verificar se a moeda já existe
    const existingMoeda = await prisma.moeda.findUnique({
      where: { nome: body.nome }
    });
    
    if (existingMoeda) {
      return NextResponse.json(
        { error: "Moeda já cadastrada" },
        { status: 409 }
      );
    }
    
    // Criar a moeda
    const moeda = await prisma.moeda.create({
      data: {
        nome: body.nome,
        simbolo: body.simbolo,
        taxaCambio: body.taxaCambio
      }
    });
    
    return NextResponse.json(moeda, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar moeda:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
