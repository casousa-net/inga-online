"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { CheckCircle, Clock, XCircle, Download, Eye, File, User2, ArrowBigDownDash, ArrowBigLeftDash, ArrowBigRightDash, Calendar1, CoinsIcon } from "lucide-react";
import { FcDocument } from "react-icons/fc";
import { BsPeople } from "react-icons/bs";
import { Arrow } from "@radix-ui/react-select";

// Mock para exemplo
const mockProcessos = [
  {
    numero: "MO-000001",
    data: "2025-05-01",
    estado: "Aguardando RUPE",
    rupe: "Sem RUPE",
    relatorio: "Relatorio1.pdf",
    parecer: null,
    tecnicos: ["Eng. João Silva", "Eng. Maria Costa"],
  },
  {
    numero: "MO-000002",
    data: "2025-04-22",
    estado: "Aguardando Pagamento",
    rupe: "1234 5678 9012 3456 7890",
    relatorio: "Relatorio2.pdf",
    parecer: null,
    tecnicos: ["Eng. Carlos Pinto"],
  },
  {
    numero: "MO-000003",
    data: "2025-04-10",
    estado: "Aprovado",
    rupe: "1234 5678 9012 3456 7890",
    relatorio: "Relatorio3.pdf",
    parecer: "ParecerTecnico3.pdf",
    tecnicos: ["Eng. João Silva", "Eng. Maria Costa"],
  },
];

const parecerStatusColor = (estado: string) => {
  if (estado === "Aprovado") return "bg-green-600 text-white border-none rounded-[1.0rem]";
  if (estado === "Rejeitado") return "bg-red-600 text-white border-none rounded-[1.0rem]";
  if (estado === "Carece de Melhorias") return "bg-yellow-400 text-white border-none rounded-[1.0rem]";
  return "bg-gray-200 text-gray-800 rounded-[1.0rem]";
};

export default function MonitorizacaoProcessoView({ params }: { params: Promise<{ numero: string }> }) {
  const router = useRouter();
  const [notificando, setNotificando] = React.useState(false);
  const [pago, setPago] = React.useState(false);

  // Novo padrão: usar React.use() para acessar params
  const unwrappedParams = React.use(params);
  const numero = unwrappedParams.numero;

  const proc = mockProcessos.find(p => p.numero === numero);

  if (!proc) return (
    <div className="p-8">
      <h2 className="text-xl font-semibold">Processo não encontrado</h2>
      <Button className="mt-4" onClick={() => router.push("/ut_monitorizacao")}>← Voltar</Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg mt-8">
      {/* Breadcrumbs e botão voltar */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/ut_monitorizacao" className="text-lime-700 hover:underline font-semibold">Monitorização</Link>
        <span className="text-gray-400">/</span>
        <span className="text-lime-900 font-bold">{proc.numero}</span>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => router.push('/ut_monitorizacao')}>← Voltar</Button>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-lime-800">Processo {proc.numero}</h1>
        <Badge
          variant={proc.estado === "Aprovado" ? "default" : proc.estado === "Rejeitado" ? "destructive" : "secondary"}
          className={"flex items-center gap-1 px-2 " + parecerStatusColor(proc.estado)}
        >
          {proc.estado === 'Aprovado' && <CheckCircle className="text-white-600" size={16} />}
          {proc.estado.toLowerCase().includes('aguardando') && <Clock className="text-yellow-500" size={16} />}
          {proc.estado === 'Rejeitado' && <XCircle className="text-red-500" size={16} />}
          {proc.estado}
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
          <Badge variant={proc.relatorio ? "default" : "secondary"} className="flex items-center gap-1 px-2">
            {proc.relatorio ? <File className="text-green-600" size={16} /> : <XCircle className="text-red-500" size={16} />}
            <span className="block text-sm text-gray-500">Relatório</span>
            <span className={proc.relatorio ? "font-semibold" : "font-semibold text-gray-500"}>{proc.relatorio ? proc.relatorio : "Não enviado"}</span>
          </Badge>
        </div>
        <div className="col-span-2">
          <Badge variant="secondary" className="flex items-center gap-1 px-2">
            <span className="block text-sm text-gray-500 mb-1">Técnicos Responsáveis</span>
            <div className="flex flex-wrap gap-2">
              {proc.tecnicos.map((nome, idx) => (
                <span key={idx} className="inline-flex items-center gap-2 bg-lime-100 text-lime-900 px-3 py-1 rounded-full text-sm font-medium border border-lime-300 shadow-sm">
                  <User2 className="text-lime-700" size={16} />
                  {nome}
                </span>
              ))}
            </div>
          </Badge>
        </div>
      </div>
      {/* RUPE, Referência e Botões */}
      <div className="flex flex-col gap-2 mt-6">
        <div className="flex items-center gap-4">
          <span className="font-semibold">RUPE:</span>
          <Badge variant={proc.rupe && proc.rupe !== "Sem RUPE" ? "default" : "secondary"} className="flex items-center gap-1 px-2">
            {proc.rupe && proc.rupe !== "Sem RUPE" ? <CheckCircle className="text-green-600" size={16} /> : <XCircle className="text-red-500" size={16} />}
            {proc.rupe && proc.rupe !== "Sem RUPE" ? proc.rupe : "Sem RUPE"}
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
        {/* Botão Baixar Parecer Técnico */}
        {proc.estado === "Aprovado" && proc.parecer && (
          <div className="mt-4">
            <Badge variant="secondary" className="flex items-center gap-1 px-2 cursor-pointer" asChild>
              <Button variant="outline" className="rounded-[1.0rem]" onClick={() => alert('Baixando Parecer Técnico...')}>
                <Download className="text-lime-700" size={16} /> Baixar Parecer Técnico
              </Button>
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
