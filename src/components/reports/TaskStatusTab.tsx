
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/types";
import { TaskStatusPieChart } from "./TaskStatusPieChart";
import { TaskStatusProgressBars } from "./TaskStatusProgressBars";

interface TaskStatusTabProps {
  tasksByStatusData: {
    name: string;
    value: number;
  }[];
  statusColors: string[];
  tasks: Task[];
}

export function TaskStatusTab({ tasksByStatusData, statusColors, tasks }: TaskStatusTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>업무 상태 분석</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-[300px]">
            <TaskStatusPieChart 
              tasksByStatusData={tasksByStatusData} 
              statusColors={statusColors} 
            />
          </div>
          
          <div>
            <h3 className="font-medium mb-4">상태별 업무 수</h3>
            <TaskStatusProgressBars 
              tasksByStatusData={tasksByStatusData} 
              statusColors={statusColors} 
              totalTasks={tasks.length} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
