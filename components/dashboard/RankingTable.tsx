"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, Trophy, Medal, Award } from "lucide-react";

interface AlunoRanking {
  posicao: number;
  id: string;
  nome: string;
  email: string;
  avatar: string | null;
  notaMedia: number;
  totalProvas: number;
  taxaAprovacao: number;
}

interface RankingTableProps {
  alunos: AlunoRanking[];
  total: number;
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onLimitChange: (limit: string) => void;
}

export function RankingTable({
  alunos,
  total,
  page,
  totalPages,
  loading = false,
  onPageChange,
  onSearch,
  onLimitChange,
}: RankingTableProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = () => {
    onSearch(searchValue);
  };

  const getPositionIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="font-bold text-muted-foreground">{posicao}º</span>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-20" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Ranking de Alunos</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
                className="pl-9"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button variant="outline" size="icon" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alunos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum aluno encontrado para o período selecionado
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pos.</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-center">Média</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Provas</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Aprovação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunos.map((aluno) => (
                    <TableRow
                      key={aluno.id}
                      className={
                        aluno.posicao <= 3
                          ? "bg-yellow-500/5"
                          : aluno.notaMedia < 50
                          ? "bg-red-500/5"
                          : ""
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-center">
                          {getPositionIcon(aluno.posicao)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={aluno.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(aluno.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{aluno.nome}</p>
                            <p className="text-xs text-muted-foreground truncate hidden sm:block">
                              {aluno.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={aluno.notaMedia >= 70 ? "default" : "destructive"}
                          className={
                            aluno.notaMedia >= 70
                              ? "bg-green-500 hover:bg-green-600"
                              : ""
                          }
                        >
                          {aluno.notaMedia}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        {aluno.totalProvas}
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        <span
                          className={
                            aluno.taxaAprovacao >= 70
                              ? "text-green-600"
                              : aluno.taxaAprovacao >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }
                        >
                          {aluno.taxaAprovacao}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mostrar:</span>
                <Select defaultValue="10" onValueChange={onLimitChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  de {total} alunos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
