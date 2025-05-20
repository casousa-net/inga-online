import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da autorização não fornecido' },
        { status: 400 }
      );
    }

    try {
      // Buscar autorização e dados do utente
      const [autorizacao, utente] = await Promise.all([
        prisma.$queryRaw`
          SELECT id, tipo, dataAprovacao, utenteId, rupeReferencia 
          FROM solicitacaoautorizacao 
          WHERE id = ${parseInt(id)}
        `,
        prisma.$queryRaw`
          SELECT s.id, u.nome, u.nif, s.numeroProcesso, s.codigosPautais
          FROM solicitacao s
          JOIN utente u ON s.utenteId = u.id
          WHERE s.id = ${parseInt(id)}
        `
      ]);

      // Verificar se encontrou dados
      if (!autorizacao || !Array.isArray(autorizacao) || autorizacao.length === 0) {
        return NextResponse.json(
          { error: 'Autorização não encontrada' },
          { status: 404 }
        );
      }

      const auth = Array.isArray(autorizacao) ? autorizacao[0] : autorizacao;
      const utenteData = Array.isArray(utente) && utente.length > 0 ? utente[0] : null;

      // Verificar se a autorização está válida (180 dias a partir da data de emissão)
      const dataEmissao = auth.dataAprovacao || new Date();
      const hoje = new Date();
      const diasRestantes = 180 - differenceInDays(hoje, dataEmissao);
      const isValido = diasRestantes > 0;

      // Gerar URL para o QR code
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const qrCodeUrl = `${baseUrl}/api/qrcode/${id}`;
      
      // Retornar os dados formatados para o PDF de verificação
      return NextResponse.json({
        tipoAutorizacao: auth.tipo || 'Importação',
        pa: utenteData?.numeroProcesso || '',
        codigosPautais: utenteData?.codigosPautais || '',
        dataEmissao: dataEmissao,
        nif: utenteData?.nif || '',
        nome: utenteData?.nome || '',
        qrCodeUrl: qrCodeUrl,
        isValido: isValido,
        diasRestantes: diasRestantes > 0 ? diasRestantes : 0
      });
    } catch (error) {
      console.error('Erro ao buscar dados da autorização:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao buscar dados da autorização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
