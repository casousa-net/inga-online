import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type PeriodoMonitorizacao = {
  id: number;
  configuracaoId: number;
  numeroPeriodo: number;
  dataInicio: Date;
  dataFim: Date;
  estado: string; // Alterado para string para compatibilidade com o Prisma
};

type Monitorizacao = {
  id: number;
  utenteId: number;
  periodoId: number;
  relatorioPath: string;
  estado: string;
};

export async function GET(req: NextRequest) {
  console.log('Iniciando busca de períodos...');
  try {
    const utenteIdParam = req.nextUrl.searchParams.get("utenteId");
    console.log('ID do utente recebido:', utenteIdParam);
    
    if (!utenteIdParam) {
      return NextResponse.json(
        { error: "ID do utente é obrigatório" },
        { status: 400 }
      );
    }
    
    const utenteId = parseInt(utenteIdParam);
    console.log('ID do utente convertido:', utenteId);
    
    console.log('Buscando configuração de monitorização...');
    // Buscar configuração de monitorização do utente
    // Tentando primeiro buscar usando findFirst em vez de findUnique
    const configuracao = await prisma.configuracaoMonitorizacao.findFirst({
      where: { utenteId },
      include: {
        periodos: {
          orderBy: { numeroPeriodo: 'asc' }
        }
      }
    });
    
    console.log('Configuração encontrada:', configuracao ? 'sim' : 'não');
    if (!configuracao) {
      console.log('Nenhuma configuração de monitorização encontrada para o utente:', utenteId);
      return NextResponse.json(
        { 
          error: "Configuração de monitorização não encontrada para este utente",
          message: "Por favor, contacte o administrador para configurar os seus períodos de monitorização."
        },
        { status: 404 }
      );
    }
    
    console.log('Buscando monitorização para cada período...');
    // Buscar monitorização para cada período
    const periodosComMonitorizacao = await Promise.all(
      configuracao.periodos.map(async (periodo: PeriodoMonitorizacao) => {
        const monitorizacao = await prisma.monitorizacao.findFirst({
          where: { 
            utenteId,
            periodoId: periodo.id
          }
        });
        
        return {
          ...periodo,
          monitorizacao
        };
      })
    );
    
    console.log('Retornando dados...');
    return NextResponse.json({
      configuracao: {
        id: configuracao.id,
        tipoPeriodo: configuracao.tipoPeriodo,
        dataInicio: configuracao.dataInicio,
      },
      periodos: periodosComMonitorizacao
    });
    
  } catch (error) {
    console.error("Erro ao buscar períodos de monitorização:", error);
    if (error instanceof Error) {
      console.error('Detalhes do erro:', error.message);
      if ('code' in error) {
        console.error('Código do erro:', (error as any).code);
      }
    }
    return NextResponse.json(
      { error: "Erro ao buscar períodos de monitorização" },
      { status: 500 }
    );
  }
}
