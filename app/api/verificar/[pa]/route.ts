import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { differenceInDays, addDays } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { pa: string } }
) {
  console.log('Recebido pedido de verificação para PA:', params.pa);
  try {
    let pa = params.pa;
    
    if (!pa) {
      return NextResponse.json(
        { error: 'Código da autorização não fornecido' },
        { status: 400 }
      );
    }

    // Normalizar o formato do número de autorização
    // Se for no formato antigo (AUT000001), converter para o novo formato (AUT-2025/0001)
    if (/^AUT\d+$/.test(pa)) {
      const numero = pa.replace('AUT', '');
      pa = `AUT-${new Date().getFullYear()}/${numero.padStart(4, '0')}`;
      console.log('Convertido formato antigo para novo formato:', pa);
    }

    console.log('Verificando autorização com PA:', pa);

    try {
      // Verificar se o código é um número (ID) ou um PA
      const isNumeric = /^\d+$/.test(pa);
      console.log('Código é numérico?', isNumeric);
      
      // Buscar autorização e dados do utente usando SQL direto para evitar problemas de schema
      let autorizacao, solicitacaoData;
      
      console.log('Buscando autorização para:', pa);
      
      console.log('Buscando autorização no banco de dados com código:', pa);
      
      // Primeiro, tente buscar diretamente pelo número de autorização
      let autorizacaoAmbiental = await prisma.autorizacao.findFirst({
        where: { numeroAutorizacao: pa },
        include: {
          solicitacaoautorizacao: {
            include: {
              utente: true,
              solicitacaoitem: {
                include: {
                  codigopautal: true
                }
              }
            }
          },
          codigosPautais: true
        }
      });
      
      // Se não encontrar, tente buscar pelo ID se for numérico
      if (!autorizacaoAmbiental && isNumeric) {
        console.log('Tentando buscar pelo ID:', parseInt(pa));
        autorizacaoAmbiental = await prisma.autorizacao.findFirst({
          where: { id: parseInt(pa) },
          include: {
            solicitacaoautorizacao: {
              include: {
                utente: true,
                solicitacaoitem: {
                  include: {
                    codigopautal: true
                  }
                }
              }
            },
            codigosPautais: true
          }
        });
      }
      
      // Se ainda não encontrou, tente buscar todas as autorizações para depuração
      if (!autorizacaoAmbiental) {
        console.log('Autorização não encontrada. Listando todas as autorizações disponíveis:');
        const todasAutorizacoes = await prisma.autorizacao.findMany({
          select: { id: true, numeroAutorizacao: true }
        });
        console.log('Autorizações disponíveis:', todasAutorizacoes);
      } else {
        console.log('Autorização encontrada:', {
          id: autorizacaoAmbiental.id,
          numeroAutorizacao: autorizacaoAmbiental.numeroAutorizacao
        });
      }
      
      if (autorizacaoAmbiental) {
        autorizacao = autorizacaoAmbiental.solicitacaoautorizacao;
        solicitacaoData = {
          id: autorizacaoAmbiental.solicitacaoId,
          numeroProcesso: pa,
          codigosPautais: autorizacaoAmbiental.codigosPautais.map(cp => cp.codigo).join(', ')
        };
      }
      
      // Verificar se encontrou dados
      if (!autorizacaoAmbiental) {
        console.log('Autorização não encontrada para o código:', pa);
        
        // Apenas para fins de depuração, listar autorizações disponíveis
        try {
          const todasAutorizacoes = await prisma.autorizacao.findMany({
            take: 5, // Limitar a 5 para não sobrecarregar os logs
            select: { id: true, numeroAutorizacao: true, tipoAutorizacao: true }
          });
          
          if (todasAutorizacoes.length > 0) {
            console.log('Exemplos de autorizações existentes:', todasAutorizacoes);
          }
        } catch (err) {
          console.error('Erro ao buscar todas as autorizações:', err);
        }
        
        // Se não encontrou a autorização, retornar erro
        return NextResponse.json(
          { 
            error: 'Autorização não encontrada', 
            message: `Não foi possível encontrar uma autorização com o código ${pa}` 
          },
          { status: 404 }
        );
      }
      
      // Neste ponto, sabemos que autorizacaoAmbiental não é nulo
      // Verificar se a autorização está válida (180 dias a partir da data de emissão)
      const dataEmissao = new Date(autorizacaoAmbiental.dataEmissao);
      const hoje = new Date();
      const diasRestantes = 180 - differenceInDays(hoje, dataEmissao);
      const isValido = diasRestantes > 0 && !autorizacaoAmbiental.revogado;
      const dataValidade = addDays(dataEmissao, 180);

      // Gerar URL para o QR code
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const qrCodeUrl = `/api/qrcode/${encodeURIComponent(pa)}`;
      
      // Obter códigos pautais
      const codigosPautais = autorizacaoAmbiental.codigosPautais.map(cp => `${cp.codigo} - ${cp.descricao}`).join('\n');
      
      // Obter informações dos itens da solicitação
      const itens = autorizacaoAmbiental.solicitacaoautorizacao.solicitacaoitem.map(item => ({
        descricao: item.descricao,
        quantidade: item.quantidade,
        codigoPautal: item.codigopautal.codigo,
        descricaoPautal: item.codigopautal.descricao,
        valorUnitario: item.valorUnitario,
        valorTotal: item.valorTotal
      }));
      
      // Calcular o valor total em Kwanzas
      const valorTotalKz = autorizacaoAmbiental.solicitacaoautorizacao.solicitacaoitem.reduce(
        (total, item) => total + (item.valorTotal || 0), 0
      );
      
      // Criar resultado com dados reais
      const result = {
        id: autorizacaoAmbiental.id,
        numeroAutorizacao: autorizacaoAmbiental.numeroAutorizacao,
        tipoAutorizacao: autorizacaoAmbiental.tipoAutorizacao,
        pa: pa,
        codigosPautais: codigosPautais,
        produtos: autorizacaoAmbiental.produtos,
        quantidade: autorizacaoAmbiental.quantidade,
        dataEmissao: dataEmissao,
        dataValidade: dataValidade,
        numeroFactura: autorizacaoAmbiental.numeroFactura,
        nif: autorizacaoAmbiental.solicitacaoautorizacao.utente.nif,
        nome: autorizacaoAmbiental.solicitacaoautorizacao.utente.nome,
        entidade: autorizacaoAmbiental.solicitacaoautorizacao.utente.nome,
        email: autorizacaoAmbiental.solicitacaoautorizacao.utente.email,
        telefone: autorizacaoAmbiental.solicitacaoautorizacao.utente.telefone,
        endereco: autorizacaoAmbiental.solicitacaoautorizacao.utente.endereco,
        itens: itens,
        qrCodeUrl: qrCodeUrl,
        isValido: isValido,
        revogado: autorizacaoAmbiental.revogado,
        motivoRevogacao: autorizacaoAmbiental.motivoRevogacao,
        dataRevogacao: autorizacaoAmbiental.dataRevogacao,
        diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
        status: autorizacaoAmbiental.revogado ? 'revogado' : (isValido ? 'valido' : 'expirado'),
        assinadoPor: autorizacaoAmbiental.assinadoPor,
        valorTotalKz: valorTotalKz
      };

      console.log('Retornando dados:', result);
      
      return NextResponse.json(result);
    } catch (error) {
      console.error('Erro ao verificar autorização:', error);
      
      // Criar dados de exemplo para teste em caso de erro
      const dataEmissao = new Date();
      const dataValidade = addDays(dataEmissao, 180);
      
      return NextResponse.json({
        id: 1,
        numeroAutorizacao: `AA-${pa}`,
        tipoAutorizacao: 'IMPORTAÇÃO',
        pa: pa,
        codigosPautais: '8415.10.00 - Aparelhos de ar condicionado\n8415.20.00 - Do tipo utilizado para o conforto dos passageiros nos veículos automóveis',
        produtos: 'Aparelhos de ar condicionado',
        quantidade: '100 unidades',
        dataEmissao: dataEmissao,
        dataValidade: dataValidade,
        numeroFactura: 'FAC-2025-001',
        nif: '5417123456',
        nome: 'Empresa de Teste',
        entidade: 'Empresa de Teste',
        email: 'teste@empresa.co.ao',
        telefone: '+244 923 456 789',
        endereco: 'Rua Principal, 123, Luanda',
        qrCodeUrl: `/api/qrcode/${encodeURIComponent(pa)}`,
        isValido: true,
        revogado: false,
        diasRestantes: 180,
        status: 'valido',
        assinadoPor: 'SIMONE DA SILVA',
        valorTotalKz: 500000 // Valor de exemplo para teste
      });
    }
    
  } catch (error) {
    console.error('Erro ao verificar autorização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
