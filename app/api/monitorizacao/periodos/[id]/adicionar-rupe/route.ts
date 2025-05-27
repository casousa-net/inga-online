import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";
// @ts-ignore - Ignorando erro de tipagem para uuid
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: NextRequest,
  context: any
) {
  const { params } = context;
  try {
    // Usar o params de forma assíncrona
    const { id } = params;
    console.log("[API] Iniciando adição de RUPE para período:", id);
    const periodoId = parseInt(id);

    if (isNaN(periodoId)) {
      return NextResponse.json(
        { error: "ID do período inválido" },
        { status: 400 }
      );
    }

    // Verificar se o período existe
    const periodo = await prisma.periodomonitorizacao.findUnique({
      where: { id: periodoId },
      include: {
        configuracao: {
          include: {
            utente: true,
          },
        },
      },
    });

    if (!periodo) {
      return NextResponse.json(
        { error: "Período não encontrado" },
        { status: 404 }
      );
    }

    // Verificar status do período
    const statusReabertura = (periodo as any).statusReabertura;
    if (periodo.estado !== "SOLICITADA_REABERTURA" && statusReabertura !== "PENDENTE") {
      return NextResponse.json(
        { error: "Período não está com solicitação de reabertura pendente" },
        { status: 400 }
      );
    }

    // Processar o formulário
    const formData = await req.formData();
    const numeroRupe = formData.get("numeroRupe") as string;
    const file = formData.get("file") as File;

    if (!numeroRupe) {
      return NextResponse.json(
        { error: "Número da RUPE não fornecido" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo da RUPE não fornecido" },
        { status: 400 }
      );
    }

    console.log("[API] Dados recebidos:", {
      periodoId,
      numeroRupe,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    // Criar diretório de uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads", "rupe");
    
    try {
      if (!fs.existsSync(path.join(process.cwd(), "public"))) {
        await mkdir(path.join(process.cwd(), "public"), { recursive: true });
      }
      
      if (!fs.existsSync(path.join(process.cwd(), "public", "uploads"))) {
        await mkdir(path.join(process.cwd(), "public", "uploads"), { recursive: true });
      }
      
      if (!fs.existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
    } catch (error) {
      console.error("[API] Erro ao criar diretório:", error);
      return NextResponse.json(
        { error: `Erro ao criar diretório de uploads: ${error instanceof Error ? error.message : "Erro desconhecido"}` },
        { status: 500 }
      );
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split(".").pop();
    const fileName = `rupe-periodo-${periodoId}-${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);
    const publicPath = `/uploads/rupe/${fileName}`;

    try {
      // Ler e salvar o arquivo
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      
      console.log("[API] Arquivo salvo com sucesso:", filePath);
    } catch (error) {
      console.error("[API] Erro ao salvar arquivo:", error);
      return NextResponse.json(
        { error: `Erro ao salvar arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}` },
        { status: 500 }
      );
    }

    // Atualizar o período com os dados da RUPE
    // Armazenar o caminho do arquivo e o número da RUPE em um campo de metadados JSON
    const metadata = { 
      rupePath: publicPath,
      rupeNumero: numeroRupe 
    };
    
    const updateData: any = {
      estado: "AGUARDANDO_PAGAMENTO",
      rupeNumero: numeroRupe, // Manter o campo rupeNumero para compatibilidade
      statusReabertura: "AGUARDANDO_PAGAMENTO",
      rupePago: false,
      rupeValidado: false,
      // Armazenar o caminho do arquivo e o número da RUPE como metadados
      motivoReabertura: JSON.stringify(metadata)
    };
    
    const periodoAtualizado = await prisma.periodomonitorizacao.update({
      where: { id: periodoId },
      data: updateData,
      include: {
        configuracao: {
          include: {
            utente: true,
          },
        },
      },
    });

    console.log("[API] Período atualizado com sucesso");

    return NextResponse.json({
      success: true,
      message: "RUPE adicionado com sucesso",
      numeroRupe,
      rupePath: publicPath,
      metadata: { rupePath: publicPath },
      periodo: periodoAtualizado,
    });
  } catch (error) {
    console.error("[API] Erro ao processar adição de RUPE:", error);
    return NextResponse.json(
      { error: `Erro ao processar adição de RUPE: ${error instanceof Error ? error.message : "Erro desconhecido"}` },
      { status: 500 }
    );
  }
}
