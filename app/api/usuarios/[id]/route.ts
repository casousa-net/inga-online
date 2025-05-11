import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// Obter usuário por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    const usuario = await prisma.utente.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        nif: true,
        telefone: true,
        endereco: true,
        role: true,
        departamento: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

// Atualizar usuário
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    // Verificar se o usuário existe
    const existingUser = await prisma.utente.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    
    // Verificar se o email já está em uso por outro usuário
    if (body.email && body.email !== existingUser.email) {
      const duplicateEmail = await prisma.utente.findFirst({
        where: { 
          email: body.email,
          id: { not: id }
        }
      });
      
      if (duplicateEmail) {
        return NextResponse.json(
          { error: "Email já está em uso por outro usuário" },
          { status: 409 }
        );
      }
    }
    
    // Verificar se o NIF já está em uso por outro usuário
    if (body.nif && body.nif !== existingUser.nif) {
      const duplicateNif = await prisma.utente.findFirst({
        where: { 
          nif: body.nif,
          id: { not: id }
        }
      });
      
      if (duplicateNif) {
        return NextResponse.json(
          { error: "NIF já está em uso por outro usuário" },
          { status: 409 }
        );
      }
    }
    
    // Preparar dados para atualização
    const updateData: any = {};
    
    if (body.nome) updateData.nome = body.nome;
    if (body.email) updateData.email = body.email;
    if (body.nif) updateData.nif = body.nif;
    if (body.telefone) updateData.telefone = body.telefone;
    if (body.endereco) updateData.endereco = body.endereco;
    if (body.role) updateData.role = body.role;
    if (body.departamento) updateData.departamento = body.departamento;
    
    // Se a senha foi fornecida, hash e atualiza
    if (body.senha) {
      updateData.senha = await bcrypt.hash(body.senha, 10);
    }
    
    // Atualizar o usuário
    const usuario = await prisma.utente.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        nif: true,
        telefone: true,
        endereco: true,
        role: true,
        departamento: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

// Excluir usuário
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // Verificar se o usuário existe
    const existingUser = await prisma.utente.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário tem solicitações associadas
    const solicitacoesCount = await prisma.solicitacaoAutorizacao.count({
      where: { utenteId: id }
    });
    
    if (solicitacoesCount > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir um usuário que possui solicitações associadas" },
        { status: 400 }
      );
    }
    
    // Excluir o usuário
    await prisma.utente.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
