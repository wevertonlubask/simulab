"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartContainer } from "./ChartContainer";

interface DistribuicaoData {
  faixa: string;
  quantidade: number;
  percentual: number;
  cor: string;
  [key: string]: string | number;
}

interface DistribuicaoChartProps {
  data: DistribuicaoData[];
  loading?: boolean;
}

export function DistribuicaoChart({ data, loading = false }: DistribuicaoChartProps) {
  const total = data.reduce((acc, d) => acc + d.quantidade, 0);

  return (
    <ChartContainer
      title="Distribuição de Notas"
      description="Faixas de desempenho dos alunos"
      loading={loading}
      height={300}
    >
      {total === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">
            Nenhum dado disponível para o período selecionado
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="quantidade"
              nameKey="faixa"
              label={({ payload }) => {
                const item = payload as DistribuicaoData | undefined;
                return item && item.percentual > 5 ? `${item.percentual}%` : "";
              }}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.cor} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DistribuicaoData;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.cor }}
                        />
                        <span className="font-medium">{item.faixa}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.quantidade} {item.quantidade === 1 ? "prova" : "provas"}
                      </p>
                      <p className="text-lg font-bold">{item.percentual}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => (
                <span className="text-sm text-muted-foreground">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
}
