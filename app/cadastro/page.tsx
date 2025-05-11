'use client';
import { useState } from "react";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import Link from "next/link";

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f4f7fa] to-[#e1e7ef] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-primary mb-6 text-center">Cadastro de Empresa</h1>
        {success ? (
          <div className="text-green-700 text-center font-semibold py-6">
            Cadastro realizado com sucesso!<br />
            <Link href="/login" className="underline text-primary">Ir para Login</Link>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">NIF</label>
              <Input name="nif" value={form.nif} onChange={handleChange} required maxLength={14} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Empresa</label>
              <Input name="nome" value={form.nome} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <Input name="endereco" value={form.endereco} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <Input name="telefone" value={form.telefone} onChange={handleChange} required type="tel" pattern="[0-9]+" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input name="email" value={form.email} onChange={handleChange} required type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Senha</label>
              <Input name="senha" value={form.senha} onChange={handleChange} required type="password" minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirmar Senha</label>
              <Input name="confirmarSenha" value={form.confirmarSenha} onChange={handleChange} required type="password" minLength={6} />
            </div>
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <Button type="submit" className="mt-4 w-full" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
            <div className="text-center mt-2">
              <Link href="/login" className="text-primary underline">Já tem conta? Entrar</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
