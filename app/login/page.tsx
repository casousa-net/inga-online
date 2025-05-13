'use client';
import { useState } from "react";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import Link from "next/link";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f4f7fa] to-[#e1e7ef] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-primary mb-6 text-center">Entrar no Sistema</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">NIF</label>
            <Input name="nif" value={form.nif} onChange={handleChange} required maxLength={14} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <Input name="senha" value={form.senha} onChange={handleChange} required type="password" />
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <Button type="submit" className="mt-4 w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <div className="text-center mt-2">
            <Link href="/cadastro" className="text-primary underline">Não tem conta? Cadastre-se</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
