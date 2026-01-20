import { NextResponse } from "next/server";

export async function GET() {
  const headers = [
    "tipo",
    "enunciado",
    "dificuldade",
    "tags",
    "explicacao",
    "alt_a",
    "alt_b",
    "alt_c",
    "alt_d",
    "alt_e",
    "corretas",
  ].join(",");

  const exemplo1 = [
    "MULTIPLA_ESCOLHA_UNICA",
    '"Qual porta padrão o protocolo HTTP utiliza?"',
    "FACIL",
    '"http,redes,portas"',
    '"O HTTP utiliza a porta 80 como padrão para comunicação não criptografada"',
    "80",
    "443",
    "22",
    "21",
    "",
    "A",
  ].join(",");

  const exemplo2 = [
    "MULTIPLA_ESCOLHA_MULTIPLA",
    '"Quais dos seguintes são protocolos da camada de transporte do modelo OSI?"',
    "MEDIO",
    '"osi,tcp,udp,transporte"',
    '"TCP e UDP são os dois principais protocolos da camada 4 (Transporte)"',
    "TCP",
    "UDP",
    "IP",
    "HTTP",
    "ICMP",
    '"A,B"',
  ].join(",");

  const exemplo3 = [
    "MULTIPLA_ESCOLHA_UNICA",
    '"O que significa a sigla DNS?"',
    "FACIL",
    '"dns,redes,nomenclatura"',
    '"DNS = Domain Name System, responsável por traduzir nomes de domínio em endereços IP"',
    "Domain Name System",
    "Dynamic Network Service",
    "Digital Network Standard",
    "Data Name Server",
    "",
    "A",
  ].join(",");

  const csvContent = [
    "# Template de Importação de Questões - SimulaB",
    "# ",
    "# INSTRUÇÕES:",
    "# - Preencha cada linha com uma questão",
    "# - tipo: MULTIPLA_ESCOLHA_UNICA ou MULTIPLA_ESCOLHA_MULTIPLA",
    "# - dificuldade: FACIL, MEDIO ou DIFICIL",
    "# - tags: separadas por vírgula dentro de aspas",
    "# - corretas: letras separadas por vírgula (ex: A ou A,B,C)",
    "# - Use aspas duplas para textos com vírgulas",
    "# - Deixe alt_e vazia se tiver apenas 4 alternativas",
    "#",
    headers,
    exemplo1,
    exemplo2,
    exemplo3,
  ].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=template_questoes_simulab.csv",
    },
  });
}
