"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { CheckCircle, Clock, XCircle, Download, Eye, File, User2, Calendar1, ArrowBigRightDash, Coins, CoinsIcon } from "lucide-react";

// Mock para exemplo, substitua por fetch real ou contexto global
const mockProcessos = [
  {
    numero: "PA-000001",
    tipo: "Importações",
    data: "2025-04-10",
    estado: "Aprovado",
    rupe: "Disponível",
    rupeNumero: "1234 5678 9012 3456 7890", // <-- Adicione este campo!
    produtos: [
      { codigo: "12345678", quantidade: 10, custo: 100 },
      { codigo: "87654321", quantidade: 5, custo: 200 },
    ],
  },
  {
    numero: "PA-000002",
    tipo: "Exportações",
    data: "2025-04-12",
    estado: "Pendente",
    rupe: "Sem RUPE",
    produtos: [
      { codigo: "12345670", quantidade: 2, custo: 300 },
    ],
  },
];

import Link from "next/link";
import { BiMoney } from "react-icons/bi";

export default function ProcessoView({ params }: { params: Promise<{ numero: string }> }) {
  const router = useRouter();
  const [proc, setProc] = React.useState<any>(null);
  const [notificando, setNotificando] = React.useState(false);
  const [pago, setPago] = React.useState(false);

  // Novo padrão: usar React.use() para acessar params
  const unwrappedParams = React.use(params);
  const numero = unwrappedParams.numero;

  React.useEffect(() => {
    // Buscar processo pelo número
    const processo = mockProcessos.find(p => p.numero === numero);
    setProc(processo);
  }, [numero]);

  if (!proc) return (
    <div className="p-8">
      <h2 className="text-xl font-semibold">Processo não encontrado</h2>
      <Button className="mt-4" onClick={() => router.push("/autorizacao")}>← Voltar</Button>
    </div>
  );

  const total = proc.produtos.reduce((acc: number, p: any) => acc + (p.quantidade * p.custo), 0);

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg mt-8">
      {/* Breadcrumbs e botão voltar */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/autorizacao" className="text-lime-700 hover:underline font-semibold">Autorizações</Link>
        <span className="text-gray-400">/</span>
        <span className="text-lime-900 font-bold">{proc.numero}</span>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => router.push('/autorizacao')}>← Voltar</Button>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-lime-800">Processo {proc.numero}</h1>
        <Badge
          variant={proc.rupe === "Disponível" ? "default" : "secondary"}
          className="flex items-center gap-1 px-2"
        >
          {proc.rupe === "Disponível" ? <CheckCircle className="text-green-600" size={16} /> : <XCircle className="text-red-500" size={16} />}
          {proc.rupe}
        </Badge>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <Badge variant="secondary" className="flex items-center gap-1 px-2">
            <Calendar1 className="text-lime-700" size={16} />
            <span className="block text-sm text-gray-500">Data</span>
            <span className="font-semibold">{proc.data}</span>
          </Badge>
        </div>
        <div>
          <Badge variant="secondary" className="flex items-center gap-1 px-2">
            <File className="text-lime-700" size={16} />
            <span className="block text-sm text-gray-500">Tipo</span>
            <span className="font-semibold">{proc.tipo}</span>
          </Badge>
        </div>
        <div>
          <Badge variant={proc.estado === 'Aprovado' ? 'default' : proc.estado === 'Rejeitado' ? 'destructive' : 'secondary'} className="flex items-center gap-1 px-2">
            {proc.estado === 'Aprovado' && <CheckCircle className="text-green-600" size={16} />}
            {proc.estado.toLowerCase().includes('pendente') && <Clock className="text-yellow-500" size={16} />}
            {proc.estado === 'Rejeitado' && <XCircle className="text-red-500" size={16} />}
            <span className="block text-sm text-gray-500">Estado</span>
            <span className="font-semibold">{proc.estado}</span>
          </Badge>
        </div>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2"><File className="text-lime-700" size={20} />Produtos</h2>
        <table className="w-full text-sm border rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-lime-100">
              <th className="px-3 py-2 text-left"><File className="inline text-lime-700 mr-1" size={16} />Código Pautal</th>
              <th className="px-3 py-2 text-left">Quantidade</th>
              <th className="px-3 py-2 text-left">Custo Unitário</th>
              <th className="px-3 py-2 text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {proc.produtos.map((p: any, idx: number) => (
              <tr key={idx} className="border-b last:border-b-0">
                <td className="px-3 py-2 font-mono">{p.codigo}</td>
                <td className="px-3 py-2">{p.quantidade}</td>
                <td className="px-3 py-2">{p.custo.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</td>
                <td className="px-3 py-2">{(p.quantidade * p.custo).toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-right font-bold px-3 py-2">Total</td>
              <td className="font-bold px-3 py-2">{total.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {/* RUPE, Referência e Botões */}
      <div className="flex flex-col gap-2 mt-6">
        <div className="flex items-center gap-4">
          <span className="font-semibold">RUPE:</span>
          <Badge variant={proc.rupe && proc.rupe !== "Sem RUPE" ? "default" : "secondary"} className="flex items-center gap-1 px-2">
  {proc.rupe && proc.rupe !== "Sem RUPE" ? <CheckCircle className="text-green-600" size={16} /> : <XCircle className="text-red-500" size={16} />}
  {proc.rupe && proc.rupe !== "Sem RUPE" ? (proc.rupeNumero || proc.rupe) : "Sem RUPE"}
</Badge>
          {proc.rupe && proc.rupe !== "Sem RUPE" ? (
            <Button
              className="bg-lime-600 hover:bg-lime-700 rounded-[1.0rem] ml-4"
              onClick={() => setPago(true)}
              disabled={pago}
            >
              {pago ? "Pagamento Confirmado" : "Paguei"}
            </Button>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1 px-2 cursor-pointer" asChild>
              <Button size="sm" variant="ghost" onClick={async () => {
                setNotificando(true);
                setTimeout(() => setNotificando(false), 1500);
              }} disabled={notificando}>
                {notificando ? "Notificando..." : <><ArrowBigRightDash className="text-lime-700" size={16} /> Notificar</>}
              </Button>
            </Badge>
          )}
        </div>
        {/* Exibir Valor a Pagar se RUPE disponível */}
        {proc.rupe && proc.rupe !== "Sem RUPE" && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="flex items-center gap-1 px-2">
              <CoinsIcon className="text-lime-700" size={16} />
              <span className="text-gray-500 text-sm">Valor a Pagar:</span>
              <span className="font-mono text-lime-800 tracking-widest bg-lime-50 px-3 py-1 rounded-[1.0rem] border border-lime-200 select-all">120.000,00 AKz</span>
            </Badge>
          </div>
        )}
        {/* Botão Baixar */}
        <div className="mt-4">
          <Badge variant="secondary" className="flex items-center gap-1 px-2 cursor-pointer" asChild>
            <Button variant="outline" className="rounded-[1.0rem]" onClick={() => alert('Baixando Parecer Técnico...')}>
              <Download className="text-lime-700" size={16} /> Baixar Parecer Técnico
            </Button>
          </Badge>
        </div>
      </div>
    </div>
  );
}
