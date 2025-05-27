import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/cadastro',
  '/recuperar-senha',
  '/test-page',
  '/api/auth/login',
  '/api/auth/register',
  '/favicon.ico',
  '/logo_inga.png',
  '/_next',
];

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Log para debug
  console.log('Middleware executando para:', pathname);

  // Permite acesso a rotas públicas
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))) {
    console.log('Rota pública, permitindo acesso:', pathname);
    return NextResponse.next();
  }

  // Verificação especial para a página inicial
  if (pathname === '/' || pathname === '') {
    console.log('Página inicial, permitindo acesso');
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;
  if (!token) {
    // Redireciona para login se não autenticado
    console.log('Sem token, redirecionando para login');
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Se o token existe, permite acesso
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
