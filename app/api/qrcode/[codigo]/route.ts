import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(
  req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  try {
    const codigo = params.codigo;
    
    if (!codigo) {
      return NextResponse.json(
        { error: 'Código não fornecido' },
        { status: 400 }
      );
    }

    console.log('Gerando QR code para:', codigo);

    // Gerar URL para verificação
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verificar/${encodeURIComponent(codigo)}`;
    
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
