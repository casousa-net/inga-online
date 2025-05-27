import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// Redefinir senha de usuário
export async function POST(
  request: Request,
  context: any
) {
  const { params } = context;
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    // Validação básica
    if (!body.novaSenha) {
      return NextResponse.json(
        { error: "Nova senha é obrigatória" },
        { status: 400 }
      );
    }
    
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
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(body.novaSenha, 10);
    
    // Atualizar a senha do usuário
    await prisma.utente.update({
      where: { id },
      data: {
        senha: hashedPassword
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
