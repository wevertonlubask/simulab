"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NivelBadge } from "./NivelBadge";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  posicao: number;
  userId: string;
  nome: string;
  avatar: string | null;
  xp: number;
  nivel: number;
  nomeNivel: string;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  className?: string;
}

function getPositionIcon(posicao: number) {
  switch (posicao) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return null;
  }
}

function getPositionClass(posicao: number) {
  switch (posicao) {
    case 1:
      return "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500";
    case 2:
      return "bg-gray-50 dark:bg-gray-800/50 border-l-4 border-gray-400";
    case 3:
      return "bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-600";
    default:
      return "";
  }
}

export function LeaderboardTable({
  entries,
  currentUserId,
  className,
}: LeaderboardTableProps) {
  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">#</TableHead>
            <TableHead>Jogador</TableHead>
            <TableHead className="text-center w-20">Nível</TableHead>
            <TableHead className="text-right w-24">XP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            const positionIcon = getPositionIcon(entry.posicao);
            const positionClass = getPositionClass(entry.posicao);

            return (
              <TableRow
                key={entry.userId}
                className={cn(
                  positionClass,
                  isCurrentUser && "bg-primary/10 dark:bg-primary/20 font-semibold"
                )}
              >
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {positionIcon || (
                      <span className="text-muted-foreground">{entry.posicao}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.avatar || undefined} />
                      <AvatarFallback>
                        {entry.nome.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <span className={cn(isCurrentUser && "text-primary")}>
                        {entry.nome}
                      </span>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">
                          Você
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <NivelBadge nivel={entry.nivel} nome={entry.nomeNivel} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {entry.nivel}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {entry.xp.toLocaleString()}
                </TableCell>
              </TableRow>
            );
          })}
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                Nenhum jogador no ranking ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
