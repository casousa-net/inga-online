"use client";

import DashboardCharts from "../components/DashboardCharts";

export default function UtenteDashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <h1 className="text-3xl font-bold text-lime-800 mb-8 text-center">Dashboard do Utente</h1>
      <DashboardCharts />
    </main>
  );
}
