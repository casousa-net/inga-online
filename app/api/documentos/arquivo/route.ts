import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Obter o caminho do arquivo da query string
    const url = new URL(request.url);
    const filePath = url.searchParams.get('path');
    const fileName = url.searchParams.get('nome') || 'documento';
    
    if (!filePath) {
      return NextResponse.json({ error: 'Caminho do arquivo não especificado' }, { status: 400 });
    }
    
    console.log('Tentando acessar arquivo:', filePath);
    
    // Construir o caminho completo do arquivo
    let fullPath = '';
    
    // Se o caminho começa com /uploads, considerar como caminho relativo à pasta public
    if (filePath.startsWith('/uploads/')) {
      fullPath = path.join(process.cwd(), 'public', filePath);
    } else {
      // Caso contrário, considerar como caminho relativo à pasta uploads
      fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
    }
    
    console.log('Caminho completo do arquivo:', fullPath);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(fullPath)) {
      console.error('Arquivo não encontrado no caminho:', fullPath);
      
      // Listar arquivos na pasta uploads para depuração
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (fs.existsSync(uploadsDir)) {
          const files = fs.readdirSync(uploadsDir);
          console.log('Arquivos na pasta uploads:', files);
          
          // Verificar subpastas
          const subfolders = files.filter(file => 
            fs.statSync(path.join(uploadsDir, file)).isDirectory()
          );
          
          for (const subfolder of subfolders) {
            const subfolderPath = path.join(uploadsDir, subfolder);
            const subfolderFiles = fs.readdirSync(subfolderPath);
            console.log(`Arquivos na pasta uploads/${subfolder}:`, subfolderFiles);
          }
        } else {
          console.log('Pasta uploads não existe');
        }
      } catch (err) {
        console.error('Erro ao listar arquivos:', err);
      }
      
      return NextResponse.json({ 
        error: 'Arquivo não encontrado',
        caminhoTentado: fullPath
      }, { status: 404 });
    }
    
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(fullPath);
    
    // Determinar o tipo MIME com base na extensão do arquivo
    const ext = path.extname(fullPath).toLowerCase();
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
        'Content-Disposition': `inline; filename="${fileName}${ext}"`,
      },
    });
    
  } catch (error) {
    console.error('Erro ao buscar arquivo:', error);
    return NextResponse.json({ error: 'Erro ao processar a solicitação' }, { status: 500 });
  }
}
