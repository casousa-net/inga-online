"use client";
import { useState, useEffect } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Eye, CheckCircle2, XCircle, UserCog, Users, Briefcase, ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Colaborador = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  nivel: string;
  area: string;
  estado: string;
};

export default function ColaboradoresPage() {
  const [busca, setBusca] = useState("");
  const [nivel, setNivel] = useState("");
  const [area, setArea] = useState("");
  const [estado, setEstado] = useState("");
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (busca) params.append('busca', busca);
        if (nivel) params.append('nivel', nivel);
        if (area) params.append('area', area);
        
        const response = await fetch(`/api/usuarios/colaboradores?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Erro ao buscar colaboradores');
        }
        
        const data = await response.json();
        setColaboradores(data);
        setError('');
      } catch (err) {
        console.error('Erro ao buscar colaboradores:', err);
        setError('Falha ao carregar os dados. Tente novamente.');
        setColaboradores([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchColaboradores();
  }, [busca, nivel, area]);
  
  const colaboradoresFiltrados = colaboradores.filter(c =>
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
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-lime-600 mb-4" />
          <p className="text-gray-500">Carregando colaboradores...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4 border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : colaboradoresFiltrados.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-center">
          <p className="text-gray-500">Nenhum colaborador encontrado com os filtros selecionados.</p>
        </div>
      ) : (
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
                <tr key={colab.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
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
                      onClick={() => router.push(`/direccao/dir_colaboradores/${colab.id}`)}
                    >
                      <Eye className="mr-1" size={14} /> Ver perfil
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

