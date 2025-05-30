import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QRCode from 'qrcode';

// Determinar a URL base para recursos estáticos
const BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Cor personalizada para o QR code
const QR_CODE_COLOR = '#067323'; // Verde escuro

// Registrar fontes
Font.register({
  family: 'Times-Roman',
  src: 'https://fonts.gstatic.com/s/times/v1/Times-Roman.ttf',
});

// Estilos para o PDF
const styles = StyleSheet.create({
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
    alignSelf: 'center',
  },
  watermarkImage: {
    width: '50%',
    opacity: 0.05,
    alignSelf: 'center',
  },
  signatureImage: {
    width: 150,
    height: 130,
    position: 'absolute',
    top: -30,
    left: '50%',
    transform: 'translateX(-70%)',
    zIndex: 1,
  },
  page: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  content: {
    marginLeft: 10,
    marginRight: 10,
  },
  border: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderStyle: 'solid',
    borderWidth: 12,
    borderColor: '#c90000', // Dourada
    zIndex: -1,
  },
  border2: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderStyle: 'solid',
    borderWidth: 10,
    borderColor: '#000000', //Preta
    zIndex: -1,
  },
  innerBorder: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderStyle: 'solid',
    borderWidth: 6,
    borderColor: '#ffdd00', // Dourada
    zIndex: -1,
  },
  cornerSquare: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: '#c90000', // vermelha
    zIndex: 1,
  },
  topLeft: {
    top: 10,
    left: 10,
  },
  topRight: {
    top: 10,
    right: 10,
  },
  bottomLeft: {
    bottom: 10,
    left: 10,
  },
  bottomRight: {
    bottom: 10,
    right: 10,
  },
  header: {
    marginTop: 20,
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 0,
    fontFamily: 'Times-Roman',
  },
  subtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: 'Times-Roman',
  },
  autorizacaoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 2,
    fontFamily: 'Times-Roman',
    textDecoration: 'underline',
    textDecorationStyle: 'double',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 180,
    fontFamily: 'Times-Roman',
  },
  value: {
    fontSize: 10,
    flex: 1,
    fontFamily: 'Times-Roman',
    flexWrap: 'wrap',
  },
  multilineValue: {
    fontSize: 10,
    width: '100%',
    marginTop: 2,
    marginLeft: 180,
    fontFamily: 'Times-Roman',
  },
  pageBreak: {
    height: 0,
    width: '100%',
    pageBreakAfter: 'always',
  },
  continuationHeader: {
    fontSize: 10,
    textAlign: 'right',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  continuationFooter: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: 5,
    fontStyle: 'italic',
  },
  paragraph: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'justify',
    lineHeight: 1.2,
    fontFamily: 'Times-Roman',
  },
  footer: {
    marginTop: 40,
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Times-Roman',
  },
  signature: {
    marginTop: 30,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    gap: 0,
  },

  signatureName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Times-Roman',
    position: 'relative',
    zIndex: 0,
  },
  qrCode: {
    position: 'absolute',
    bottom: 35,
    right: 35,
    width: 80,
    height: 80,
  },
  qrCodeText: {
    position: 'absolute',
    bottom: 25,
    right: 35,
    fontSize: 10,
    textAlign: 'center',
    width: 80,
    fontFamily: 'Times-Roman',
  },
  digitalSignature: {
    position: 'absolute',
    bottom: 25,
    left: 30,
    fontSize: 6,
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    width: '100%',
    height: 'auto',
    transform: 'translateY(-50%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.05,
    zIndex: -2,
  },
  qrCodeContainer: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 100,
  },
  note: {
    fontSize: 8,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
});

// Interface para os dados da autorização
export interface AutorizacaoAmbientalData {
  id?: number; // ID da autorização
  tipoAutorizacao: string;
  entidade: string;
  nif: string;
  numeroFactura?: string;
  produtos: string;
  quantidade: string;
  codigosPautais?: string;
  descricaoCodigosPautais?: string;
  dataEmissao: Date;
  numeroAutorizacao: string;
  numeroProcesso?: string; // Número do processo (PA)
}

export interface AutorizacaoAmbientalPDFProps {
  data: AutorizacaoAmbientalData;
  logoUrl?: string;
  assinaturaUrl?: string;
  qrCodeUrl?: string; // URL para o QR Code já gerado
}

// Componente do PDF
const AutorizacaoAmbientalPDF: React.FC<AutorizacaoAmbientalPDFProps> = ({
  data,
  logoUrl = `${BASE_URL}/assets/pdf/logo-angola.png`,
  assinaturaUrl = `${BASE_URL}/assets/pdf/assinatura.png`,
  qrCodeUrl
}) => {
  // Gerar URL para verificação
  const baseUrl = BASE_URL;
  
  // Usar o PA (número do processo) para a verificação em vez do ID
  const numeroProcesso = data.numeroProcesso || `PA-${data.id}` || 'PA-000001';
  
  // Garantir que o número de autorização existe
  if (!data.numeroAutorizacao) {
    console.error('ERRO: Número de autorização não definido nos dados do PDF:', data);
  }
  
  // Usar o número de autorização com verificação de undefined
  const numeroAutorizacao = data.numeroAutorizacao || `AUT-${new Date().getFullYear()}-ERROR`;
  
  // Usar o caminho /verificar/[pa] para corresponder ao diretório [pa]
  const verificationUrl = `${baseUrl}/verificar/${encodeURIComponent(numeroAutorizacao)}`;
  
  // Garantir que a URL do QR code seja absoluta e inclua a cor personalizada
  const qrCodeImageUrl = qrCodeUrl || `${baseUrl}/api/qrcode/${encodeURIComponent(numeroAutorizacao)}?color=${QR_CODE_COLOR.replace('#', '')}`;

  // Garantir que a data é válida antes de formatar
  let dataFormatada = '';
  try {
    const dataEmissao = data.dataEmissao instanceof Date ? data.dataEmissao : new Date(data.dataEmissao);
    if (!isNaN(dataEmissao.getTime())) {
      dataFormatada = format(dataEmissao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } else {
      dataFormatada = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      console.warn('Data de emissão inválida, usando data atual');
    }
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    dataFormatada = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }

  // Função para dividir texto longo em linhas
  const splitTextIntoChunks = (text: string, maxLength: number = 100): string[] => {
    if (!text || text.length <= maxLength) return [text];
    
    const chunks: string[] = [];
    let currentIndex = 0;
    
    while (currentIndex < text.length) {
      // Encontrar um ponto de quebra adequado (espaço, vírgula, ponto)
      let endIndex = Math.min(currentIndex + maxLength, text.length);
      
      if (endIndex < text.length) {
        // Procurar por um espaço para trás a partir do endIndex
        const lastSpaceIndex = text.lastIndexOf(' ', endIndex);
        if (lastSpaceIndex > currentIndex && lastSpaceIndex - currentIndex >= maxLength / 2) {
          endIndex = lastSpaceIndex;
        }
      }
      
      chunks.push(text.substring(currentIndex, endIndex));
      currentIndex = endIndex;
      
      // Se terminar em espaço, avançar para o próximo caractere
      if (text[currentIndex] === ' ') {
        currentIndex++;
      }
    }
    
    return chunks;
  };
  
  // Processar os dados para exibição
  const produtos = data.descricaoCodigosPautais || data.produtos || '';
  const hsCodes = data.codigosPautais || '';
  const quantidade = data.quantidade || '';
  
  // Dividir textos longos em chunks para exibição em múltiplas páginas
  const produtosChunks = splitTextIntoChunks(produtos, 100);
  const hsCodesChunks = splitTextIntoChunks(hsCodes, 100);
  const quantidadeChunks = splitTextIntoChunks(quantidade, 100);
  
  // Verificar se precisamos de múltiplas páginas
  const needsMultiplePages = 
    produtosChunks.length > 1 || 
    hsCodesChunks.length > 1 || 
    quantidadeChunks.length > 1 ||
    produtos.length > 150 ||
    hsCodes.length > 150 ||
    quantidade.length > 150;
  
  // Função para renderizar o cabeçalho comum
  const renderHeader = () => (
    <>
      <Image
        src={logoUrl}
        style={styles.logo}
      />
      <Text style={styles.title}>REPÚBLICA DE ANGOLA</Text>
      <Text style={styles.title}>MINISTERIO DO AMBIENTE</Text>
      <Text style={styles.title}>INSTITUTO NACIONAL DE GESTÃO AMBIENTAL</Text>

      <Text style={styles.autorizacaoTitle}>
        AUTORIZAÇÃO AMBIENTAL PARA {data.tipoAutorizacao.toUpperCase()}
      </Text>
    </>
  );
  
  // Função para renderizar as bordas e elementos decorativos
  const renderBorders = () => (
    <>
      <View style={styles.border} />
      <View style={[styles.cornerSquare, styles.topLeft]} />
      <View style={[styles.cornerSquare, styles.topRight]} />
      <View style={[styles.cornerSquare, styles.bottomLeft]} />
      <View style={[styles.cornerSquare, styles.bottomRight]} />
      <View style={styles.border2} />
      <View style={styles.innerBorder} />
      
      {/* Marca d'água */}
      <View style={styles.watermark}>
        <Image
          src={`${BASE_URL}/assets/pdf/logo-inga.png`}
          style={styles.watermarkImage}
        />
      </View>
    </>
  );
  
  // Função para renderizar o rodapé com QR code
  const renderFooter = (isLastPage: boolean = true) => (
    <>
      {isLastPage && (
        <>
          {/* Rodapé e Assinatura */}
          <Text style={styles.footer}>
            <Text style={{ fontWeight: 'bold' }}>INSTITUTO NACIONAL DE GESTÃO AMBIENTAL</Text> em Luanda, aos {dataFormatada}
          </Text>

          <View style={styles.signature}>
            <Image
              src={assinaturaUrl}
              style={styles.signatureImage}
            />
            <Text style={styles.signatureName}>A DIRECTORA GERAL</Text>
            <View style={{ height: 65, position: 'relative', marginTop: -5 }}></View>
            <Text style={[styles.signatureName, { marginTop: -30 }]}>SIMONE DA SILVA</Text>
          </View>
        </>
      )}
      
      {/* QR Code */}
      <View style={{
        position: 'absolute',
        bottom: 25,
        right: 40,
        alignItems: 'center',
        width: 80
      }}>
        <Image
          src={qrCodeImageUrl}
          style={{ width: 80, height: 80 }}
        />
        <Text style={{ fontSize: 8, marginTop: 1, textAlign: 'center' }}>
          {numeroProcesso}
        </Text>
        <Text style={{ fontSize: 5, marginTop: 1, textAlign: 'center', color: '#666666' }}>
          {verificationUrl}
        </Text>
      </View>

      <Text style={styles.digitalSignature}>
        Documento assinado digitalmente • Verificar em: inga.gov.ao/verificar/{numeroAutorizacao}
      </Text>
      
      {!isLastPage && (
        <Text style={styles.continuationFooter}>Continua na próxima página...</Text>
      )}
    </>
  );
  
  // Função para renderizar informações básicas
  const renderBasicInfo = () => (
    <>
      <View style={styles.infoRow}>
        <Text style={styles.label}>ENTIDADE:</Text>
        <Text style={styles.value}>{data.entidade}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>NIF:</Text>
        <Text style={styles.value}>{data.nif}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>NÚMERO DE FACTURA:</Text>
        <Text style={styles.value}>{data.numeroFactura}</Text>
      </View>
    </>
  );
  
  // Função para renderizar informações detalhadas que podem ser extensas
  const renderDetailedInfo = (page: number = 1, isLastPage: boolean = true) => {
    if (page === 1) {
      // Na primeira página, mostramos o início de cada campo
      return (
        <>
          <View style={styles.infoRow}>
            <Text style={styles.label}>PRODUTOS:</Text>
            <Text style={styles.value}>
              {needsMultiplePages ? `${produtosChunks[0]}...` : produtos}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>QUANTIDADE:</Text>
            <Text style={styles.value}>
              {needsMultiplePages ? `${quantidadeChunks[0]}...` : `${quantidade} Un`}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>HS CODES:</Text>
            <Text style={styles.value}>
              {needsMultiplePages ? `${hsCodesChunks[0]}...` : hsCodes}
            </Text>
          </View>
          
          {!needsMultiplePages && (
            <View style={{ marginTop: 5 }}>
              <Text style={styles.note}>
                {/* Nota: Este documento é válido quando acompanhado do respectivo QR Code e assinatura digital. */}
              </Text>
            </View>
          )}
        </>
      );
    } else {
      // Nas páginas seguintes, mostramos o conteúdo completo
      return (
        <View style={{ paddingTop: 20 }}>
          {page === 2 && (
            <Text style={styles.continuationHeader}>Continuação da página anterior</Text>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>PRODUTOS (completo):</Text>
          </View>
          <Text style={styles.multilineValue}>{produtos}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>QUANTIDADE (completo):</Text>
          </View>
          <Text style={styles.multilineValue}>{quantidade} Un</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>HS CODES (completo):</Text>
          </View>
          <Text style={styles.multilineValue}>{hsCodes}</Text>
          
          {isLastPage && (
            <View style={{ marginTop: 5, marginBottom: 20 }}>
              <Text style={styles.note}>
                {/* Nota: Este documento é válido quando acompanhado do respectivo QR Code e assinatura digital. */}
              </Text>
            </View>
          )}
        </View>
      );
    }
  };
  
  // Função para renderizar o texto da certificação
  const renderCertificationText = () => (
    <>
      <Text style={[styles.paragraph, { textAlign: 'justify' }]}>
        Certifica-se a Autorização para a {data.tipoAutorizacao} de acordo com o Parecer Técnico do Instituto Nacional de
        Gestão Ambiental.
      </Text>

      <Text style={[styles.paragraph, { textAlign: 'justify' }]}>
        A empresa deve cumprir durante o período excepcional a adaptação e reconversão industrial em
        conformidade com a legislação em vigor nos termos do Decreto Presidencial nº 153/11 de 15 de Junho,
        que aprova o regulamento que estabelece as regras sobre a produção, exportação, reexportação e
        importação de substâncias, equipamentos e aparelhos possuidores de substâncias que empobrecem a
        camada de ozono e demais Convenções.
      </Text>

      <Text style={[styles.paragraph, { textAlign: 'justify' }]}>
        Este documento deve ser apresentado a versão original correspondente à factura mencionada e tem
        validade até 180 dias a contar da data da sua emissão.
      </Text>

      <Text style={[styles.paragraph, { textAlign: 'justify' }]}>
        As Autoridades Competentes deverão proceder a verificação do código QR para efeitos de confirmação
        da validade do documento.
      </Text>
    </>
  );
  
  return (
    <Document>
      {/* Primeira página - Informações básicas e início dos dados */}
      <Page size="A4" style={styles.page}>
        {renderBorders()}
        
        <View style={styles.content}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            {renderHeader()}
          </View>

          <View style={styles.divider} />

          {/* Informações básicas */}
          {renderBasicInfo()}
          
          {/* Informações detalhadas (versão resumida se for muito extenso) */}
          {renderDetailedInfo(1, !needsMultiplePages)}
          
          {/* Se não precisar de múltiplas páginas, mostrar o texto de certificação */}
          {!needsMultiplePages && renderCertificationText()}
        </View>
        
        {/* Rodapé e QR Code */}
        {renderFooter(!needsMultiplePages)}
      </Page>
      
      {/* Segunda página - Se necessário, para conteúdo extenso */}
      {needsMultiplePages && (
        <Page size="A4" style={styles.page}>
          {renderBorders()}
          
          <View style={styles.content}>
            {/* Cabeçalho simplificado */}
            <View style={styles.header}>
              {renderHeader()}
            </View>
            
            <View style={styles.divider} />
            
            {/* Informações detalhadas completas */}
            {renderDetailedInfo(2, true)}
            
            {/* Texto da certificação */}
            {renderCertificationText()}
          </View>
          
          {/* Rodapé e QR Code */}
          {renderFooter(true)}
        </Page>
      )}
    </Document>
  );
};

export default AutorizacaoAmbientalPDF;
