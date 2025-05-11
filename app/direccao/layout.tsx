import '../globals.css';
import SidebarDireccao from '../components/SidebarDireccao';

export const metadata = {
  title: 'Dashboard Direcção - IngaOnline',
  description: 'Painel da direcção com menu personalizado',
};

export default function DireccaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <SidebarDireccao />
      <main className="flex-1 ml-auto p-8">
        {children}
      </main>
    </div>
  );
}
