import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Obter parâmetros de consulta
    const url = new URL(request.url);
    const busca = url.searchParams.get('busca') || '';
    const status = url.searchParams.get('status');
    const verificado = url.searchParams.get('verificado');

    console.log('Buscando utentes com parâmetros:', { busca, status, verificado });

    // Construir a consulta
    const where: any = {
      role: 'utente', // Filtrar apenas utentes usando o campo 'role' conforme o schema
      OR: [
        { nome: { contains: busca } }, // Removido mode: 'insensitive' que não é suportado
        { email: { contains: busca } },
        { nif: { contains: busca } }
      ]
    };

    // Adicionar filtro de status se fornecido
    // Nota: Como não temos um campo 'ativo' no modelo, vamos filtrar por outro critério
    // ou remover este filtro por enquanto

    // Removido filtro de verificação de email pois o campo não existe no modelo
    // if (verificado === 'verificado' || verificado === 'nao') {
    //   where.emailVerificado = verificado === 'verificado';
    // }
    
    console.log('Consulta Prisma para utentes:', where);

    try {
      // Buscar utentes
      const utentes = await prisma.utente.findMany({
        where,
        select: {
          id: true,
          nome: true,
          nif: true,
          email: true,
          telefone: true,
          endereco: true,
          createdAt: true
        },
        orderBy: {
          nome: 'asc'
        }
      });

      console.log(`Encontrados ${utentes.length} utentes`);

      // Mapear os resultados para o formato esperado pelo frontend
      const utentesFormatados = utentes.map(utente => ({
        ...utente,
        status: 'Ativo', // Por padrão, consideramos todos os utentes como ativos
        createdAt: utente.createdAt ? utente.createdAt.toISOString() : null
      }));

      return NextResponse.json(utentesFormatados);
    } catch (prismaError) {
      console.error('Erro do Prisma ao buscar utentes:', prismaError);
      throw prismaError; // Propagar o erro para ser capturado pelo catch externo
    }
  } catch (error) {
    console.error('Erro ao buscar utentes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar utentes' },
      { status: 500 }
    );
  }
}
