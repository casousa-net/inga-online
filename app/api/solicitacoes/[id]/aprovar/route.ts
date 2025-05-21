import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { observacoes } = body;

    // Verificar se a solicitação existe
    const solicitacao = await prisma.solicitacaoautorizacao.findUnique({
      where: { id },
      include: {
        utente: true,
        moeda: true,
        solicitacaoitem: {
          include: {
            codigopautal: true
          }
        }
      }
    });

    if (!solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o pagamento foi validado
    if (!solicitacao.rupeValidado) {
      return NextResponse.json(
        { error: 'Pagamento ainda não foi validado' },
        { status: 400 }
      );
    }

    // Gerar o PDF da licença
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Configurações de texto
    const fontSize = 12;
    const lineHeight = 20;
    let y = 800; // Posição inicial do texto

    // Cabeçalho
    page.drawText('REPÚBLICA DE ANGOLA', {
      x: 250,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    y -= lineHeight;
    page.drawText('MINISTÉRIO DO COMÉRCIO', {
      x: 230,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    y -= lineHeight;
    page.drawText('INSTITUTO NACIONAL DE GESTÃO DE ANGOLA (INGA)', {
      x: 130,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    y -= lineHeight * 2;
    page.drawText('AUTORIZAÇÃO DE IMPORTAÇÃO / EXPORTAÇÃO', {
      x: 150,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Número da autorização
    y -= lineHeight * 2;
    page.drawText(`Nº: PA-${String(solicitacao.id).padStart(6, '0')}`, {
      x: 50,
      y,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Data
    const dataEmissao = new Date().toLocaleString('pt-AO');
    page.drawText(`Data de Emissão: ${dataEmissao}`, {
      x: 350,
      y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Informações do utente
    y -= lineHeight * 2;
    page.drawText('DADOS DO UTENTE:', {
      x: 50,
      y,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    y -= lineHeight;
    page.drawText(`Nome: ${solicitacao.utente.nome}`, {
      x: 50,
      y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    y -= lineHeight;
    page.drawText(`NIF: ${solicitacao.utente.nif}`, {
      x: 50,
      y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Informações da autorização
    y -= lineHeight * 2;
    page.drawText('DADOS DA AUTORIZAÇÃO:', {
      x: 50,
      y,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    y -= lineHeight;
    page.drawText(`Tipo: ${solicitacao.tipo}`, {
      x: 50,
      y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    y -= lineHeight;
    page.drawText(`Referência RUPE: ${solicitacao.rupeReferencia}`, {
      x: 50,
      y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    y -= lineHeight;
    page.drawText(`Valor Total: ${solicitacao.valorTotalKz.toLocaleString('pt-AO')} Kz`, {
      x: 50,
      y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Itens da autorização
    y -= lineHeight * 2;
    page.drawText('ITENS AUTORIZADOS:', {
      x: 50,
      y,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    y -= lineHeight;
    // Cabeçalho da tabela
    page.drawText('Descrição', {
      x: 50,
      y,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Código Pautal', {
      x: 250,
      y,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Quantidade', {
      x: 350,
      y,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Valor', {
      x: 450,
      y,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Itens
    for (const item of solicitacao.solicitacaoitem) {
      y -= lineHeight;
      
      page.drawText(item.descricao || 'Sem descrição', {
        x: 50,
        y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(item.codigopautal?.codigo || 'N/A', {
        x: 250,
        y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(item.quantidade.toString(), {
        x: 350,
        y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(`${item.valorUnitario.toLocaleString('pt-AO')} ${solicitacao.moeda?.nome || 'USD'}`, {
        x: 450,
        y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // Assinatura
    y -= lineHeight * 4;
    page.drawText('Assinado digitalmente pela Direção do INGA', {
      x: 150,
      y,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    y -= lineHeight;
    const dataAssinatura = new Date().toLocaleString('pt-AO');
    page.drawText(`Data: ${dataAssinatura}`, {
      x: 250,
      y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Rodapé
    y -= lineHeight * 4;
    page.drawText('Este documento é válido por 90 dias a partir da data de emissão.', {
      x: 120,
      y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Salvar o PDF
    const pdfBytes = await pdfDoc.save();
    
    // Criar diretório para armazenar as licenças se não existir
    const uploadDir = path.join(process.cwd(), 'uploads', 'licencas');
    await mkdir(uploadDir, { recursive: true });
    
    // Nome do arquivo
    const fileName = `licenca_${id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    
    // Salvar o arquivo
    await writeFile(filePath, pdfBytes);
    
    // Atualizar a solicitação
    const updatedSolicitacao = await prisma.solicitacaoautorizacao.update({
      where: { id },
      data: {
        aprovadoPorDirecao: true,
        status: 'Aprovado',
        observacoes: observacoes || null,
        dataAprovacao: new Date(),
        licencaDocumento: fileName,
      },
    });

    return NextResponse.json({
      ...updatedSolicitacao,
      licencaDocumento: fileName
    });
  } catch (error) {
    console.error('Erro ao aprovar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao aprovar solicitação' },
      { status: 500 }
    );
  }
}
