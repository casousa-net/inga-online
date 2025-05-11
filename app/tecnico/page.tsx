"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TecnicoDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página de solicitações pendentes
    router.push("/tecnico/processos/autorizacao");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500"></div>
    </div>
  );
}
