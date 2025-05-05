"use client";
import { useState } from "react";
import {
  Bar,
  Line,
  Pie,
  Doughnut,
  Radar,
  PolarArea,
  Bubble,
  Scatter,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend
);

const barData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    { label: "Autorizações", data: [12, 19, 3, 5, 2, 3], backgroundColor: "#84cc16" },
    { label: "Monitorizações", data: [8, 13, 6, 9, 5, 7], backgroundColor: "#22d3ee" },
  ],
};
const lineData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    { label: "Pagamentos", data: [100, 120, 150, 90, 170, 200], borderColor: "#f59e42", backgroundColor: "#f59e4211" },
  ],
};
const pieData = {
  labels: ["Aprovado", "Rejeitado", "Pendente"],
  datasets: [
    { data: [60, 25, 15], backgroundColor: ["#22c55e", "#ef4444", "#fbbf24"] },
  ],
};
const doughnutData = {
  labels: ["Com RUPE", "Sem RUPE"],
  datasets: [
    { data: [80, 20], backgroundColor: ["#0ea5e9", "#f59e42"] },
  ],
};
const radarData = {
  labels: ["Importação", "Exportação", "Espaços Verdes", "Monitorização", "Outros"],
  datasets: [
    { label: "Processos", data: [20, 14, 17, 10, 8], backgroundColor: "#a3e63588", borderColor: "#a3e635" },
  ],
};
const polarData = {
  labels: ["USD", "EUR", "AKZ"],
  datasets: [
    { data: [25, 15, 60], backgroundColor: ["#f59e42", "#22d3ee", "#84cc16"] },
  ],
};
const bubbleData = {
  datasets: [
    {
      label: "Volume de Processos",
      data: [
        { x: 10, y: 20, r: 15 },
        { x: 15, y: 10, r: 10 },
        { x: 20, y: 30, r: 20 },
      ],
      backgroundColor: "#0ea5e9",
    },
  ],
};
const scatterData = {
  datasets: [
    {
      label: "Pagamentos vs Processos",
      data: [
        { x: 10, y: 100 },
        { x: 20, y: 200 },
        { x: 30, y: 150 },
        { x: 40, y: 170 },
      ],
      backgroundColor: "#f59e42",
    },
  ],
};

// Gráfico: Número de Empresas Cadastradas
const empresasData = {
  labels: ["2020", "2021", "2022", "2023", "2024"],
  datasets: [
    { label: "Empresas Cadastradas", data: [120, 180, 250, 320, 400], backgroundColor: "#0ea5e9" },
  ],
};
// Gráfico: Produtos Mais Importados
const produtosImportadosData = {
  labels: ["Arroz", "Óleo", "Trigo", "Açúcar", "Peixe"],
  datasets: [
    { label: "Importados (toneladas)", data: [500, 420, 380, 300, 250], backgroundColor: ["#22d3ee", "#84cc16", "#f59e42", "#fbbf24", "#a3e635"] },
  ],
};
// Gráfico: Produtos Mais Exportados
const produtosExportadosData = {
  labels: ["Café", "Diamante", "Petróleo", "Madeira", "Peixe"],
  datasets: [
    { label: "Exportados (toneladas)", data: [600, 540, 500, 350, 200], backgroundColor: ["#0ea5e9", "#22c55e", "#f59e42", "#ef4444", "#a3e635"] },
  ],
};

export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-8">
      {/* Gráficos existentes */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold mb-3 text-lime-800">Autorizações e Monitorizações</h3>
        <Bar data={barData} />
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold mb-3 text-lime-800">Pagamentos Mensais</h3>
        <Line data={lineData} />
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold mb-3 text-lime-800">Status dos Processos</h3>
        <Pie data={pieData} />
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold mb-3 text-lime-800">Distribuição RUPE</h3>
        <Doughnut data={doughnutData} />
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold mb-3 text-lime-800">Processos por Tipo</h3>
        <Radar data={radarData} />
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold mb-3 text-lime-800">Moeda dos Pagamentos</h3>
        <PolarArea data={polarData} />
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold mb-3 text-lime-800">Volume de Processos</h3>
        <Bubble data={bubbleData} />
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold mb-3 text-lime-800">Pagamentos vs Processos</h3>
        <Scatter data={scatterData} />
      </div>
      {/* Novos Gráficos */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold mb-3 text-lime-800">Empresas Cadastradas</h3>
        <Bar data={empresasData} />
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold mb-3 text-lime-800">Produtos Mais Importados</h3>
        <Pie data={produtosImportadosData} />
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold mb-3 text-lime-800">Produtos Mais Exportados</h3>
        <Pie data={produtosExportadosData} />
      </div>
    </div>
  );
}
