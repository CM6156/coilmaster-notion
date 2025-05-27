
import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Cell } from "recharts";

interface ProjectProgressProps {
  projectProgressData: {
    name: string;
    progress: number;
  }[];
}

export function ProjectProgressChart({ projectProgressData }: ProjectProgressProps) {
  // Custom color for the progress bars - a nice gradient
  const getProgressBarColor = (progress: number) => {
    if (progress < 30) return "#f97316"; // orange for low progress
    if (progress < 70) return "#0EA5E9"; // blue for medium progress
    return "#10b981"; // green for high progress
  };
  
  // Custom tooltip
  const renderTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">진행률: {data.progress}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={projectProgressData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={renderTooltip} />
        <Legend />
        <Bar 
          dataKey="progress" 
          name="진행률 (%)" 
          radius={[4, 4, 0, 0]}
          barSize={30}
        >
          {projectProgressData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`}
              fill={getProgressBarColor(entry.progress)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
