import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();
    
    console.log('Tentando atualizar senha para:', email);
    
    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Email e nova senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const usuario = await prisma.utente.findUnique({
      where: { email }
    });

    if (!usuario) {
      console.log('Usuário não encontrado:', email);
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Gerar hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Atualizar a senha do usuário
    await prisma.utente.update({
      where: { email },
      data: { senha: hashedPassword }
    });

    console.log('Senha atualizada com sucesso para:', email);
    
    return NextResponse.json({
      success: true,
      message: 'Senha atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao atualizar senha', error: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
