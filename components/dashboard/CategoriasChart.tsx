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

interface CategoriaData {
  categoria: string;
  taxaAcerto: number;
  totalQuestoes: number;
}

interface CategoriasChartProps {
  data: CategoriaData[];
  loading?: boolean;
}

const getBarColor = (value: number) => {
  if (value >= 70) return "hsl(142, 76%, 36%)"; // green
  if (value >= 50) return "hsl(45, 93%, 47%)"; // yellow
  return "hsl(0, 84%, 60%)"; // red
};

export function CategoriasChart({ data, loading = false }: CategoriasChartProps) {
  return (
    <ChartContainer
      title="Desempenho por Categoria"
      description="Taxa de acerto por certificação"
      loading={loading}
      height={300}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="categoria"
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as CategoriaData;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <p className="font-medium">{item.categoria}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.totalQuestoes} questões respondidas
                    </p>
                    <p className="mt-1 text-lg font-bold" style={{ color: getBarColor(item.taxaAcerto) }}>
                      {item.taxaAcerto}% de acerto
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="taxaAcerto" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.taxaAcerto)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
