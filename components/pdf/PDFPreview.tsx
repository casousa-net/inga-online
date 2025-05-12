"use client";

import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import AutorizacaoAmbientalPDF from './AutorizacaoAmbientalPDF';
import type { AutorizacaoAmbientalData } from './AutorizacaoAmbientalPDF';

interface PDFPreviewProps {
  data: AutorizacaoAmbientalData;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ data }) => {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div>Carregando visualizador de PDF...</div>
      </div>
    );
  }

  return (
    <PDFViewer width="100%" height="100%" className="border-0">
      <AutorizacaoAmbientalPDF data={data} />
    </PDFViewer>
  );
};

export default PDFPreview;
