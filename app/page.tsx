'use client';

import { useEffect } from 'react';
import { Button } from "components/ui/button";
import Link from "next/link";
import MobileMenu from "./components/MobileMenu";

const faqs = [
  {
    q: "Quais são os requisitos para solicitar autorizações?",
    a: "É necessário informar os dados do projeto, área, certidão comercial, croquis de localização, contrato com operadora, plano de gestão ambiental, entre outros documentos."
  },
  {
    q: "Como acompanho o andamento do meu processo?",
    a: "Após login, acesse sua área de utente para acompanhar cada etapa do seu pedido, receber notificações e baixar documentos."
  },
  {
    q: "Quem pode solicitar licenças e autorizações?",
    a: "Empresas, cidadãos e entidades que atuam em atividades ambientais sujeitas a regulação podem solicitar pelo portal."
  },
  {
    q: "Quanto tempo demora o processo?",
    a: "O tempo pode variar conforme a complexidade do pedido e a documentação apresentada. Você será notificado a cada etapa."
  }
];

export default function Home() {
  // Adicionar log para debug
  useEffect(() => {
    console.log('Home page loaded');
    
    // Verificar se há algum redirecionamento automático
    const checkLocalStorage = () => {
      // Limpar qualquer estado que possa estar causando redirecionamento
      localStorage.removeItem('redirectTo');
    };
    
    checkLocalStorage();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f4f7fa] to-[#e1e7ef]">
      {/* Navbar */}
      <header className="w-full bg-white/90 border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <nav className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo_inga.png" alt="Logo" className="h-10 w-auto" />
            <span className="font-bold text-lg text-[#84cc16] tracking-tight">ONLINE</span>
          </div>
          {/* Desktop menu */}
          <div className="hidden md:flex gap-3 items-center">
            <Link href="https://inga.casousa.net">
              <Button variant="ghost" className="font-semibold">Verificar Documento</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="font-semibold">Entrar</Button>
            </Link>
            <Link href="/cadastro">
              <Button className="font-semibold bg-[#84cc16] hover:bg-[#65a30d] text-white">Criar Conta</Button>
            </Link>
            <a href="https://inga.gov.ao" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="font-semibold border-[#84cc16] text-[#84cc16]">INGA</Button>
            </a>
          </div>
          {/* Mobile menu (hamburguer) */}
          <MobileMenu />
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Gestão Ambiental Simplificada
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Solicite autorizações ambientais, monitore processos e gerencie licenças em um só lugar.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/cadastro">
                <Button className="px-6 py-3 bg-[#84cc16] hover:bg-[#65a30d] text-white font-medium rounded-lg">
                  Criar Conta
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="px-6 py-3 border-[#84cc16] text-[#84cc16] font-medium rounded-lg">
                  Entrar
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden shadow-lg">
              <img 
                src="/hero-image.jpg" 
                alt="Gestão Ambiental" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1274&q=80';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Funcionalidades</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-[#84cc16]/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#84cc16]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Autorizações Ambientais</h3>
              <p className="text-gray-600">Solicite e acompanhe suas autorizações ambientais com facilidade e transparência.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-[#84cc16]/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#84cc16]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Monitorização</h3>
              <p className="text-gray-600">Acompanhe visitas técnicas e monitore o cumprimento das condicionantes ambientais.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-[#84cc16]/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#84cc16]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestão de Pagamentos</h3>
              <p className="text-gray-600">Gerencie pagamentos de taxas e emolumentos com referências RUPE integradas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Perguntas Frequentes</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo_inga.png" alt="Logo" className="h-10 w-auto" />
                <span className="font-bold text-lg text-[#84cc16] tracking-tight">ONLINE</span>
              </div>
              <p className="text-gray-400">
                Sistema de gestão ambiental para autorizações e monitorização.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-gray-400 hover:text-white">Entrar</Link></li>
                <li><Link href="/cadastro" className="text-gray-400 hover:text-white">Criar Conta</Link></li>
                <li><a href="https://inga.gov.ao" className="text-gray-400 hover:text-white">Site Oficial</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contato</h3>
              <p className="text-gray-400 mb-2">Luanda, Angola</p>
              <p className="text-gray-400 mb-2">info@inga.gov.ao</p>
              <p className="text-gray-400">+244 222 123 456</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} INGA ONLINE. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
