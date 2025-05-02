"use client";
import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "components/ui/table";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { CheckCircle2, XCircle, UserCog, Briefcase, ChevronDown, Pencil, Save, Undo2 } from "lucide-react";

// Mock data (replace with real data fetching)
const colaborador = {
  nome: "Ana Paula",
  nivel: "Chefe de Departamento",
  area: "Autorização",
  estado: "Ativo",
};
const historicoNivelArea = [
  { data: "2024-01-01", nivel: "Técnico", area: "Autorização" },
  { data: "2024-03-15", nivel: "Chefe de Departamento", area: "Autorização" },
  { data: "2024-06-10", nivel: "Chefe de Departamento", area: "Monitorizacao" },
];
const processos = [
  { id: "P001", data: "2024-04-10", tipo: "Validação", status: "Aprovado" },
  { id: "P002", data: "2024-04-15", tipo: "Aprovação", status: "Rejeitado" },
  { id: "P003", data: "2024-04-20", tipo: "Validação", status: "Aprovado" },
  { id: "P004", data: "2024-05-01", tipo: "Aprovação", status: "Pendente" },
];

export default function ColaboradorPerfilPage() {
  const [editando, setEditando] = useState(false);
  const [nivel, setNivel] = useState(colaborador.nivel);
  const [area, setArea] = useState(colaborador.area);
  const [ativo, setAtivo] = useState(colaborador.estado === "Ativo");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const mudouNivel = nivel !== colaborador.nivel;
  const mudouArea = area !== colaborador.area;

  const handleSalvar = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEditando(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8 mt-10">
      {/* Breadcrumbs e voltar */}
      <div className="flex flex-col gap-2 mb-4">
        <button
          className="flex items-center gap-2 text-xs text-lime-700 hover:underline w-fit mt-1"
          onClick={() => window.history.length > 1 ? window.history.back() : null}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M8 3l-5 5 5 5"/></svg>
          ← Voltar para lista de colaboradores
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-4 text-primary">Perfil do Colaborador</h2>
      {success && (
        <div className="mb-4 px-4 py-2 rounded bg-lime-50 text-lime-800 border border-lime-200 text-sm animate-fade-in">Alterações salvas com sucesso!</div>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:gap-10 gap-3 mb-6">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Nome:</span> {colaborador.nome}
            <Badge variant={ativo ? "default" : "secondary"} className="flex items-center gap-1 text-xs px-2 py-1">
              {ativo ? <CheckCircle2 size={12} className="text-green-600"/> : <XCircle size={12} className="text-yellow-500"/>}
              {ativo ? "Ativo" : "Inativo"}
            </Badge>
            <Button
              size="sm"
              variant={ativo ? "destructive" : "outline"}
              className="ml-2 px-2 py-1 h-7 text-xs"
              disabled={loadingStatus}
              onClick={() => {
                setLoadingStatus(true);
                setTimeout(() => {
                  setAtivo(a => !a);
                  setLoadingStatus(false);
                }, 1000);
              }}
            >
              {loadingStatus ? (ativo ? "Desativando..." : "Ativando...") : (ativo ? "Desativar" : "Ativar")}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Nível:</span>
            {editando ? (
              <select
                className={`border rounded px-2 py-1 focus:ring-2 focus:ring-lime-200 ${mudouNivel ? 'border-lime-500 bg-lime-50' : ''}`}
                value={nivel}
                onChange={e => setNivel(e.target.value)}
                disabled={loading}
              >
                <option value="Tecnico">Técnico</option>
                <option value="Chefe de Departamento">Chefe de Departamento</option>
              </select>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1 text-sm px-2 py-1 bg-blue-50 border-blue-200 text-blue-800">
                {nivel === "Chefe de Departamento" ? <UserCog size={14} className="text-blue-700" /> : <Briefcase size={14} className="text-gray-400" />}
                {nivel}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Área:</span>
            {editando ? (
              <select
                className={`border rounded px-2 py-1 focus:ring-2 focus:ring-lime-200 ${mudouArea ? 'border-lime-500 bg-lime-50' : ''}`}
                value={area}
                onChange={e => setArea(e.target.value)}
                disabled={loading}
              >
                <option value="Autorização">Autorização</option>
                <option value="Monitorizacao">Monitorizacao</option>
                <option value="Espaços Verdes">Espaços Verdes</option>
              </select>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1 text-sm px-2 py-1 bg-lime-50 border-lime-200 text-lime-800">
                <ChevronDown size={14} className="text-lime-700" /> {area}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-row gap-2 items-center mt-2 md:mt-0">
          {editando ? (
            <>
              <Button size="sm" className="bg-lime-700 text-white flex items-center gap-1 disabled:opacity-70" onClick={handleSalvar} disabled={loading || (!mudouNivel && !mudouArea)}>
                {loading ? <span className="animate-spin mr-1"><Save size={16}/></span> : <Save size={16} className="mr-1"/>}
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setNivel(colaborador.nivel); setArea(colaborador.area); setEditando(false); }} disabled={loading}><Undo2 size={16} className="mr-1"/>Cancelar</Button>
            </>
          ) : (
            <div className="group relative">
              <Button size="sm" variant="outline" onClick={() => setEditando(true)}><Pencil size={16} className="mr-1"/>Editar</Button>
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-10 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Editar nível e área</span>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold mt-8 mb-2 text-primary">Histórico de Nível e Área</h3>
      <Table>
        <TableCaption>Alterações de nível e área do colaborador</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Nível</TableHead>
            <TableHead>Área</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historicoNivelArea.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell>{item.data}</TableCell>
              <TableCell>{item.nivel}</TableCell>
              <TableCell>{item.area}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h3 className="text-lg font-semibold mt-10 mb-2 text-primary">Processos Validados/Aprovados/Rejeitados</h3>
      <Table>
        <TableCaption>Processos em que o colaborador atuou</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processos.map(proc => (
            <TableRow key={proc.id}>
              <TableCell>{proc.id}</TableCell>
              <TableCell>{proc.data}</TableCell>
              <TableCell>{proc.tipo}</TableCell>
              <TableCell>
                <Badge variant={proc.status === "Aprovado" ? "default" : proc.status === "Rejeitado" ? "destructive" : "secondary"} className="flex items-center gap-1 text-xs px-2 py-1">
                  {proc.status === "Aprovado" ? <CheckCircle2 size={12} className="text-green-600" /> : proc.status === "Rejeitado" ? <XCircle size={12} className="text-red-500" /> : null}
                  {proc.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
