const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    // Verificar se já existe um usuário com o email admin@inga.gov.ao
    const existingAdmin = await prisma.utente.findUnique({
      where: { email: 'admin@inga.gov.ao' }
    });
    
    if (existingAdmin) {
      // Se o usuário já existe, atualizar para a role 'admin'
      const updatedAdmin = await prisma.utente.update({
        where: { id: existingAdmin.id },
        data: { role: 'admin' }
      });
      
      console.log('Usuário administrador atualizado com sucesso:');
      console.log({
        id: updatedAdmin.id,
        nome: updatedAdmin.nome,
        email: updatedAdmin.email,
        role: updatedAdmin.role
      });
      
      return;
    }
    
    // Hash da senha
    const senha = await bcrypt.hash('admin123', 10);
    
    // Criar usuário administrador com um NIF diferente
    const admin = await prisma.utente.create({
      data: {
        nif: '987654321',
        nome: 'Administrador Sistema',
        endereco: 'Luanda, Angola',
        telefone: '+244 923456789',
        email: 'admin@inga.gov.ao',
        senha: senha,
        role: 'admin'
      }
    });
    
    console.log('Usuário administrador criado com sucesso:');
    console.log({
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      role: admin.role
    });
    
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
