import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: any) {
  const { params } = context;
  const { id } = params;
  
  if (!id) {
    return NextResponse.json({ error: "ID da autorização não fornecido" }, { status: 400 });
  }
  
  // Determinar a URL base
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  
  // Redirecionar para a página de visualização com parâmetro para download
  return NextResponse.redirect(`${baseUrl}/autorizacao/${id}/visualizar?download=true`);
}
