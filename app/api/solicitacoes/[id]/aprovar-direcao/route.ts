import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

// Criar uma nova instância do Prisma Client para evitar problemas de tipagem
const newPrisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Obter o número da fatura do corpo da requisição
  const { numeroFactura } = await request.json().catch(() => ({}));
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Buscar a solicitação
    const solicitacao = await prisma.solicitacaoautorizacao.findUnique({
      where: { id }
    });
    
    // Formatar o número do processo no formato PA-000000 (apenas para uso no código)
    const numeroProcesso = `PA-${String(id).padStart(6, '0')}`;

    if (!solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o pagamento foi validado pelo chefe
    if (!solicitacao.rupeValidado) {
      return NextResponse.json(
        { error: 'Pagamento ainda não foi validado pelo chefe' },
        { status: 400 }
      );
    }

    // Criar uma nova autorização ambiental
    const dataEmissao = new Date();
    const numeroAutorizacao = `${dataEmissao.getFullYear()}${String(dataEmissao.getMonth() + 1).padStart(2, '0')}${String(dataEmissao.getDate()).padStart(2, '0')}${String(dataEmissao.getHours()).padStart(2, '0')}${String(dataEmissao.getMinutes()).padStart(2, '0')}${String(dataEmissao.getSeconds()).padStart(2, '0')}`;

    // Buscar detalhes da solicitação usando SQL bruto
    const [solicitacaoCompleta] = await prisma.$queryRaw<any[]>`
      SELECT 
        sa.*,
        u.nome as utente_nome,
        u.nif as utente_nif
      FROM solicitacaoautorizacao sa
      JOIN utente u ON sa.utenteId = u.id
      WHERE sa.id = ${id}
    `;

    // Buscar itens da solicitação
    const solicitacaoItens = await prisma.$queryRaw<any[]>`
      SELECT 
        si.*,
        cp.codigo as codigopautal_codigo,
        cp.descricao as codigopautal_descricao
      FROM solicitacaoitem si
      JOIN codigopautal cp ON si.codigoPautalId = cp.id
      WHERE si.solicitacaoId = ${id}
    `;

    if (!solicitacaoCompleta) {
      throw new Error('Solicitação não encontrada');
    }

    console.log('Dados da solicitação:', {
      numeroAutorizacao,
      tipo: solicitacaoCompleta.tipo,
      id,
      rupe: solicitacaoCompleta.rupeReferencia,
      produtos: solicitacaoItens.map(item => item.descricao).join(', '),
      quantidade: solicitacaoItens.map(item => `${item.quantidade}`).join(', '),
      dataEmissao
    });

    // Verificar se a tabela autorizacao existe
    console.log('Verificando tabelas existentes...');
    const tabelas = await prisma.$queryRaw`SHOW TABLES`;
    console.log('Tabelas existentes:', tabelas);
    
    // Verificar estrutura da tabela autorizacao
    console.log('Verificando estrutura da tabela autorizacao...');
    const estrutura = await prisma.$queryRaw`DESCRIBE autorizacao`;
    console.log('Estrutura da tabela autorizacao:', estrutura);
    
    // Usar o número da fatura da solicitação ou o número fornecido ou o número de referência RUPE como fallback
    const facturaNumero = solicitacaoCompleta.numeroFactura || numeroFactura || solicitacaoCompleta.rupeReferencia || '';
    
    // O número do processo será gerado dinamicamente a partir do ID da solicitação
    // Não precisamos armazenar na tabela, pois podemos gerar quando necessário
    console.log('Número do processo gerado (não armazenado):', numeroProcesso);
    
    // Obter a descrição dos códigos pautais para usar como produtos
    const descricaoCodigosPautais = solicitacaoItens
      .map(item => item.codigopautal_descricao || item.descricao)
      .join(', ');
    
    // Criar a autorização ambiental usando SQL bruto
    console.log('Inserindo nova autorização com os seguintes dados:', {
      numeroAutorizacao,
      tipoAutorizacao: solicitacaoCompleta.tipo,
      solicitacaoId: id,
      numeroFactura: facturaNumero,
      produtos: descricaoCodigosPautais,
      quantidade: solicitacaoItens.map(item => `${item.quantidade}`).join(', '),
      dataEmissao: dataEmissao.toISOString(),
      assinadoPor: 'SIMONE DA SILVA'
    });
    
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO autorizacao (
          numeroAutorizacao,
          tipoAutorizacao,
          solicitacaoId,
          numeroFactura,
          produtos,
          quantidade,
          dataEmissao,
          assinadoPor
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, 
        numeroAutorizacao,
        solicitacaoCompleta.tipo,
        id,
        facturaNumero,
        descricaoCodigosPautais,
        solicitacaoCompleta.solicitacaoitem.map((item: { quantidade: any; }) => `${item.quantidade}`).join(', '),
        dataEmissao,
        'SIMONE DA SILVA'
      );
      console.log('Autorização inserida com sucesso!');
    } catch (error) {
      console.error('Erro ao inserir autorização:', error);
      throw error;
    }

    // Buscar a autorização criada
    console.log('Buscando autorização criada com numeroAutorizacao:', numeroAutorizacao);
    let novaAutorizacao;
    try {
      const autorizacoes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM autorizacao WHERE numeroAutorizacao = ?
      `, numeroAutorizacao);
      
      console.log('Resultado da busca de autorização:', autorizacoes);
      
      if (!autorizacoes || autorizacoes.length === 0) {
        console.error('Autorização não encontrada após inserção!');
        // Verificar todas as autorizações
        const todasAutorizacoes = await prisma.$queryRaw`SELECT * FROM autorizacao`;
        console.log('Todas as autorizações:', todasAutorizacoes);
        throw new Error('Autorização não encontrada após inserção');
      }
      
      novaAutorizacao = autorizacoes[0];
      console.log('Autorização criada:', novaAutorizacao);
    } catch (error) {
      console.error('Erro ao buscar autorização criada:', error);
      throw error;
    }

    // Criar os códigos pautais associados
    if (!novaAutorizacao) {
      throw new Error('Autorização não encontrada para criar códigos pautais');
    }
    
    console.log('Criando códigos pautais para autorização ID:', novaAutorizacao.id);
    for (const item of solicitacaoCompleta.solicitacaoitem) {
      console.log('Inserindo código pautal:', item.codigopautal.codigo);
      await prisma.$executeRawUnsafe(`
        INSERT INTO codigopautalautorizacao (
          autorizacaoId,
          codigo,
          descricao
        ) VALUES (?, ?, ?)
      `,
        novaAutorizacao.id,
        item.codigopautal.codigo,
        item.codigopautal.descricao
      );
    }

    // Buscar os códigos pautais criados
    const codigosPautais = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM codigopautalautorizacao WHERE autorizacaoId = ?
    `, novaAutorizacao.id);

    console.log('Códigos pautais criados:', codigosPautais);

    // Buscar o nome do diretor logado do body
    const requestBody = await request.json();
    const { nome } = requestBody;

    // Atualizar a solicitação usando SQL direto para contornar restrições de tipo
    await prisma.$executeRaw`
      UPDATE solicitacaoautorizacao 
      SET aprovadoPorDirecao = 1,
          status = 'Aprovado',
          dataAprovacao = ${dataEmissao},
          direcaoValidador = ${nome}
      WHERE id = ${id}
    `;

    // Buscar a solicitação atualizada
    const updatedSolicitacao = await prisma.solicitacaoautorizacao.findUnique({
      where: { id }
    });

    return NextResponse.json({
      ...updatedSolicitacao,
      autorizacao: novaAutorizacao
    });
  } catch (error) {
    console.error('Erro ao aprovar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao aprovar solicitação' },
      { status: 500 }
    );
  }
}
