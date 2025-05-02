import '../globals.css';
import SidebarDireccao from '../components/SidebarDireccao';

export const metadata = {
  title: 'Dashboard Direcção - IngaOnline',
  description: 'Painel da direcção com menu personalizado',
};

export default function DireccaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-gray-50 min-h-screen flex">
        <SidebarDireccao />
        <main className="flex-1 ml-absolute p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
