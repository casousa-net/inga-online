'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from 'components/ui/input';
import { Button } from 'components/ui/button';
import { AuthLayout } from '@/components/AuthLayout';
import { Loader2 } from 'lucide-react';

export default function CadastroPage() {
  const [form, setForm] = useState({
    nif: "",
    nome: "",
    endereco: "",
    telefone: "",
    email: "",
    senha: "",
    confirmarSenha: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (form.senha !== form.confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nif: form.nif,
          nome: form.nome,
          endereco: form.endereco,
          telefone: form.telefone,
          email: form.email,
          senha: form.senha,
          // role: "utente" // descomente e altere para cadastrar outros tipos
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.error || "Erro ao cadastrar.");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setLoading(false);
      setError("Erro de conexão com o servidor.");
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Cadastro realizado com sucesso!"
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
          <h2 className="mt-3 text-lg font-medium text-gray-900">Cadastro concluído com sucesso!</h2>
          <p className="mt-2 text-sm text-gray-500">Sua conta foi criada com sucesso. Agora você pode fazer login.</p>
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
      title="Crie sua conta"
      footerText="Já tem uma conta?"
      footerLinkText="Faça login"
      footerLinkHref="/login"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nif" className="block text-sm font-medium text-gray-700 mb-1">
                NIF <span className="text-red-500">*</span>
              </label>
              <Input
                id="nif"
                name="nif"
                type="text"
                value={form.nif}
                onChange={handleChange}
                required
                maxLength={14}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Digite o NIF da empresa"
              />
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone <span className="text-red-500">*</span>
              </label>
              <Input
                id="telefone"
                name="telefone"
                type="tel"
                value={form.telefone}
                onChange={handleChange}
                required
                pattern="[0-9]+"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Digite o telefone"
              />
            </div>
          </div>

          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Empresa <span className="text-red-500">*</span>
            </label>
            <Input
              id="nome"
              name="nome"
              type="text"
              value={form.nome}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Digite o nome da empresa"
            />
          </div>

          <div>
            <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-1">
              Endereço <span className="text-red-500">*</span>
            </label>
            <Input
              id="endereco"
              name="endereco"
              type="text"
              value={form.endereco}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Digite o endereço completo"
            />
          </div>

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
              placeholder="Digite o email da empresa"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                Senha <span className="text-red-500">*</span>
              </label>
              <Input
                id="senha"
                name="senha"
                type="password"
                value={form.senha}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Crie uma senha"
              />
            </div>

            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha <span className="text-red-500">*</span>
              </label>
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                value={form.confirmarSenha}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Confirme sua senha"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#84cc16] hover:bg-[#65a30d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#84cc16] transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              'Criar conta'
            )}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
