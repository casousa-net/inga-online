import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface UtenteWithDepartamento {
  id: number;
  nif: string;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  senha: string;
  role: string;
  departamento?: string;
  createdAt: Date;
  updatedAt: Date;
}

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key"; // Recomenda-se definir JWT_SECRET no .env

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { nif, senha } = data;

    if (!nif || !senha) {
      return NextResponse.json({ error: "NIF e senha são obrigatórios." }, { status: 400 });
    }

    // Busca o usuário pelo NIF
    const utente = await prisma.utente.findUnique({ where: { nif } }) as UtenteWithDepartamento;
    if (!utente) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Verifica a senha
    const senhaCorreta = await bcrypt.compare(senha, utente.senha);
    if (!senhaCorreta) {
      return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
    }

    // Gera o token JWT incluindo o role
    const token = jwt.sign({ id: utente.id, nif: utente.nif, role: utente.role }, JWT_SECRET, { expiresIn: "7d" });

    // Retorna o token em cookie HTTPOnly e inclui o nome, role e departamento do usuário na resposta
    const response = NextResponse.json({
      message: "Login realizado com sucesso!",
      role: utente.role,
      nome: utente.nome,
      id: utente.id,
      departamento: (utente.role === 'chefe' || utente.role === 'tecnico') ? utente.departamento : null
    });
    response.cookies.set("token", token, { httpOnly: true, sameSite: "strict", path: "/" });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Erro ao fazer login." }, { status: 500 });
  }
}
