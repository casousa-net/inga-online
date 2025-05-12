import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Registrar fontes
Font.register({
  family: 'Times-Roman',
  src: 'https://fonts.gstatic.com/s/times/v1/Times-Roman.ttf',
});

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    position: 'relative',
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
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
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
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
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
    marginTop: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  signatureImage: {
    width: 170,
    height: 80,
  },
  signatureName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 0,
    fontFamily: 'Times-Roman',
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
    color: '#666666',
    fontFamily: 'Times-Roman',
    textAlign: 'left',
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -2,
  },
  watermarkImage: {
    width: 450,
    opacity: 0.02,
  },
});

// Interface para os dados da autorização
export interface AutorizacaoAmbientalData {
  tipoAutorizacao: 'IMPORTAÇÃO' | 'EXPORTAÇÃO' | 'REEXPORTAÇÃO';
  entidade: string;
  nif: string;
  numeroFactura: string;
  produtos: string;
  quantidade: string;
  codigosPautais: string;
  dataEmissao: Date;
  numeroAutorizacao: string;
}

interface AutorizacaoAmbientalPDFProps {
  data: AutorizacaoAmbientalData;
  logoUrl?: string;
  assinaturaUrl?: string;
}

// Componente do PDF
const AutorizacaoAmbientalPDF: React.FC<AutorizacaoAmbientalPDFProps> = ({ 
  data, 
  logoUrl = '/assets/pdf/logo-angola.png',
  assinaturaUrl = '/assets/pdf/assinatura.png'
}) => {
  const dataFormatada = format(data.dataEmissao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Bordas e cantos */}
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
            src="/assets/pdf/logo-inga.png"
            style={styles.watermarkImage}
          />
        </View>

        {/* Cabeçalho */}
        <View style={styles.header}>
          <Image
            src={logoUrl}
            style={styles.logo}
          />
          <Text style={styles.title}>REPÚBLICA DE ANGOLA</Text>
          <Text style={styles.title}>MINISTERIO DO AMBIENTE</Text>
          <Text style={styles.title}>INSTITUTO NACIONAL DE GESTÃO AMBIENTAL</Text>

          <Text style={styles.autorizacaoTitle}>
            AUTORIZAÇÃO AMBIENTAL PARA {data.tipoAutorizacao}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Informações da Entidade */}
        <View style={styles.infoRow}>
          <Text style={styles.label}>ENTIDADE:</Text>
          <Text style={styles.value}>{data.entidade}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>NÚMERO DE IDENTIFICAÇÃO FISCAL:</Text>
          <Text style={styles.value}>{data.nif}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>NÚMERO DA FACTURA:</Text>
          <Text style={styles.value}>{data.numeroFactura}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>PRODUTOS:</Text>
          <Text style={styles.value}>{data.produtos}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>QUANTIDADE:</Text>
          <Text style={styles.value}>{data.quantidade}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>HS CODES:</Text>
          <Text style={styles.value}>{data.codigosPautais}</Text>
        </View>

        {/* Texto da Certificação */}
        <Text style={[styles.paragraph, { textAlign: 'justify' }]}>
          Certifica-se a Autorização para a {data.tipoAutorizacao.toLowerCase()} de acordo com o Parecer Técnico do Instituto Nacional de
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

        {/* Rodapé e Assinatura */}
        <Text style={styles.footer}>
          <Text style={{ fontWeight: 'bold' }}>INSTITUTO NACIONAL DE GESTÃO AMBIENTAL</Text> em Luanda, aos {dataFormatada}
        </Text>


        <View style={styles.signature}>
          <Text style={styles.signatureName}>A DIRECTORA GERAL</Text>
          <Image
            src={assinaturaUrl}
            style={styles.signatureImage}
          />
          <Text style={styles.signatureName}>SIMONE DA SILVA</Text>
        </View>

        {/* QR Code */}
        <Image
          src={`/api/qrcode?text=${data.numeroAutorizacao}`}
          style={styles.qrCode}
        />
        <Text style={styles.qrCodeText}>PA {data.numeroAutorizacao}</Text>

        {/* Assinatura Digital */}
        <Text style={styles.digitalSignature}>
          Documento assinado digitalmente • Verificar em: inga.gov.ao/verificar/{data.numeroAutorizacao}
        </Text>
      </Page>
    </Document>
  );
};

export default AutorizacaoAmbientalPDF;
