'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from 'components/ui/input';
import { Button } from 'components/ui/button';
import { AuthLayout } from '@/components/AuthLayout';
import { Loader2 } from 'lucide-react';

type FormState = {
  email: string;
  code?: string;
  newPassword?: string;
  confirmPassword?: string;
};

type Step = 'email' | 'code' | 'newPassword';

export default function RecuperarSenhaPage() {
  const [step, setStep] = useState<Step>('email');
  const [form, setForm] = useState<FormState>({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulando uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (step === 'email') {
        // Validação básica de email
        if (!form.email.includes('@')) {
          setError('Por favor, insira um email válido.');
          setLoading(false);
          return;
        }
        setStep('code');
      } else if (step === 'code') {
        // Validação básica do código
        if (!form.code || form.code.length !== 6) {
          setError('Por favor, insira o código de 6 dígitos que enviamos para o seu email.');
          setLoading(false);
          return;
        }
        setStep('newPassword');
      } else if (step === 'newPassword') {
        // Validação de senha
        if (!form.newPassword || form.newPassword.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }
        if (form.newPassword !== form.confirmPassword) {
          setError('As senhas não coincidem.');
          setLoading(false);
          return;
        }
        // Senha alterada com sucesso
        setSuccess(true);
      }
    } catch (err) {
      setError('Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Senha alterada com sucesso!"
        footerText=""
        footerLinkText=""
        footerLinkHref=""
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-3 text-lg font-medium text-gray-900">Senha alterada com sucesso!</h2>
          <p className="mt-2 text-sm text-gray-500">Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.</p>
          <div className="mt-6">
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Ir para o login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={step === 'email' ? 'Recuperar senha' : step === 'code' ? 'Verificação' : 'Nova senha'}
      footerText="Lembrou sua senha?"
      footerLinkText="Fazer login"
      footerLinkHref="/login"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {step === 'email' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Digite o endereço de email associado à sua conta e enviaremos um código de verificação para redefinir sua senha.
              </p>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Digite seu email"
                />
              </div>
            </div>
          )}

          {step === 'code' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Enviamos um código de 6 dígitos para <span className="font-medium">{form.email}</span>. Por favor, insira-o abaixo para continuar.
              </p>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Código de verificação <span className="text-red-500">*</span>
                </label>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  value={form.code}
                  onChange={handleChange}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center tracking-widest font-mono text-lg"
                  placeholder="_ _ _ _ _ _"
                />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Não recebeu o código?{' '}
                <button 
                  type="button" 
                  className="text-primary font-medium hover:text-primary/80"
                  onClick={() => alert('Código reenviado!')}
                >
                  Reenviar código
                </button>
              </div>
            </div>
          )}

          {step === 'newPassword' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Crie uma nova senha para sua conta. Certifique-se de que ela tenha pelo menos 6 caracteres.
              </p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Nova senha <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={form.newPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Digite sua nova senha"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar nova senha <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Confirme sua nova senha"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#84cc16] hover:bg-[#65a30d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#84cc16] transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {step === 'email' ? 'Enviando código...' : step === 'code' ? 'Verificando...' : 'Alterando senha...'}
              </>
            ) : (
              step === 'email' ? 'Enviar código' : step === 'code' ? 'Verificar código' : 'Redefinir senha'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep(step === 'email' ? 'email' : step === 'code' ? 'email' : 'code')}
              className="text-sm font-medium text-[#84cc16] hover:text-[#65a30d]"
            >
              {step === 'email' ? 'Lembrou sua senha?' : 'Voltar'}
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
