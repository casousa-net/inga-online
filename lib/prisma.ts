
import { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

// Configuração do cliente Prisma com log para desenvolvimento
export const prisma = new PrismaClient({
  log: ['error'],
});

// Função para verificar a conexão com o banco de dados
export async function checkDatabaseConnection() {
  try {
    // Tenta executar uma consulta simples
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true, error: null };
  } catch (error) {
    console.error('Erro de conexão com o banco de dados:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Função para tratamento seguro de operações do banco de dados
export async function safeDbOperation<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('Erro na operação do banco de dados:', error);
    return fallback;
  }
}
