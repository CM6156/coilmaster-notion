import React from 'react';
import { Task, User } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskProgressBar } from './TaskProgressBar';
import { TaskStatusBadge } from './TaskStatusBadge';
import { DaysRemaining } from './DaysRemaining';
import { parseISO } from 'date-fns';
import { useLanguage } from '@/context/LanguageContext';
import { useAppContext } from '@/context/AppContext';

interface TaskCardProps {
  task: Task;
  users?: User[];
  onClick?: () => void;
}

export const TaskCard = ({ task, users = [], onClick }: TaskCardProps) => {
  const { managers, getUserById, getAssigneeNames } = useAppContext();
  const { translations } = useLanguage();
  const t = translations.dashboard;
  
  // 담당자 정보 가져오기 (유틸리티 함수 사용)
  const assignee = getUserById(task.assignedTo);
  const assigneeNames = getAssigneeNames(task);
  
  // 우선순위 번역
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return priority;
    }
  };
  
  return (
    <Card className="h-full cursor-pointer hover:border-primary/50 transition-colors" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-base">{task.title}</CardTitle>
            <CardDescription className="line-clamp-2">{task.description}</CardDescription>
          </div>
          <TaskStatusBadge status={task.status} />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="mt-2">
          <TaskProgressBar progress={task.progress} status={task.status} department={task.department} />
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex flex-wrap justify-between items-center w-full mt-2 gap-2">
          <div className="flex items-center">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={(assignee as any)?.avatar} />
              <AvatarFallback className="text-xs">
                {assigneeNames?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{assigneeNames}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={
              task.priority === 'high' ? "destructive" :
              task.priority === 'medium' ? "default" : "outline"
            } className="text-xs whitespace-nowrap">
              {getPriorityLabel(task.priority)}
            </Badge>
            <DaysRemaining dueDate={task.dueDate} status={task.status} />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
