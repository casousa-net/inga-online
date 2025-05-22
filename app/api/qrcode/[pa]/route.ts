import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(
  req: NextRequest,
  context: any
) {
  const { params } = context;
  console.log('Recebido pedido de QR code para número de autorização. Parâmetros recebidos:', params);
  
  try {
    const numeroAutorizacao = params?.pa;
    
    if (!numeroAutorizacao) {
      console.error('Erro: Número de autorização não fornecido nos parâmetros');
      return NextResponse.json(
        { error: 'Número de autorização não fornecido' },
        { status: 400 }
      );
    }

    console.log('Gerando QR code para número de autorização:', numeroAutorizacao);

    // Gerar URL para verificação
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || '192.168.0.253:3000';
    const baseUrl = `${protocol}://${host}`;
    
    const verificationUrl = `${baseUrl}/verificar/${encodeURIComponent(numeroAutorizacao)}`;
    console.log('URL de verificação gerada para QR code:', verificationUrl);
    
    // Gerar QR code como data URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Extrair a parte base64 da data URL
    const base64Data = qrCodeDataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Retornar a imagem do QR code
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (error) {
    console.error('Erro ao gerar QR code:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
