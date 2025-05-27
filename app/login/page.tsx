'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from 'components/ui/input';
import { Button } from 'components/ui/button';
import { AuthLayout } from '@/components/AuthLayout';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({
    nif: "",
    senha: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (form.nif === "" || form.senha === "") {
        setError("Preencha todos os campos.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.error || "Erro ao fazer login.");
      } else {
        // Armazenar informações do usuário no localStorage
        if (data.nome) {
          localStorage.setItem('userName', data.nome);
        }
        
        if (data.role) {
          localStorage.setItem('userRole', data.role);
        }

        if (data.id) {
          localStorage.setItem('utenteId', data.id.toString());
        }
        
        // Armazenar o departamento do usuário se disponível
        if (data.departamento) {
          localStorage.setItem('userDepartamento', data.departamento);
        }

        // Redirecionar com base no role do usuário
        switch (data.role) {
          case 'admin':
            window.location.href = "/admin";
            break;
          case 'chefe':
            window.location.href = "/chefe";
            break;
          case 'tecnico':
            window.location.href = "/tecnico";
            break;
          case 'direccao':
            window.location.href = "/direccao";
            break;
          default:
            window.location.href = "/utente";
        }
      }
    } catch (err) {
      setLoading(false);
      setError("Erro de conexão com o servidor.");
    }
  }

  return (
    <AuthLayout
      title="Acesse sua conta"
      footerText="Não tem uma conta?"
      footerLinkText="Cadastre-se"
      footerLinkHref="/cadastro"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="nif" className="block text-sm font-medium text-gray-700 mb-1">
              NIF
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
              placeholder="Digite seu NIF"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <Link href="/recuperar-senha" className="text-sm font-medium text-[#84cc16] hover:text-[#65a30d]">
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="senha"
              name="senha"
              type="password"
              value={form.senha}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Digite sua senha"
            />
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
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
