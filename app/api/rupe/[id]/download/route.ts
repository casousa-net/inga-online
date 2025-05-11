import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";

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
    });

    if (!solicitacao) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    if (!solicitacao.rupeReferencia || !solicitacao.rupeDocumento) {
      return NextResponse.json({ error: 'Documento RUPE não disponível' }, { status: 404 });
    }

    // Verificar se o arquivo existe
    const filePath = path.resolve(process.cwd(), solicitacao.rupeDocumento);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Arquivo não encontrado no servidor' }, { status: 404 });
    }

    // Ler o arquivo
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determinar o tipo de conteúdo com base na extensão do arquivo
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream'; // Padrão
    
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    
    // Criar o nome do arquivo para download
    const fileName = `RUPE_${solicitacao.rupeReferencia}${ext}`;
    
    // Configurar os headers da resposta
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Retornar o arquivo
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Erro ao baixar RUPE:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
