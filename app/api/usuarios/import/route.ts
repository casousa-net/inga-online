import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { usuarios } = await request.json();

    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      return NextResponse.json(
        { error: 'Formato inválido. É necessário fornecer um array de usuários.' },
        { status: 400 }
      );
    }

    // Validar todos os usuários
    for (const usuario of usuarios) {
      if (!usuario.nome) {
        return NextResponse.json(
          { error: 'Nome do usuário é obrigatório.' },
          { status: 400 }
        );
      }
      if (!usuario.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario.email)) {
        return NextResponse.json(
          { error: `Email inválido: ${usuario.email}` },
          { status: 400 }
        );
      }
      if (!usuario.nif) {
        return NextResponse.json(
          { error: `NIF ausente para o usuário: ${usuario.nome}` },
          { status: 400 }
        );
      }
      if (!usuario.telefone) {
        return NextResponse.json(
          { error: `Telefone ausente para o usuário: ${usuario.nome}` },
          { status: 400 }
        );
      }
      if (!usuario.endereco) {
        return NextResponse.json(
          { error: `Endereço ausente para o usuário: ${usuario.nome}` },
          { status: 400 }
        );
      }
      if (!usuario.role || !['utente', 'tecnico', 'chefe', 'direccao', 'admin'].includes(usuario.role.toLowerCase())) {
        return NextResponse.json(
          { error: `Função inválida para o usuário: ${usuario.nome}. Deve ser utente, tecnico, chefe, direccao ou admin.` },
          { status: 400 }
        );
      }
    }

    // Criar ou atualizar usuários em massa
    const result = await Promise.all(
      usuarios.map(async (usuario) => {
        // Gerar senha padrão ou usar a fornecida
        const senha = usuario.senha || usuario.nif; // Se não for fornecida, usa o NIF como senha padrão
        const senhaHash = await bcrypt.hash(senha, 10);
        
        return prisma.utente.upsert({
          where: { email: usuario.email },
          update: { 
            nome: usuario.nome,
            nif: usuario.nif,
            telefone: usuario.telefone,
            endereco: usuario.endereco,
            role: usuario.role.toLowerCase(),
            // Não atualiza a senha se não for fornecida
            ...(usuario.senha ? { senha: senhaHash } : {})
          },
          create: {
            nome: usuario.nome,
            email: usuario.email,
            nif: usuario.nif,
            telefone: usuario.telefone,
            endereco: usuario.endereco,
            role: usuario.role.toLowerCase(),
            senha: senhaHash
          }
        });
      })
    );

    return NextResponse.json({
      message: `${result.length} usuários importados com sucesso.`,
      count: result.length
    });
  } catch (error: any) {
    console.error('Erro ao importar usuários:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar a importação de usuários.' },
      { status: 500 }
    );
  }
}
