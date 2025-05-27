import { cn } from "@/lib/utils";

interface TaskStatusProgressBarsProps {
  tasksByStatusData: {
    name: string;
    value: number;
  }[];
  statusColors: string[];
  totalTasks: number;
}

// Enhanced status colors for progress bars
const enhancedStatusColors = [
  "bg-gradient-to-r from-gray-300 to-gray-400", // 대기중
  "bg-gradient-to-r from-blue-400 to-blue-500", // 진행중
  "bg-gradient-to-r from-green-400 to-green-500", // 완료
  "bg-gradient-to-r from-red-400 to-red-500", // 지연
];

export function TaskStatusProgressBars({ tasksByStatusData, totalTasks }: TaskStatusProgressBarsProps) {
  return (
    <div className="space-y-4">
      {tasksByStatusData.map((item, index) => (
        <div key={item.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className={cn(
                  "w-3 h-3 rounded-full mr-2",
                  enhancedStatusColors[index % enhancedStatusColors.length].replace("bg-gradient-to-r", "")
                  .split(" ")[1]
                )}
              />
              <span className="font-medium">{item.name}</span>
            </div>
            <span className="font-medium">{item.value}개</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-300",
                enhancedStatusColors[index % enhancedStatusColors.length]
              )}
              style={{ width: `${(item.value / totalTasks) * 100}%` }} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}
