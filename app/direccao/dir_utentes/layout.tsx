import '../../globals.css';
import SidebarDireccao from '../../components/SidebarDireccao';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarDireccao />
      <main className="flex-1 ml-auto p-8">
        {children}
      </main>
    </>
  );
}
