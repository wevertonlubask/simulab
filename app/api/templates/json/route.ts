import { NextResponse } from "next/server";

export async function GET() {
  const template = {
    _comentarios: {
      descricao: "Template de importação de questões - SimulaB",
      tipos_suportados: [
        "MULTIPLA_ESCOLHA_UNICA",
        "MULTIPLA_ESCOLHA_MULTIPLA",
        "DRAG_DROP",
        "ASSOCIACAO",
        "ORDENACAO",
        "LACUNA",
        "COMANDO",
      ],
      dificuldades: ["FACIL", "MEDIO", "DIFICIL"],
      instrucoes: "Remova este campo _comentarios antes de importar",
    },
    questoes: [
      {
        tipo: "MULTIPLA_ESCOLHA_UNICA",
        enunciado: "Qual porta padrão o protocolo HTTP utiliza?",
        dificuldade: "FACIL",
        tags: ["http", "redes", "portas"],
        explicacao: "O HTTP utiliza a porta 80 como padrão para comunicação não criptografada",
        alternativas: [
          { texto: "80", correta: true },
          { texto: "443", correta: false },
          { texto: "22", correta: false },
          { texto: "21", correta: false },
        ],
      },
      {
        tipo: "MULTIPLA_ESCOLHA_MULTIPLA",
        enunciado: "Quais dos seguintes são protocolos da camada de transporte do modelo OSI?",
        dificuldade: "MEDIO",
        tags: ["osi", "tcp", "udp", "transporte"],
        explicacao: "TCP e UDP são os dois principais protocolos da camada 4 (Transporte)",
        alternativas: [
          { texto: "TCP", correta: true },
          { texto: "UDP", correta: true },
          { texto: "IP", correta: false },
          { texto: "HTTP", correta: false },
          { texto: "ICMP", correta: false },
        ],
      },
      {
        tipo: "DRAG_DROP",
        enunciado: "Arraste cada protocolo para sua porta padrão correspondente",
        dificuldade: "MEDIO",
        tags: ["portas", "protocolos", "redes"],
        explicacao: "HTTP=80, HTTPS=443, FTP=21, SSH=22",
        configuracao: {
          itens: [
            { id: "item1", texto: "HTTP" },
            { id: "item2", texto: "HTTPS" },
            { id: "item3", texto: "FTP" },
            { id: "item4", texto: "SSH" },
          ],
          zonas: [
            { id: "zona1", label: "Porta 80", itensCorretos: ["item1"] },
            { id: "zona2", label: "Porta 443", itensCorretos: ["item2"] },
            { id: "zona3", label: "Porta 21", itensCorretos: ["item3"] },
            { id: "zona4", label: "Porta 22", itensCorretos: ["item4"] },
          ],
        },
      },
      {
        tipo: "ASSOCIACAO",
        enunciado: "Associe cada camada OSI com sua função principal",
        dificuldade: "MEDIO",
        tags: ["osi", "camadas", "funções"],
        explicacao: "O modelo OSI possui 7 camadas, cada uma com funções específicas",
        configuracao: {
          colunaA: [
            { id: "a1", texto: "Camada de Rede" },
            { id: "a2", texto: "Camada de Transporte" },
            { id: "a3", texto: "Camada Física" },
          ],
          colunaB: [
            { id: "b1", texto: "Roteamento de pacotes" },
            { id: "b2", texto: "Controle de fluxo e erros" },
            { id: "b3", texto: "Transmissão de bits" },
          ],
          conexoesCorretas: [
            { de: "a1", para: "b1" },
            { de: "a2", para: "b2" },
            { de: "a3", para: "b3" },
          ],
        },
      },
      {
        tipo: "ORDENACAO",
        enunciado: "Ordene as camadas do modelo OSI da mais baixa (1) para a mais alta (7)",
        dificuldade: "DIFICIL",
        tags: ["osi", "camadas", "ordem"],
        explicacao: "A ordem correta é: Física, Enlace, Rede, Transporte, Sessão, Apresentação, Aplicação",
        configuracao: {
          itens: [
            { id: "o1", texto: "Física", ordemCorreta: 1 },
            { id: "o2", texto: "Enlace", ordemCorreta: 2 },
            { id: "o3", texto: "Rede", ordemCorreta: 3 },
            { id: "o4", texto: "Transporte", ordemCorreta: 4 },
            { id: "o5", texto: "Sessão", ordemCorreta: 5 },
            { id: "o6", texto: "Apresentação", ordemCorreta: 6 },
            { id: "o7", texto: "Aplicação", ordemCorreta: 7 },
          ],
        },
      },
      {
        tipo: "LACUNA",
        enunciado: "Preencha as lacunas",
        dificuldade: "MEDIO",
        tags: ["tcp", "ip", "redes"],
        explicacao: "O endereço IP identifica dispositivos na rede, e a porta identifica serviços",
        configuracao: {
          texto: "O protocolo [LACUNA_1] opera na camada de [LACUNA_2] e utiliza endereços de [LACUNA_3] bits.",
          lacunas: [
            { id: "l1", respostasAceitas: ["IP", "ip", "Internet Protocol"] },
            { id: "l2", respostasAceitas: ["rede", "Rede", "network", "3", "três"] },
            { id: "l3", respostasAceitas: ["32", "trinta e dois"] },
          ],
        },
      },
      {
        tipo: "COMANDO",
        enunciado: "Digite o comando Linux para listar todos os arquivos (incluindo ocultos) no diretório atual com detalhes",
        dificuldade: "FACIL",
        tags: ["linux", "comandos", "ls"],
        explicacao: "O comando ls -la lista todos os arquivos com detalhes, incluindo ocultos",
        configuracao: {
          prompt: "user@server:~$",
          contexto: "Terminal Linux",
          respostasAceitas: ["ls -la", "ls -al", "ls -a -l", "ls -l -a"],
          caseSensitive: false,
          ignorarEspacosExtras: true,
        },
      },
    ],
  };

  const jsonContent = JSON.stringify(template, null, 2);

  return new NextResponse(jsonContent, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=template_questoes_simulab.json",
    },
  });
}
