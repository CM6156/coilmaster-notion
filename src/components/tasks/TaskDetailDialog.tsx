import React, { useState, useEffect } from 'react';
import { Task } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppContext } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { TaskStatusBadge } from '@/components/dashboard/tasks/TaskStatusBadge';
import { TaskEditDialog } from './TaskEditDialog';
import { TaskCompletionDialog } from './TaskCompletionDialog';
import { 
  Calendar, 
  User, 
  Building, 
  Flag, 
  Clock, 
  FileText,
  Edit3,
  Save,
  X,
  Play,
  CheckCircle,
  Pause,
  RotateCcw,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle2,
  FileIcon,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
}

export const TaskDetailDialog = ({ task, open, onOpenChange, onTaskUpdated }: TaskDetailDialogProps) => {
  const { users, managers, updateTask, deleteTask, getTaskStatuses, getPriorityStatuses, getUserById, getAssigneeNames, currentUser } = useAppContext();
  const { translations } = useLanguage();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [progressValue, setProgressValue] = useState<number[]>([0]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  
  useEffect(() => {
    if (task) {
      setProgressValue([task.progress || 0]);
    }
  }, [task]);

  if (!task) return null;

  // 담당자 정보 가져오기 (유틸리티 함수 사용)
  const assignee = getUserById(task.assignedTo);
  const assigneeNames = getAssigneeNames(task);

  // 권한 확인
  const userRole = currentUser?.role || 'user';
  const canDelete = userRole === 'admin' || userRole === 'manager';
  
  // 본인이 올린 업무인지 확인 (모든 사용자가 업무 상태를 변경할 수 있도록 수정)
  const isOwnTask = true; // 임시로 모든 사용자가 상태 변경 가능하도록 설정

  // 우선순위 정보 가져오기
  const priorityStatuses = getPriorityStatuses();
  const priorityStatus = priorityStatuses.find(p => p.name === task.priority);
  const translatedPriority = priorityStatus?.translationKey && translations.global?.[priorityStatus.translationKey]
    ? translations.global[priorityStatus.translationKey]
    : task.priority;

  // 상태 정보 가져오기
  const taskStatuses = getTaskStatuses();

  // 업무 삭제 함수
  const handleDeleteTask = async () => {
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      
      toast({
        title: "업무 삭제 완료",
        description: "업무가 성공적으로 삭제되었습니다.",
      });

      onTaskUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('업무 삭제 실패:', error);
      toast({
        title: "삭제 실패",
        description: "업무 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // 상태 변경 함수
  const handleStatusChange = async (newStatus: string) => {
    try {
      console.log("=== 상태 변경 시작 ===");
      console.log("현재 업무:", task);
      console.log("새로운 상태:", newStatus);
      
      const updatedTask = {
        ...task,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      
      console.log("업데이트할 업무 데이터:", updatedTask);
      
      await updateTask(task.id, updatedTask);
      
      console.log("상태 변경 완료 - updateTask 호출 성공");
      
      // 상태명 번역
      const statusObj = taskStatuses.find(s => s.name === newStatus);
      const translatedStatus = statusObj?.translationKey && translations.global?.[statusObj.translationKey]
        ? translations.global[statusObj.translationKey]
        : newStatus;
      
      toast({
        title: "상태 변경 완료",
        description: `업무 상태가 "${translatedStatus}"로 변경되었습니다.`,
      });

      console.log("onTaskUpdated 콜백 호출 중...");
      onTaskUpdated?.();
      console.log("=== 상태 변경 종료 ===");
    } catch (error) {
      console.error('=== 상태 변경 실패 ===');
      console.error('에러 상세:', error);
      toast({
        title: "변경 실패",
        description: "상태 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 현재 상태에 따른 가능한 상태 변경 버튼들
  const getStatusChangeButtons = () => {
    const currentStatus = task.status.toLowerCase();
    const buttons = [];

    if (currentStatus.includes('to do') || currentStatus.includes('시작') || currentStatus === 'not-started') {
      // 시작 전 상태 -> 진행중, 완료
      const inProgressStatus = taskStatuses.find(s => 
        s.name.toLowerCase().includes('progress') || 
        s.name.toLowerCase().includes('진행') ||
        s.name === 'In Progress'
      );
      const doneStatus = taskStatuses.find(s => 
        s.name.toLowerCase().includes('done') || 
        s.name.toLowerCase().includes('완료') ||
        s.name === 'Done'
      );

      if (inProgressStatus) {
        buttons.push({
          status: inProgressStatus.name,
          label: translations.global?.[inProgressStatus.translationKey] || '진행중',
          icon: Play,
          variant: 'default' as const,
          color: 'bg-blue-500 hover:bg-blue-600'
        });
      }

      if (doneStatus) {
        buttons.push({
          status: doneStatus.name,
          label: translations.global?.[doneStatus.translationKey] || '완료',
          icon: CheckCircle,
          variant: 'default' as const,
          color: 'bg-green-500 hover:bg-green-600'
        });
      }
    } 
    else if (currentStatus.includes('progress') || currentStatus.includes('진행')) {
      // 진행중 상태 -> 연기, 완료
      const doneStatus = taskStatuses.find(s => 
        s.name.toLowerCase().includes('done') || 
        s.name.toLowerCase().includes('완료') ||
        s.name === 'Done'
      );
      const delayedStatus = taskStatuses.find(s => 
        s.name.toLowerCase().includes('delay') || 
        s.name.toLowerCase().includes('연기') ||
        s.name.toLowerCase().includes('hold')
      );

      if (delayedStatus) {
        buttons.push({
          status: delayedStatus.name,
          label: translations.global?.[delayedStatus.translationKey] || '연기',
          icon: Pause,
          variant: 'outline' as const,
          color: 'bg-yellow-500 hover:bg-yellow-600'
        });
      }

      if (doneStatus) {
        buttons.push({
          status: doneStatus.name,
          label: translations.global?.[doneStatus.translationKey] || '완료',
          icon: CheckCircle,
          variant: 'default' as const,
          color: 'bg-green-500 hover:bg-green-600'
        });
      }
    }
    else if (currentStatus.includes('done') || currentStatus.includes('완료')) {
      // 완료 상태 -> 연기, 시작전
      const delayedStatus = taskStatuses.find(s => 
        s.name.toLowerCase().includes('delay') || 
        s.name.toLowerCase().includes('연기') ||
        s.name.toLowerCase().includes('hold')
      );
      const todoStatus = taskStatuses.find(s => 
        s.name.toLowerCase().includes('to do') || 
        s.name.toLowerCase().includes('시작') ||
        s.name === 'To Do'
      );

      if (delayedStatus) {
        buttons.push({
          status: delayedStatus.name,
          label: translations.global?.[delayedStatus.translationKey] || '연기',
          icon: Pause,
          variant: 'outline' as const,
          color: 'bg-yellow-500 hover:bg-yellow-600'
        });
      }

      if (todoStatus) {
        buttons.push({
          status: todoStatus.name,
          label: translations.global?.[todoStatus.translationKey] || '시작전',
          icon: RotateCcw,
          variant: 'outline' as const,
          color: 'bg-gray-500 hover:bg-gray-600'
        });
      }
    }
    else {
      // 기타 상태 (연기, 검토중 등) -> 진행중, 완료
      const inProgressStatus = taskStatuses.find(s => 
        s.name.toLowerCase().includes('progress') || 
        s.name.toLowerCase().includes('진행') ||
        s.name === 'In Progress'
      );
      const doneStatus = taskStatuses.find(s => 
        s.name.toLowerCase().includes('done') || 
        s.name.toLowerCase().includes('완료') ||
        s.name === 'Done'
      );

      if (inProgressStatus) {
        buttons.push({
          status: inProgressStatus.name,
          label: translations.global?.[inProgressStatus.translationKey] || '진행중',
          icon: Play,
          variant: 'default' as const,
          color: 'bg-blue-500 hover:bg-blue-600'
        });
      }

      if (doneStatus) {
        buttons.push({
          status: doneStatus.name,
          label: translations.global?.[doneStatus.translationKey] || '완료',
          icon: CheckCircle,
          variant: 'default' as const,
          color: 'bg-green-500 hover:bg-green-600'
        });
      }
    }

    return buttons;
  };

  const statusChangeButtons = getStatusChangeButtons();

  // 진행율 저장
  const handleSaveProgress = async () => {
    try {
      const updatedTask = {
        ...task,
        progress: progressValue[0]
      };
      
      await updateTask(task.id, updatedTask);
      setIsEditingProgress(false);
      
      toast({
        title: "진행율 업데이트 완료",
        description: `진행율이 ${progressValue[0]}%로 업데이트되었습니다.`,
      });

      onTaskUpdated?.();
    } catch (error) {
      console.error('진행율 업데이트 실패:', error);
      toast({
        title: "업데이트 실패",
        description: "진행율 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 우선순위 색상 가져오기
  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'default';
    return 'outline';
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                업무 상세정보
              </div>
              <div className="flex items-center gap-2">
                {/* 업무 완료 작성하기 버튼 - 완료되지 않은 업무에만 표시 */}
                {isOwnTask && !task.status.toLowerCase().includes('done') && !task.status.toLowerCase().includes('complete') && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setIsCompletionDialogOpen(true)}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    업무 완료 작성하기
                  </Button>
                )}
                
                {/* 상태 변경 버튼들 */}
                {isOwnTask && statusChangeButtons.length > 0 && (
                  <div className="flex items-center gap-2">
                    {statusChangeButtons.map((button, index) => {
                      const IconComponent = button.icon;
                      return (
                        <Button
                          key={index}
                          size="sm"
                          variant={button.variant}
                          className={`text-white ${button.color}`}
                          onClick={() => handleStatusChange(button.status)}
                        >
                          <IconComponent className="h-3 w-3 mr-1" />
                          {button.label}
                        </Button>
                      );
                    })}
                  </div>
                )}
                
                {/* 수정/삭제 드롭다운 메뉴 */}
                {isOwnTask && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                      {canDelete && (
                        <DropdownMenuItem 
                          onClick={() => setIsDeleteDialogOpen(true)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              업무의 상세 정보를 확인하고 관리할 수 있습니다.
              {isOwnTask && " 담당자로서 상태와 진행율을 변경할 수 있습니다."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 업무 제목 및 상태 */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold leading-tight">{task.title}</h2>
                <TaskStatusBadge status={task.status} />
              </div>
              {task.description && (
                <p className="text-muted-foreground">{task.description}</p>
              )}
            </div>

            <Separator />

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 담당자 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    담당자
                    {task.assignees && Array.isArray(task.assignees) && task.assignees.length > 1 && (
                      <Badge variant="outline" className="text-xs">
                        {task.assignees.length}명
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {(() => {
                    // 다중 담당자 표시 (우선순위)
                    if (task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0) {
                      return (
                        <div className="space-y-3">
                          {task.assignees.map((assignee, index) => (
                            <div key={assignee.id || index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="text-sm font-medium">
                                  {assignee.user_name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{assignee.user_name}</span>
                                  {assignee.is_primary && (
                                    <Badge variant="default" className="text-xs bg-blue-600 hover:bg-blue-700">
                                      주 담당자
                                    </Badge>
                                  )}
                                </div>
                                {assignee.user_email && (
                                  <span className="text-xs text-muted-foreground">{assignee.user_email}</span>
                                )}
                                {assignee.user_department && (
                                  <span className="text-xs text-muted-foreground">
                                    {assignee.user_department}
                                  </span>
                                )}
                              </div>
                              {assignee.assigned_at && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(assignee.assigned_at), 'MM/dd')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    } 
                    
                    // 기존 단일 담당자 표시 (하위 호환성)
                    if (assignee) {
                      return (
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={(assignee as any).avatar} />
                            <AvatarFallback className="text-sm font-medium">
                              {assignee.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <span className="font-medium text-sm">{assignee.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              담당자
                            </Badge>
                          </div>
                        </div>
                      );
                    }
                    
                    // 미할당 상태 표시
                    return (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm">
                            ?
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">{assigneeNames}</span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* 부서 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    부서
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="font-medium">{task.department || '미지정'}</span>
                </CardContent>
              </Card>

              {/* 우선순위 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    우선순위
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Badge variant={getPriorityColor(task.priority)}>
                    {translatedPriority}
                  </Badge>
                </CardContent>
              </Card>

              {/* 마감일 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    마감일
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="font-medium">
                    {format(new Date(task.dueDate), 'yyyy년 MM월 dd일', { locale: ko })}
                  </span>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* 진행율 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    진행율
                  </div>
                  {isOwnTask && (
                    <div className="flex items-center gap-2">
                      {isEditingProgress ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsEditingProgress(false);
                              setProgressValue([task.progress || 0]);
                            }}
                          >
                            <X className="h-3 w-3 mr-1" />
                            취소
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveProgress}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            저장
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingProgress(true)}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          수정
                        </Button>
                      )}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {isEditingProgress ? progressValue[0] : task.progress || 0}%
                    </span>
                    {!isOwnTask && (
                      <span className="text-xs text-muted-foreground">
                        (담당자만 수정 가능)
                      </span>
                    )}
                  </div>
                  
                  {isEditingProgress ? (
                    <div className="space-y-2">
                      <Slider
                        value={progressValue}
                        onValueChange={setProgressValue}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${task.progress || 0}%` }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* 생성 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">생성일:</span>{' '}
                {format(new Date(task.createdAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
              </div>
              <div>
                <span className="font-medium">수정일:</span>{' '}
                {format(new Date(task.updatedAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
              </div>
            </div>
            
            {/* 완료된 업무의 완료 내용 표시 */}
            {(task.status.toLowerCase().includes('done') || task.status.toLowerCase().includes('complete')) && 
             (task as any).completionContent && (
              <>
                <Separator />
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      완료 내용
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {/* 완료 내용 */}
                    <div>
                      <span className="font-medium text-sm">작업 내용:</span>
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                        {(task as any).completionContent}
                      </p>
                    </div>

                    {/* 첨부 파일 */}
                    {(task as any).completionFiles && (task as any).completionFiles.length > 0 && (
                      <div>
                        <span className="font-medium text-sm">첨부 파일:</span>
                        <div className="mt-2 space-y-2">
                          {(task as any).completionFiles.map((file: any) => (
                            <div key={file.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <FileIcon className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{file.size ? `${Math.round(file.size / 1024)}KB` : ''}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 관련 링크 */}
                    {(task as any).completionLinks && (task as any).completionLinks.length > 0 && (
                      <div>
                        <span className="font-medium text-sm">관련 링크:</span>
                        <div className="mt-2 space-y-2">
                          {(task as any).completionLinks.map((link: any) => (
                            <div key={link.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <ExternalLink className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-sm font-medium">{link.title}</p>
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  {link.url}
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 완료일 */}
                    {(task as any).completedAt && (
                      <div>
                        <span className="font-medium text-sm">완료일:</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date((task as any).completedAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isEditDialogOpen && (
        <TaskEditDialog
          task={task}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onTaskUpdated={onTaskUpdated}
        />
      )}

      {isCompletionDialogOpen && (
        <TaskCompletionDialog
          task={task}
          open={isCompletionDialogOpen}
          onOpenChange={setIsCompletionDialogOpen}
          onTaskCompleted={onTaskUpdated}
        />
      )}

      {isDeleteDialogOpen && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>업무 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                업무를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTask}>삭제</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};