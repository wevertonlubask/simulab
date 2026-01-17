/**
 * Integração com Google Classroom
 *
 * Para usar esta integração, é necessário:
 * 1. Criar um projeto no Google Cloud Console
 * 2. Ativar a Google Classroom API
 * 3. Configurar credenciais OAuth 2.0
 * 4. Adicionar as variáveis de ambiente:
 *    - GOOGLE_CLIENT_ID
 *    - GOOGLE_CLIENT_SECRET
 *    - GOOGLE_REDIRECT_URI
 */

export interface GoogleClassroomConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  ownerId: string;
  creationTime: string;
  updateTime: string;
  enrollmentCode?: string;
  courseState: "ACTIVE" | "ARCHIVED" | "PROVISIONED" | "DECLINED" | "SUSPENDED";
  alternateLink: string;
  teacherGroupEmail?: string;
  courseGroupEmail?: string;
  guardiansEnabled: boolean;
  calendarId?: string;
}

export interface GoogleStudent {
  courseId: string;
  userId: string;
  profile: {
    id: string;
    name: {
      givenName: string;
      familyName: string;
      fullName: string;
    };
    emailAddress: string;
    photoUrl?: string;
  };
}

export interface GoogleCoursework {
  courseId: string;
  id: string;
  title: string;
  description?: string;
  materials?: Array<{
    link?: { url: string; title?: string };
    driveFile?: { driveFile: { id: string; title: string } };
  }>;
  state: "PUBLISHED" | "DRAFT" | "DELETED";
  alternateLink: string;
  creationTime: string;
  updateTime: string;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours: number; minutes: number };
  scheduledTime?: string;
  maxPoints?: number;
  workType: "ASSIGNMENT" | "SHORT_ANSWER_QUESTION" | "MULTIPLE_CHOICE_QUESTION";
}

/**
 * Gera URL de autorização OAuth para Google Classroom
 */
export function getGoogleAuthUrl(config: GoogleClassroomConfig): string {
  const scopes = [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.rosters.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.students",
    "https://www.googleapis.com/auth/classroom.profile.emails",
  ];

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Troca código de autorização por tokens de acesso
 */
export async function exchangeCodeForTokens(
  code: string,
  config: GoogleClassroomConfig
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || "Erro ao trocar código por tokens");
  }

  return response.json();
}

/**
 * Atualiza token de acesso usando refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  config: GoogleClassroomConfig
): Promise<{
  access_token: string;
  expires_in: number;
  token_type: string;
}> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Erro ao atualizar token");
  }

  return response.json();
}

/**
 * Lista cursos do professor
 */
export async function listCourses(accessToken: string): Promise<GoogleCourse[]> {
  const response = await fetch(
    "https://classroom.googleapis.com/v1/courses?teacherId=me&courseStates=ACTIVE",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao listar cursos");
  }

  const data = await response.json();
  return data.courses || [];
}

/**
 * Lista alunos de um curso
 */
export async function listStudents(
  courseId: string,
  accessToken: string
): Promise<GoogleStudent[]> {
  const response = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/students`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao listar alunos");
  }

  const data = await response.json();
  return data.students || [];
}

/**
 * Cria um link para atividade no Classroom
 */
export async function createCourseworkLink(
  courseId: string,
  accessToken: string,
  options: {
    title: string;
    description?: string;
    linkUrl: string;
    maxPoints?: number;
    dueDate?: Date;
  }
): Promise<GoogleCoursework> {
  const body: Record<string, unknown> = {
    title: options.title,
    description: options.description,
    workType: "ASSIGNMENT",
    state: "PUBLISHED",
    materials: [
      {
        link: {
          url: options.linkUrl,
          title: options.title,
        },
      },
    ],
  };

  if (options.maxPoints) {
    body.maxPoints = options.maxPoints;
  }

  if (options.dueDate) {
    body.dueDate = {
      year: options.dueDate.getFullYear(),
      month: options.dueDate.getMonth() + 1,
      day: options.dueDate.getDate(),
    };
    body.dueTime = {
      hours: options.dueDate.getHours(),
      minutes: options.dueDate.getMinutes(),
    };
  }

  const response = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Erro ao criar atividade");
  }

  return response.json();
}

/**
 * Mapeia alunos do Google Classroom para formato interno
 */
export function mapGoogleStudentsToSimulab(
  students: GoogleStudent[]
): Array<{ nome: string; email: string }> {
  return students.map((s) => ({
    nome: s.profile.name.fullName,
    email: s.profile.emailAddress,
  }));
}
