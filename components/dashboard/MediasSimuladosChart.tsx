"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartContainer } from "./ChartContainer";

interface MediaSimuladoData {
  simulado: string;
  media: number;
  totalProvas: number;
}

interface MediasSimuladosChartProps {
  data: MediaSimuladoData[];
  loading?: boolean;
}

const getBarColor = (value: number) => {
  if (value >= 70) return "hsl(142, 76%, 36%)"; // green
  return "hsl(0, 84%, 60%)"; // red
};

export function MediasSimuladosChart({ data, loading = false }: MediasSimuladosChartProps) {
  // Limit to top 10 and reverse for horizontal display
  const chartData = data.slice(0, 10);

  return (
    <ChartContainer
      title="Média de Notas por Simulado"
      description="Desempenho geral por simulado"
      loading={loading}
      height={300}
    >
      {chartData.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">
            Nenhum dado disponível para o período selecionado
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              type="category"
              dataKey="simulado"
              tick={{ fontSize: 11 }}
              width={120}
              className="text-muted-foreground"
              tickFormatter={(value) =>
                value.length > 18 ? value.slice(0, 18) + "..." : value
              }
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as MediaSimuladoData;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="font-medium">{item.simulado}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.totalProvas} provas realizadas
                      </p>
                      <p
                        className="mt-1 text-lg font-bold"
                        style={{ color: getBarColor(item.media) }}
                      >
                        Média: {item.media}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="media" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.media)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
}
