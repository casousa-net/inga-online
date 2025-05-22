import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: any
) {
  const { params } = context;
  try {
    const id = Number(params.id);
    
    // Verificar se o ID é válido
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    
    // Buscar o documento no banco de dados
    const documento = await prisma.documentosolicitacao.findUnique({
      where: { id },
      include: {
        solicitacaoautorizacao: true
      }
    }) as any; // Usar cast para any para contornar erros de TypeScript
    
    // Verificar se o documento existe
    if (!documento) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }
    
    console.log('Documento encontrado:', documento);
    
    // Extrair o caminho do arquivo
    let filePath = '';
    
    // Tentar usar o URL como caminho relativo
    if (documento.url && documento.url.startsWith('/uploads/')) {
      filePath = path.join(process.cwd(), 'public', documento.url);
    } 
    // Tentar usar o caminhoArquivo se disponível
    else if (documento.caminhoArquivo) {
      filePath = path.join(process.cwd(), 'public', documento.caminhoArquivo);
    }
    // Tentar construir o caminho com base no nome
    else if (documento.nome) {
      filePath = path.join(process.cwd(), 'public', 'uploads', documento.nome);
    }
    
    console.log('Caminho do arquivo:', filePath);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      console.error('Arquivo não encontrado no caminho:', filePath);
      
      // Tentar encontrar o arquivo em caminhos alternativos
      const possiblePaths = [
        // Caminho baseado no URL (se existir)
        documento.url ? path.join(process.cwd(), 'public', documento.url) : '',
        
        // Caminhos baseados no nome do arquivo
        path.join(process.cwd(), 'public', 'uploads', documento.nome || ''),
        path.join(process.cwd(), 'public', 'uploads', 'documentos', documento.nome || ''),
        path.join(process.cwd(), 'public', 'uploads', 'fotos', documento.nome || ''),
        path.join(process.cwd(), 'public', 'uploads', 'rupe', documento.nome || ''),
        
        // Caminhos baseados no tipo de documento
        path.join(process.cwd(), 'public', 'uploads', documento.tipo, documento.nome || ''),
        
        // Caminhos legados
        path.join(process.cwd(), 'uploads', documento.nome || ''),
        path.join(process.cwd(), 'public', documento.tipo + '_' + documento.solicitacaoId + '.pdf')
      ].filter(p => p !== '');
      
      let found = false;
      for (const possiblePath of possiblePaths) {
        if (possiblePath && fs.existsSync(possiblePath)) {
          filePath = possiblePath;
          found = true;
          console.log('Arquivo encontrado em caminho alternativo:', filePath);
          break;
        }
      }
      
      if (!found) {
        // Listar arquivos na pasta uploads para depuração
        try {
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            console.log('Arquivos na pasta uploads:', files);
          } else {
            console.log('Pasta uploads não existe');
          }
        } catch (err) {
          console.error('Erro ao listar arquivos:', err);
        }
        
        return NextResponse.json({ 
          error: 'Arquivo não encontrado',
          documento: documento,
          caminhoTentado: filePath,
          caminhosPossiveis: possiblePaths
        }, { status: 404 });
      }
    }
    
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determinar o tipo MIME com base na extensão do arquivo
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream'; // Padrão
    
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.doc') contentType = 'application/msword';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    // Retornar o arquivo com o tipo MIME apropriado
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${documento.nome || path.basename(filePath)}"`,
      },
    });
    
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    return NextResponse.json({ error: 'Erro ao processar a solicitação' }, { status: 500 });
  }
}
