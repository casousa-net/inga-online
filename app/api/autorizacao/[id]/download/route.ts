import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Extrair o ID do número do processo (PA-000001 -> 1)
    const match = params.id.match(/PA-0*([1-9][0-9]*)/);
    const id = match ? Number(match[1]) : Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    if (solicitacao.status !== 'Aprovado') {
      return NextResponse.json({ error: 'Licença disponível apenas para processos aprovados' }, { status: 403 });
    }

    // Gerar PDF da licença
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    
    // Adicionar fonte
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Título
    page.drawText('REPÚBLICA DE ANGOLA', {
      x: width / 2 - 100,
      y: height - 50,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('INSTITUTO NACIONAL DE GESTÃO ADUANEIRA', {
      x: width / 2 - 170,
      y: height - 80,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('LICENÇA DE IMPORTAÇÃO / EXPORTAÇÃO', {
      x: width / 2 - 150,
      y: height - 120,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Número do processo
    page.drawText(`PROCESSO Nº: PA-${String(solicitacao.id).padStart(6, "0")}`, {
      x: 50,
      y: height - 170,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Data
    const dataEmissao = new Date().toLocaleDateString('pt-AO');
    page.drawText(`DATA DE EMISSÃO: ${dataEmissao}`, {
      x: width - 250,
      y: height - 170,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Dados do utente
    page.drawText('DADOS DO UTENTE:', {
      x: 50,
      y: height - 220,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Nome: ${solicitacao.utente.nome}`, {
      x: 50,
      y: height - 250,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`NIF: ${solicitacao.utente.nif}`, {
      x: 50,
      y: height - 270,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Endereço: ${solicitacao.utente.endereco}`, {
      x: 50,
      y: height - 290,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Detalhes da autorização
    page.drawText('DETALHES DA AUTORIZAÇÃO:', {
      x: 50,
      y: height - 340,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Tipo: ${solicitacao.tipo}`, {
      x: 50,
      y: height - 370,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Moeda: ${solicitacao.moeda.nome} (${solicitacao.moeda.simbolo})`, {
      x: 50,
      y: height - 390,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    if (solicitacao.rupeReferencia) {
      page.drawText(`Referência RUPE: ${solicitacao.rupeReferencia}`, {
        x: 50,
        y: height - 410,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // Itens
    page.drawText('ITENS AUTORIZADOS:', {
      x: 50,
      y: height - 460,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Cabeçalho da tabela
    page.drawText('Código', {
      x: 50,
      y: height - 490,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Descrição', {
      x: 150,
      y: height - 490,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Quantidade', {
      x: 350,
      y: height - 490,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Valor', {
      x: 450,
      y: height - 490,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Linhas da tabela
    let yPosition = height - 520;
    solicitacao.itens.forEach((item, index) => {
      if (yPosition < 100) {
        // Adicionar nova página se necessário
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }
      
      page.drawText(item.codigoPautal.codigo, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      // Limitar o tamanho da descrição
      let descricao = item.codigoPautal.descricao;
      if (descricao.length > 30) {
        descricao = descricao.substring(0, 27) + '...';
      }
      
      page.drawText(descricao, {
        x: 150,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(String(item.quantidade), {
        x: 350,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      const valor = item.precoUnitario * item.quantidade;
      page.drawText(`${solicitacao.moeda.simbolo} ${valor.toFixed(2)}`, {
        x: 450,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= 20;
    });
    
    // Rodapé
    yPosition = Math.min(yPosition, 150);
    
    page.drawText('ESTA LICENÇA É VÁLIDA POR 90 DIAS A PARTIR DA DATA DE EMISSÃO', {
      x: width / 2 - 200,
      y: yPosition - 50,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Assinatura
    page.drawText('_______________________________', {
      x: width / 2 - 100,
      y: yPosition - 100,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Assinatura e Carimbo', {
      x: width / 2 - 70,
      y: yPosition - 120,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Salvar o PDF
    const pdfBytes = await pdfDoc.save();
    
    // Configurar os headers da resposta
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="Licenca_PA-${String(solicitacao.id).padStart(6, "0")}.pdf"`);
    
    // Retornar o arquivo
    return new NextResponse(pdfBytes, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Erro ao gerar licença:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
