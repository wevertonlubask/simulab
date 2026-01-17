"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  GraduationCap,
  Trophy,
  History,
  X,
} from "lucide-react";
import type { Role } from "@prisma/client";

interface MobileSidebarProps {
  role: Role;
  open: boolean;
  onClose: () => void;
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
    title: "Questões",
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

export function MobileSidebar({ role, open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  const navItems =
    role === "DOCENTE" || role === "SUPERADMIN"
      ? docenteNavItems
      : alunoNavItems;

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="fixed left-0 top-0 h-full w-72 translate-x-0 translate-y-0 rounded-none border-r p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-72">
        <DialogHeader className="flex h-16 flex-row items-center justify-between border-b px-4">
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">S</span>
            </div>
            <span className="text-xl font-bold text-primary">Simulab</span>
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
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

        <div className="p-2">
          <Link href={`/${role === "ALUNO" ? "aluno" : "docente"}/configuracoes`} onClick={onClose}>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Settings className="h-5 w-5" />
              Configurações
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
