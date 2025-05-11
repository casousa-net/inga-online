import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

    // Verificar se a solicitação existe
    const solicitacao = await prisma.solicitacaoAutorizacao.findUnique({
      where: { id },
    });

    if (!solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se já foi validada pelo chefe
    if (!solicitacao.validadoPorChefe) {
      return NextResponse.json(
        { error: 'Solicitação ainda não foi validada pelo chefe' },
        { status: 400 }
      );
    }

    // Processar o FormData
    const formData = await request.formData();
    const rupeReferencia = formData.get('rupeReferencia') as string;
    const rupeDocumento = formData.get('rupeDocumento') as File;

    if (!rupeReferencia) {
      return NextResponse.json(
        { error: 'Referência RUPE é obrigatória' },
        { status: 400 }
      );
    }

    if (!rupeDocumento) {
      return NextResponse.json(
        { error: 'Documento RUPE é obrigatório' },
        { status: 400 }
      );
    }

    // Criar diretório para armazenar os documentos se não existir
    const uploadDir = path.join(process.cwd(), 'uploads', 'rupe');
    await mkdir(uploadDir, { recursive: true });

    // Salvar o documento
    const fileExtension = rupeDocumento.name.split('.').pop();
    const fileName = `rupe_${id}_${Date.now()}.${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    const fileBuffer = Buffer.from(await rupeDocumento.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    // Atualizar a solicitação
    const updatedSolicitacao = await prisma.solicitacaoAutorizacao.update({
      where: { id },
      data: {
        rupeReferencia,
        rupeDocumento: fileName,
        status: 'Aguardando_Pagamento',
        dataRupe: new Date(),
      },
    });

    return NextResponse.json(updatedSolicitacao);
  } catch (error) {
    console.error('Erro ao adicionar RUPE:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar RUPE' },
      { status: 500 }
    );
  }
}
