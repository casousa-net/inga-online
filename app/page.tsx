import DashboardCharts from './components/DashboardCharts'

export default function Home() {
  return (
    <section>
      <h1 className="text-3xl font-bold text-primary mb-4">Bem-vindo à Dashboard</h1>
      <p className="text-gray-700">Aqui você pode visualizar informações importantes do sistema.</p>
      <DashboardCharts />
    </section>
  )
}