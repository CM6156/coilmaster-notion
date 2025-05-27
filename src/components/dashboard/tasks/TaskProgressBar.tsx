
import { cn } from "@/lib/utils";

interface TaskProgressBarProps {
  progress: number;
  status?: string;
  department?: string;
}

export function TaskProgressBar({ progress, status, department }: TaskProgressBarProps) {
  return (
    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full",
          status === 'completed' ? 'bg-green-500' :
          status === 'delayed' || status === 'on-hold' ? 'bg-red-500' :
          department ? `bg-department-${department}` : 'bg-blue-500'
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
