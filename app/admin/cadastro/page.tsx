'use client';
import { useState } from "react";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";

export default function AdminCadastroPage() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    tipo: "direccao"
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
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
        <h1 className="text-2xl font-bold text-primary mb-6 text-center">Cadastro de Usuário (Admin)</h1>
        {success ? (
          <div className="text-green-700 text-center font-semibold py-6">
            Usuário cadastrado com sucesso!
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <Input name="nome" value={form.nome} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input name="email" value={form.email} onChange={handleChange} required type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Senha</label>
              <Input name="senha" value={form.senha} onChange={handleChange} required type="password" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Usuário</label>
              <select name="tipo" value={form.tipo} onChange={handleChange} className="w-full border rounded px-3 py-2">
                <option value="direccao">Direcção</option>
                <option value="chefe">Chefe</option>
                <option value="tecnico">Técnico</option>
              </select>
            </div>
            <Button type="submit" className="mt-4 w-full" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
