import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Type for the request body
type RequestBody = {
  action?: string;
  numeroRupe?: string;
  rupePath?: string;
  motivoReabertura?: string;
  motivoRejeicao?: string;
  dataReaberturaAprovada?: Date;
  [key: string]: any; // For other potential properties
};

// Type for PeriodoMonitorizacao
type PeriodoMonitorizacao = {
  id: number;
  estado: string;
  dataFim: Date;
  dataSolicitacaoReabertura?: Date | null;
  motivoReabertura?: string | null;
  statusReabertura?: string | null;
  rupeReferencia?: string | null;
  rupePago: boolean;
  rupeValidado: boolean;
  dataReaberturaAprovada?: Date | null;
  dataValidadeReabertura?: Date | null;
  configuracaoId: number;
  numeroPeriodo: number;
  dataInicio: Date;
  configuracao?: {
    utente?: {
      id: number;
      nome: string;
      email: string;
    };
  };
};

// Rota para solicitar reabertura de um período
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('Processando solicitação de reabertura...');

  try {
    const body = await req.json() as RequestBody;
    console.log('Dados recebidos:', body);

    if (!body || !body.action) {
      console.error('Parâmetros inválidos');
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    // Ensure params is properly awaited
    const id = params?.id;
    if (!id) {
      console.error('ID não fornecido nos parâmetros');
      return NextResponse.json(
        { error: "ID do período não fornecido" },
        { status: 400 }
      );
    }

    const periodoId = parseInt(id);
    console.log('ID do período:', periodoId);
    
    if (isNaN(periodoId)) {
      console.error('ID do período inválido:', id);
      return NextResponse.json(
        { error: "ID do período inválido" },
        { status: 400 }
      );
    }

    const { action, motivoReabertura, numeroRupe, ...updateData } = body;

    if (!action) {
      console.error('Ação não especificada na requisição');
      return NextResponse.json(
        { error: "Ação não especificada" },
        { status: 400 }
      );
    }

    // Verificar se o período existe
    console.log(`Buscando período com ID: ${periodoId}`);
    const existingPeriod = await prisma.periodomonitorizacao.findUnique({
      where: { id: periodoId },
      include: {
        configuracao: {
          include: {
            utente: true
          }
        }
      }
    }) as unknown as PeriodoMonitorizacao | null;

    console.log('Período encontrado:', existingPeriod ? 'Sim' : 'Não');

    if (!existingPeriod) {
      return NextResponse.json(
        { error: "Período não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar o estado do período com base na ação
    if (action === "solicitar-reabertura") {
      console.log('Processando solicitação de reabertura para período:', periodoId);
      
      // Verificar se o motivo foi fornecido
      if (!motivoReabertura) {
        console.error('Motivo de reabertura não fornecido');
        return NextResponse.json(
          { error: "Motivo da reabertura é obrigatório" },
          { status: 400 }
        );
      }

      try {
        console.log('Atualizando período para SOLICITADA_REABERTURA...');
        const periodo = await prisma.periodomonitorizacao.update({
          where: { id: periodoId },
          data: {
            estado: "SOLICITADA_REABERTURA",
            motivoReabertura: motivoReabertura,
            dataSolicitacaoReabertura: new Date(),
            statusReabertura: "PENDENTE",
          } as any, // Type assertion to bypass TypeScript error
          include: {
            configuracao: {
              include: {
                utente: true,
              },
            },
          },
        });

        console.log('Período atualizado com sucesso:', periodo);

        // Aqui você pode adicionar lógica para notificar os administradores
        // sobre a solicitação de reabertura
        console.log('Notificando administradores sobre a nova solicitação...');
        // TODO: Implementar notificação para administradores

        return NextResponse.json({
          success: true,
          message: 'Solicitação de reabertura enviada com sucesso',
          data: periodo
        });
      } catch (error) {
        console.error('Erro ao atualizar o período:', error);
        return NextResponse.json(
          { 
            success: false,
            error: "Erro ao processar a solicitação de reabertura" 
          },
          { status: 500 }
        );
      }
    }

    // Lógica para enviar RUPE (primeira etapa de aprovação pelo Chefe)
    if (action === "aprovar-reabertura-chefe") {
      console.log('Processando envio de RUPE para período:', periodoId);
      
      // Verificar status atual do período
      if (existingPeriod.estado !== "SOLICITADA_REABERTURA" && existingPeriod.statusReabertura !== "PENDENTE") {
        return NextResponse.json(
          { error: "Período não está com solicitação de reabertura pendente" },
          { status: 400 }
        );
      }

      // Verificar se o número da RUPE e o caminho do arquivo foram fornecidos
      if (!body.numeroRupe) {
        return NextResponse.json(
          { error: "Número da RUPE não fornecido" },
          { status: 400 }
        );
      }

      if (!body.rupePath) {
        return NextResponse.json(
          { error: "Documento da RUPE não fornecido" },
          { status: 400 }
        );
      }
      
      // Atualizar o período com os dados da RUPE
      // Armazenar o caminho do arquivo em um campo de metadados JSON
      const metadata = { rupePath: body.rupePath };
      
      const periodoAtualizado = await prisma.periodomonitorizacao.update({
        where: { id: periodoId },
        data: {
          estado: 'AGUARDANDO_PAGAMENTO',
          rupeNumero: body.numeroRupe,
          statusReabertura: 'AGUARDANDO_PAGAMENTO',
          rupePago: false,
          rupeValidado: false,
          // Armazenar o caminho do arquivo como metadados
          motivoReabertura: JSON.stringify(metadata)
        } as any, // Type assertion para contornar o erro de TypeScript
        include: {
          configuracao: {
            include: {
              utente: true
            }
          }
        }
      });

      // Notificar o utente sobre a necessidade de pagamento do RUPE
      // Aqui você pode adicionar lógica para enviar e-mail ou notificação

      return NextResponse.json({ 
        success: true, 
        message: 'RUPE enviado com sucesso. Aguardando pagamento pelo utente.',
        numeroRupe: body.numeroRupe,
        rupePath: body.rupePath,
        periodo: periodoAtualizado
      });
    }
    
    // Lógica para o utente indicar que realizou o pagamento do RUPE
    if (action === "informar-pagamento-rupe") {
      console.log('Processando informação de pagamento de RUPE para período:', periodoId);
      
      if (existingPeriod.estado !== "AGUARDANDO_PAGAMENTO") {
        return NextResponse.json(
          { error: "Período não está aguardando pagamento de RUPE" },
          { status: 400 }
        );
      }

      // Atualizar o período indicando que o pagamento foi realizado
      const periodoAtualizado = await prisma.periodomonitorizacao.update({
        where: { id: periodoId },
        data: {
          estado: 'AGUARDANDO_CONFIRMACAO_PAGAMENTO',
          statusReabertura: 'AGUARDANDO_CONFIRMACAO_PAGAMENTO',
          rupePago: true,
          rupeValidado: false
        } as any, // Type assertion para contornar o erro de TypeScript
        include: {
          configuracao: {
            include: {
              utente: true
            }
          }
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Pagamento informado com sucesso. Aguardando confirmação pelo gestor.',
        periodo: periodoAtualizado
      });
    }
    
    // Lógica para o Chefe validar o pagamento do RUPE
    if (action === "validar-pagamento-rupe") {
      console.log('[API] Validando pagamento de RUPE para período:', periodoId);
      console.log('[API] Estado atual do período:', existingPeriod.estado);
      console.log('[API] Status de reabertura:', existingPeriod.statusReabertura);
      
      // Verificar se o período está em um estado válido para confirmação de pagamento
      // Aceitar tanto o estado do período quanto o statusReabertura
      const estadosValidos = ['AGUARDANDO_CONFIRMACAO_PAGAMENTO', 'AGUARDANDO_PAGAMENTO', 'SOLICITADA_REABERTURA'];
      const statusValidos = ['AGUARDANDO_CONFIRMACAO_PAGAMENTO', 'AGUARDANDO_PAGAMENTO', 'PENDENTE'];
      
      if (!estadosValidos.includes(existingPeriod.estado) && 
          !statusValidos.includes(existingPeriod.statusReabertura || '')) {
        console.log('[API] Estado inválido para confirmação de pagamento');
        return NextResponse.json(
          { error: "Período não está em um estado válido para confirmação de pagamento" },
          { status: 400 }
        );
      }
      
      // Verificar se o pagamento foi informado pelo utente (rupePago = true)
      // Se não foi, assumir que o Chefe está confirmando diretamente
      if (!existingPeriod.rupePago) {
        console.log('[API] Pagamento não foi informado pelo utente, mas será confirmado diretamente pelo Chefe');
      }

      // Calcular data de validade (7 dias a partir de agora)
      const dataValidade = new Date();
      dataValidade.setDate(dataValidade.getDate() + 7);

      // Atualizar o período confirmando o pagamento e reabrindo o período
      const periodoAtualizado = await prisma.periodomonitorizacao.update({
        where: { id: periodoId },
        data: {
          estado: 'REABERTO',
          statusReabertura: 'APROVADA',
          rupeValidado: true,
          dataReaberturaAprovada: new Date(),
          dataValidadeReabertura: dataValidade
        } as any, // Type assertion para contornar o erro de TypeScript
        include: {
          configuracao: {
            include: {
              utente: true
            }
          }
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Pagamento confirmado e período reaberto com sucesso por 7 dias',
        dataValidade,
        periodo: periodoAtualizado
      });
    }
    
    // Lógica original para aprovar solicitação de reabertura (mantida para compatibilidade)
    if (action === "aprovar-reabertura") {
      console.log('Processando aprovação direta de reabertura para período:', periodoId);
      
      if (existingPeriod.estado !== "SOLICITADA_REABERTURA") {
        return NextResponse.json(
          { error: "Período não está com solicitação de reabertura pendente" },
          { status: 400 }
        );
      }

      // Extract request body data
      const data = await req.json() as RequestBody;

      if (!data?.numeroRupe) {
        return NextResponse.json(
          { error: "Número do RUPE é obrigatório para aprovar a reabertura" },
          { status: 400 }
        );
      }

      // Calcular data de validade (7 dias a partir de agora)
      const dataValidade = new Date();
      dataValidade.setDate(dataValidade.getDate() + 7);

      // Atualizar o período com os dados da RUPE e reabrir
      const periodoAtualizado = await prisma.periodomonitorizacao.update({
        where: { id: periodoId },
        data: {
          estado: 'ABERTO',
          rupeReferencia: data.numeroRupe, // Use numeroRupe from the request body
          rupeValidado: true,
          rupePago: true,
          dataReaberturaAprovada: new Date(),
          dataValidadeReabertura: dataValidade,
          statusReabertura: 'APROVADA'
        } as any, // Type assertion para contornar o erro de TypeScript
        include: {
          configuracao: {
            include: {
              utente: true
            }
          }
        }
      });

      // Aqui você pode adicionar lógica para notificar o usuário
      // sobre a reabertura do período

      return NextResponse.json({ 
        success: true, 
        message: 'Período reaberto com sucesso por 7 dias',
        dataValidade,
        periodo: periodoAtualizado
      });
    }
    
    // Lógica para rejeitar solicitação de reabertura pelo chefe
    if (action === "rejeitar-reabertura-chefe") {
      console.log('Processando rejeição de reabertura para período:', periodoId);
      
      // Verificar status atual do período
      if (existingPeriod.estado !== "SOLICITADA_REABERTURA" && existingPeriod.statusReabertura !== "PENDENTE") {
        return NextResponse.json(
          { error: "Período não está com solicitação de reabertura pendente" },
          { status: 400 }
        );
      }
      
      // Atualizar o período rejeitando a solicitação
      const periodoAtualizado = await prisma.periodomonitorizacao.update({
        where: { id: periodoId },
        data: {
          estado: 'FECHADO',
          statusReabertura: 'REJEITADA',
          motivoReabertura: body.motivoRejeicao || 'Solicitação rejeitada pelo Chefe'
        } as any, // Type assertion para contornar o erro de TypeScript
        include: {
          configuracao: {
            include: {
              utente: true
            }
          }
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Solicitação de reabertura rejeitada com sucesso',
        periodo: periodoAtualizado
      });
    }
    
    // Lógica para confirmar pagamento RUPE e reabrir período
    if (action === "confirmarRupe") {
      if (existingPeriod.estado === "FECHADO") {
        return NextResponse.json(
          { error: "Período expirado. É necessário solicitar reabertura." },
          { status: 400 }
        );
      }

      if (!numeroRupe) {
        return NextResponse.json(
          { error: "Número da RUPE é obrigatório" },
          { status: 400 }
        );
      }

      // Verificar se o período está com solicitação de reabertura
      if (
        existingPeriod.estado !== "AGUARDANDO_APROVACAO_REABERTURA" &&
        existingPeriod.estado !== "REABERTURA_SOLICITADA"
      ) {
        return NextResponse.json(
          { error: "Solicitação de reabertura inválida ou já processada" },
          { status: 400 }
        );
      }

      // Calcular data de validade (7 dias a partir de agora)
      const dataValidade = new Date();
      dataValidade.setDate(dataValidade.getDate() + 7);

      // Atualizar o período com os dados da RUPE e reabrir
      await prisma.periodomonitorizacao.update({
        where: { id: periodoId },
        data: {
          estado: 'ABERTO',
          // Usando type assertion para contornar o erro de TypeScript
          ...(numeroRupe ? { rupeNumero: numeroRupe } : {}),
          rupeValidado: true,
          rupePago: true,
          dataReaberturaAprovada: new Date(),
          dataValidadeReabertura: dataValidade,
          statusReabertura: 'APROVADA'
        } as any // Type assertion para contornar o erro de TypeScript
      });

      // Aqui você pode adicionar lógica para notificar o usuário
      // sobre a reabertura do período

      return NextResponse.json({ 
        success: true, 
        message: 'Período reaberto com sucesso por 7 dias',
        dataValidade
      });
    }

    // Se não for nenhuma ação específica, fazer uma atualização genérica
    if (Object.keys(updateData).length > 0) {
      // Verificar se o período está expirado
      const dataAtual = new Date();
      const dataFim = new Date(existingPeriod.dataFim);
      const isPeriodoExpirado = dataAtual > dataFim;

      const updatePayload: any = { ...updateData };
      
      // Se o período estiver expirado e não houver uma data de reabertura, forçar estado FECHADO
      if (isPeriodoExpirado && !updateData.dataReaberturaAprovada) {
        updatePayload.estado = 'FECHADO';
      }

      const updatedPeriodo = await prisma.periodomonitorizacao.update({
        where: { id: periodoId },
        data: updatePayload,
        include: {
          configuracao: {
            include: {
              utente: true
            }
          }
        }
      });

      return NextResponse.json(updatedPeriodo);
    }

    // Se nenhuma ação válida for fornecida
    return NextResponse.json(
      { error: 'Nenhuma ação válida fornecida' },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao atualizar período:", error);
    
    // Tratar erros específicos do Prisma
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { error: "Período não encontrado" },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: "Violação de restrição única. Verifique os dados fornecidos." },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Erro ao processar a requisição" },
      { status: 500 }
    );
  }
}
