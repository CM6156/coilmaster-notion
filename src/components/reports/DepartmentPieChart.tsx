
import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { Department } from "@/types";

interface DepartmentChartProps {
  tasksByDepartmentData: {
    name: string;
    value: number;
    department: string;
  }[];
}

// Enhanced department colors for charts
const chartDepartmentColors: Record<string, string> = {
  "sales": "#3b82f6",             // blue-500
  "development": "#10b981",       // emerald-500
  "manufacturing": "#f59e0b",     // amber-500
  "quality": "#8b5cf6",           // violet-500
  "finance": "#6366f1",           // indigo-500
  "administration": "#a855f7",    // purple-500
  "management": "#ec4899",        // pink-500
  "engineering": "#14b8a6",       // teal-500
  "rnd": "#8b5cf6",               // violet-500
  "production": "#f97316",        // orange-500
  "qa": "#ec4899",                // pink-500
};

export function DepartmentPieChart({ tasksByDepartmentData }: DepartmentChartProps) {
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
        {name}
      </text>
    ) : null;
  };

  // Custom formatter for tooltip
  const customTooltipFormatter = (value: number, name: string, entry: any) => {
    return [`${value}개 업무`, entry.payload.name];
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={tasksByDepartmentData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
        >
          {tasksByDepartmentData.map((entry, index) => {
            const color = chartDepartmentColors[entry.department] || '#CCCCCC';
            
            return (
              <Cell 
                key={`cell-${index}`} 
                fill={color}
              />
            );
          })}
        </Pie>
        <Tooltip formatter={customTooltipFormatter} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
