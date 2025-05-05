"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "components/ui/button";
import { Menu, X } from "lucide-react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden relative">
      <Button variant="ghost" size="icon" aria-label="Abrir menu" onClick={() => setOpen(!open)}>
        {open ? <X size={24} /> : <Menu size={24} />}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 flex flex-col gap-2 p-4 animate-fade-in">
          <Link href="/login" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">Entrar</Button>
          </Link>
          <Link href="/cadastro" onClick={() => setOpen(false)}>
            <Button className="w-full justify-start">Criar Conta</Button>
          </Link>
          <a href="https://inga.gov.ao" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
            <Button variant="outline" className="w-full justify-start border-primary text-primary">INGA</Button>
          </a>
        </div>
      )}
    </div>
  );
}
