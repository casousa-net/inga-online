import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Obter parâmetros de consulta
    const url = new URL(request.url);
    const busca = url.searchParams.get('busca') || '';
    const nivel = url.searchParams.get('nivel');
    const area = url.searchParams.get('area');

    console.log('Buscando colaboradores com parâmetros:', { busca, nivel, area });

    // Construir a consulta
    let where: any = {
      OR: [
        { nome: { contains: busca } }, // Removido mode: 'insensitive' que não é suportado
        { email: { contains: busca } }
      ]
    };

    // Filtrar apenas colaboradores (não utentes)
    if (!nivel) {
      // Se não tiver filtro específico, incluir todos os tipos de colaboradores
      where.role = { in: ['tecnico', 'chefe', 'direccao'] };
    } else {
      // Adicionar filtro de nível (função) se fornecido
      if (nivel === 'Tecnico') {
        where.role = 'tecnico';
      } else if (nivel === 'Chefe de Departamento') {
        where.role = 'chefe';
      } else if (nivel === 'Direção') {
        where.role = 'direccao';
      }
    }

    // Adicionar filtro de área (departamento) se fornecido
    if (area) {
      where.departamento = area.toLowerCase().replace(/ç/g, 'c').replace(/ã/g, 'a');
    }
    
    console.log('Consulta Prisma:', where);

    try {
      // Buscar colaboradores
      const colaboradores = await prisma.utente.findMany({
        where,
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          role: true,
          departamento: true,
          createdAt: true
        },
        orderBy: {
          nome: 'asc'
        }
      });

      console.log(`Encontrados ${colaboradores.length} colaboradores`);

      // Mapear os resultados para o formato esperado pelo frontend
      const colaboradoresFormatados = colaboradores.map(colab => ({
        id: colab.id,
        nome: colab.nome,
        email: colab.email,
        telefone: colab.telefone,
        nivel: colab.role === 'tecnico' ? 'Tecnico' : 
              colab.role === 'chefe' ? 'Chefe de Departamento' : 'Direção',
        area: colab.departamento ? 
              colab.departamento === 'autorizacao' ? 'Autorização' :
              colab.departamento === 'monitorizacao' ? 'Monitorizacao' :
              colab.departamento === 'espacos-verdes' ? 'Espaços Verdes' : 
              colab.departamento : 'Não especificada',
        estado: 'Ativo', // Por padrão, consideramos todos os colaboradores como ativos
        createdAt: colab.createdAt ? colab.createdAt.toISOString() : null
      }));

      return NextResponse.json(colaboradoresFormatados);
    } catch (prismaError) {
      console.error('Erro do Prisma ao buscar colaboradores:', prismaError);
      throw prismaError; // Propagar o erro para ser capturado pelo catch externo
    }
  } catch (error) {
    console.error('Erro ao buscar colaboradores:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar colaboradores' },
      { status: 500 }
    );
  }
}
