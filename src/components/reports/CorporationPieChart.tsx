
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

interface ChartData {
  name: string;
  value: number;
  corporation: string;
}

interface CorporationPieChartProps {
  chartData: ChartData[];
  label: string;
  suffix?: string;
}

// Enhanced corporation colors with more vibrant colors
const corporationColors: Record<string, string> = {
  "본사": "#4f46e5",       // indigo-600
  "서울지사": "#10b981",   // emerald-500
  "부산지사": "#f59e0b",   // amber-500
  "대구지사": "#ef4444",   // red-500
  "인천지사": "#8b5cf6",   // violet-500
  "광주지사": "#ec4899",   // pink-500
  "대전지사": "#6366f1",   // indigo-500
  "울산지사": "#14b8a6",   // teal-500
};

// 기본 색상 (법인이 위 목록에 없을 경우)
const defaultColors = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
  "#ec4899", "#6366f1", "#14b8a6", "#0ea5e9", "#84cc16"
];

export function CorporationPieChart({ chartData, label, suffix = "" }: CorporationPieChartProps) {
  const getColor = (corporation: string, index: number) => {
    return corporationColors[corporation] || defaultColors[index % defaultColors.length];
  };

  const renderTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const { name, value } = props.payload[0].payload;
      return (
        <div className="bg-white p-2 border shadow-sm rounded">
          <p className="font-medium">{name}</p>
          <p className="text-sm text-slate-600">
            {label}: <span className="font-medium">{value}{suffix}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={90}
          fill="#8884d8"
          dataKey="value"
          label={({ name, value }) => `${name}: ${value}${suffix}`}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={getColor(entry.corporation, index)} 
            />
          ))}
        </Pie>
        <Tooltip content={renderTooltip} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
