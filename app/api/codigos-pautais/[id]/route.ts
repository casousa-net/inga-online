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
    if (!body.codigo || !body.descricao) {
      return NextResponse.json(
        { error: "Código e descrição são obrigatórios" },
        { status: 400 }
      );
    }
    
    // Validar formato do código (8 dígitos)
    if (body.codigo.length !== 8 || !/^\d+$/.test(body.codigo)) {
      return NextResponse.json(
        { error: "O código pautal deve ter exatamente 8 dígitos" },
        { status: 400 }
      );
    }
    
    // Verificar se o código pautal existe
    const existingCodigo = await prisma.codigoPautal.findUnique({
      where: { id }
    });
    
    if (!existingCodigo) {
      return NextResponse.json(
        { error: "Código pautal não encontrado" },
        { status: 404 }
      );
    }
    
    // Verificar se o código já está em uso por outro registro
    const duplicateCode = await prisma.codigoPautal.findFirst({
      where: { 
        codigo: body.codigo,
        id: { not: id }
      }
    });
    
    if (duplicateCode) {
      return NextResponse.json(
        { error: "Já existe outro registro com este código pautal" },
        { status: 409 }
      );
    }
    
    // Atualizar o código pautal
    const codigoPautal = await prisma.codigoPautal.update({
      where: { id },
      data: {
        codigo: body.codigo,
        descricao: body.descricao
      }
    });
    
    return NextResponse.json(codigoPautal);
  } catch (error) {
    console.error("Erro ao atualizar código pautal:", error);
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
    
    // Verificar se o código pautal existe
    const existingCodigo = await prisma.codigoPautal.findUnique({
      where: { id }
    });
    
    if (!existingCodigo) {
      return NextResponse.json(
        { error: "Código pautal não encontrado" },
        { status: 404 }
      );
    }
    
    // Excluir o código pautal
    await prisma.codigoPautal.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir código pautal:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
