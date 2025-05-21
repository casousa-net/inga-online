import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  console.log(`GET request for colaborador ID: ${params.id}`);
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      console.error(`Invalid ID: ${params.id}`);
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Buscar o colaborador com informações básicas
    const colaborador = await prisma.utente.findUnique({
      where: { id }
    });

    if (!colaborador) {
      console.error(`Colaborador não encontrado: ${id}`);
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se é um colaborador (não utente)
    if (!['tecnico', 'chefe', 'direccao'].includes(colaborador.role || '')) {
      console.error(`Usuário não é um colaborador: ${colaborador.role}`);
      return NextResponse.json(
        { error: 'Usuário não é um colaborador' },
        { status: 400 }
      );
    }

    // Formatar a resposta no formato esperado pelo frontend
    const response: ColaboradorResponse = {
      id: colaborador.id,
      nome: colaborador.nome || 'Sem nome',
      email: colaborador.email || '',
      telefone: colaborador.telefone || '',
      nivel: colaborador.role === 'tecnico' ? 'Tecnico' : 
             colaborador.role === 'chefe' ? 'Chefe de Departamento' : 'Direção',
      area: colaborador.departamento ? 
            colaborador.departamento === 'autorizacao' ? 'Autorização' :
            colaborador.departamento === 'monitorizacao' ? 'Monitorização' :
            colaborador.departamento === 'espacos-verdes' ? 'Espaços Verdes' : 
            'Geral' : 'Geral',
      estado: 'Ativo',
      createdAt: colaborador.createdAt.toISOString(),
      processos: [],
      historicoNiveis: []
    };

    // Tentar buscar processos de autorização
    try {
      const processosAutorizacao = await prisma.solicitacaoautorizacao.findMany({
        where: {
          OR: [
            { tecnicoValidador: colaborador.nome },
            { chefeValidador: colaborador.nome },
            { direcaoValidador: colaborador.nome }
          ]
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      response.processos = processosAutorizacao.map(p => ({
        id: p.id,
        status: p.status,
        tipo: 'autorização',
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }));
    } catch (err) {
      console.error('Erro ao buscar processos de autorização:', err);
      // Continuar mesmo com erro
    }

    return NextResponse.json(response);
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
