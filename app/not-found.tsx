import Link from 'next/link';
import Image from 'next/image';
import { XCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Image src="/assets/pdf/logo-inga.png" alt="INGA" width={120} height={120} />
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 shadow-sm mb-8">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Página não encontrada</h2>
          
          <p className="text-gray-600 mb-8">
            A página que você está procurando não existe ou foi removida.
          </p>
          
          <Link 
            href="/" 
            className="px-6 py-3 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors inline-block"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
      
      <footer className="mt-12 text-center text-gray-500 text-sm border-t pt-6 w-full max-w-md">
        <div className="flex justify-center gap-6 items-center mb-4">
          <Image src="/assets/pdf/logo-inga.png" alt="INGA" width={40} height={40} className="opacity-70" />
          <Image src="/assets/pdf/minamb.png" alt="MINAMB" width={100} height={40} className="opacity-70" />
          <Image src="/assets/pdf/logo-angola.png" alt="Angola" width={40} height={40} className="opacity-70" />
        </div>
        <p>© {new Date().getFullYear()} Instituto Nacional de Gestão Ambiental (INGA)</p>
      </footer>
    </div>
  );
}
