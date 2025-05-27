import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Task, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StaffTimeChartProps {
  tasks: Task[];
  users: User[];
  title?: string;
}

const StaffTimeChart = ({ tasks = [], users, title = "직원 시간별 업무 현황" }: StaffTimeChartProps) => {
  // 시간대별 데이터 생성
  const timeData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}:00`,
    count: (Array.isArray(tasks) ? tasks : []).filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate.getHours() === hour;
    }).length
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="업무 수" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffTimeChart;
