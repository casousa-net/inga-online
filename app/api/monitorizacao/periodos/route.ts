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

// Função para verificar e atualizar o estado dos períodos com base nas datas
async function verificarEAtualizarEstadosPeriodos(periodos: any[]) {
  const dataAtual = new Date();
  console.log('Verificando estados dos períodos com base na data atual:', dataAtual);
  
  for (const periodo of periodos) {
    const dataInicio = new Date(periodo.dataInicio);
    const dataFim = new Date(periodo.dataFim);
    const periodoId = periodo.id;
    
    // Verificar se o período já tem monitorizacao
    const temMonitorizacao = await prisma.monitorizacao.count({
      where: { periodoId: periodoId }
    }) > 0;
    
    // Se já tem monitorizacao, não alteramos o estado
    if (temMonitorizacao) {
      console.log(`Período ${periodoId} já possui monitorizacao, estado não será alterado`);
      continue;
    }
    
    // Se o período está em um estado especial, não alteramos
    if (periodo.estado === 'REABERTURA_SOLICITADA' || 
        periodo.estado === 'AGUARDANDO_REAVALIACAO') {
      console.log(`Período ${periodoId} está em estado especial: ${periodo.estado}, não será alterado`);
      continue;
    }
    
    // Verificar se a data atual está dentro do período
    const dentroDoPerido = dataAtual >= dataInicio && dataAtual <= dataFim;
    // Verificar se a data atual já passou do fim do período
    const periodoExpirado = dataAtual > dataFim;
    // Verificar se a data atual ainda não chegou ao início do período
    const periodoFuturo = dataAtual < dataInicio;
    
    let novoEstado = periodo.estado; // Manter o estado atual por padrão
    
    if (dentroDoPerido && periodo.estado !== 'ABERTO') {
      novoEstado = 'ABERTO';
      console.log(`Período ${periodoId} está dentro da data válida, alterando para ABERTO`);
    } else if (periodoExpirado && periodo.estado !== 'FECHADO') {
      novoEstado = 'FECHADO';
      console.log(`Período ${periodoId} expirou, alterando para FECHADO`);
    } else if (periodoFuturo && periodo.estado !== 'FECHADO') {
      novoEstado = 'FECHADO'; // Períodos futuros também são fechados até sua data de início
      console.log(`Período ${periodoId} ainda não começou, alterando para FECHADO`);
    }
    
    // Atualizar o estado do período se necessário
    if (novoEstado !== periodo.estado) {
      await prisma.periodomonitorizacao.update({
        where: { id: periodoId },
        data: { estado: novoEstado }
      });
      
      // Atualizar o objeto período para refletir a mudança
      periodo.estado = novoEstado;
      
      // Registrar no console para fins de debug
      console.log(`Período ${periodoId}: estado atualizado de ${periodo.estado} para ${novoEstado}`);
    }
  }
  
  return periodos;
}

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
    // Buscar configuração de monitorização do utente usando Prisma ORM
    const configuracao = await prisma.configuracaomonitorizacao.findFirst({
      where: {
        utenteId: utenteId
      }
    });
    
    console.log('Configuração encontrada:', configuracao ? 'sim' : 'não');
    
    // Buscar períodos associados
    let periodos: any[] = [];
    if (configuracao) {
      try {
        console.log('Buscando períodos para a configuração ID:', configuracao.id);
        periodos = await prisma.periodomonitorizacao.findMany({
          where: {
            configuracaoId: configuracao.id
          },
          orderBy: {
            numeroPeriodo: 'asc'
          }
        });
        console.log(`Encontrados ${periodos.length} períodos`);
      } catch (periodoError) {
        console.error('Erro ao buscar períodos:', periodoError);
        periodos = [];
      }
      
      // Verificar e atualizar os estados dos períodos com base nas datas atuais
      periodos = await verificarEAtualizarEstadosPeriodos(periodos);
    }
    
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
    
    // Criar objeto de resposta com configuração e períodos
    const configuracaoCompleta = {
      ...configuracao,
      periodos: periodos
    };
    
    console.log('Buscando monitorização para cada período...');
    // Buscar todas as monitorizações para os períodos do utente
    let monitorizacoes: any[] = [];
    
    if (periodos.length > 0) {
      try {
        console.log('Buscando monitorizações para os períodos...');
        const periodoIds = periodos.map(p => p.id);
        
        // Buscar monitorizações usando Prisma ORM
        const monitorizacoesBase = await prisma.monitorizacao.findMany({
          where: {
            utenteId: utenteId,
            periodoId: { in: periodoIds }
          }
        });
        
            // Buscar técnicos associados às monitorizações usando SQL nativo
        const monitorizacaoIdsForTecnicos = monitorizacoesBase.map(m => m.id);
        let tecnicosMonitorizacao: any[] = [];
        
        if (monitorizacaoIdsForTecnicos.length > 0) {
          try {
            const tecnicosResult = await prisma.$queryRaw`
              SELECT tm.*, u.id as utente_id, u.nome as utente_nome 
              FROM tecnicomonitorizacao tm
              JOIN utente u ON tm.tecnicoId = u.id
              WHERE tm.monitorizacaoId IN (${Prisma.join(monitorizacaoIdsForTecnicos)})
            `;
            tecnicosMonitorizacao = Array.isArray(tecnicosResult) ? tecnicosResult : [];
          } catch (tecnicosError) {
            console.error('Erro ao buscar técnicos:', tecnicosError);
            // Continuar com array vazio
          }
        }
        
        // Buscar informações de visitas técnicas usando SQL nativo para compatibilidade
        const monitorizacaoIds = monitorizacoesBase.map(m => m.id);
        let visitasTecnicas: any[] = [];
        
        if (monitorizacaoIds.length > 0) {
          try {
            const visitasResult = await prisma.$queryRaw`
              SELECT * FROM visitatecnico 
              WHERE monitorizacaoId IN (${Prisma.join(monitorizacaoIds)})
            `;
            visitasTecnicas = Array.isArray(visitasResult) ? visitasResult : [];
          } catch (visitaError) {
            console.error('Erro ao buscar visitas técnicas:', visitaError);
            // Continuar com array vazio
          }
        }
        
        // Mapear as monitorizações com informações adicionais
        monitorizacoes = monitorizacoesBase.map(m => {
          // Agrupar técnicos por monitorização
          const tecnicosAssociados = tecnicosMonitorizacao
            .filter((tm: any) => Number(tm.monitorizacaoId) === Number(m.id))
            .map((tm: any) => ({
              id: Number(tm.utente_id),
              nome: tm.utente_nome
            }));
          
          // Formatar string de técnicos selecionados
          const tecnicosSelecionados = tecnicosAssociados
            .map((t: any) => `${t.id}:${t.nome}`)
            .join('|');
          
          // Buscar visita técnica associada
          const visita = visitasTecnicas.find((v: any) => Number(v.monitorizacaoId) === Number(m.id));
          
          return {
            ...m,
            tecnicosSelecionados,
            dataVisitaTecnico: visita?.dataVisita || null,
            tecnicoVisita: visita ? `${visita.tecnicoId}:${visita.tecnicoNome}` : null
          };
        });
        
        console.log(`Encontradas ${monitorizacoes.length} monitorizações`);
      } catch (monitorizacaoError) {
        console.error('Erro ao buscar monitorizações:', monitorizacaoError);
        monitorizacoes = [];
      }
    }
    
    // Mapear monitorizações para os períodos correspondentes
    const periodosComMonitorizacao = periodos.map((periodo: any) => {
      const monitorizacao = Array.isArray(monitorizacoes) ? 
        (monitorizacoes as any[]).find((m: any) => Number(m.periodoId) === Number(periodo.id)) : null;
      
      // Processar técnicos selecionados se existirem
      let tecnicosSelecionados = [];
      if (monitorizacao && monitorizacao.tecnicosSelecionados) {
        tecnicosSelecionados = monitorizacao.tecnicosSelecionados
          .split('|')
          .filter((t: string) => t.trim() !== '')
          .map((tecnico: string) => {
            const [id, nome] = tecnico.split(':');
            return { id: Number(id), nome };
          });
      }
      
      // Processar informações do técnico que realizou a visita
      let tecnicoVisita = null;
      if (monitorizacao && monitorizacao.tecnicoVisita) {
        const [id, nome] = monitorizacao.tecnicoVisita.split(':');
        tecnicoVisita = { id: Number(id), nome };
      }
      
      // Garantir que as datas da visita estejam disponíveis
      // Priorizar as datas da tabela monitorizacao, mas usar as da visitatecnico se necessário
      const dataPrevistaVisita = monitorizacao?.dataPrevistaVisita || monitorizacao?.dataPrevistaVisita;
      const dataVisita = monitorizacao?.dataVisita || monitorizacao?.dataVisitaTecnico;
      const observacoesVisita = monitorizacao?.observacoesVisita || monitorizacao?.observacoesVisitaTecnico;
      
      return {
        ...periodo,
        monitorizacao: monitorizacao ? {
          ...monitorizacao,
          tecnicosSelecionados: tecnicosSelecionados,
          tecnicoVisita: tecnicoVisita,
          // Garantir que estas propriedades estejam sempre disponíveis
          dataPrevistaVisita: dataPrevistaVisita,
          dataVisita: dataVisita,
          observacoesVisita: observacoesVisita
        } : null
      };
    });
    // Formatar resposta final
    const response = {
      configuracao: configuracaoCompleta,
      periodos: periodosComMonitorizacao
    };
    
    console.log('Retornando dados...');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Erro ao buscar períodos de monitorização:", error);
    
    // Fornecer mensagens de erro mais detalhadas
    let errorMessage = "Erro ao buscar períodos de monitorização";
    let statusCode = 500;
    
    if (error instanceof Error) {
      console.error('Detalhes do erro:', error.message);
      errorMessage = `Erro ao buscar períodos de monitorização: ${error.message}`;
      
      // Verificar erros específicos
      if (error.message.includes('does not exist') || 
          error.message.includes('no such table') || 
          error.message.includes('Unknown table')) {
        errorMessage = "Erro de estrutura de banco de dados. Por favor, contacte o administrador.";
      } else if (error.message.includes('Unexpected token')) {
        errorMessage = "Erro de formato de dados. Por favor, tente novamente.";
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
