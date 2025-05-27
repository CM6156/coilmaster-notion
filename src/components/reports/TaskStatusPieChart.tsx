
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

interface TaskStatusPieChartProps {
  tasksByStatusData: {
    name: string;
    value: number;
  }[];
  statusColors: string[];
}

// Enhanced status colors
const enhancedStatusColors = [
  "#e5e7eb", // 대기중 - Light gray
  "#3b82f6", // 진행중 - Blue
  "#10b981", // 완료 - Green
  "#ef4444", // 지연 - Red
];

export function TaskStatusPieChart({ tasksByStatusData }: TaskStatusPieChartProps) {
  // Custom tooltip content
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">{data.value}개 업무</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={tasksByStatusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => 
            percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : null
          }
        >
          {tasksByStatusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={enhancedStatusColors[index % enhancedStatusColors.length]} />
          ))}
        </Pie>
        <Tooltip content={renderCustomTooltip} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
