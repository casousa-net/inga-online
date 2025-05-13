'use client';

import React, { useState, useEffect } from 'react';

type TotalAutorizacaoProps = {
  codigos: { id: number, codigo: string }[];
  quantidades: number[];
  precos: number[];
  moeda: string;
};

const TotalAutorizacao: React.FC<TotalAutorizacaoProps> = ({ codigos, quantidades, precos, moeda }) => {
  const [moedaSelecionada, setMoedaSelecionada] = useState<{id: number, nome: string, simbolo: string, taxaCambio: number} | null>(null);
  
  useEffect(() => {
    if (moeda) {
      fetch('/api/moedas')
        .then(res => res.json())
        .then(data => {
          const found = data.find((m: any) => m.id === Number(moeda));
          if (found) setMoedaSelecionada(found);
        })
        .catch(err => console.error('Erro ao carregar moedas:', err));
    }
  }, [moeda]);
  
  const total = codigos.reduce((acc, _, idx) => {
    return acc + (quantidades[idx] || 0) * (precos[idx] || 0);
  }, 0);

  const totalKz = moedaSelecionada ? total * moedaSelecionada.taxaCambio : total;

  // Aplicar valor mínimo se necessário
  let totalCobrar = totalKz;
  let minAplicado = false;
  if (totalCobrar < 2000) {
    totalCobrar = 2000;
    minAplicado = true;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-sm">
        <span>Total em {moedaSelecionada?.simbolo || 'USD'}:</span>
        <span className="font-semibold">{total.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span>Total em KZ:</span>
        <span className="font-semibold">{totalCobrar.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
      </div>
      {minAplicado && (
        <div className="text-xs text-gray-500 italic">
          * Valor mínimo de 2.000 KZ aplicado
        </div>
      )}
    </div>
  );
};

export default TotalAutorizacao;
