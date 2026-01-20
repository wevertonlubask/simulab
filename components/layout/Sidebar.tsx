"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Trophy,
  History,
  Shield,
} from "lucide-react";
import type { Role } from "@prisma/client";

interface LogoConfig {
  logo_light: string | null;
  logo_dark: string | null;
  logo_favicon: string | null;
}

interface SidebarProps {
  role: Role;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const docenteNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/docente/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Simulados",
    href: "/docente/simulados",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: "Banco de Questões",
    href: "/docente/questoes",
    icon: <FileQuestion className="h-5 w-5" />,
  },
  {
    title: "Provas",
    href: "/docente/provas",
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    title: "Turmas",
    href: "/docente/turmas",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Relatórios",
    href: "/docente/relatorios",
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

const adminNavItem: NavItem = {
  title: "Administração",
  href: "/admin",
  icon: <Shield className="h-5 w-5" />,
};

const alunoNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/aluno/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Provas",
    href: "/aluno/provas",
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    title: "Turmas",
    href: "/aluno/turmas",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Ranking",
    href: "/aluno/ranking",
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    title: "Meu Progresso",
    href: "/aluno/progresso",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    title: "Estatísticas",
    href: "/aluno/estatisticas",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Histórico",
    href: "/aluno/historico",
    icon: <History className="h-5 w-5" />,
  },
  {
    title: "Conquistas",
    href: "/aluno/conquistas",
    icon: <GraduationCap className="h-5 w-5" />,
  },
];

export function Sidebar({ role, collapsed = false, onCollapsedChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [logos, setLogos] = useState<LogoConfig | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  // Carregar logos do sistema
  useEffect(() => {
    setMounted(true);
    async function loadLogos() {
      try {
        const response = await fetch("/api/admin/config/logo");
        if (response.ok) {
          const data = await response.json();
          setLogos(data);
        }
      } catch (error) {
        console.error("Erro ao carregar logos:", error);
      }
    }
    loadLogos();
  }, []);

  // Determinar qual logo usar baseado no tema
  const currentLogo = mounted
    ? resolvedTheme === "dark"
      ? logos?.logo_dark || logos?.logo_light
      : logos?.logo_light || logos?.logo_dark
    : null;

  const baseNavItems =
    role === "DOCENTE" || role === "SUPERADMIN"
      ? docenteNavItems
      : alunoNavItems;

  // Adicionar item de admin para SUPERADMIN
  const navItems = role === "SUPERADMIN"
    ? [...baseNavItems, adminNavItem]
    : baseNavItems;

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center px-3">
          {!isCollapsed && (
            <Link href="/" className="flex items-center justify-center w-full">
              {currentLogo ? (
                <Image
                  src={currentLogo}
                  alt="Logo"
                  width={200}
                  height={48}
                  className="object-contain w-full max-w-[200px] h-auto"
                  unoptimized
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <span className="text-lg font-bold text-primary-foreground">S</span>
                  </div>
                  <span className="text-xl font-bold text-primary">Simulab</span>
                </div>
              )}
            </Link>
          )}
          {isCollapsed && (
            <Link href="/" className="mx-auto">
              {currentLogo ? (
                <Image
                  src={currentLogo}
                  alt="Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="text-lg font-bold text-primary-foreground">S</span>
                </div>
              )}
            </Link>
          )}
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="icon"
                        className={cn(
                          "w-full",
                          isActive && "bg-primary/10 text-primary"
                        )}
                      >
                        {item.icon}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-primary/10 text-primary"
                  )}
                >
                  {item.icon}
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Settings & Collapse Toggle */}
        <div className="p-2 space-y-1">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/${role === "ALUNO" ? "aluno" : "docente"}/configuracoes`}>
                  <Button variant="ghost" size="icon" className="w-full">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Configurações</TooltipContent>
            </Tooltip>
          ) : (
            <Link href={`/${role === "ALUNO" ? "aluno" : "docente"}/configuracoes`}>
              <Button variant="ghost" className="w-full justify-start gap-3">
                <Settings className="h-5 w-5" />
                Configurações
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn("w-full", !isCollapsed && "justify-start gap-3")}
            onClick={handleToggleCollapse}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                Recolher
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
