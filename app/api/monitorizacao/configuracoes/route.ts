import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Definir tipos para as entidades
type Utente = {
  id: number;
  nome: string;
  nif: string;
  email: string;
};

type ConfiguracaoMonitorizacao = {
  id: number;
  utenteId: number | null;
  tipoPeriodo: string;
  dataInicio: Date;
  descricao: string;
  createdAt?: Date;
  updatedAt?: Date;
  utente: Utente | null;
};

type PeriodoMonitorizacao = {
  id: number;
  configuracaoId: number;
  numeroPeriodo: number;
  dataInicio: Date;
  dataFim: Date;
  estado: string;
};

// GET - Listar todas as configurações de monitorizacao
export async function GET(req: NextRequest) {
  console.log('Listando configurações de monitorização...');
  
  try {
    console.log('Buscando configurações...');
    
    // Utilizar Prisma diretamente
    const configuracoes = await prisma.configuracaomonitorizacao.findMany({
      include: {
        utente: true
      }
    });
    
    console.log(`Encontradas ${configuracoes.length} configurações.`);
    
    if (configuracoes.length === 0) {
      console.log('Nenhuma configuração encontrada. Retornando array vazio.');
      return NextResponse.json([]);
    }
    
    // Buscar períodos
    console.log('Buscando períodos...');
    let periodos: PeriodoMonitorizacao[] = [];
    try {
      periodos = await prisma.periodomonitorizacao.findMany({
        orderBy: {
          numeroPeriodo: 'asc'
        }
      });
      console.log(`Encontrados ${periodos.length} períodos.`);
    } catch (periodosError) {
      console.error('Erro ao buscar períodos:', periodosError);
      // Continua com array vazio se não conseguir buscar os períodos
    }
    
    // Formatar os dados para o formato esperado pelo frontend
    console.log('Formatando dados para o frontend...');
    const configuracoesMapeadas = configuracoes.map((config: any) => ({
      id: Number(config.id),
      utenteId: config.utenteId ? Number(config.utenteId) : null,
      tipoPeriodo: config.tipoPeriodo,
      dataInicio: config.dataInicio,
      descricao: config.descricao || '',
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      utente: config.utente ? {
        id: Number(config.utente.id),
        nome: config.utente.nome,
        nif: config.utente.nif,
        email: config.utente.email
      } : null,
      periodos: periodos
        .filter((periodo: any) => Number(periodo.configuracaoId) === Number(config.id))
        .map((periodo: any) => ({
          id: Number(periodo.id),
          configuracaoId: Number(periodo.configuracaoId),
          numeroPeriodo: Number(periodo.numeroPeriodo),
          dataInicio: periodo.dataInicio,
          dataFim: periodo.dataFim,
          estado: periodo.estado
        }))
    }));
    
    console.log(`Retornando ${configuracoesMapeadas.length} configurações.`);
    return NextResponse.json(configuracoesMapeadas);
    
  } catch (error) {
    console.error("Erro ao listar configurações de monitorização:", error);
    
    // Verificar se é um erro de tabela não encontrada ou outro erro comum
    if (error instanceof Error) {
      console.error('Erro detalhado:', error.message);
      
      if (error.message.includes('does not exist') || 
          error.message.includes('no such table') || 
          error.message.includes('Unknown table') ||
          error.message.includes('cannot be null')) {
        console.error('Erro de tabela ou campo:', error.message);
        return NextResponse.json([]);
      }
    }
    
    return NextResponse.json(
      { 
        error: "Erro ao listar configurações de monitorização",
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// POST - Criar nova configuração de monitorização
export async function POST(req: NextRequest) {
  console.log('Criando configuração de monitorização...');
  try {
    const data = await req.json();
    const { utenteId, tipoPeriodo, dataInicio } = data;
    
    console.log('Dados recebidos:', { utenteId, tipoPeriodo, dataInicio });
    
    if (!utenteId || !tipoPeriodo || !dataInicio) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }
    
    // Verificar se o utente existe
    const utente = await prisma.utente.findUnique({
      where: { id: utenteId }
    });
    
    if (!utente) {
      return NextResponse.json(
        { error: "Utente não encontrado" },
        { status: 404 }
      );
    }
    
    // Verificar se já existe configuração para este utente
    const existingConfig = await prisma.configuracaomonitorizacao.findFirst({
      where: {
        utenteId: utenteId
      }
    });
    
    if (existingConfig) {
      return NextResponse.json(
        { error: "Já existe uma configuração para este utente" },
        { status: 400 }
      );
    }
    
    console.log('Criando configuração...');
    
    // Criar configuração usando Prisma ORM
    const dataInicioObj = new Date(dataInicio);
    
    // Criar nova configuração usando Prisma
    try {
      console.log('Criando configuração com os dados:', { utenteId, tipoPeriodo, dataInicio: dataInicioObj });
      
      // Usar o método create do Prisma
      const novaConfiguracao = await prisma.configuracaomonitorizacao.create({
        data: {
          utenteId,
          tipoPeriodo,
          dataInicio: dataInicioObj,
          descricao: `Configuração ${tipoPeriodo}`
        } as any // Usando type assertion para contornar o erro de tipagem
      });
      
      console.log('Configuração criada com sucesso:', novaConfiguracao);
    } catch (createError) {
      console.error('Erro ao criar configuração:', createError);
      
      // Tentar criar usando SQL direto como fallback
      console.log('Tentando criar usando SQL direto...');
      await prisma.$executeRaw`
        INSERT INTO configuracaomonitorizacao (utenteId, tipoPeriodo, dataInicio, descricao) 
        VALUES (${utenteId}, ${tipoPeriodo}, ${dataInicioObj.toISOString().slice(0, 19).replace('T', ' ')}, 'Configuração ${tipoPeriodo}');
      `;
      
      // Buscar a configuração criada
      const configs = await prisma.$queryRaw`
        SELECT id FROM configuracaomonitorizacao 
        WHERE utenteId = ${utenteId} 
        ORDER BY id DESC LIMIT 1
      `;
      
      if (!Array.isArray(configs) || configs.length === 0) {
        throw new Error('Não foi possível criar a configuração');
      }
      
      const novaConfiguracao = { id: Number((configs as any)[0].id) };
      console.log('Configuração criada via SQL:', novaConfiguracao);
    }
    
    // Buscar a configuração criada para garantir
    const configuracaoCriada = await prisma.configuracaomonitorizacao.findFirst({
      where: { utenteId }
    });
    
    if (!configuracaoCriada) {
      return NextResponse.json(
        { error: "Erro ao criar configuração" },
        { status: 500 }
      );
    }
    
    const configuracao = { id: configuracaoCriada.id };
    
    console.log('Configuração criada:', configuracao);
    
    // Criar períodos com base no tipo de período
    const periodos: { id: number; dataInicio: Date; numeroPeriodo: number; configuracaoId: number; dataFim: Date; estado: string; }[] = [];
    let numeroPeriodo = 1;
    
    // Função para criar períodos
    const criarPeriodos = async () => {
      const periodosMeses = tipoPeriodo === 'ANUAL' ? 12 : tipoPeriodo === 'SEMESTRAL' ? 6 : 3;
      const quantidadePeriodos = 12 / periodosMeses; // Quantos períodos em um ano
      
      for (let i = 0; i < quantidadePeriodos; i++) {
        const inicio = new Date(dataInicioObj);
        inicio.setMonth(dataInicioObj.getMonth() + (i * periodosMeses));
        
        const fim = new Date(inicio);
        fim.setMonth(inicio.getMonth() + periodosMeses - 1);
        fim.setDate(new Date(fim.getFullYear(), fim.getMonth() + 1, 0).getDate()); // Último dia do mês
        
        // Criar período usando Prisma ORM
        const novoPeriodo = await prisma.periodomonitorizacao.create({
          data: {
            configuracaoId: configuracao.id,
            numeroPeriodo: numeroPeriodo,
            dataInicio: inicio,
            dataFim: fim,
            estado: 'FECHADO'
          }
        });
        
        periodos.push({
          id: novoPeriodo.id,
          configuracaoId: configuracao.id,
          numeroPeriodo: numeroPeriodo,
          dataInicio: inicio,
          dataFim: fim,
          estado: 'FECHADO'
        });
        
        numeroPeriodo++;
      }
    };
    
    await criarPeriodos();
    
    return NextResponse.json({
      configuracao,
      periodos
    });
    
  } catch (error) {
    console.error("Erro ao criar configuração de monitorização:", error);
    return NextResponse.json(
      { error: "Erro ao criar configuração de monitorização" },
      { status: 500 }
    );
  }
}
