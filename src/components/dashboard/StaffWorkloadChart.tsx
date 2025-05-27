
// Update references from assigneeId to assignedTo
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Task, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StaffWorkloadChartProps {
  tasks: Task[];
  users: User[];
  title?: string;
}

export const StaffWorkloadChart = ({ tasks, users, title = "업무량 분포" }: StaffWorkloadChartProps) => {
  // Calculate workload per user
  const userWorkload = users.map((user) => {
    // Count tasks assigned to this user
    const assignedTasks = tasks.filter((task) => task.assignedTo === user.id);
    
    return {
      name: user.name,
      value: assignedTasks.length,
      user: user
    };
  });
  
  // Filter out users with no tasks
  const dataWithWorkload = userWorkload.filter(item => item.value > 0);
  
  // Calculate total tasks for percentage
  const totalTasks = tasks.length;
  
  // Generate colors for the chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  // If no data, show empty state
  if (dataWithWorkload.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">배정된 업무가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithWorkload}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {dataWithWorkload.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} 업무`, name]}
                labelFormatter={() => '업무 수'}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
