import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    console.log('=== DEBUG: Iniciando busca de processos ===');
    // Buscar todas as solicitações que precisam de atenção do Técnico
    // Isso inclui:
    // 1. Solicitações pendentes que ainda não foram validadas
    // 2. Solicitações que foram rejeitadas e precisam ser revisadas
    const processos = await prisma.solicitacaoAutorizacao.findMany({
      where: {
        status: 'Pendente',
        validadoPorTecnico: false
      },
      select: {
        id: true,
        tipo: true,
        status: true,
        valorTotalKz: true,
        createdAt: true,
        validadoPorTecnico: true,
        utente: {
          select: {
            id: true,
            nome: true,
            nif: true
          }
        },
        moeda: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Total de processos encontrados:', processos.length);
    if (processos.length > 0) {
      console.log('Exemplo de processo:', {
        id: processos[0].id,
        tipo: processos[0].tipo,
        status: processos[0].status
      });
    }
    
    // Formatar os dados para o formato esperado pela interface
    const processosFormatados = processos.map(proc => {
      // Formatar o número do processo
      const numeroProcesso = `PR-${String(proc.id).padStart(6, '0')}`;
      
      // Formatar o valor pago
      const valorPago = new Intl.NumberFormat('pt-AO', { 
        style: 'currency', 
        currency: 'AOA',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      }).format(proc.valorTotalKz);

      // Formatar a data
      const data = new Date(proc.createdAt).toLocaleString('pt-AO');

      return {
        id: proc.id,
        numero: numeroProcesso,
        tipo: 'Autorização',
        subtipo: proc.tipo,
        data: data,
        estado: proc.status,
        statusTecnico: proc.validadoPorTecnico ? 'Validado' : 'Pendente',
        utente: proc.utente.nome,
        valorPago: valorPago
      };
    });

    return NextResponse.json(processosFormatados);
  } catch (error) {
    console.error('Erro ao buscar processos de autorização:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar processos de autorização' },
      { status: 500 }
    );
  }
}
