"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// Registrar fonte (usando fonte padrão do sistema)
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Roboto",
  },
  border: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 3,
    borderColor: "#6366F1",
    borderRadius: 10,
  },
  innerBorder: {
    position: "absolute",
    top: 25,
    left: 25,
    right: 25,
    bottom: 25,
    borderWidth: 1,
    borderColor: "#8B5CF6",
    borderRadius: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6366F1",
    letterSpacing: 2,
  },
  logoSub: {
    fontSize: 10,
    color: "#8B5CF6",
    marginTop: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginTop: 30,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 60,
  },
  certifyText: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 12,
  },
  studentName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#8B5CF6",
    paddingBottom: 8,
    paddingHorizontal: 40,
  },
  completionText: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 8,
  },
  courseName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6366F1",
    textAlign: "center",
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: "#8B5CF6",
    textAlign: "center",
    marginBottom: 24,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  scoreBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 20,
  },
  scoreLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10B981",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerLeft: {
    alignItems: "flex-start",
  },
  footerRight: {
    alignItems: "flex-end",
  },
  dateText: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },
  codeText: {
    fontSize: 9,
    color: "#9CA3AF",
    fontFamily: "Courier",
  },
  verifyText: {
    fontSize: 8,
    color: "#9CA3AF",
    marginTop: 4,
  },
  qrContainer: {
    alignItems: "center",
    padding: 8,
  },
  qrImage: {
    width: 80,
    height: 80,
  },
  signature: {
    alignItems: "center",
    marginTop: 8,
  },
  signatureLine: {
    width: 150,
    borderBottomWidth: 1,
    borderBottomColor: "#4B5563",
    marginBottom: 4,
  },
  signatureText: {
    fontSize: 10,
    color: "#6B7280",
  },
});

export interface CertificatePDFProps {
  alunoNome: string;
  titulo: string;
  categoria: string;
  nota: number;
  notaMinima: number;
  dataEmissao: string;
  codigo: string;
  qrCodeDataUrl?: string;
}

export function CertificatePDF({
  alunoNome,
  titulo,
  categoria,
  nota,
  dataEmissao,
  codigo,
  qrCodeDataUrl,
}: CertificatePDFProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Bordas decorativas */}
        <View style={styles.border} />
        <View style={styles.innerBorder} />

        {/* Header com logo */}
        <View style={styles.header}>
          <Text style={styles.logo}>SIMULAB</Text>
          <Text style={styles.logoSub}>Plataforma de Simulados</Text>
        </View>

        {/* Título */}
        <Text style={styles.title}>CERTIFICADO</Text>
        <Text style={styles.subtitle}>DE CONCLUSÃO</Text>

        {/* Conteúdo principal */}
        <View style={styles.content}>
          <Text style={styles.certifyText}>Certificamos que</Text>
          <Text style={styles.studentName}>{alunoNome}</Text>
          <Text style={styles.completionText}>
            completou com sucesso o simulado
          </Text>
          <Text style={styles.courseName}>{titulo}</Text>
          <Text style={styles.category}>{categoria}</Text>

          {/* Nota */}
          <View style={styles.scoreContainer}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>NOTA OBTIDA</Text>
              <Text style={styles.scoreValue}>{nota.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.dateText}>Emitido em: {dataEmissao}</Text>
            <Text style={styles.codeText}>Código: {codigo}</Text>
            <Text style={styles.verifyText}>
              Verifique em: simulab.app.br/verificar/{codigo}
            </Text>
          </View>

          {qrCodeDataUrl && (
            <View style={styles.qrContainer}>
              <Image src={qrCodeDataUrl} style={styles.qrImage} />
            </View>
          )}

          <View style={styles.footerRight}>
            <View style={styles.signature}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>SimulaB</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
