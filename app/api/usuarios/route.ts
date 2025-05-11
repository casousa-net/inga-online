import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// Listar todos os usuários com opção de filtro por role
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get('role');
    const funcionariosOnly = searchParams.get('funcionariosOnly');
    
    // Construir o filtro baseado nos parâmetros
    let where: any = {};
    
    // Filtrar por role específica
    if (roleParam) {
      where.role = roleParam as 'utente' | 'direccao' | 'chefe' | 'tecnico';
    }
    
    // Filtrar apenas funcionários (excluindo utentes)
    if (funcionariosOnly === 'true') {
      where.role = {
        notIn: ['utente']
      };
    }
    
    const usuarios = await prisma.utente.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        nif: true,
        telefone: true,
        endereco: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        nome: 'asc'
      }
    });
    
    // Adicionar os campos departamento e cargo manualmente
    // Isso é necessário porque o TypeScript não reconhece automaticamente os novos campos
    // após a migração do Prisma
    const usuariosCompletos = await Promise.all(usuarios.map(async (usuario) => {
      // Buscar o usuário completo para obter os campos adicionais
      const usuarioCompleto = await prisma.utente.findUnique({
        where: { id: usuario.id }
      });
      
      // Usar any para contornar as restrições de tipo do TypeScript
      // até que o Prisma Client seja regenerado corretamente
      const usuarioCompletoAny = usuarioCompleto as any;
      
      return {
        ...usuario,
        departamento: usuarioCompletoAny?.departamento || null,
        cargo: usuarioCompletoAny?.cargo || null
      };
    }));
    return NextResponse.json(usuariosCompletos);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

// Criar um novo usuário
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validação básica
    if (!body.nome || !body.email || !body.senha || !body.nif || !body.role) {
      return NextResponse.json(
        { error: "Nome, email, senha, NIF e função são obrigatórios" },
        { status: 400 }
      );
    }
    
    // Verificar se o email já está em uso
    const existingEmail = await prisma.utente.findUnique({
      where: { email: body.email }
    });
    
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 }
      );
    }
    
    // Verificar se o NIF já está em uso
    const existingNif = await prisma.utente.findUnique({
      where: { nif: body.nif }
    });
    
    if (existingNif) {
      return NextResponse.json(
        { error: "NIF já cadastrado" },
        { status: 409 }
      );
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(body.senha, 10);
    
    // Criar o usuário com os dados básicos
    const usuario = await prisma.utente.create({
      data: {
        nome: body.nome,
        email: body.email,
        senha: hashedPassword,
        nif: body.nif,
        telefone: body.telefone || "",
        endereco: body.endereco || "",
        role: body.role,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        nif: true,
        telefone: true,
        endereco: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // Se for um funcionário (não utente), atualizar os campos adicionais
    if (body.role !== 'utente' && (body.departamento || body.cargo)) {
      try {
        // Usar uma query SQL direta para atualizar os campos que o Prisma ainda não reconhece
        await prisma.$executeRaw`UPDATE Utente SET departamento = ${body.departamento || null}, cargo = ${body.cargo || null} WHERE id = ${usuario.id}`;
        
        // Adicionar os campos ao objeto de resposta
        const usuarioCompleto = {
          ...usuario,
          departamento: body.departamento || null,
          cargo: body.cargo || null
        };
        
        return NextResponse.json(usuarioCompleto, { status: 201 });
      } catch (updateError) {
        console.error("Erro ao atualizar campos adicionais:", updateError);
        // Continuar retornando o usuário mesmo se a atualização falhar
      }
    }
    
    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
