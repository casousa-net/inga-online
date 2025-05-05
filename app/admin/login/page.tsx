'use client';
import { useState } from "react";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";

export default function AdminLoginPage() {
  const [form, setForm] = useState({
    email: "",
    senha: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (form.email === "" || form.senha === "") {
        setError("Preencha todos os campos.");
      } else {
        setError("");
        // Aqui você pode redirecionar ou autenticar
      }
    }, 1200);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f4f7fa] to-[#e1e7ef] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-primary mb-6 text-center">Login do Administrador</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input name="email" value={form.email} onChange={handleChange} required type="email" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <Input name="senha" value={form.senha} onChange={handleChange} required type="password" />
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <Button type="submit" className="mt-4 w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
