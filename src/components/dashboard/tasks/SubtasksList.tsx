
import React from "react";
import { Task } from "@/types";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";

interface SubtasksListProps {
  parentTaskId: string;
  subtasks: Task[];
}

export function SubtasksList({ parentTaskId, subtasks }: SubtasksListProps) {
  // Get status icon based on task status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "delayed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  // Filter subtasks for this specific parent
  const taskSubtasks = subtasks.filter(st => st.parentTaskId === parentTaskId);
  
  if (taskSubtasks.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pl-3 border-l-2 border-gray-200">
      <div className="text-xs text-gray-500 mb-1">하위 업무 ({taskSubtasks.length}개)</div>
      <div className="space-y-1">
        {taskSubtasks.slice(0, 2).map(subtask => (
          <div key={subtask.id} className="text-xs bg-gray-50 p-1.5 rounded flex items-center justify-between">
            <div className="flex items-center gap-1">
              {getStatusIcon(subtask.status)}
              <span className="line-clamp-1">{subtask.title}</span>
            </div>
            <span className="text-xs text-gray-500">{subtask.progress}%</span>
          </div>
        ))}
        {taskSubtasks.length > 2 && (
          <div className="text-xs text-gray-500 text-right pr-1">
            +{taskSubtasks.length - 2}개 더 있음
          </div>
        )}
      </div>
    </div>
  );
}
