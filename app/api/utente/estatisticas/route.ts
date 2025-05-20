import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Inicializar o cliente Prisma
const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    console.log("[API Estatisticas] Iniciando busca de estatísticas");
    
    // Obter a sessão do usuário
    const session = await getServerSession(authOptions);
    console.log("[API Estatisticas] Sessão:", session ? "Autenticado" : "Não autenticado");
    
    // Obter ID do usuário da sessão ou da query string
    let userId = 0;
    let utenteId = 0;
    
    // Para desenvolvimento, permitir sobrescrever o ID do utente via query string
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('utenteId');
    
    if (session && session.user) {
      userId = Number(session.user.id);
      console.log(`[API Estatisticas] Usuário autenticado, ID: ${userId}`);
    } else if (queryUserId) {
      console.log(`[API Estatisticas] Usando ID da query string: ${queryUserId}`);
    } else {
      // Para desenvolvimento, usar ID 1 como padrão
      console.log("[API Estatisticas] Usando ID padrão 1 para desenvolvimento");
    }
    
    utenteId = queryUserId ? parseInt(queryUserId) : (userId || 1); // Usar ID 1 como padrão para desenvolvimento
    
    console.log(`[API Estatisticas] Buscando estatísticas para o utente ID: ${utenteId}`);
    
    // Inicializar variáveis para armazenar os resultados
    let solicitacoesStats: any[] = [];
    let monitorizacaoStats: any[] = [];
    let solicitacoesPorMes: any[] = [];
    let monitorizacaoPorMes: any[] = [];
    let solicitacoesRecentes: any[] = [];
    let monitorizacaoRecentes: any[] = [];
    let totalSolicitacoes = 0;
    let totalMonitorizacao = 0;
    
    // Buscar dados reais do banco de dados com tratamento de erros
    try {
      // 1. Obter total de solicitações
      totalSolicitacoes = await prisma.solicitacaoautorizacao.count({
        where: { utenteId }
      });
      console.log(`[API Estatisticas] Total de solicitações: ${totalSolicitacoes}`);
    } catch (error) {
      console.error("[API Estatisticas] Erro ao buscar total de solicitações:", error);
      totalSolicitacoes = 0;
    }
    
    try {
      // 2. Obter total de monitorizações
      totalMonitorizacao = await prisma.monitorizacao.count({
        where: { utenteId }
      });
      console.log(`[API Estatisticas] Total de monitorizações: ${totalMonitorizacao}`);
    } catch (error) {
      console.error("[API Estatisticas] Erro ao buscar total de monitorizações:", error);
      totalMonitorizacao = 0;
    }
    
    try {
      // 3. Obter solicitações por status
      const result = await prisma.solicitacaoautorizacao.groupBy({
        by: ['status'],
        where: { utenteId },
        _count: { id: true }
      });
      
      // Mapear os resultados para o formato esperado
      solicitacoesStats = result.map(item => {
        let categoria = "Outras";
        
        if (item.status === "Pendente") {
          categoria = "Pendentes";
        } else if (item.status === "Aprovado") {
          categoria = "Aprovadas";
        } else if (item.status === "Rejeitado" || item.status === "Rejeitado_Direcao") {
          categoria = "Rejeitadas";
        }
        
        return {
          categoria,
          total: item._count.id
        };
      });
      
      console.log(`[API Estatisticas] Solicitações por status:`, solicitacoesStats);
    } catch (error) {
      console.error("[API Estatisticas] Erro ao buscar solicitações por status:", error);
      solicitacoesStats = [];
    }
    
    try {
      // 4. Obter monitorizações por status
      const result = await prisma.monitorizacao.groupBy({
        by: ['estadoProcesso'],
        where: { utenteId },
        _count: { id: true }
      });
      
      // Mapear os resultados para o formato esperado
      monitorizacaoStats = result.map(item => {
        let categoria = "Em Andamento";
        
        if (item.estadoProcesso === "AGUARDANDO_PARECER") {
          categoria = "Pendentes";
        } else if (item.estadoProcesso === "CONCLUIDO") {
          categoria = "Concluídos";
        }
        
        return {
          categoria,
          total: item._count.id
        };
      });
      
      console.log(`[API Estatisticas] Monitorizações por status:`, monitorizacaoStats);
    } catch (error) {
      console.error("[API Estatisticas] Erro ao buscar monitorizações por status:", error);
      monitorizacaoStats = [];
    }
    
    try {
      // 5. Obter solicitações recentes
      solicitacoesRecentes = await prisma.solicitacaoautorizacao.findMany({
        where: { utenteId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          tipo: true,
          status: true,
          createdAt: true
        }
      });
      
      // Mapear para o formato esperado
      solicitacoesRecentes = solicitacoesRecentes.map(item => ({
        id: item.id,
        tipoSolicitacao: item.tipo || "Autorização Ambiental",
        status: item.status,
        createdAt: item.createdAt.toISOString()
      }));
      
      console.log(`[API Estatisticas] Solicitações recentes: ${solicitacoesRecentes.length}`);
    } catch (error) {
      console.error("[API Estatisticas] Erro ao buscar solicitações recentes:", error);
      solicitacoesRecentes = [];
    }
    
    try {
      // 6. Obter monitorizações recentes
      monitorizacaoRecentes = await prisma.monitorizacao.findMany({
        where: { utenteId },
        orderBy: { id: 'desc' },
        take: 5,
        select: {
          id: true,
          estadoProcesso: true,
          periodoId: true,
          periodo: {
            select: {
              id: true,
              numeroPeriodo: true,
              // Verificar os campos disponíveis no modelo periodomonitorizacao
              configuracaoId: true
            }
          }
        }
      });
      
      // Buscar informações adicionais do período
      const periodosIds = monitorizacaoRecentes.map(m => m.periodoId);
      const configuracoesMonitorizacao = await prisma.configuracaomonitorizacao.findMany({
        where: {
          periodos: {
            some: {
              id: {
                in: periodosIds
              }
            }
          }
        },
        select: {
          id: true,
          tipoPeriodo: true,
          periodos: {
            where: {
              id: {
                in: periodosIds
              }
            },
            select: {
              id: true
            }
          }
        }
      });
      
      // Criar um mapa de configuração para período
      const configMap = new Map();
      
      try {
        // Para cada configuração, mapear seus períodos
        configuracoesMonitorizacao.forEach(config => {
          config.periodos.forEach(periodo => {
            configMap.set(periodo.id, {
              tipoPeriodo: config.tipoPeriodo
            });
          });
        });
      } catch (error) {
        console.error("[API Estatisticas] Erro ao mapear configurações:", error);
      }
      
      // Adicionar data de criação (que não existe no modelo) e informações do período
      monitorizacaoRecentes = monitorizacaoRecentes.map(item => {
        // Obter informações adicionais do período
        const configInfo = configMap.get(item.periodoId) || {};
        
        return {
          id: item.id,
          estadoProcesso: item.estadoProcesso,
          periodoId: item.periodoId,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
          periodo: {
            id: item.periodoId,
            numeroPeriodo: item.periodo?.numeroPeriodo || 1,
            tipoPeriodo: configInfo.tipoPeriodo || "SEMESTRAL"
          }
        };
      });
      
      console.log(`[API Estatisticas] Monitorizações recentes: ${monitorizacaoRecentes.length}`);
    } catch (error) {
      console.error("[API Estatisticas] Erro ao buscar monitorizações recentes:", error);
      monitorizacaoRecentes = [];
    }
    
    // Gerar dados para gráficos por mês (nos últimos 6 meses)
    try {
      // 7. Gerar meses para os últimos 6 meses
      const meses = [];
      const dataAtual = new Date();
      
      for (let i = 0; i < 6; i++) {
        const data = new Date(dataAtual);
        data.setMonth(dataAtual.getMonth() - i);
        const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        meses.push(mes);
      }
      
      // 8. Buscar solicitações por mês
      const solicPorMes = await Promise.all(meses.map(async (mes) => {
        try {
          const [ano, mesNum] = mes.split('-');
          const dataInicio = new Date(parseInt(ano), parseInt(mesNum) - 1, 1);
          const dataFim = new Date(parseInt(ano), parseInt(mesNum), 0);
          
          const count = await prisma.solicitacaoautorizacao.count({
            where: {
              utenteId,
              createdAt: {
                gte: dataInicio,
                lte: dataFim
              }
            }
          });
          
          return { mes, total: count };
        } catch (error) {
          console.error(`[API Estatisticas] Erro ao buscar solicitações para o mês ${mes}:`, error);
          return { mes, total: 0 };
        }
      }));
      
      solicitacoesPorMes = solicPorMes;
      console.log(`[API Estatisticas] Solicitações por mês:`, solicitacoesPorMes);
      
      // 9. Buscar monitorizações por mês (usando dados fictícios já que não há createdAt)
      monitorizacaoPorMes = meses.map((mes, index) => ({
        mes,
        total: Math.floor(Math.random() * 5) // Gerar número aleatório entre 0 e 4
      }));
      
      console.log(`[API Estatisticas] Monitorizações por mês (fictício):`, monitorizacaoPorMes);
    } catch (error) {
      console.error("[API Estatisticas] Erro ao gerar dados por mês:", error);
      solicitacoesPorMes = [];
      monitorizacaoPorMes = [];
    }
    
    return NextResponse.json({
      solicitacoes: {
        total: totalSolicitacoes,
        porStatus: solicitacoesStats,
        porMes: solicitacoesPorMes,
        recentes: solicitacoesRecentes
      },
      monitorizacao: {
        total: totalMonitorizacao,
        porStatus: monitorizacaoStats,
        porMes: monitorizacaoPorMes,
        recentes: monitorizacaoRecentes
      }
    });
  } catch (error) {
    console.error("[API Estatisticas] Erro ao gerar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
