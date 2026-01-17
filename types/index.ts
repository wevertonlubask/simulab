export type {
  User,
  Simulado,
  Questao,
  Alternativa,
  Prova,
  ProvaQuestao,
  Turma,
  TurmaProva,
  TurmaAluno,
  Tentativa,
  Resposta,
} from "@prisma/client";

export {
  Role,
  StatusSimulado,
  TipoQuestao,
  Dificuldade,
  NotaConsiderada,
  MostrarResultado,
  StatusProva,
  StatusTentativa,
} from "@prisma/client";

// Categories for Simulados
export const CATEGORIAS = [
  {
    value: "cisco",
    label: "Cisco",
    subcategorias: ["CCNA", "CCNP", "CCIE", "CyberOps", "DevNet"],
  },
  {
    value: "aws",
    label: "AWS",
    subcategorias: [
      "Cloud Practitioner",
      "Solutions Architect Associate",
      "Solutions Architect Professional",
      "Developer Associate",
      "SysOps Administrator",
    ],
  },
  {
    value: "microsoft",
    label: "Microsoft",
    subcategorias: ["AZ-900", "AZ-104", "AZ-204", "AZ-305", "AZ-400", "MS-900"],
  },
  {
    value: "comptia",
    label: "CompTIA",
    subcategorias: ["A+", "Network+", "Security+", "Linux+", "Cloud+", "CySA+"],
  },
  {
    value: "linux",
    label: "Linux",
    subcategorias: ["LPIC-1", "LPIC-2", "LPIC-3", "RHCSA", "RHCE"],
  },
  {
    value: "google",
    label: "Google Cloud",
    subcategorias: [
      "Cloud Digital Leader",
      "Associate Cloud Engineer",
      "Professional Cloud Architect",
    ],
  },
  {
    value: "outros",
    label: "Outros",
    subcategorias: [],
  },
] as const;

export type Categoria = (typeof CATEGORIAS)[number]["value"];
