import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/types";
import { CorporationPieChart } from "./CorporationPieChart";
import { CorporationProgressBars } from "./CorporationProgressBars";

interface CorporationData {
  name: string;
  value: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  progressRate: number;
  corporation: string;
}

interface CorporationTabProps {
  corporationsData: CorporationData[];
  tasks: Task[];
}

export function CorporationTab({ corporationsData, tasks }: CorporationTabProps) {
  // 완료율 데이터
  const completionRateData = corporationsData.map(corp => ({
    name: corp.name,
    value: corp.completionRate,
    corporation: corp.corporation
  }));
  
  // 진행률 데이터
  const progressRateData = corporationsData.map(corp => ({
    name: corp.name,
    value: corp.progressRate,
    corporation: corp.corporation
  }));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>법인별 업무 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">법인별 프로젝트 완료율</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <CorporationPieChart chartData={completionRateData} label="프로젝트 완료율" suffix="%" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">법인별 하위 업무 진행율</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <CorporationPieChart chartData={progressRateData} label="하위 업무 진행율" suffix="%" />
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium mb-4">법인별 업무 현황</h3>
          <div className="space-y-6">
            {corporationsData.map((corp) => (
              <div key={corp.corporation} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{corp.name}</div>
                  <div className="text-sm text-slate-500">
                    총 업무: {corp.totalTasks} | 완료: {corp.completedTasks}
                  </div>
                </div>
                <CorporationProgressBars corporationData={corp} />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
