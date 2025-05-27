import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/types";
import { DepartmentPieChart } from "./DepartmentPieChart";
import { DepartmentProgressBars } from "./DepartmentProgressBars";
import { useLanguage } from "@/context/LanguageContext";

interface DepartmentTabProps {
  tasksByDepartmentData: {
    name: string;
    value: number;
    department: string;
  }[];
  tasks: Task[];
}

export function DepartmentTab({ tasksByDepartmentData, tasks }: DepartmentTabProps) {
  const { translations } = useLanguage();
  const t = translations.dashboard;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t?.tasksByDepartment || "부서별 업무 분포"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-[300px]">
            <DepartmentPieChart tasksByDepartmentData={tasksByDepartmentData} />
          </div>
          
          <div>
            <h3 className="font-medium mb-4">{t?.tasksByDepartment || "부서별 업무 현황"}</h3>
            <DepartmentProgressBars 
              tasksByDepartmentData={tasksByDepartmentData} 
              totalTasks={tasks.length} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
