import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Variável para armazenar o transporte de email
let transporter: nodemailer.Transporter;

// Função para criar um transporte de email de teste usando Ethereal
async function createTestAccount() {
  // Criar conta de teste Ethereal
  const testAccount = await nodemailer.createTestAccount();
  
  console.log('Conta de teste Ethereal criada:', testAccount.user);
  console.log('Senha da conta de teste:', testAccount.pass);
  
  // Criar transporte usando a conta de teste
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

// Inicializar o transporte de email
async function getTransporter() {
  if (!transporter) {
    // Se estamos em ambiente de produção e as variáveis de ambiente estão definidas
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('Configurando transporte de email com:', {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true'
      });
      
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          // Não falhar em certificados inválidos
          rejectUnauthorized: false
        }
      });
    } else {
      // Usar Ethereal para testes em desenvolvimento
      transporter = await createTestAccount();
    }
  }
  return transporter;
}

// Gerar código de recuperação de 6 dígitos
function generateRecoveryCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Armazenamento temporário de códigos (em produção, use um banco de dados)
// Usamos uma variável global para persistir os códigos entre requisições
let recoveryCodes: Record<string, { code: string, expiry: Date }> = {};

// Função para salvar códigos em um arquivo JSON (apenas para desenvolvimento)
function saveRecoveryCode(email: string, code: string, expiry: Date) {
  recoveryCodes[email] = { code, expiry };
  // Em um ambiente real, isso seria salvo em um banco de dados
  console.log('Código salvo para', email, ':', code, 'expira em:', expiry);
  return { code, expiry };
}

export async function POST(request: NextRequest) {
  try {
    // Extrair os dados do corpo da requisição
    const body = await request.json();
    const { email, action } = body;
    console.log('API de email chamada com ação:', action, 'para o email:', email);

    // Validação básica
    if (!email || !email.includes('@')) {
      console.log('Email inválido:', email);
      return NextResponse.json(
        { success: false, message: 'Email inválido' },
        { status: 400 }
      );
    }

    if (action === 'send-code') {
      // Gerar código de recuperação
      const code = generateRecoveryCode();
      console.log('Código gerado para', email, ':', code);
      
      // Armazenar código com validade de 10 minutos
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 10);
      saveRecoveryCode(email, code, expiry);
      console.log('Código armazenado com expiração em:', expiry);

      // Obter o transporte de email
      const emailTransporter = await getTransporter();

      // Configuração do email
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@ingaonline.com',
        to: email,
        subject: 'Código de Recuperação de Senha - INGA ONLINE',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #84cc16; text-align: center;">INGA ONLINE</h2>
            <h3 style="text-align: center;">Recuperação de Senha</h3>
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo para continuar o processo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; display: inline-block;">
                ${code}
              </div>
            </div>
            <p>Este código é válido por 10 minutos.</p>
            <p>Se você não solicitou a redefinição de senha, por favor ignore este email.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #777; text-align: center;">
              © ${new Date().getFullYear()} INGA ONLINE - Todos os direitos reservados
            </p>
          </div>
        `,
      };

      try {
        // Enviar email
        console.log('Tentando enviar email para:', email);
        const info = await emailTransporter.sendMail(mailOptions);
        console.log('Email enviado:', info.messageId);
        
        // Se estiver usando Ethereal, mostrar URL de visualização
        if (info.messageId && info.messageId.includes('ethereal')) {
          console.log('URL de visualização do email:', nodemailer.getTestMessageUrl(info));
        }
        
        return NextResponse.json({
          success: true,
          message: 'Código de recuperação enviado com sucesso',
          // Incluir apenas a URL de visualização se estamos usando Ethereal
          ...(info.messageId && info.messageId.includes('ethereal') && { 
            previewUrl: nodemailer.getTestMessageUrl(info) 
          })
        });
      } catch (error) {
        console.error('Erro ao enviar email:', error);
        return NextResponse.json(
          { success: false, message: 'Erro ao enviar email', error: String(error) },
          { status: 500 }
        );
      }
    } else if (action === 'verify-code') {
      // O código já foi extraído do corpo da requisição acima
      const code = body.code;
      console.log('Verificando código:', code, 'para o email:', email);
      
      if (!code) {
        console.log('Código não fornecido');
        return NextResponse.json(
          { success: false, message: 'Código não fornecido' },
          { status: 400 }
        );
      }

      const storedData = recoveryCodes[email];
      console.log('Dados armazenados para', email, ':', storedData);
      
      if (!storedData) {
        console.log('Nenhum código encontrado para:', email);
        return NextResponse.json(
          { success: false, message: 'Nenhum código solicitado para este email' },
          { status: 400 }
        );
      }

      if (new Date() > storedData.expiry) {
        console.log('Código expirado para:', email);
        delete recoveryCodes[email];
        return NextResponse.json(
          { success: false, message: 'Código expirado' },
          { status: 400 }
        );
      }

      // Converter ambos os códigos para string e comparar
      const storedCode = String(storedData.code);
      const receivedCode = String(code);
      
      console.log('Comparando códigos - Armazenado:', storedCode, 'Tipo:', typeof storedCode);
      console.log('Comparando códigos - Recebido:', receivedCode, 'Tipo:', typeof receivedCode);
      
      if (storedCode !== receivedCode) {
        console.log('Código inválido. Esperado:', storedCode, 'Recebido:', receivedCode);
        return NextResponse.json(
          { success: false, message: 'Código inválido' },
          { status: 400 }
        );
      }

      // Código válido
      console.log('Código verificado com sucesso para:', email);
      return NextResponse.json({
        success: true,
        message: 'Código verificado com sucesso',
      });
    }

    console.log('Ação não suportada:', action);
    return NextResponse.json(
      { success: false, message: 'Ação não suportada' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro na API de email:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor', error: String(error) },
      { status: 500 }
    );
  }
}
