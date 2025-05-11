import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { nif, nome, endereco, telefone, email, senha, role } = data;

    // Validação básica
    if (!nif || !nome || !endereco || !telefone || !email || !senha) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
    }

    // Verifica se já existe usuário com o mesmo NIF ou email
    const existing = await prisma.utente.findFirst({
      where: { OR: [{ nif }, { email }] },
    });
    if (existing) {
      return NextResponse.json({ error: "NIF ou email já cadastrado." }, { status: 409 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Cria o usuário
    const utente = await prisma.utente.create({
      data: {
        nif,
        nome,
        endereco,
        telefone,
        email,
        senha: hashedPassword,
        role: role || 'utente', // padrão para utente
      },
    });

    return NextResponse.json({ message: "Usuário cadastrado com sucesso!", utente: { id: utente.id, nif: utente.nif, role: utente.role } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao cadastrar usuário." }, { status: 500 });
  }
}
