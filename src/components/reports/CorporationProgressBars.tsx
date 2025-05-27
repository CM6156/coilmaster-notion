import { cn } from "@/lib/utils";

interface CorporationData {
  name: string;
  value: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  progressRate: number;
  corporation: string;
}

interface CorporationProgressBarsProps {
  corporationData: CorporationData;
}

// Enhanced corporation colors with more vibrant colors
const corporationColors: Record<string, string> = {
  "본사": "bg-indigo-600",      // indigo-600
  "서울지사": "bg-emerald-500", // emerald-500
  "부산지사": "bg-amber-500",   // amber-500
  "대구지사": "bg-red-500",     // red-500
  "인천지사": "bg-violet-500",  // violet-500
  "광주지사": "bg-pink-500",    // pink-500
  "대전지사": "bg-indigo-500",  // indigo-500
  "울산지사": "bg-teal-500",    // teal-500
};

// Enhanced status colors for progress bars
const getStatusColor = (rate: number) => {
  if (rate < 30) return "bg-red-500";
  if (rate < 70) return "bg-amber-500";
  return "bg-emerald-500";
};

export function CorporationProgressBars({ corporationData }: CorporationProgressBarsProps) {
  const corporationColor = corporationColors[corporationData.corporation] || "bg-gray-500";
  
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm">프로젝트 완료율</div>
          <div className="text-sm font-medium">{corporationData.completionRate}%</div>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full", 
              getStatusColor(corporationData.completionRate)
            )} 
            style={{ width: `${corporationData.completionRate}%` }} 
          />
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm">하위 업무 진행율</div>
          <div className="text-sm font-medium">{corporationData.progressRate}%</div>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full", 
              getStatusColor(corporationData.progressRate)
            )} 
            style={{ width: `${corporationData.progressRate}%` }} 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3 bg-slate-50 rounded-lg">
          <div className="text-xs text-slate-500">총 업무</div>
          <div className="text-lg font-medium">{corporationData.totalTasks}개</div>
        </div>
        
        <div className="p-3 bg-slate-50 rounded-lg">
          <div className="text-xs text-slate-500">완료된 업무</div>
          <div className="text-lg font-medium">{corporationData.completedTasks}개</div>
        </div>
      </div>
    </div>
  );
}
