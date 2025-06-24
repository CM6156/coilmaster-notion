import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Task, Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";
import { useAppContext } from "@/context/AppContext";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Loader2, 
  User, 
  Briefcase, 
  Building2, 
  FileText,
  LinkIcon,
  Clock3,
  CheckCircle2,
  Edit,
  Save,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { toast } from "@/hooks/use-toast";
import { departmentColors, departmentTextColors, getDepartmentKoreanName } from "@/utils/departmentUtils";
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

interface TaskDetailsDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskDetailsDialog = ({
  task,
  open,
  onOpenChange,
}: TaskDetailsDialogProps) => {
  const { translations } = useLanguage();
  const { projects, tasks, updateTask, currentUser, getUserNameById } = useAppContext();
  
  // 로컬 상태로 현재 업무 정보 관리 (실시간 업데이트를 위해)
  const [currentTask, setCurrentTask] = useState(task);
  const [taskPhases, setTaskPhases] = useState<TaskPhase[]>([]);
  const [isEditingPhase, setIsEditingPhase] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(task.taskPhase || '');
  
  // task prop이 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setCurrentTask(task);
    setSelectedPhase(task.taskPhase || '');
  }, [task]);

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
    if (open) {
      loadTaskPhases();
    }
  }, [open]);

  // 업무 단계 정보 가져오기
  const getTaskPhaseInfo = (phaseId?: string) => {
    if (!phaseId) return { name: '단계 미지정', color: '#6b7280' };
    
    const phase = taskPhases.find(p => p.id === phaseId);
    return phase ? { name: phase.name, color: phase.color || '#3b82f6' } : { name: '단계 미지정', color: '#6b7280' };
  };

  // 업무 단계 변경 저장
  const handleSavePhase = async () => {
    try {
      await updateTask(currentTask.id, {
        taskPhase: selectedPhase
      });
      
      setCurrentTask(prev => ({
        ...prev,
        taskPhase: selectedPhase
      }));
      
      setIsEditingPhase(false);
      
      toast({
        title: "업무 단계 변경 완료",
        description: "업무 단계가 성공적으로 변경되었습니다.",
      });
    } catch (error) {
      console.error("Error updating task phase:", error);
      toast({
        title: "단계 변경 실패",
        description: "업무 단계 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // Translation objects
  const t = translations.taskDetails || {};
  const globalT = translations.global || {};
  
  // Get the project this task belongs to
  const project = projects.find(p => p.id === currentTask.projectId);

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
    
    if (diffDays < 0) return `${Math.abs(diffDays)}${t.daysOverdue || '일 지남'}`;
    if (diffDays === 0) return t.dueToday || '오늘 마감';
    return `${diffDays}${t.daysLeft || '일 남음'}`;
  };

  // 업무 담당자 권한 확인 - 모든 사용자가 사용 가능
  const canChangeTaskStatus = () => {
    // 모든 사용자가 업무 상태를 변경할 수 있음
    return true;
  };

  // 업무 상태 변경
  const handleTaskStatusChange = async (status: 'not-started' | 'in-progress' | 'completed') => {
    if (!canChangeTaskStatus()) return;
    
    let progress = 0;
    let taskStatus = status;
    
    switch (status) {
      case 'not-started':
        progress = 0;
        taskStatus = 'not-started';
        break;
      case 'in-progress':
        progress = 50;
        taskStatus = 'in-progress';
        break;
      case 'completed':
        progress = 100;
        taskStatus = 'completed';
        break;
    }
    
    // 로컬 상태 즉시 업데이트 (UI 즉시 반영)
    setCurrentTask(prev => ({
      ...prev,
      progress,
      status: taskStatus
    }));
    
    try {
      await updateTask(currentTask.id, {
        progress,
        status: taskStatus
      });
      
      const statusText = status === 'not-started' ? '예정' : status === 'in-progress' ? '진행' : '완료';
      const userName = currentUser?.name || '사용자';
      
      toast({
        title: "상태 변경 완료",
        description: `${userName}님이 "${currentTask.title}" 업무 상태를 ${statusText}으로 변경했습니다.`,
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      
      // 에러 발생 시 로컬 상태를 원래대로 롤백
      setCurrentTask(task);
      
      toast({
        title: "상태 변경 실패",
        description: "업무 상태 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* 업무 단계 배지 */}
                <div className="mb-2">
                  {isEditingPhase ? (
                    <div className="flex items-center gap-2">
                      <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="업무 단계 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {taskPhases.map((phase) => (
                            <SelectItem key={phase.id} value={phase.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: phase.color }}
                                />
                                {phase.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={handleSavePhase}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsEditingPhase(false);
                        setSelectedPhase(currentTask.taskPhase || '');
                      }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className="text-sm font-medium"
                        style={{ 
                          backgroundColor: `${getTaskPhaseInfo(currentTask.taskPhase).color}40`,
                          borderColor: getTaskPhaseInfo(currentTask.taskPhase).color,
                          color: getTaskPhaseInfo(currentTask.taskPhase).color,
                          fontWeight: 600
                        }}
                      >
                        📋 {getTaskPhaseInfo(currentTask.taskPhase).name}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setIsEditingPhase(true)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <DialogTitle className="text-xl">업무 상세 정보</DialogTitle>
                <DialogDescription>
                  {t.description || '업무 상세 정보를 확인하고 관리할 수 있습니다.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            {/* Status and progress */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {getStatusIcon(currentTask.status)}
                <span className="font-medium">{getStatusText(currentTask.status)}</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{currentTask.progress}%</div>
                <div className="text-sm text-gray-500">{t.completionRate || '하위 업무 진행율'}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  currentTask.status === 'completed' ? 'bg-green-500' :
                  currentTask.status === 'delayed' || currentTask.status === 'on-hold' ? 'bg-red-500' :
                  currentTask.status === 'in-progress' ? 'bg-blue-500' :
                  'bg-gray-400'
                )}
                style={{ width: `${currentTask.progress}%` }}
              />
            </div>
            
            {/* Task details */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Department */}
              <div className="space-y-1 border-l-2 border-gray-200 pl-3">
                <div className="text-sm text-gray-500">부서</div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-sm",
                    `bg-department-${currentTask.department}/10`,
                    departmentTextColors[currentTask.department]
                  )}>
                    {getDepartmentKoreanName(currentTask.department)}
                  </span>
                </div>
              </div>

              {/* Project */}
              <div className="space-y-1 border-l-2 border-gray-200 pl-3">
                <div className="text-sm text-gray-500">프로젝트</div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span>{project?.name || "-"}</span>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Assigned to */}
              <div className="space-y-1 border-l-2 border-gray-200 pl-3">
                <div className="text-sm text-gray-500">{t.assignedTo || '담당자'}</div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{getUserNameById(currentTask.assignedTo)}</span>
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1 border-l-2 border-gray-200 pl-3">
                <div className="text-sm text-gray-500">우선순위</div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    currentTask.priority === 'high' ? 'destructive' : 
                    currentTask.priority === 'medium' ? 'default' : 
                    'outline'
                  }>
                    {currentTask.priority === 'high' ? (t.priorityHigh || '높음') : 
                    currentTask.priority === 'medium' ? (t.priorityMedium || '중간') : (t.priorityLow || '낮음')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1 border-l-2 border-gray-200 pl-3">
                <div className="text-sm text-gray-500">{t.startDate || '시작일'}</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{currentTask.startDate}</span>
                </div>
              </div>

              <div className="space-y-1 border-l-2 border-gray-200 pl-3">
                <div className="text-sm text-gray-500">{t.dueDate || '마감일'}</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{currentTask.dueDate}</span>
                  {currentTask.status !== 'completed' && (
                    <span className={cn(
                      "text-sm",
                      currentTask.status === "on-hold" ? "text-red-500 font-medium" : 
                      new Date(currentTask.dueDate) < new Date() ? "text-red-500 font-medium" : "text-gray-500"
                    )}>
                      ({currentTask.status === "on-hold" ? (t.overdue || "기간경과") : getDaysRemaining(currentTask.dueDate)})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="text-sm text-gray-500 mb-2">{t.taskDescription || '업무 설명'}</div>
              <div 
                className="text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: currentTask.description || '설명이 없습니다.' }}
              />
              
              {/* 상태 변경 버튼들 - 등록자만 표시 */}
              {true && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant={currentTask.status === 'not-started' ? "default" : "outline"}
                      onClick={() => handleTaskStatusChange('not-started')}
                      className="flex items-center gap-2"
                    >
                      <Clock3 className="w-4 h-4" />
                      예정
                    </Button>
                    <Button
                      size="sm"
                      variant={currentTask.status === 'in-progress' ? "default" : "outline"}
                      onClick={() => handleTaskStatusChange('in-progress')}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="w-4 h-4" />
                      진행
                    </Button>
                    <Button
                      size="sm"
                      variant={currentTask.status === 'completed' ? "default" : "outline"}
                      onClick={() => handleTaskStatusChange('completed')}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      완료
                    </Button>
                  </div>
                  <p className="text-xs text-blue-600 text-center mt-2">
                    모든 사용자가 업무 진행 상태를 변경할 수 있습니다.
                  </p>
                </div>
              )}
            </div>

            {/* Documents */}
            {/* {currentTask.documents && currentTask.documents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div className="text-sm font-medium">{t.attachments || '첨부 자료'} ({currentTask.documents.length})</div>
                </div>
                <div className="grid gap-2">
                  {currentTask.documents.map((doc) => (
                    <div key={doc.id} className="text-sm flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="flex-1 truncate">{doc.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )} */}

            {/* Dependencies */}
            {/* {currentTask.dependencies && currentTask.dependencies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon className="h-4 w-4 text-gray-500" />
                  <div className="text-sm font-medium">{t.dependencies || '선행 업무'}</div>
                </div>
                <div className="grid gap-2">
                  {currentTask.dependencies.map((depId) => {
                    const depTask = tasks.find(t => t.id === depId);
                    return depTask ? (
                      <div key={depId} className="text-sm flex items-center gap-2 p-2 bg-gray-50 rounded">
                        {getStatusIcon(depTask.status)}
                        <span>{depTask.title}</span>
                        <Badge variant="outline" className="ml-auto">
                          {getStatusText(depTask.status)}
                        </Badge>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )} */}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskDetailsDialog;
