const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if the admin role exists in the database
    const roles = await prisma.$queryRaw`SHOW COLUMNS FROM utente LIKE 'role'`;
    console.log('Available roles in the database:');
    console.log(roles);
    
    // Try to create a test user with admin role
    const testUser = await prisma.utente.create({
      data: {
        nif: '987654321',
        nome: 'Test Admin User',
        endereco: 'Luanda, Angola',
        telefone: '+244 987654321',
        email: 'testadmin@inga.gov.ao',
        senha: 'test123',
        role: 'admin'
      }
    });
    
    console.log('Test admin user created successfully:');
    console.log({
      id: testUser.id,
      nome: testUser.nome,
      email: testUser.email,
      role: testUser.role
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
