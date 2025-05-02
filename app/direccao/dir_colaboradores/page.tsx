"use client";
import { useState } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Eye, CheckCircle2, XCircle, UserCog, Users, Briefcase, ChevronDown } from "lucide-react";

export const mockColaboradores = [
  { nome: "Ana Paula", nivel: "Chefe de Departamento", area: "Autorização", estado: "Ativo" },
  { nome: "Carlos Dias", nivel: "Tecnico", area: "Monitorizacao", estado: "Ativo" },
  { nome: "Beatriz Lopes", nivel: "Tecnico", area: "Espaços Verdes", estado: "Inativo" },
  { nome: "João Miguel", nivel: "Chefe de Departamento", area: "Monitorizacao", estado: "Ativo" },
  { nome: "Sara Pinto", nivel: "Tecnico", area: "Autorização", estado: "Inativo" },
];

import { useRouter } from "next/navigation";

export default function ColaboradoresPage() {
  const [busca, setBusca] = useState("");
  const [nivel, setNivel] = useState("");
  const [area, setArea] = useState("");
  const [estado, setEstado] = useState("");
  const router = useRouter();

  const colaboradoresFiltrados = mockColaboradores.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) &&
    (nivel ? c.nivel === nivel : true) &&
    (area ? c.area === area : true) &&
    (estado ? c.estado === estado : true)
  );

  return (
    <div className="w-full min-h-screen pt-12 px-4 text-sm">
      <h1 className="text-2xl font-bold mb-6 text-primary">Colaboradores</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <input
          type="text"
          placeholder="Buscar por nome..."
          className="border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-lime-200"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-lime-200"
          value={nivel}
          onChange={e => setNivel(e.target.value)}
        >
          <option value="">Nível</option>
          <option value="Tecnico">Técnico</option>
          <option value="Chefe de Departamento">Chefe de Departamento</option>
        </select>
        <select
          className="border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-lime-200"
          value={area}
          onChange={e => setArea(e.target.value)}
        >
          <option value="">Área</option>
          <option value="Autorização">Autorização</option>
          <option value="Monitorizacao">Monitorizacao</option>
          <option value="Espaços Verdes">Espaços Verdes</option>
        </select>
        <select
          className="border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-lime-200"
          value={estado}
          onChange={e => setEstado(e.target.value)}
        >
          <option value="">Estado</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-xl text-sm">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="text-left px-4 py-2 whitespace-nowrap align-middle">Nome</th>
              <th className="text-left px-4 py-2 whitespace-nowrap align-middle">Nível</th>
              <th className="text-left px-4 py-2 whitespace-nowrap align-middle">Área</th>
              <th className="text-left px-4 py-2 whitespace-nowrap align-middle">Estado</th>
              <th className="text-left px-4 py-2 whitespace-nowrap align-middle">Ações</th>
            </tr>
          </thead>
          <tbody>
            {colaboradoresFiltrados.map((colab, idx) => (
              <tr key={colab.nome} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-2 font-semibold align-middle min-w-[180px]">
                  <span className="inline-flex items-center gap-2"><Users size={16} className="text-lime-700" /> {colab.nome}</span>
                </td>
                <td className="px-4 py-2 align-middle min-w-[160px]">
                  <span className="inline-flex items-center gap-2">{colab.nivel === "Chefe de Departamento" ? (
                    <UserCog size={16} className="text-blue-700" />
                  ) : (
                    <Briefcase size={16} className="text-gray-400" />
                  )} {colab.nivel}</span>
                </td>
                <td className="px-4 py-2 align-middle min-w-[150px]">
                  <span className="inline-flex items-center gap-2"><ChevronDown size={16} className="text-lime-700" /> {colab.area}</span>
                </td>
                <td className="px-4 py-2 align-middle">
                  <Badge variant={colab.estado === "Ativo" ? "default" : "secondary"} className="flex items-center gap-1 text-sm px-2 py-1">
                    {colab.estado === "Ativo" ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-yellow-500" />}
                    {colab.estado}
                  </Badge>
                </td>
                <td className="px-4 py-2 align-middle">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex items-center gap-1 text-green-700 hover:bg-lime-50 border border-lime-200 shadow-none text-sm px-3 py-1 h-8"
                    onClick={() => {
                      const slug = colab.nome.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');
                      router.push(`/direccao/dir_colaboradores/${slug}`);
                    }}
                  >
                    <Eye className="mr-1" size={14} /> Ver perfil
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

