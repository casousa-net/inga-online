import SidebarChefe from "../components/SidebarChefe";

export default function ChefeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarChefe />
      <main className="flex-1 ml-auto p-8">
        {children}
      </main>
    </div>
  );
}
