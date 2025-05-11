import '../../globals.css';
import SidebarDireccao from '../../components/SidebarDireccao';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1">
      {children}
    </div>
  );
}
