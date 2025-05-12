import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const text = searchParams.get('text');
    
    if (!text) {
      return NextResponse.json({ error: 'Texto para o QR Code não fornecido' }, { status: 400 });
    }
    
    // URL base para verificação de autenticidade
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://inga-online.vercel.app'}/verificar/${text}`;
    
    // Gerar QR Code como data URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Retornar a imagem do QR Code
    return new NextResponse(qrCodeDataUrl.split(',')[1], {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="qrcode-${text}.png"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    return NextResponse.json({ error: 'Erro ao gerar QR Code' }, { status: 500 });
  }
}
