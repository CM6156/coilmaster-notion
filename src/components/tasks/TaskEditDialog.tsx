import React, { useState, useEffect } from 'react';
import { Task } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppContext } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from "sonner";
import { CalendarIcon, Clock, CheckCircle2, AlertCircle, Loader2, Save, X, FileText, User, Building, Flag, Target, Upload, File, Users, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/lib/supabase";
import { MultiSelect, Option } from "@/components/ui/multi-select";

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

interface TaskEditDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
}

export const TaskEditDialog = ({ task, open, onOpenChange, onTaskUpdated }: TaskEditDialogProps) => {
  const { 
    updateTask, 
    getTaskStatuses, 
    getPriorityStatuses, 
    departments, 
    users, 
    managers,
    projects,
    currentUser
  } = useAppContext();
  const { translations } = useLanguage();

  // 업무 단계 상태 추가
  const [taskPhases, setTaskPhases] = useState<TaskPhase[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 다중 담당자 상태 추가
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [primaryAssignee, setPrimaryAssignee] = useState<string>("");

  const [formData, setFormData] = useState({
    taskPhase: '', // 업무 단계 필드
    projectId: '',
    department: '',
    assignedTo: '',
    startDate: '',
    dueDate: '',
    priority: '',
    status: '',
    progress: 0
  });

  const [isLoading, setIsLoading] = useState(false);

  // 사용자 옵션 생성 (TaskCreateDialog와 동일)
  const userOptions: Option[] = React.useMemo(() => {
    console.log('👥 TaskEditDialog - 사용자 옵션 생성 시작');
    console.log('currentUser:', currentUser);
    console.log('managers:', managers);
    console.log('users:', users);
    
    const options: Option[] = [];
    
    // 현재 사용자 추가
    if (currentUser && currentUser.id) {
      console.log('✅ 현재 사용자 추가:', currentUser);
      options.push({
        label: `👤 ${currentUser.name} (본인)`,
        value: currentUser.id,
      });
    }
    
    // 매니저들 추가
    if (managers && Array.isArray(managers)) {
      console.log(`👔 매니저 ${managers.length}명 처리 중...`);
      managers
        .filter(manager => manager.id && manager.id !== currentUser?.id)
        .forEach(manager => {
          console.log('👔 매니저 추가:', manager);
          options.push({
            label: `${manager.name} (${manager.department?.name || '부서 정보 없음'})`,
            value: manager.id,
          });
        });
    }
    
    // 일반 사용자들 추가
    if (users && Array.isArray(users)) {
      console.log(`👤 일반 사용자 ${users.length}명 처리 중...`);
      users
        .filter(user => 
          user.id && 
          user.id !== currentUser?.id && 
          !managers?.some(m => m.id === user.id)
        )
        .forEach(user => {
          console.log('👤 일반 사용자 추가:', user);
          options.push({
            label: `${user.name} (${user.department || '부서 정보 없음'})`,
            value: user.id,
          });
        });
    }
    
    console.log('📋 최종 사용자 옵션:', options);
    return options;
  }, [currentUser, managers, users]);

  // 업무 단계 로드
  const loadTaskPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('task_phases')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        console.error('업무 단계 로드 오류:', error);
        return;
      }
      
      console.log('📋 업무 단계 로드 성공:', data);
      setTaskPhases(data || []);
    } catch (error) {
      console.error('업무 단계 로드 중 오류:', error);
    }
  };

  // 컴포넌트 마운트 시 업무 단계 로드
  useEffect(() => {
    if (open) {
      loadTaskPhases();
    }
  }, [open]);

  useEffect(() => {
    if (task && open) {
      console.log('🔄 TaskEditDialog - 업무 정보 로드:', task);
      
      setFormData({
        taskPhase: task.taskPhase || '', // 업무 단계
        projectId: task.projectId || '',
        department: task.department || '',
        assignedTo: task.assignedTo || '',
        startDate: task.startDate || '',
        dueDate: task.dueDate || '',
        priority: task.priority || '',
        status: task.status || '',
        progress: task.progress || 0
      });
      
      // 기존 담당자 정보 로드
      if (task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0) {
        console.log('✅ 다중 담당자 정보 로드:', task.assignees);
        const assigneeIds = task.assignees.map(assignee => assignee.user_id);
        const primary = task.assignees.find(assignee => assignee.is_primary);
        
        setSelectedAssignees(assigneeIds);
        setPrimaryAssignee(primary?.user_id || assigneeIds[0] || "");
      } else if (task.assignedTo && task.assignedTo !== 'unassigned') {
        console.log('⚠️ 기존 단일 담당자 정보 로드:', task.assignedTo);
        setSelectedAssignees([task.assignedTo]);
        setPrimaryAssignee(task.assignedTo);
      } else {
        console.log('❌ 담당자 정보 없음');
        setSelectedAssignees([]);
        setPrimaryAssignee("");
      }
      
      setUploadedFiles([]); // 파일 목록 초기화
    }
  }, [task, open]);

  const taskStatuses = getTaskStatuses();
  const priorityStatuses = getPriorityStatuses();

  // 파일 업로드 핸들러
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newFiles = Array.from(files);
      
      // 파일 크기 체크 (50MB 제한)
      const maxSize = 50 * 1024 * 1024; // 50MB
      const oversizedFiles = newFiles.filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        toast.error(`파일 크기가 50MB를 초과합니다: ${oversizedFiles.map(f => f.name).join(', ')}`);
        return;
      }

      // 기존 파일 목록에 추가
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      toast.success(`${newFiles.length}개 파일이 추가되었습니다.`);
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      toast.error('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 파일 제거 핸들러
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 실제 파일 업로드 (Supabase Storage)
  const uploadFilesToStorage = async (files: File[]) => {
    const uploadedFileUrls: string[] = [];
    
    for (const file of files) {
      try {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('project-files')
          .upload(fileName, file);

        if (error) {
          console.error('파일 업로드 오류:', error);
          continue;
        }

        // 공개 URL 생성
        const { data: urlData } = supabase.storage
          .from('project-files')
          .getPublicUrl(fileName);

        uploadedFileUrls.push(urlData.publicUrl);
      } catch (error) {
        console.error('파일 업로드 중 오류:', error);
      }
    }
    
    return uploadedFileUrls;
  };

  // 업무 담당자 추가/수정 함수
  const addTaskAssignees = async (taskId: string, assigneeIds: string[], primaryId: string) => {
    try {
      console.log('🔍 TaskEditDialog - 담당자 수정 요청:', { taskId, assigneeIds, primaryId });
      
      // 먼저 기존 담당자들을 삭제
      const { error: deleteError } = await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', taskId);
        
      if (deleteError) {
        console.error('기존 담당자 삭제 오류:', deleteError);
        // 테이블이 없는 경우 무시
        if (!deleteError.message?.includes('relation "public.task_assignees" does not exist')) {
          throw deleteError;
        }
      }
      
      // 새로운 담당자들 추가
      if (assigneeIds.length > 0) {
        // 먼저 user_profiles에 존재하는 사용자만 필터링
        const { data: validUsers, error: userCheckError } = await supabase
          .from('user_profiles')
          .select('id')
          .in('id', assigneeIds);
          
        if (userCheckError) {
          console.error('사용자 존재 확인 오류:', userCheckError);
          throw userCheckError;
        }
        
        const validUserIds = validUsers?.map(user => user.id) || [];
        console.log('✅ 유효한 사용자 ID들:', validUserIds);
        
        if (validUserIds.length === 0) {
          console.warn('⚠️ 유효한 담당자가 없습니다.');
          return;
        }
        
        // 주 담당자가 유효한 사용자 목록에 없으면 첫 번째 유효한 사용자로 설정
        const validPrimaryId = validUserIds.includes(primaryId) ? primaryId : validUserIds[0];
        
        // 담당자 데이터 준비 (유효한 사용자만)
        const assigneeData = validUserIds.map(userId => ({
          task_id: taskId,
          user_id: userId,
          is_primary: userId === validPrimaryId,
          assigned_by: currentUser?.id || userId,
        }));

        console.log('💾 담당자 추가 시도:', assigneeData);

        const { error } = await supabase
          .from('task_assignees')
          .insert(assigneeData);

        if (error) {
          console.error('담당자 추가 실패:', error);
          // task_assignees 테이블이 없는 경우 안내 메시지
          if (error.message?.includes('relation "public.task_assignees" does not exist')) {
            console.warn('⚠️ task_assignees 테이블이 존재하지 않습니다. SQL 스크립트를 먼저 실행해주세요.');
            return;
          }
          throw error;
        }

        console.log('✅ 담당자 수정 성공:', assigneeData);
      }
    } catch (error) {
      console.error('담당자 수정 중 오류:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    setIsLoading(true);
    try {
      let fileUrls: string[] = [];
      
      // 새로 업로드된 파일이 있으면 Storage에 업로드
      if (uploadedFiles.length > 0) {
        fileUrls = await uploadFilesToStorage(uploadedFiles);
      }

      // UUID 형식 검증 함수
      const isValidUUID = (uuid: string): boolean => {
        if (!uuid || uuid.trim() === '') return false;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      };

      // 안전한 담당자 ID 결정
      const getValidAssignedTo = (): string | null => {
        // 주 담당자가 유효한 UUID인지 확인
        if (primaryAssignee && isValidUUID(primaryAssignee)) {
          return primaryAssignee;
        }
        
        // 선택된 담당자 중 유효한 UUID 찾기
        const safeSelectedAssignees = Array.isArray(selectedAssignees) ? selectedAssignees : [];
        const validAssignee = safeSelectedAssignees.find(id => isValidUUID(id));
        if (validAssignee) {
          return validAssignee;
        }
        
        // 기존 task의 assignedTo가 유효한 UUID인지 확인
        if (task.assignedTo && isValidUUID(task.assignedTo)) {
          return task.assignedTo;
        }
        
        // 모든 검사에 실패하면 null 반환
        return null;
      };

      const validAssignedTo = getValidAssignedTo();
      console.log('🔍 TaskEditDialog - assignedTo 검증:', {
        primaryAssignee,
        selectedAssignees,
        originalAssignedTo: task.assignedTo,
        validAssignedTo,
        isValidUUID: validAssignedTo ? isValidUUID(validAssignedTo) : false
      });

      const updatedTask = {
        ...task,
        ...formData,
        // 유효한 UUID만 assignedTo에 설정, 그렇지 않으면 null
        assignedTo: validAssignedTo,
        // attachments 속성이 없으면 빈 배열로 초기화하고 새 파일 추가
        ...(fileUrls.length > 0 && { 
          attachments: [...((task as any).attachments || []), ...fileUrls] 
        }),
        updatedAt: new Date().toISOString()
      };

      console.log('💾 TaskEditDialog - 업데이트할 업무 데이터:', updatedTask);

      await updateTask(task.id, updatedTask);
      
      // 다중 담당자 정보 업데이트
      const safeSelectedAssignees = Array.isArray(selectedAssignees) ? selectedAssignees : [];
      const validAssignees = safeSelectedAssignees.filter(id => isValidUUID(id));
      
      if (validAssignees.length > 0) {
        const validPrimaryAssignee = primaryAssignee && isValidUUID(primaryAssignee) ? primaryAssignee : validAssignees[0];
        await addTaskAssignees(task.id, validAssignees, validPrimaryAssignee);
      }
      
      toast.success("업무가 수정되었습니다");
      onOpenChange(false);
      onTaskUpdated?.();
    } catch (error) {
      console.error("업무 수정 실패:", error);
      toast.error("업무 수정에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 담당자 변경 핸들러
  const handleAssigneesChange = (assigneeIds: string[]) => {
    const safeAssigneeIds = Array.isArray(assigneeIds) ? assigneeIds : [];
    setSelectedAssignees(safeAssigneeIds);
    
    // 주 담당자가 선택된 담당자 목록에 없으면 첫 번째 담당자를 주 담당자로 설정
    if (safeAssigneeIds.length > 0 && !safeAssigneeIds.includes(primaryAssignee)) {
      setPrimaryAssignee(safeAssigneeIds[0]);
    } else if (safeAssigneeIds.length === 0) {
      setPrimaryAssignee("");
    }
  };

  // 주 담당자 변경 핸들러
  const handlePrimaryAssigneeChange = (assigneeId: string) => {
    setPrimaryAssignee(assigneeId);
    
    // 주 담당자가 담당자 목록에 없으면 추가
    const safeSelectedAssignees = Array.isArray(selectedAssignees) ? selectedAssignees : [];
    if (!safeSelectedAssignees.includes(assigneeId)) {
      setSelectedAssignees([...safeSelectedAssignees, assigneeId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>업무 수정</DialogTitle>
          <DialogDescription>
            업무 정보를 수정하고 추가 문서를 업로드할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid gap-4 py-4">
            {/* 기본 정보 섹션 */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                📝 기본 정보
              </h3>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="taskPhase" className="text-right">
                  업무 단계 *
                </Label>
                <Select
                  value={formData.taskPhase}
                  onValueChange={(value) => handleInputChange('taskPhase', value)}
                  required
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="업무 단계 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskPhases
                      .filter(phase => phase.id && phase.id.trim() !== '') // 빈 ID 필터링
                      .map((phase) => (
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
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="projectId" className="text-right">
                프로젝트 *
              </Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => handleInputChange('projectId', value)}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {projects
                    .filter(project => project.id && project.id.trim() !== '') // 빈 ID 필터링
                    .map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                담당 부서 *
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleInputChange('department', value)}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  {departments
                    .filter(dept => dept.id && dept.id.trim() !== '') // 빈 ID 필터링
                    .map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 담당자 정보 섹션 */}
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Users className="h-4 w-4" />
                담당자 정보 (다중 선택 가능)
              </h3>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  담당자 선택
                </Label>
                <div className="col-span-3 space-y-3">
                  <MultiSelect
                    options={userOptions || []}
                    selected={selectedAssignees || []}
                    onChange={handleAssigneesChange}
                    placeholder="담당자를 선택하세요..."
                    className="w-full"
                  />
                  
                  {(selectedAssignees && selectedAssignees.length > 0) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">주 담당자 설정:</Label>
                      <Select
                        value={primaryAssignee}
                        onValueChange={handlePrimaryAssigneeChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="주 담당자 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedAssignees
                            .filter(assigneeId => assigneeId && assigneeId.trim() !== '') // 빈 ID 필터링
                            .map((assigneeId) => {
                              const option = userOptions.find(opt => opt.value === assigneeId);
                              return (
                                <SelectItem key={assigneeId} value={assigneeId}>
                                  {option?.label}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {(selectedAssignees && selectedAssignees.length > 0) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">선택된 담당자:</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedAssignees.map((assigneeId) => {
                          const option = userOptions.find(opt => opt.value === assigneeId);
                          const isPrimary = assigneeId === primaryAssignee;
                          return (
                            <Badge 
                              key={assigneeId} 
                              variant={isPrimary ? "default" : "secondary"}
                              className={isPrimary ? "bg-blue-600" : ""}
                            >
                              {option?.label}
                              {isPrimary && " (주 담당자)"}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">시작일 *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate ? new Date(formData.startDate) : undefined}
                    onSelect={(date) =>
                      handleInputChange(
                        'startDate',
                        date ? format(date, 'yyyy-MM-dd') : ''
                      )
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">마감일 *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate ? new Date(formData.dueDate) : undefined}
                    onSelect={(date) =>
                      handleInputChange(
                        'dueDate',
                        date ? format(date, 'yyyy-MM-dd') : ''
                      )
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                우선순위
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="우선순위 선택" />
                </SelectTrigger>
                <SelectContent>
                  {priorityStatuses
                    .filter(priority => priority.name && priority.name.trim() !== '') // 빈 name 필터링
                    .map((priority) => (
                      <SelectItem key={priority.id} value={priority.name}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: priority.color }}
                          />
                          {priority.translationKey && translations.global?.[priority.translationKey] 
                            ? translations.global[priority.translationKey] 
                            : priority.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                상태
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  {taskStatuses
                    .filter(status => status.name && status.name.trim() !== '') // 빈 name 필터링
                    .map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: status.color }}
                          />
                          {status.translationKey && translations.global?.[status.translationKey] 
                            ? translations.global[status.translationKey] 
                            : status.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* 문서 업로드 섹션 */}
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                📎 추가 업로드 할 문서
              </h3>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  파일 선택
                </Label>
                <div className="col-span-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="flex-1"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                    />
                    {isUploading && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    지원 형식: PDF, Word, Excel, PowerPoint, 이미지, 압축파일 (최대 50MB)
                  </p>

                  {/* 업로드된 파일 목록 */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">선택된 파일 ({uploadedFiles.length}개)</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <File className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(index)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                수정 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                수정 완료
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};