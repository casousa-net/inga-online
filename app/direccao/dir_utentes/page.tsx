"use client";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "components/ui/table";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const mockUtentes = [
  { nif: '500100200', nome: 'João Silva', endereco: 'Rua das Flores, 123', email: 'joao.silva@email.com', telefone: '923456789', status: 'Ativo', emailVerificado: true },
  { nif: '400200300', nome: 'Maria Santos', endereco: 'Av. Central, 456', email: 'maria.santos@email.com', telefone: '933112233', status: 'Inativo', emailVerificado: false },
  { nif: '600300400', nome: 'Pedro Oliveira', endereco: 'Travessa Norte, 789', email: 'pedro.oliveira@email.com', telefone: '912223344', status: 'Ativo', emailVerificado: true },
];

export default function UtentesPage() {
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
  const [verificado, setVerificado] = useState('');
  const router = useRouter();

  const utentesFiltrados = mockUtentes.filter(u =>
    (u.nome.toLowerCase().includes(busca.toLowerCase()) || u.email.toLowerCase().includes(busca.toLowerCase())) &&
    (status ? u.status === status : true) &&
    (verificado ? (verificado === 'verificado' ? u.emailVerificado : !u.emailVerificado) : true)
  );
  return (
    <div className="w-full min-h-screen pt-12 px-4">
      <h1 className="text-2xl font-bold mb-6 text-primary">Utentes</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-200"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-200"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
        </select>
        <select
          className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-200"
          value={verificado}
          onChange={e => setVerificado(e.target.value)}
        >
          <option value="">Email</option>
          <option value="verificado">Verificado</option>
          <option value="nao">Não verificado</option>
        </select>
      </div>
      <Table className="rounded-xl shadow-md bg-white border border-base-200">
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead className="text-left">NIF</TableHead>
            <TableHead className="text-left">Nomes</TableHead>
            <TableHead className="text-left">Endereço</TableHead>
            <TableHead className="text-left">Email</TableHead>
            <TableHead className="text-left">Telefone</TableHead>
            <TableHead className="text-left">Status</TableHead>
            <TableHead className="text-left">Email</TableHead>
            <TableHead className="text-left">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {utentesFiltrados.map((utente, idx) => (
            <TableRow key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <TableCell className="py-2 font-mono text-sm text-gray-800">{utente.nif}</TableCell>
              <TableCell className="py-2 font-semibold text-gray-900">{utente.nome}</TableCell>
              <TableCell className="py-2 text-gray-700">{utente.endereco}</TableCell>
              <TableCell className="py-2 text-gray-700">{utente.email}</TableCell>
              <TableCell className="py-2 text-gray-700">{utente.telefone}</TableCell>
              <TableCell className="py-2">
                <Badge variant={utente.status === 'Ativo' ? 'default' : 'secondary'} className="flex items-center gap-1 px-2">
                  {utente.status === 'Ativo' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-green-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-yellow-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  )}
                  {utente.status}
                </Badge>
              </TableCell>
              <TableCell className="py-2">
                <Badge variant={utente.emailVerificado ? 'default' : 'secondary'} className="flex items-center gap-1 px-2">
                  {utente.emailVerificado ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-green-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-red-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                  )}
                  {utente.emailVerificado ? 'Verificado' : 'Não verificado'}
                </Badge>
              </TableCell>
              <TableCell className="py-2 flex gap-2">
                <Button size="sm" variant="ghost" className="flex items-center gap-1 text-green-700 hover:bg-lime-50 border border-lime-200 shadow-none" onClick={() => router.push(`/dir_utentes/${utente.nif}`)}>
                  <Eye className="mr-1" size={16} /> Ver
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
