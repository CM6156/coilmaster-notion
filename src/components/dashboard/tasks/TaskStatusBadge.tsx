
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskStatusBadgeProps {
  status: string;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "완료";
      case "in-progress":
        return "진행중";
      case "delayed":
        return "지연";
      case "on-hold":
        return "보류";
      default:
        return status;
    }
  };

  // Get color for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-200";
      case "in-progress":
        return "bg-blue-500/10 text-blue-500 border-blue-200";
      case "delayed":
        return "bg-red-500/10 text-red-500 border-red-200";
      case "on-hold":
        return "bg-red-500/10 text-red-500 border-red-200";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-200";
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(getStatusColor(status))}
    >
      {getStatusText(status)}
    </Badge>
  );
}
