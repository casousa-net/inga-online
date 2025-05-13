import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type ColaboradorResponse = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  nivel: string;
  area: string;
  estado: string;
  createdAt: string;
  processos: any[];
  historicoNiveis: any[];
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Buscar o colaborador com histórico de processos e níveis
    // Buscar o colaborador
    const colaborador = await (prisma.utente.findUnique({
      where: { id },
      include: {
        historicoNiveis: true
      } as any
    }) as any);

    // Buscar processos onde o colaborador foi validador
    const processosValidados = await (prisma.solicitacaoautorizacao.findMany({
      where: {
        OR: [
          { tecnicoValidador: colaborador.nome },
          { chefeValidador: colaborador.nome },
          { direcaoValidador: colaborador.nome }
        ]
      } as any,
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }) as any);

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se é um colaborador (não utente)
    if (!['tecnico', 'chefe', 'direccao'].includes(colaborador.role)) {
      return NextResponse.json(
        { error: 'Usuário não é um colaborador' },
        { status: 400 }
      );
    }

    // Formatar os dados do colaborador
    const colaboradorFormatado = {
      id: colaborador.id,
      nome: colaborador.nome,
      email: colaborador.email,
      telefone: colaborador.telefone,
      nivel: colaborador.role === 'tecnico' ? 'Tecnico' : 
             colaborador.role === 'chefe' ? 'Chefe de Departamento' : 'Direção',
      area: colaborador.departamento ? 
            colaborador.departamento === 'autorizacao' ? 'Autorização' :
            colaborador.departamento === 'monitorizacao' ? 'Monitorizacao' :
            colaborador.departamento === 'espacos-verdes' ? 'Espaços Verdes' : 
            colaborador.departamento : 'Não especificada',
      estado: 'Ativo',
      createdAt: colaborador.createdAt.toISOString(),
      processos: processosValidados || [],
      historicoNiveis: colaborador.historicoNiveis || []
    };

    return NextResponse.json(colaboradorFormatado);
  } catch (error) {
    console.error('Erro ao buscar colaborador:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar colaborador' },
      { status: 500 }
    );
  }
}

// Atualizar nível e área do colaborador
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { nivel, area, motivoAlteracao } = data;

    // Validar dados
    if (!nivel || !area || !motivoAlteracao) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Mapear nível para role
    const role = nivel === 'Tecnico' ? 'tecnico' :
                nivel === 'Chefe de Departamento' ? 'chefe' :
                nivel === 'Direção' ? 'direccao' : null;

    if (!role) {
      return NextResponse.json(
        { error: 'Nível inválido' },
        { status: 400 }
      );
    }

    // Mapear área para departamento
    const departamento = area === 'Autorização' ? 'autorizacao' :
                        area === 'Monitorizacao' ? 'monitorizacao' :
                        area === 'Espaços Verdes' ? 'espacos-verdes' : null;

    if (!departamento) {
      return NextResponse.json(
        { error: 'Área inválida' },
        { status: 400 }
      );
    }

    // Atualizar colaborador
    const colaboradorAtualizado = await prisma.utente.update({
      where: { id },
      data: {
        role,
        departamento
      }
    });

    // Criar histórico de nível
    await (prisma as any).historicoNivel.create({
      data: {
        utenteId: id,
        nivel,
        area,
        dataAlteracao: new Date(),
        motivoAlteracao
      }
    });

    return NextResponse.json({
      message: 'Colaborador atualizado com sucesso',
      colaborador: colaboradorAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar colaborador:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar colaborador' },
      { status: 500 }
    );
  }
}
