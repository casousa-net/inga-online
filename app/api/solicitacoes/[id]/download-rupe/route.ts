import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Iniciando download de RUPE para solicitação ID: ${params.id}`);
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Buscar a solicitação para obter o nome do arquivo RUPE
    const solicitacao = await prisma.solicitacaoautorizacao.findUnique({
      where: { id },
      select: {
        rupeDocumento: true,
      },
    });

    if (!solicitacao || !solicitacao.rupeDocumento) {
      return NextResponse.json(
        { error: 'Documento RUPE não encontrado' },
        { status: 404 }
      );
    }

    // Construir o caminho para o arquivo
    // O arquivo é salvo em public/uploads/rupe conforme informado pelo usuário
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rupe');
    const filePath = path.join(uploadDir, solicitacao.rupeDocumento);
    
    console.log('Buscando arquivo RUPE em:', filePath);

    // Verificar se o arquivo existe
    try {
      await fs.access(filePath);
    } catch (error) {
      console.error(`Arquivo não encontrado: ${filePath}`, error);
      return NextResponse.json(
        { error: 'Arquivo não encontrado no servidor' },
        { status: 404 }
      );
    }

    // Ler o arquivo
    const fileBuffer = await fs.readFile(filePath);
    
    // Determinar o tipo de conteúdo com base na extensão do arquivo
    const fileExtension = path.extname(solicitacao.rupeDocumento).toLowerCase();
    let contentType = 'application/octet-stream'; // Padrão
    
    if (fileExtension === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.jpg', '.jpeg'].includes(fileExtension)) {
      contentType = 'image/jpeg';
    } else if (fileExtension === '.png') {
      contentType = 'image/png';
    }

    // Retornar o arquivo como resposta
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${solicitacao.rupeDocumento}"`,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar documento RUPE:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
