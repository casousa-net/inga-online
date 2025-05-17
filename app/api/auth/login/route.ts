import { NextRequest, NextResponse } from "next/server";
import { prisma, checkDatabaseConnection } from "@/lib/prisma";
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


const JWT_SECRET = process.env.JWT_SECRET || "secret_key"; // Recomenda-se definir JWT_SECRET no .env

export async function POST(req: NextRequest) {
  let utente: UtenteWithDepartamento | null = null;
  
  try {
    // Verificar conexão com o banco de dados
    console.log('Verificando conexão com o banco de dados...');
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      console.error('Erro de conexão:', dbStatus.error);
      return NextResponse.json({ error: 'Erro de conexão com o banco de dados.' }, { status: 500 });
    }
    console.log('Conexão com o banco de dados estabelecida.');

    console.log('Iniciando login...');
    const data = await req.json();
    console.log('Dados recebidos:', { nif: data.nif });
    const { nif, senha } = data;

    if (!nif || !senha) {
      return NextResponse.json({ error: "NIF e senha são obrigatórios." }, { status: 400 });
    }

    // Busca o usuário pelo NIF
    console.log('Buscando utente...');
    const utente = await prisma.utente.findUnique({ where: { nif } }) as UtenteWithDepartamento;
    console.log('Utente encontrado:', utente ? { id: utente.id, nome: utente.nome, role: utente.role } : 'não encontrado');
    if (!utente) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Verifica a senha
    console.log('Verificando senha...');
    const senhaCorreta = await bcrypt.compare(senha, utente.senha);
    console.log('Senha correta:', senhaCorreta);
    if (!senhaCorreta) {
      return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
    }

    // Gera o token JWT incluindo o role
    console.log('Gerando token...');
    const token = jwt.sign({ id: utente.id, nif: utente.nif, role: utente.role }, JWT_SECRET, { expiresIn: "7d" });
    console.log('Token gerado com sucesso');

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
    console.error('Erro no login:', error);
    
    // Verifica se é um erro do Prisma
    if (error instanceof Error && error.message.includes('Prisma')) {
      return NextResponse.json({ error: 'Erro de conexão com o banco de dados.' }, { status: 500 });
    }
    
    // Verifica se é um erro do bcrypt
    if (error instanceof Error && error.message.includes('bcrypt')) {
      return NextResponse.json({ error: 'Erro na verificação da senha.' }, { status: 500 });
    }
    
    // Verifica se é um erro do JWT
    if (error instanceof Error && error.message.includes('jwt')) {
      return NextResponse.json({ error: 'Erro na geração do token.' }, { status: 500 });
    }
    return NextResponse.json({ error: "Erro ao fazer login." }, { status: 500 });
  }
}
