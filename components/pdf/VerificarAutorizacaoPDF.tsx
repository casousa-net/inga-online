import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '1px solid #000',
    paddingBottom: 10,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
  },
  value: {
    width: '60%',
  },
  status: {
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: 'bold',
    fontSize: 16,
  },
  valid: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  expired: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  message: {
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
  },
  footerImages: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  footerImage: {
    width: 80,
    height: 80,
    marginHorizontal: 20,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 10,
    color: '#666',
  },
  qrCode: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    margin: 20,
  },
});

interface VerificarAutorizacaoPDFProps {
  data: {
    tipoAutorizacao: string;
    pa: string;
    codigosPautais: string;
    dataEmissao: Date | string;
    nif: string;
    nome: string;
    qrCodeUrl: string;
  };
}

const VerificarAutorizacaoPDF: React.FC<VerificarAutorizacaoPDFProps> = ({ data }) => {
  // Calcular dias restantes
  const dataEmissao = new Date(data.dataEmissao);
  const hoje = new Date();
  const diffTime = Math.abs(hoje.getTime() - dataEmissao.getTime());
  const diffDays = 180 - Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isValido = diffDays > 0;

  // Formatar data
  const dataFormatada = format(dataEmissao, "dd 'de' MMMM 'de' yyyy", { locale: pt });
  const anoAtual = new Date().getFullYear();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Image 
            src="/assets/pdf/logo-angola.png" 
            style={styles.logo} 
          />
          <View>
            <Text style={styles.title}>VERIFICAÇÃO DE AUTORIZAÇÃO AMBIENTAL</Text>
          </View>
          <View style={{ width: 100 }} /> {/* Espaço vazio para alinhamento */}
        </View>

        {/* Conteúdo */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tipo de Autorização:</Text>
            <Text style={styles.value}>{data.tipoAutorizacao.toUpperCase()}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>PA:</Text>
            <Text style={styles.value}>{data.pa}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Códigos Pautais:</Text>
            <Text style={styles.value}>{data.codigosPautais}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>NIF:</Text>
            <Text style={styles.value}>{data.nif}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Nome:</Text>
            <Text style={styles.value}>{data.nome}</Text>
          </View>

          {/* QR Code */}
          <Image 
            src={data.qrCodeUrl} 
            style={styles.qrCode} 
          />

          {/* Status */}
          <View style={[styles.status, isValido ? styles.valid : styles.expired]}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{isValido ? 'VÁLIDO' : 'EXPIRADO'}</Text>
            <Text style={{ marginTop: 5 }}>{isValido 
              ? `Válido por mais ${diffDays} dias (até ${format(new Date(dataEmissao.getTime() + 180 * 24 * 60 * 60 * 1000), "dd/MM/yyyy")})` 
              : 'Documento expirado'}</Text>
          </View>

          {/* Mensagem de status */}
          <View style={styles.message}>
            <Text style={{ textAlign: 'center', fontSize: 12, fontWeight: 'bold' }}>
              A presente Autorização Ambiental está {isValido ? 'devidamente certificada' : 'não está mais válida'} para a {data.tipoAutorizacao.toUpperCase()}
              {isValido ? ` visto que restam ${diffDays} dias de validade!` : '.'}
            </Text>
            <Text style={{ marginTop: 10, textAlign: 'center' }}>
              Autorização Ambiental emitida em {dataFormatada} pelo
            </Text>
            <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>INGA - Instituto Nacional de Gestão Ambiental</Text>
            
            <Text style={{ marginTop: 15, fontSize: 10, textAlign: 'center', fontStyle: 'italic' }}>
              Este documento pode ser verificado a qualquer momento através do QR Code ou pelo site oficial do INGA.
            </Text>
          </View>
        </View>

        {/* Rodapé com imagens */}
        <View style={styles.footer}>
          <View style={styles.footerImages}>
            <Image 
              src="/assets/pdf/logo-inga.png" 
              style={styles.footerImage} 
            />
            <Image 
              src="/assets/pdf/minamb.png" 
              style={styles.footerImage} 
            />
            <Image 
              src="/assets/pdf/logo_50_anos.png" 
              style={styles.footerImage} 
            />
          </View>
          <Text style={styles.copyright}>
            © {anoAtual} Todos os direitos reservados. INGA - Instituto Nacional de Gestão Ambiental
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default VerificarAutorizacaoPDF;
