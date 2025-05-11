import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/cadastro',
  '/api/auth/login',
  '/api/auth/register',
  '/favicon.ico',
  '/logo_inga.png',
];

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permite acesso a rotas públicas
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;
  if (!token) {
    // Redireciona para login se não autenticado
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Se o token existe, permite acesso (validação completa deve ser feita nas rotas de API)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/utente/:path*',
    '/chefe/:path*',
    '/direccao/:path*',
    '/tecnico/:path*',
    '/admin/:path*',
    // Adicione outras rotas protegidas aqui
  ],
};
