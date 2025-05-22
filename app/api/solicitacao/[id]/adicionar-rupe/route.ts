import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import { mkdir } from "fs/promises";

export async function POST(
  request: NextRequest,
  context: any
) {
  const { params } = context;
  try {
    const id = parseInt(params.id);
    const formData = await request.formData();
    const rupeReferencia = formData.get('rupeReferencia') as string;
    const rupePdf = formData.get('rupePdf') as File;

    if (!rupeReferencia || !rupePdf) {
      return NextResponse.json(
        { error: 'Referência RUPE e PDF são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a solicitação existe
    const solicitacao = await prisma.solicitacaoautorizacao.findUnique({
      where: { id },
      select: { id: true, status: true }
    });

    if (!solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Salvar o arquivo PDF
    const bytes = await rupePdf.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Criar pasta de uploads se não existir
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rupe');
    await createUploadDirIfNotExists(uploadDir);

    // Gerar nome único para o arquivo
    const fileName = `rupe_${id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    
    // Salvar o arquivo
    await writeFile(filePath, buffer);
    
    // Atualizar a solicitação no banco de dados
    const updatedSolicitacao = await prisma.solicitacaoautorizacao.update({
      where: { id },
      data: {
        rupeReferencia,
        rupeDocumento: `/uploads/rupe/${fileName}`,
        status: 'Aguardando_Pagamento'
      }
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

async function createUploadDirIfNotExists(dir: string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}
