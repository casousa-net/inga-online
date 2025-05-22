import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: any
) {
  const { params } = context;
  try {
    // Obter o caminho do documento a partir dos parâmetros da rota
    const documentPath = params.path.join('/');
    console.log('Caminho do documento solicitado:', documentPath);
    
    // Limpar o caminho para evitar problemas com extensões duplicadas
    const cleanPath = documentPath.replace(/\.pdf+$/, '.pdf')
      .replace(/\.jpg+$/, '.jpg')
      .replace(/\.png+$/, '.png')
      .replace(/\.docx+$/, '.docx');
      
    console.log('Caminho limpo:', cleanPath);
    
    // Lista de possíveis caminhos para o arquivo
    const possiblePaths = [
      // Caminho direto
      path.join(process.cwd(), 'public', cleanPath),
      path.join(process.cwd(), cleanPath),
      
      // Caminhos com uploads
      path.join(process.cwd(), 'public', 'uploads', cleanPath),
      path.join(process.cwd(), 'uploads', cleanPath),
      
      // Tentar sem o prefixo 'uploads/' se já estiver no caminho
      cleanPath.startsWith('uploads/') 
        ? path.join(process.cwd(), 'public', cleanPath.substring(8))
        : null,
      cleanPath.startsWith('uploads/') 
        ? path.join(process.cwd(), cleanPath.substring(8))
        : null,

      // Caminhos para arquivos em pastas específicas
      path.join(process.cwd(), 'uploads', 'pareceres', path.basename(cleanPath)),
      path.join(process.cwd(), 'uploads', 'relatorios', path.basename(cleanPath)),
      path.join(process.cwd(), 'uploads', 'rupe', path.basename(cleanPath)),
        
      // Caminhos específicos para tipos de documentos em public
      path.join(process.cwd(), 'public', 'uploads', 'relatorios', path.basename(cleanPath)),
      path.join(process.cwd(), 'public', 'uploads', 'pareceres', path.basename(cleanPath)),
      path.join(process.cwd(), 'public', 'uploads', 'rupe', path.basename(cleanPath)),
    ].filter(Boolean) as string[];
    
    // Tentar cada caminho possível
    for (const possiblePath of possiblePaths) {
      console.log('Tentando caminho:', possiblePath);
      if (fs.existsSync(possiblePath)) {
        console.log('Arquivo encontrado em:', possiblePath);
        return serveFile(possiblePath);
      }
    }
    
    // Se chegou aqui, não encontrou o arquivo
    console.error('Arquivo não encontrado em nenhum dos caminhos possíveis');
    
    // Listar arquivos na pasta uploads para depuração
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        console.log('Arquivos na pasta uploads:', files);
        
        // Verificar subpastas
        for (const subdir of ['relatorios', 'pareceres', 'rupe']) {
          const subdirPath = path.join(uploadsDir, subdir);
          if (fs.existsSync(subdirPath)) {
            const subdirFiles = fs.readdirSync(subdirPath);
            console.log(`Arquivos na pasta uploads/${subdir}:`, subdirFiles);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao listar arquivos:', err);
    }
    
    return NextResponse.json({ 
      error: 'Arquivo não encontrado',
      caminhoSolicitado: documentPath,
      caminhosPossiveis: possiblePaths
    }, { status: 404 });
    
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    return NextResponse.json({ error: 'Erro ao processar a solicitação' }, { status: 500 });
  }
}

// Função auxiliar para servir o arquivo
function serveFile(filePath: string) {
  try {
    console.log(`Tentando ler arquivo de: ${filePath}`);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      console.error(`Arquivo não existe: ${filePath}`);
      return NextResponse.json({ error: 'Arquivo não encontrado no caminho especificado' }, { status: 404 });
    }
    
    // Ler o arquivo como um stream para evitar problemas com caracteres especiais
    const fileStream = fs.createReadStream(filePath);
    const chunks: Buffer[] = [];
    
    // Criar uma Promise para processar o stream
    return new Promise<NextResponse>((resolve, reject) => {
      fileStream.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      
      fileStream.on('error', (err) => {
        console.error('Erro ao ler arquivo como stream:', err);
        reject(err);
      });
      
      fileStream.on('end', () => {
        try {
          // Combinar todos os chunks em um único buffer
          const fileBuffer = Buffer.concat(chunks);
          console.log(`Arquivo lido com sucesso: ${filePath}, tamanho: ${fileBuffer.length} bytes`);
          
          // Determinar o tipo MIME com base na extensão do arquivo
          const ext = path.extname(filePath).toLowerCase();
          let contentType = 'application/octet-stream'; // Padrão
          
          if (ext === '.pdf') contentType = 'application/pdf';
          else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
          else if (ext === '.png') contentType = 'image/png';
          else if (ext === '.gif') contentType = 'image/gif';
          else if (ext === '.doc') contentType = 'application/msword';
          else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          
          // Sanitizar o nome do arquivo para evitar problemas com caracteres especiais
          const fileName = encodeURIComponent(path.basename(filePath));
          console.log(`Servindo arquivo ${fileName} como ${contentType}`);
          
          // Retornar o arquivo com o tipo MIME apropriado
          const response = new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `inline; filename="${fileName}"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
          });
          
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    }).catch((error) => {
      console.error('Erro ao processar arquivo:', error);
      return NextResponse.json({ 
        error: 'Erro ao servir o arquivo', 
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
        caminho: filePath
      }, { status: 500 });
    });
  } catch (error) {
    console.error('Erro ao servir arquivo:', error);
    return NextResponse.json({ 
      error: 'Erro ao servir o arquivo', 
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      caminho: filePath
    }, { status: 500 });
  }
}
