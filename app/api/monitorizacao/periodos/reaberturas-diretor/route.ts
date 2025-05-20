import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Define the type for the reaberturas query result
type Reabertura = {
  id: string;
  numeroPeriodo: string | null;
  dataInicio: Date | null;
  dataFim: Date | null;
  estado: string;
  motivoReabertura: string | null;
  dataSolicitacaoReabertura: Date | null;
  statusReabertura: string | null;
  utenteId: string;
  utenteNome: string;
  utenteNif: string;
};

export async function GET(req: NextRequest) {
  try {
    console.log('[API-Diretor] Iniciando busca de solicitações de reabertura');
    
    // Verificar a sessão do usuário (com múltiplos fallbacks)
    const session = await getServerSession(authOptions);
    
    // Verificar existência de diversos cookies de autenticação possíveis
    const nextAuthCookie = req.cookies.get('next-auth.session-token')?.value || 
                           req.cookies.get('__Secure-next-auth.session-token')?.value;
    const tokenCookie = req.cookies.get('token')?.value;
    
    // Verificar Authorization header (Bearer token)
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    console.log('[API-Diretor] Métodos de autenticação disponíveis:', {
      session: !!session?.user,
      nextAuthCookie: !!nextAuthCookie,
      tokenCookie: !!tokenCookie,
      bearerToken: !!bearerToken
    });
    
    // Se não temos nenhuma forma de autenticação, retornar erro
    if ((!session || !session.user) && !nextAuthCookie && !tokenCookie && !bearerToken) {
      console.log('[API-Diretor] Erro: Nenhum método de autenticação encontrado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Registro de qual método de autenticação está sendo usado
    if (session?.user?.email) {
      console.log('[API-Diretor] Autenticação via NextAuth session:', session.user.email);
    } else if (nextAuthCookie) {
      console.log('[API-Diretor] Autenticação via cookie NextAuth');
    } else if (tokenCookie) {
      console.log('[API-Diretor] Autenticação via cookie token customizado');
    } else if (bearerToken) {
      console.log('[API-Diretor] Autenticação via Bearer token no header');
    }
    
    // Verificar schema dos periodos
    const periodsTableExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'periodomonitorizacao'
    `;
    console.log('[API-Diretor] Tabela periodomonitorizacao existe?', periodsTableExists);

    // Buscar períodos com solicitação de reabertura para diretor
    console.log('[API-Diretor] Buscando períodos com solicitação de reabertura');
    
    // Usar uma consulta SQL direta para evitar problemas com o schema Prisma
    // Os diretores devem ver todas as solicitações, independentemente do status
    const reaberturas = await prisma.$queryRaw<Reabertura[]>`
      SELECT 
        p.id,
        p.numeroPeriodo,
        p.dataInicio,
        p.dataFim,
        p.estado,
        p.motivoReabertura,
        p.dataSolicitacaoReabertura,
        p.statusReabertura,
        c.utenteId,
        u.nome as utenteNome,
        u.nif as utenteNif
      FROM periodomonitorizacao p
      JOIN configuracaomonitorizacao c ON p.configuracaoId = c.id
      JOIN utente u ON c.utenteId = u.id
      WHERE 
        (p.estado IN ('SOLICITADA_REABERTURA', 'PENDENTE') OR p.dataSolicitacaoReabertura IS NOT NULL)
      ORDER BY p.dataInicio DESC
    `;

    console.log('[API-Diretor] Reaberturas encontradas:', reaberturas.length);
    
    // Formatar os dados para resposta
    const formattedReaberturas = reaberturas.map((reabertura) => ({
          id: reabertura.id,
          numeroPeriodo: reabertura.numeroPeriodo || '',
          dataInicio: reabertura.dataInicio || null,
          dataFim: reabertura.dataFim || null,
          estado: reabertura.estado || 'DESCONHECIDO',
          motivoReabertura: reabertura.motivoReabertura || null,
          dataSolicitacaoReabertura: reabertura.dataSolicitacaoReabertura || null,
          statusReabertura: reabertura.statusReabertura || null,
          utenteId: reabertura.utenteId || null,
          utenteNome: reabertura.utenteNome || 'Nome não disponível',
          utenteNif: reabertura.utenteNif || 'NIF não disponível',
        }));

    console.log('[API-Diretor] Resposta formatada:', formattedReaberturas.length, 'registros');

    return NextResponse.json({ reaberturas: formattedReaberturas });
  } catch (error) {
    console.error('[API-Diretor] Erro ao buscar solicitações de reabertura:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar solicitações de reabertura' },
      { status: 500 }
    );
  }
}
