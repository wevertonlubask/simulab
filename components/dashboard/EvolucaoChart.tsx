"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChartContainer } from "./ChartContainer";

interface EvolucaoData {
  data: string;
  prova: string;
  nota: number;
}

interface EvolucaoChartProps {
  data: EvolucaoData[];
  loading?: boolean;
}

export function EvolucaoChart({ data, loading = false }: EvolucaoChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <ChartContainer
      title="Evolução das Notas"
      description="Suas últimas provas realizadas"
      loading={loading}
      height={300}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="data"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as EvolucaoData;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <p className="font-medium">{item.prova}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(item.data)}
                    </p>
                    <p className="mt-1 text-lg font-bold text-primary">
                      {item.nota}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine
            y={70}
            stroke="hsl(var(--destructive))"
            strokeDasharray="5 5"
            label={{
              value: "Mínimo (70%)",
              position: "insideBottomRight",
              fill: "hsl(var(--destructive))",
              fontSize: 11,
            }}
          />
          <Line
            type="monotone"
            dataKey="nota"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
