import React from "react";
import { Calendar, CheckCircle, Clock, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Department, Task } from "@/types";
import { departmentTextColors, getDepartmentKoreanName } from "@/utils/departmentUtils";
import { useState, useEffect } from "react";
import TaskDetailsDialog from "./TaskDetailsDialog";
import { useAppContext } from "@/context/AppContext";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

// 업무 단계 타입 정의
interface TaskPhase {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [taskPhases, setTaskPhases] = useState<TaskPhase[]>([]);
  const { managers } = useAppContext();
  
  // 업무 단계 로드
  const loadTaskPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('task_phases')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setTaskPhases(data || []);
    } catch (error) {
      console.error('업무 단계 로드 오류:', error);
    }
  };

  // 컴포넌트 마운트 시 업무 단계 로드
  useEffect(() => {
    loadTaskPhases();
  }, []);

  // 업무 단계 정보 가져오기
  const getTaskPhaseInfo = () => {
    if (!task.taskPhase) return { name: '단계 미지정', color: '#6b7280' };
    
    const phase = taskPhases.find(p => p.id === task.taskPhase);
    return phase ? { name: phase.name, color: phase.color || '#3b82f6' } : { name: '단계 미지정', color: '#6b7280' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Loader2 className="h-4 w-4 text-blue-500" />;
      case 'delayed': case 'on-hold': return <Clock className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'in-progress': return '진행중';
      case 'delayed': case 'on-hold': return '지연';
      case 'not-started': return '미시작';
      default: return status;
    }
  };
  
  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)}일 지남`;
    if (diffDays === 0) return '오늘 마감';
    return `${diffDays}일 남음`;
  };

  // 담당자 이름 가져오기
  const getAssignedPersonName = () => {
    if (!task.assignedTo) return '미지정';
    const assignedManager = managers.find(m => m.id === task.assignedTo);
    return assignedManager ? assignedManager.name : '미지정';
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'MM.dd', { locale: ko });
    } catch {
      return dateString;
    }
  };
  
  return (
    <>
      <Card className="p-4 hover:shadow transition-shadow duration-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className={cn("flex-1 flex border-l-4 pl-4", `border-department-${task.department}`)}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {/* 업무 단계 배지 */}
                <Badge 
                  variant="outline" 
                  className="text-sm font-medium"
                  style={{ 
                    backgroundColor: `${getTaskPhaseInfo().color}20`,
                    borderColor: getTaskPhaseInfo().color,
                    color: getTaskPhaseInfo().color
                  }}
                >
                  📋 {getTaskPhaseInfo().name}
                </Badge>
                
                {/* 상태 아이콘 */}
                <div className="flex items-center gap-1 text-sm">
                  {getStatusIcon(task.status)}
                  <span>{getStatusText(task.status)}</span>
                </div>
              </div>
              
              <p className="text-gray-600 mt-1 line-clamp-2">{task.description}</p>
              
              <div className="flex flex-wrap items-center mt-3 gap-x-4 gap-y-2 text-sm text-gray-500">
                <div className={cn("px-2 py-1 rounded-full", 
                  `bg-department-${task.department}/10`,
                  departmentTextColors[task.department as keyof typeof departmentTextColors]
                )}>
                  {task.department || '부서 없음'}
                </div>

                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{getAssignedPersonName()}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(task.startDate)} ~ {formatDate(task.dueDate)}</span>
                </div>
                
                <div>
                  {task.status !== 'completed' && (
                    <span className={cn(
                      "text-sm",
                      new Date(task.dueDate) < new Date() ? "text-red-500 font-medium" : "text-gray-500"
                    )}>
                      {getDaysRemaining(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end justify-between">
              <div className="text-right mb-2">
                <div className="text-2xl font-bold">{task.progress}%</div>
                <div className="text-sm text-gray-500">하위 업무 진행율</div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsDetailOpen(true)}
              >
                상세보기
              </Button>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                task.status === 'completed' ? 'bg-green-500' :
                task.status === 'delayed' || task.status === 'on-hold' ? 'bg-red-500' :
                task.status === 'in-progress' ? 'bg-blue-500' :
                'bg-gray-400'
              )}
              style={{ 
                width: `${task.progress}%`,
                minWidth: task.progress > 0 ? '6px' : '0' // 최소 너비 보장
              }}
            />
          </div>
          {/* 디버깅용 - 나중에 제거 가능 */}
          <div className="text-xs text-gray-400 mt-1">
            진행률: {task.progress}%, 상태: {task.status}
          </div>
        </div>
      </Card>
      
      {/* Task Details Dialog */}
      <TaskDetailsDialog 
        task={task}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  );
};

export default TaskCard;
