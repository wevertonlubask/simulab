import { PrismaClient, CategoriaConquista } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Conquistas disponíveis no sistema - Fase 6 Gamificação
const CONQUISTAS = [
  // CATEGORIA: PROVAS
  {
    codigo: "primeira_prova",
    nome: "Primeira Prova",
    descricao: "Complete sua primeira prova",
    icone: "🥉",
    categoria: "PROVAS" as CategoriaConquista,
    condicao: { tipo: "provas_total", valor: 1 },
    xpBonus: 50,
    ordem: 1,
  },
  {
    codigo: "maratonista",
    nome: "Maratonista",
    descricao: "Complete 10 provas",
    icone: "🥈",
    categoria: "PROVAS" as CategoriaConquista,
    condicao: { tipo: "provas_total", valor: 10 },
    xpBonus: 100,
    ordem: 2,
  },
  {
    codigo: "incansavel",
    nome: "Incansável",
    descricao: "Complete 50 provas",
    icone: "🥇",
    categoria: "PROVAS" as CategoriaConquista,
    condicao: { tipo: "provas_total", valor: 50 },
    xpBonus: 200,
    ordem: 3,
  },
  {
    codigo: "veterano",
    nome: "Veterano",
    descricao: "Complete 100 provas",
    icone: "💎",
    categoria: "PROVAS" as CategoriaConquista,
    condicao: { tipo: "provas_total", valor: 100 },
    xpBonus: 500,
    ordem: 4,
  },
  {
    codigo: "lendario",
    nome: "Lendário",
    descricao: "Complete 500 provas",
    icone: "👑",
    categoria: "PROVAS" as CategoriaConquista,
    condicao: { tipo: "provas_total", valor: 500 },
    xpBonus: 1000,
    ordem: 5,
  },
  // CATEGORIA: NOTAS
  {
    codigo: "aprovado",
    nome: "Aprovado!",
    descricao: "Seja aprovado em uma prova",
    icone: "⭐",
    categoria: "NOTAS" as CategoriaConquista,
    condicao: { tipo: "aprovacoes_total", valor: 1 },
    xpBonus: 50,
    ordem: 6,
  },
  {
    codigo: "destaque",
    nome: "Destaque",
    descricao: "Tire nota acima de 90%",
    icone: "🌟",
    categoria: "NOTAS" as CategoriaConquista,
    condicao: { tipo: "nota_minima", valor: 90 },
    xpBonus: 100,
    ordem: 7,
  },
  {
    codigo: "perfeito",
    nome: "Perfeição",
    descricao: "Tire 100% em uma prova",
    icone: "🏆",
    categoria: "NOTAS" as CategoriaConquista,
    condicao: { tipo: "nota_minima", valor: 100 },
    xpBonus: 200,
    ordem: 8,
  },
  {
    codigo: "consistente",
    nome: "Consistente",
    descricao: "5 aprovações seguidas",
    icone: "💯",
    categoria: "NOTAS" as CategoriaConquista,
    condicao: { tipo: "aprovacoes_seguidas", valor: 5 },
    xpBonus: 150,
    ordem: 9,
  },
  {
    codigo: "imparavel",
    nome: "Imparável",
    descricao: "10 aprovações seguidas",
    icone: "🔥",
    categoria: "NOTAS" as CategoriaConquista,
    condicao: { tipo: "aprovacoes_seguidas", valor: 10 },
    xpBonus: 300,
    ordem: 10,
  },
  // CATEGORIA: STREAKS
  {
    codigo: "focado",
    nome: "Focado",
    descricao: "3 dias seguidos estudando",
    icone: "🔥",
    categoria: "STREAKS" as CategoriaConquista,
    condicao: { tipo: "streak_dias", valor: 3 },
    xpBonus: 50,
    ordem: 11,
  },
  {
    codigo: "dedicado",
    nome: "Dedicado",
    descricao: "7 dias seguidos estudando",
    icone: "🔥🔥",
    categoria: "STREAKS" as CategoriaConquista,
    condicao: { tipo: "streak_dias", valor: 7 },
    xpBonus: 100,
    ordem: 12,
  },
  {
    codigo: "comprometido",
    nome: "Comprometido",
    descricao: "30 dias seguidos estudando",
    icone: "🔥🔥🔥",
    categoria: "STREAKS" as CategoriaConquista,
    condicao: { tipo: "streak_dias", valor: 30 },
    xpBonus: 500,
    ordem: 13,
  },
  {
    codigo: "relampago",
    nome: "Relâmpago",
    descricao: "100 dias seguidos estudando",
    icone: "⚡",
    categoria: "STREAKS" as CategoriaConquista,
    condicao: { tipo: "streak_dias", valor: 100 },
    xpBonus: 1000,
    ordem: 14,
  },
  // CATEGORIA: ESPECIAIS
  {
    codigo: "coruja",
    nome: "Coruja",
    descricao: "Faça prova após meia-noite",
    icone: "🦉",
    categoria: "ESPECIAIS" as CategoriaConquista,
    condicao: { tipo: "horario", valor: "noturno" },
    xpBonus: 30,
    ordem: 15,
  },
  {
    codigo: "madrugador",
    nome: "Madrugador",
    descricao: "Faça prova antes das 7h",
    icone: "🌅",
    categoria: "ESPECIAIS" as CategoriaConquista,
    condicao: { tipo: "horario", valor: "madrugada" },
    xpBonus: 30,
    ordem: 16,
  },
  {
    codigo: "veloz",
    nome: "Veloz",
    descricao: "Complete prova em <50% do tempo",
    icone: "⚡",
    categoria: "ESPECIAIS" as CategoriaConquista,
    condicao: { tipo: "tempo_percentual", valor: 50 },
    xpBonus: 50,
    ordem: 17,
  },
  {
    codigo: "sniper",
    nome: "Sniper",
    descricao: "Acerte 20 questões seguidas",
    icone: "🎯",
    categoria: "ESPECIAIS" as CategoriaConquista,
    condicao: { tipo: "acertos_seguidos", valor: 20 },
    xpBonus: 100,
    ordem: 18,
  },
  {
    codigo: "explorador",
    nome: "Explorador",
    descricao: "Faça provas de 5 categorias diferentes",
    icone: "📚",
    categoria: "ESPECIAIS" as CategoriaConquista,
    condicao: { tipo: "categorias_diferentes", valor: 5 },
    xpBonus: 150,
    ordem: 19,
  },
];

async function main() {
  console.log("🌱 Iniciando seed...");

  // Limpar dados existentes
  await prisma.userConquista.deleteMany();
  await prisma.conquista.deleteMany();
  await prisma.userGamification.deleteMany();
  await prisma.provaQuestao.deleteMany();
  await prisma.prova.deleteMany();
  await prisma.alternativa.deleteMany();
  await prisma.questao.deleteMany();
  await prisma.simulado.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Dados anteriores removidos");

  // Criar conquistas
  for (const conquista of CONQUISTAS) {
    await prisma.conquista.create({
      data: conquista,
    });
  }
  console.log(`🏆 ${CONQUISTAS.length} conquistas criadas`);

  // Criar usuário docente
  const senhaHash = await hash("123456", 12);

  const docente = await prisma.user.create({
    data: {
      nome: "Professor Teste",
      email: "docente@simulab.com",
      senha: senhaHash,
      role: "DOCENTE",
    },
  });
  console.log("👨‍🏫 Docente criado:", docente.email);

  // Criar usuário aluno
  const aluno = await prisma.user.create({
    data: {
      nome: "Aluno Teste",
      email: "aluno@simulab.com",
      senha: senhaHash,
      role: "ALUNO",
    },
  });
  console.log("👨‍🎓 Aluno criado:", aluno.email);

  // Criar superadmin
  const admin = await prisma.user.create({
    data: {
      nome: "Administrador",
      email: "admin@simulab.com",
      senha: senhaHash,
      role: "SUPERADMIN",
    },
  });
  console.log("👑 Admin criado:", admin.email);

  // Criar Simulado CCNA
  const simuladoCCNA = await prisma.simulado.create({
    data: {
      nome: "CCNA 200-301",
      descricao: "Simulado completo para certificação Cisco CCNA 200-301. Aborda todos os tópicos do exame oficial.",
      categoria: "CISCO",
      subcategoria: "CCNA",
      status: "ATIVO",
      docenteId: docente.id,
    },
  });
  console.log("📚 Simulado CCNA criado");

  // Criar questões CCNA
  const questoesCCNA = [
    {
      enunciado: "Qual é a camada do modelo OSI responsável pelo endereçamento lógico e roteamento?",
      explicacao: "A camada de Rede (Layer 3) é responsável pelo endereçamento IP e roteamento de pacotes entre redes diferentes.",
      dificuldade: "FACIL" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "Camada de Enlace", correta: false },
        { texto: "Camada de Rede", correta: true },
        { texto: "Camada de Transporte", correta: false },
        { texto: "Camada de Aplicação", correta: false },
      ],
    },
    {
      enunciado: "Qual protocolo opera na camada de transporte e fornece entrega confiável de dados?",
      explicacao: "O TCP (Transmission Control Protocol) é um protocolo orientado à conexão que garante a entrega ordenada e confiável dos dados.",
      dificuldade: "FACIL" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "UDP", correta: false },
        { texto: "IP", correta: false },
        { texto: "TCP", correta: true },
        { texto: "ICMP", correta: false },
      ],
    },
    {
      enunciado: "Qual é o endereço de broadcast da rede 192.168.1.0/24?",
      explicacao: "Em uma rede /24, o último endereço (255) é sempre o endereço de broadcast.",
      dificuldade: "FACIL" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "192.168.1.0", correta: false },
        { texto: "192.168.1.1", correta: false },
        { texto: "192.168.1.254", correta: false },
        { texto: "192.168.1.255", correta: true },
      ],
    },
    {
      enunciado: "Qual comando é usado para exibir a tabela de roteamento em um roteador Cisco?",
      explicacao: "O comando 'show ip route' exibe a tabela de roteamento com todas as rotas conhecidas pelo roteador.",
      dificuldade: "MEDIO" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "show routing table", correta: false },
        { texto: "show ip route", correta: true },
        { texto: "display routes", correta: false },
        { texto: "get ip routes", correta: false },
      ],
    },
    {
      enunciado: "Qual é a máscara de sub-rede para um prefixo /26?",
      explicacao: "Um prefixo /26 significa 26 bits para rede, resultando em 255.255.255.192 (192 = 11000000 em binário).",
      dificuldade: "MEDIO" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "255.255.255.128", correta: false },
        { texto: "255.255.255.192", correta: true },
        { texto: "255.255.255.224", correta: false },
        { texto: "255.255.255.240", correta: false },
      ],
    },
    {
      enunciado: "Em qual modo do IOS Cisco você pode fazer alterações na configuração de interfaces?",
      explicacao: "O modo de configuração global (config) permite acessar submodos como o de interface para configurar interfaces.",
      dificuldade: "MEDIO" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "Modo EXEC usuário", correta: false },
        { texto: "Modo EXEC privilegiado", correta: false },
        { texto: "Modo de configuração global", correta: true },
        { texto: "Modo ROM", correta: false },
      ],
    },
    {
      enunciado: "Qual protocolo de roteamento usa o algoritmo Dijkstra para calcular o melhor caminho?",
      explicacao: "OSPF (Open Shortest Path First) é um protocolo de estado de enlace que usa o algoritmo SPF (Shortest Path First) de Dijkstra.",
      dificuldade: "DIFICIL" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "RIP", correta: false },
        { texto: "EIGRP", correta: false },
        { texto: "OSPF", correta: true },
        { texto: "BGP", correta: false },
      ],
    },
    {
      enunciado: "Qual é o valor de AD (Administrative Distance) padrão para rotas OSPF?",
      explicacao: "O AD padrão do OSPF é 110. Quanto menor o AD, mais confiável é considerada a fonte da rota.",
      dificuldade: "DIFICIL" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "90", correta: false },
        { texto: "100", correta: false },
        { texto: "110", correta: true },
        { texto: "120", correta: false },
      ],
    },
    {
      enunciado: "Em uma configuração de VLAN trunk, qual protocolo de encapsulamento é padrão em switches Cisco modernos?",
      explicacao: "O 802.1Q é o protocolo padrão de encapsulamento de VLAN em switches Cisco modernos, substituindo o ISL proprietário.",
      dificuldade: "MEDIO" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "ISL", correta: false },
        { texto: "802.1Q", correta: true },
        { texto: "VTP", correta: false },
        { texto: "DTP", correta: false },
      ],
    },
    {
      enunciado: "Quantos endereços de host utilizáveis existem em uma sub-rede /28?",
      explicacao: "Uma sub-rede /28 tem 4 bits para hosts = 2^4 - 2 = 14 endereços utilizáveis (excluindo rede e broadcast).",
      dificuldade: "DIFICIL" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "14", correta: true },
        { texto: "16", correta: false },
        { texto: "30", correta: false },
        { texto: "62", correta: false },
      ],
    },
    {
      enunciado: "Quais são características do protocolo UDP? (Selecione todas que se aplicam)",
      explicacao: "UDP é não orientado à conexão, não garante entrega, tem baixa latência e não realiza controle de fluxo.",
      dificuldade: "MEDIO" as const,
      tipo: "MULTIPLA_ESCOLHA_MULTIPLA" as const,
      alternativas: [
        { texto: "Não orientado à conexão", correta: true },
        { texto: "Garante entrega de dados", correta: false },
        { texto: "Baixa latência", correta: true },
        { texto: "Realiza controle de fluxo", correta: false },
      ],
    },
    {
      enunciado: "Qual é a função principal do protocolo ARP?",
      explicacao: "O ARP (Address Resolution Protocol) mapeia endereços IP para endereços MAC na rede local.",
      dificuldade: "FACIL" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "Resolver nomes de domínio", correta: false },
        { texto: "Mapear IP para MAC", correta: true },
        { texto: "Atribuir endereços IP", correta: false },
        { texto: "Rotear pacotes", correta: false },
      ],
    },
  ];

  for (let i = 0; i < questoesCCNA.length; i++) {
    const q = questoesCCNA[i];
    await prisma.questao.create({
      data: {
        simuladoId: simuladoCCNA.id,
        enunciado: q.enunciado,
        explicacao: q.explicacao,
        dificuldade: q.dificuldade,
        tipo: q.tipo,
        ordem: i + 1,
        alternativas: {
          create: q.alternativas.map((alt, idx) => ({
            texto: alt.texto,
            correta: alt.correta,
            ordem: idx + 1,
          })),
        },
      },
    });
  }
  console.log(`✅ ${questoesCCNA.length} questões CCNA criadas`);

  // Criar Simulado AWS
  const simuladoAWS = await prisma.simulado.create({
    data: {
      nome: "AWS Solutions Architect Associate",
      descricao: "Simulado para certificação AWS Solutions Architect Associate (SAA-C03).",
      categoria: "AWS",
      subcategoria: "Solutions Architect",
      status: "ATIVO",
      docenteId: docente.id,
    },
  });
  console.log("📚 Simulado AWS criado");

  // Criar questões AWS
  const questoesAWS = [
    {
      enunciado: "Qual serviço AWS é usado para armazenamento de objetos escalável?",
      explicacao: "O Amazon S3 (Simple Storage Service) é o serviço de armazenamento de objetos da AWS, altamente escalável e durável.",
      dificuldade: "FACIL" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "Amazon EBS", correta: false },
        { texto: "Amazon S3", correta: true },
        { texto: "Amazon EFS", correta: false },
        { texto: "Amazon Glacier", correta: false },
      ],
    },
    {
      enunciado: "Qual é o número máximo de VPCs por região por padrão?",
      explicacao: "Por padrão, você pode ter até 5 VPCs por região, mas esse limite pode ser aumentado via solicitação.",
      dificuldade: "MEDIO" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "3", correta: false },
        { texto: "5", correta: true },
        { texto: "10", correta: false },
        { texto: "20", correta: false },
      ],
    },
    {
      enunciado: "Qual serviço AWS fornece um banco de dados relacional gerenciado?",
      explicacao: "O Amazon RDS (Relational Database Service) é um serviço gerenciado para bancos de dados relacionais.",
      dificuldade: "FACIL" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "Amazon DynamoDB", correta: false },
        { texto: "Amazon RDS", correta: true },
        { texto: "Amazon Redshift", correta: false },
        { texto: "Amazon ElastiCache", correta: false },
      ],
    },
    {
      enunciado: "Qual componente do AWS é responsável por distribuir tráfego entre instâncias EC2?",
      explicacao: "O Elastic Load Balancer (ELB) distribui automaticamente o tráfego de entrada entre múltiplas instâncias EC2.",
      dificuldade: "FACIL" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "Auto Scaling", correta: false },
        { texto: "Elastic Load Balancer", correta: true },
        { texto: "CloudFront", correta: false },
        { texto: "Route 53", correta: false },
      ],
    },
    {
      enunciado: "Qual classe de armazenamento S3 é mais adequada para dados acessados raramente mas que precisam de recuperação rápida?",
      explicacao: "S3 Standard-IA (Infrequent Access) é ideal para dados acessados raramente mas que precisam de acesso rápido quando necessário.",
      dificuldade: "MEDIO" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "S3 Standard", correta: false },
        { texto: "S3 Standard-IA", correta: true },
        { texto: "S3 Glacier", correta: false },
        { texto: "S3 One Zone-IA", correta: false },
      ],
    },
    {
      enunciado: "Qual serviço AWS permite executar código sem provisionar servidores?",
      explicacao: "AWS Lambda é um serviço serverless que executa código em resposta a eventos sem necessidade de gerenciar servidores.",
      dificuldade: "FACIL" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "Amazon EC2", correta: false },
        { texto: "AWS Lambda", correta: true },
        { texto: "Amazon ECS", correta: false },
        { texto: "AWS Batch", correta: false },
      ],
    },
    {
      enunciado: "Qual serviço AWS é usado para monitoramento e observabilidade de recursos?",
      explicacao: "O Amazon CloudWatch é o serviço de monitoramento da AWS, permitindo coletar métricas, logs e criar alarmes.",
      dificuldade: "MEDIO" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "AWS CloudTrail", correta: false },
        { texto: "Amazon CloudWatch", correta: true },
        { texto: "AWS Config", correta: false },
        { texto: "AWS X-Ray", correta: false },
      ],
    },
    {
      enunciado: "Qual é a durabilidade padrão do Amazon S3?",
      explicacao: "O Amazon S3 oferece durabilidade de 99.999999999% (11 noves), garantindo alta proteção contra perda de dados.",
      dificuldade: "MEDIO" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "99.9%", correta: false },
        { texto: "99.99%", correta: false },
        { texto: "99.999999999%", correta: true },
        { texto: "99.9999%", correta: false },
      ],
    },
    {
      enunciado: "Qual serviço AWS fornece CDN (Content Delivery Network)?",
      explicacao: "O Amazon CloudFront é o serviço de CDN da AWS, distribuindo conteúdo globalmente com baixa latência.",
      dificuldade: "FACIL" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "Amazon Route 53", correta: false },
        { texto: "Amazon CloudFront", correta: true },
        { texto: "AWS Global Accelerator", correta: false },
        { texto: "Amazon API Gateway", correta: false },
      ],
    },
    {
      enunciado: "Qual tipo de instância EC2 é otimizado para cargas de trabalho com uso intensivo de memória?",
      explicacao: "As instâncias da família R são otimizadas para memória, ideais para bancos de dados em memória e caches.",
      dificuldade: "DIFICIL" as const,
      tipo: "MULTIPLA_ESCOLHA_UNICA" as const,
      alternativas: [
        { texto: "Família C", correta: false },
        { texto: "Família R", correta: true },
        { texto: "Família T", correta: false },
        { texto: "Família M", correta: false },
      ],
    },
  ];

  for (let i = 0; i < questoesAWS.length; i++) {
    const q = questoesAWS[i];
    await prisma.questao.create({
      data: {
        simuladoId: simuladoAWS.id,
        enunciado: q.enunciado,
        explicacao: q.explicacao,
        dificuldade: q.dificuldade,
        tipo: q.tipo,
        ordem: i + 1,
        alternativas: {
          create: q.alternativas.map((alt, idx) => ({
            texto: alt.texto,
            correta: alt.correta,
            ordem: idx + 1,
          })),
        },
      },
    });
  }
  console.log(`✅ ${questoesAWS.length} questões AWS criadas`);

  // Criar uma prova de exemplo para o CCNA
  const prova = await prisma.prova.create({
    data: {
      simuladoId: simuladoCCNA.id,
      codigo: "CCNA-2026-001",
      nome: "CCNA 200-301 - Prova 1",
      status: "RASCUNHO",
      embaralharQuestoes: true,
      embaralharAlternativas: true,
    },
  });

  // Pegar as 5 primeiras questões do CCNA para a prova
  const questoesParaProva = await prisma.questao.findMany({
    where: { simuladoId: simuladoCCNA.id },
    take: 5,
    orderBy: { ordem: "asc" },
  });

  for (let i = 0; i < questoesParaProva.length; i++) {
    await prisma.provaQuestao.create({
      data: {
        provaId: prova.id,
        questaoId: questoesParaProva[i].id,
        ordem: i + 1,
      },
    });
  }
  console.log("📝 Prova de exemplo criada:", prova.codigo);

  console.log("\n✨ Seed concluído com sucesso!");
  console.log("\n📋 Credenciais de acesso:");
  console.log("┌─────────────────────────────────────────┐");
  console.log("│ Docente: docente@simulab.com / 123456   │");
  console.log("│ Aluno:   aluno@simulab.com / 123456     │");
  console.log("│ Admin:   admin@simulab.com / 123456     │");
  console.log("└─────────────────────────────────────────┘");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
