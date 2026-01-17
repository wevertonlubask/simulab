"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartContainer } from "./ChartContainer";

interface TagData {
  tag: string;
  taxaAcerto: number;
  total: number;
}

interface RadarDesempenhoProps {
  data: TagData[];
  loading?: boolean;
}

export function RadarDesempenho({ data, loading = false }: RadarDesempenhoProps) {
  // Transform data for radar chart
  const radarData = data.map((item) => ({
    subject: item.tag.length > 12 ? item.tag.slice(0, 12) + "..." : item.tag,
    fullName: item.tag,
    A: item.taxaAcerto,
    total: item.total,
  }));

  return (
    <ChartContainer
      title="Pontos Fortes e Fracos"
      description="Desempenho por tópico"
      loading={loading}
      height={300}
    >
      {data.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">
            Responda mais questões para ver seu radar de desempenho
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid className="stroke-muted" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="font-medium">{item.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.total} questões respondidas
                      </p>
                      <p className="mt-1 text-lg font-bold text-primary">
                        {item.A}% de acerto
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Radar
              name="Taxa de Acerto"
              dataKey="A"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
}
