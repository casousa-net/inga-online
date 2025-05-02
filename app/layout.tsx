import './globals.css'
import Sidebar from './components/Sidebar'

export const metadata = {
  title: 'Dashboard IngaOnline',
  description: 'Dashboard responsiva com Next.js, ShadCN UI e Tailwind',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-gray-50 min-h-screen flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </body>
    </html>
  )
}