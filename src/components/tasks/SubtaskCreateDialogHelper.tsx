
import { Task } from '@/types';
import { SubtaskCreateDialog } from './SubtaskCreateDialog';
import { useState, useEffect } from 'react';

interface SafeSubtaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentTask: Task;
}

export const SafeSubtaskCreateDialogWrapper = (props: SafeSubtaskCreateDialogProps) => {
  // Extract task number from title if it exists (e.g., "1. Task name" => "1")
  const getTaskNumber = (title: string) => {
    const match = title.match(/^(\d+)\./);
    return match ? match[1] : "";
  };

  // Calculate next subtask number
  const [nextSubtaskNumber, setNextSubtaskNumber] = useState(1);
  
  // Get the parent task number
  const parentNumber = getTaskNumber(props.parentTask.title) || "";
  
  useEffect(() => {
    // Calculate next subtask number based on existing subtasks
    if (props.parentTask.id) {
      // This would normally check existing subtasks in a database
      // For now, just increment by 1
      setNextSubtaskNumber(1);
    }
  }, [props.parentTask.id]);
  
  return (
    <SubtaskCreateDialog
      {...props}
      parentNumber={parentNumber}
      nextSubtaskNumber={nextSubtaskNumber}
      projectId={props.parentTask.projectId}
    />
  );
};
