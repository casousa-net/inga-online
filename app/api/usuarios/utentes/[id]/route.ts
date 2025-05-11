import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = parseInt(context.params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de utente inválido' },
        { status: 400 }
      );
    }

    console.log(`Buscando utente com ID: ${id}`);

    // Buscar o utente pelo ID
    const utente = await prisma.utente.findFirst({
      where: { 
        id,
        role: 'utente' // Garantir que é um utente
      },
      select: {
        id: true,
        nome: true,
        nif: true,
        email: true,
        telefone: true,
        endereco: true,
        createdAt: true,
        updatedAt: true,
        // Incluir solicitações relacionadas a este utente
        solicitacaoautorizacao: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            tipo: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    }) as any; // Usando type assertion para evitar erros de TypeScript

    if (!utente) {
      return NextResponse.json(
        { error: 'Utente não encontrado' },
        { status: 404 }
      );
    }

    // Formatar os dados para o frontend
    const utenteFormatado = {
      ...utente,
      status: 'Ativo', // Por padrão, consideramos todos os utentes como ativos
      emailVerificado: true, // Por padrão, consideramos todos os emails como verificados
      createdAt: utente.createdAt ? utente.createdAt.toISOString() : null,
      updatedAt: utente.updatedAt ? utente.updatedAt.toISOString() : null,
      // Formatar as solicitações
      solicitacoes: utente.solicitacaoautorizacao.map((sol: any) => ({
        id: sol.id,
        numero: sol.numero,
        tipo: 'Autorização', // Tipo fixo para solicitações de autorização
        subtipo: sol.tipo || 'Não especificado',
        data: sol.createdAt ? sol.createdAt.toISOString().split('T')[0] : null,
        estado: mapearStatus(sol.status),
        link: `/direccao/dir_processos/${sol.id}`
      }))
    };

    return NextResponse.json(utenteFormatado);
  } catch (error) {
    console.error('Erro ao buscar utente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar utente' },
      { status: 500 }
    );
  }
}

// Função para mapear o status da solicitação para um formato mais amigável
function mapearStatus(status: string | null): string {
  if (!status) return 'Pendente';
  
  switch (status) {
    case 'Pendente':
      return 'Pendente';
    case 'Valido_RUPE':
      return 'Validado';
    case 'Aguardando_Pagamento':
      return 'Aguardando RUPE';
    case 'Pagamento_Confirmado':
      return 'Pagamento Confirmado';
    case 'Aprovado':
      return 'Aprovado';
    case 'Rejeitado':
      return 'Rejeitado';
    default:
      return status;
  }
}
