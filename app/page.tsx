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
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f4f7fa] to-[#e1e7ef]">
      {/* Navbar */}
      <header className="w-full bg-white/90 border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <nav className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo_inga.png" alt="Logo" className="h-10 w-auto" />
            <span className="font-bold text-lg text-primary tracking-tight">ONLINE</span>
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
              <Button className="font-semibold">Criar Conta</Button>
            </Link>
            <a href="https://inga.gov.ao" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="font-semibold border-primary text-primary">INGA</Button>
            </a>
          </div>
          {/* Mobile menu (hamburguer) */}
          <MobileMenu />
        </nav>
      </header>
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl mx-auto px-2 sm:px-6 py-8 sm:py-16 gap-8 sm:gap-10">
        <div className="flex-1 flex flex-col gap-6 w-full">
          <h1 className="text-2xl xs:text-3xl md:text-5xl font-bold text-primary mb-2 text-center md:text-left">Solicite autorizações e acompanhe seus processos ambientais online</h1>
          <p className="text-base sm:text-lg text-gray-700 max-w-full md:max-w-xl mx-auto md:mx-0 text-center md:text-left">Plataforma oficial para gestão de licenças, monitorização e autorizações ambientais. Reduza a burocracia, ganhe tempo e acompanhe tudo em tempo real.</p>
          <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 mt-2 w-full justify-center md:justify-start">
            <Link href="/login">
              <Button size="lg" className="w-full xs:w-auto px-8 py-2 text-lg font-semibold rounded-lg">Entrar</Button>
            </Link>
            <Link href="/cadastro">
              <Button size="lg" variant="outline" className="w-full xs:w-auto px-8 py-2 text-lg font-semibold rounded-lg border-primary text-primary">Criar Conta</Button>
            </Link>
          </div>
        </div>
        <div className="flex-1 flex justify-center w-full max-w-xs sm:max-w-md mx-auto">
          <img src="/hero-illustration.svg" alt="Ilustração" className="w-full h-auto" />
        </div>
      </section>
      {/* Sobre */}
      <section className="bg-white py-14 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row gap-10 items-center">
          <img src="/about-illustration.svg" alt="Sobre" className="w-64 h-auto hidden md:block" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-primary mb-3">Sobre o Sistema</h2>
            <p className="text-gray-700 text-lg mb-2">O SIGA é um sistema moderno desenvolvido para facilitar a emissão de licenças, autorizações e o acompanhamento de processos ambientais em Angola.</p>
            <ul className="list-disc pl-5 text-gray-600 text-base">
              <li>Solicite e acompanhe processos de qualquer lugar</li>
              <li>Documentação digital e notificações em tempo real</li>
              <li>Compatível com computador, telemóvel e tablet</li>
              <li>Segurança e transparência em todas as etapas</li>
            </ul>
          </div>
        </div>
      </section>
      {/* FAQ */}
      <section className="py-14 bg-gradient-to-b from-[#f4f7fa] to-[#e1e7ef]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-primary mb-6 text-center">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="bg-white rounded-xl shadow p-4 border border-gray-100 group">
                <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between group-open:text-primary">
                  {faq.q}
                  <span className="ml-2 text-primary">+</span>
                </summary>
                <div className="mt-2 text-gray-700 text-base">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <img src="/logo_inga.png" alt="Logo" className="h-8 w-auto" />
            <span>SIGA &mdash; Sistema Integrado de Gestão Ambiental</span>
          </div>
          <span>&copy; {new Date().getFullYear()} Governo de Angola. Todos os direitos reservados.</span>
          <a href="https://api.whatsapp.com/send?phone=244948701010&text=Caro%20utente,%20%20%0A%0ASeja%20bem-vindo%20ao%20canal%20de%20apoio%20do%20Sistema%20SIGA.%20Podemos%20ajud%C3%A1-lo?" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">Fale connosco</a>
        </div>
      </footer>
    </div>
  );
}