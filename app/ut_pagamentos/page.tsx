'use client';
import React, { useState } from 'react';
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "components/ui/select";
import { Badge } from "components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "components/ui/table";

// Mock data for RUPES
const mockRupes = [
  { id: 1, descricao: 'RUPE 001', valor: 1000, status: 'PENDENTE', data: '2025-05-01' },
  { id: 2, descricao: 'RUPE 002', valor: 2000, status: 'PAGA', data: '2025-04-10' },
  { id: 3, descricao: 'RUPE 003', valor: 1500, status: 'PENDENTE', data: '2025-03-15' },
  { id: 4, descricao: 'RUPE 004', valor: 1200, status: 'PAGA', data: '2025-02-20' },
];

const statusOptions = ['TODOS', 'PENDENTE', 'PAGA'];

export default function Pagamentos() {
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  const [rupes, setRupes] = useState(mockRupes);

  const rupesFiltradas = statusFiltro === 'TODOS'
    ? rupes
    : rupes.filter(r => r.status === statusFiltro);

  const gerarRelatorio = () => {
    // Aqui pode implementar exportação para PDF/Excel
    alert('Funcionalidade de relatório a implementar');
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Pagamentos</h1>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="ml-auto bg-lime-600 hover:bg-lime-700 text-white font-semibold rounded-lg shadow" onClick={gerarRelatorio}>
          Gerar Relatório
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rupesFiltradas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma RUPA encontrada</TableCell>
            </TableRow>
          ) : (
            rupesFiltradas.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.descricao}</TableCell>
                <TableCell>{r.valor.toLocaleString('pt-PT', { style: 'currency', currency: 'AOA' })}</TableCell>
                <TableCell>
                  <Badge variant={r.status === 'PAGA' ? 'default' : r.status === 'PENDENTE' ? 'secondary' : 'outline'} className="flex items-center gap-1 px-2">
                    {r.status === 'PAGA' && <CheckCircle className="text-green-600" size={16} />}
                    {r.status === 'PENDENTE' && <Clock className="text-yellow-500" size={16} />}
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell>{r.data}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
