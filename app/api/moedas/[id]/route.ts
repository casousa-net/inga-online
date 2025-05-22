import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: any
) {
  const { params } = context;
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    // Validação básica
    if (!body.nome || !body.simbolo || body.taxaCambio === undefined) {
      return NextResponse.json(
        { error: "Nome, símbolo e taxa de câmbio são obrigatórios" },
        { status: 400 }
      );
    }
    
    // Verificar se a moeda existe
    const existingMoeda = await prisma.moeda.findUnique({
      where: { id }
    });
    
    if (!existingMoeda) {
      return NextResponse.json(
        { error: "Moeda não encontrada" },
        { status: 404 }
      );
    }
    
    // Verificar se o nome já está em uso por outra moeda
    const duplicateName = await prisma.moeda.findFirst({
      where: { 
        nome: body.nome,
        id: { not: id }
      }
    });
    
    if (duplicateName) {
      return NextResponse.json(
        { error: "Já existe outra moeda com este nome" },
        { status: 409 }
      );
    }
    
    // Atualizar a moeda
    const moeda = await prisma.moeda.update({
      where: { id },
      data: {
        nome: body.nome,
        simbolo: body.simbolo,
        taxaCambio: body.taxaCambio
      }
    });
    
    return NextResponse.json(moeda);
  } catch (error) {
    console.error("Erro ao atualizar moeda:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: any
) {
  const { params } = context;
  try {
    const id = parseInt(params.id);
    
    // Verificar se a moeda existe
    const existingMoeda = await prisma.moeda.findUnique({
      where: { id }
    });
    
    if (!existingMoeda) {
      return NextResponse.json(
        { error: "Moeda não encontrada" },
        { status: 404 }
      );
    }
    
    // Excluir a moeda
    await prisma.moeda.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir moeda:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
