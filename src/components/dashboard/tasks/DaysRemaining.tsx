import { cn } from "@/lib/utils";

interface DaysRemainingProps {
  dueDate: string;
  status?: string;
}

export function DaysRemaining({ dueDate, status }: DaysRemainingProps) {
  // Get appropriate style for the due date display based on status
  const getDueDateStyle = (dueDate: string, status?: string) => {
    if (status === "on-hold" || status === "delayed" || new Date(dueDate) < new Date()) {
      return "text-red-500 font-medium";
    }
    return "text-gray-600";
  };

  // Calculate days remaining
  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)}일 지남`;
    if (diffDays === 0) return '오늘 마감';
    return `${diffDays}일 남음`;
  };

  return (
    <span className={cn("text-xs whitespace-nowrap", getDueDateStyle(dueDate, status))}>
      {status === "on-hold" ? "기간경과" : getDaysRemaining(dueDate)}
    </span>
  );
}
