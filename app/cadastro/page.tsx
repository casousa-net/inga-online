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
    email: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
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
