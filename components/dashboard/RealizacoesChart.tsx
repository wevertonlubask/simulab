"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer } from "./ChartContainer";

interface RealizacaoData {
  data: string;
  quantidade: number;
}

interface RealizacoesChartProps {
  data: RealizacaoData[];
  loading?: boolean;
}

export function RealizacoesChart({ data, loading = false }: RealizacoesChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <ChartContainer
      title="Provas Realizadas por Dia"
      description="Quantidade de provas finalizadas"
      loading={loading}
      height={300}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorQuantidade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="data"
            tickFormatter={formatDate}
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as RealizacaoData;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(item.data)}
                    </p>
                    <p className="mt-1 text-lg font-bold text-primary">
                      {item.quantidade} {item.quantidade === 1 ? "prova" : "provas"}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="quantidade"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorQuantidade)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
