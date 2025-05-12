import React, { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from 'components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import AutorizacaoAmbientalPDF, { AutorizacaoAmbientalData } from './AutorizacaoAmbientalPDF';

interface AutorizacaoAmbientalDownloadProps {
  data: AutorizacaoAmbientalData;
  fileName?: string;
}

const AutorizacaoAmbientalDownload: React.FC<AutorizacaoAmbientalDownloadProps> = ({ 
  data, 
  fileName = `autorizacao-ambiental-${data.numeroAutorizacao}.pdf` 
}) => {
  const [isClient, setIsClient] = useState(false);

  // Usar useEffect para garantir que o componente só seja renderizado no cliente
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Button disabled className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Preparando documento...
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<AutorizacaoAmbientalPDF data={data} />}
      fileName={fileName}
      className="inline-block"
    >
      {({ loading, error }) => (
        <Button 
          disabled={loading} 
          className="flex items-center gap-2"
          variant="default"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Baixar Autorização
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default AutorizacaoAmbientalDownload;
