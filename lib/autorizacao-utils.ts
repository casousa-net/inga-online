import { prisma } from "./prisma";

/**
 * Utilitários para gestão de autorizações ambientais
 */

/**
 * Gera um número único para a autorização ambiental
 * @returns Número da autorização no formato INGA/AA/YYYY/XXXX
 */
export async function gerarNumeroAutorizacao(): Promise<string> {
  const year = new Date().getFullYear();
  
  // Buscar a última autorização do ano atual
  const ultimaAutorizacao = await prisma.autorizacao.findFirst({
    where: {
      numeroAutorizacao: {
        contains: `INGA/AA/${year}/`
      }
    },
    orderBy: {
      numeroAutorizacao: 'desc'
    }
  });
  
  let sequencial = 1;
  
  if (ultimaAutorizacao) {
    // Extrair o número sequencial da última autorização
    const match = ultimaAutorizacao.numeroAutorizacao.match(/INGA\/AA\/\d{4}\/(\d{4})/);
    if (match && match[1]) {
      sequencial = parseInt(match[1], 10) + 1;
    }
  }
  
  // Formatar o número sequencial com zeros à esquerda
  const sequencialFormatado = sequencial.toString().padStart(4, '0');
  
  return `INGA/AA/${year}/${sequencialFormatado}`;
}

/**
 * Verifica se uma autorização existe pelo seu número
 * @param numero Número da autorização
 * @returns true se a autorização existe, false caso contrário
 */
export async function verificarAutorizacao(numero: string): Promise<boolean> {
  const autorizacao = await prisma.autorizacao.findUnique({
    where: {
      numeroAutorizacao: numero
    }
  });
  
  return !!autorizacao;
}
