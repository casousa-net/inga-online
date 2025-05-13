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
    height: 70,
    position: 'absolute',
    top: -20,
    left: '50%',
    transform: 'translateX(-65%)',
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
    bottom: 35,
    right: 35,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 100,
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
const AutorizacaoAmbientalPDF = ({
  data,
  logoUrl = 'http://localhost:3000/assets/pdf/logo-angola.png',
  assinaturaUrl = 'http://localhost:3000/assets/pdf/assinatura.png',
  qrCodeUrl = ''
}: AutorizacaoAmbientalPDFProps) => {
  const dataFormatada = format(data.dataEmissao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  // URL padrão para verificação
  const verificacaoUrl = `https://inga.gov.ao/verificar/${data.numeroAutorizacao}`;

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
            src="http://localhost:3000/assets/pdf/logo-inga.png"
            style={styles.watermarkImage}
          />
        </View>

        <View style={styles.content}>
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
            <Text style={styles.label}>NIF:</Text>
            <Text style={styles.value}>{data.nif}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>NÚMERO DE FACTURA:</Text>
            <Text style={styles.value}>{data.numeroFactura}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>PRODUTOS:</Text>
            <Text style={styles.value}>{data.descricaoCodigosPautais || data.produtos}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>QUANTIDADE:</Text>
            <Text style={styles.value}>{data.quantidade}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>CÓDIGOS PAUTAIS:</Text>
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
            <View style={{ height: 65, position: 'relative', marginTop: -5 }}>
              <Image
                src={assinaturaUrl}
                style={styles.signatureImage}
              />
            </View>
            <Text style={[styles.signatureName, { marginTop: -30 }]}>SIMONE DA SILVA</Text>
          </View>
        </View>
        {/* QR Code - Temporariamente removido */}
        <View style={styles.qrCodeContainer}>
          <Text style={styles.qrCodeText}>Verifique a autenticidade em: inga.gov.ao/verificar/{data.numeroProcesso}</Text>
        </View>
        <Text style={styles.qrCodeText}>{data.numeroProcesso}</Text>

        <Text style={styles.digitalSignature}>
          Documento assinado digitalmente • Verificar em: inga.gov.ao/verificar/{data.numeroProcesso}
        </Text>
      </Page>
    </Document>
  );
};

export default AutorizacaoAmbientalPDF;
