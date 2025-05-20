import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseSchema() {
  try {
    // Check monitorizacao table
    console.log('Checking monitorizacao table structure...');
    const monitorQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'monitorizacao'
      ORDER BY ordinal_position;
    `;
    const monitorColumns = await prisma.$queryRawUnsafe(monitorQuery);
    console.log('Monitorizacao columns:', monitorColumns);

    // Check periodoMonitorizacao table
    console.log('\nChecking periodoMonitorizacao table structure...');
    const periodoQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'periodomonitorizacao'
      ORDER BY ordinal_position;
    `;
    const periodoColumns = await prisma.$queryRawUnsafe(periodoQuery);
    console.log('PeriodoMonitorizacao columns:', periodoColumns);

    // Check for existing records
    console.log('\nChecking for existing records in monitorizacao...');
    const monitorRecords = await prisma.$queryRaw`SELECT COUNT(*) as count FROM monitorizacao`;
    console.log('Monitorizacao records:', monitorRecords);

    // Check for existing periods
    console.log('\nChecking for existing periods...');
    const periodoRecords = await prisma.$queryRaw`SELECT COUNT(*) as count FROM periodomonitorizacao`;
    console.log('PeriodoMonitorizacao records:', periodoRecords);

    // Check for reopened periods
    console.log('\nChecking for reopened periods...');
    const reopenedPeriods = await prisma.$queryRaw`
      SELECT id, estado, statusReabertura 
      FROM periodomonitorizacao 
      WHERE estado = 'REABERTO' OR statusReabertura = 'APROVADA'
      LIMIT 5
    `;
    console.log('Reopened periods:', reopenedPeriods);

  } catch (error) {
    console.error('Error checking database schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseSchema()
  .then(() => console.log('Database schema check completed'))
  .catch(console.error);
