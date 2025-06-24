import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Users, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import { DepartmentCode, Task } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import React from "react";

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

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskCreateDialog = ({ open, onOpenChange }: TaskCreateDialogProps) => {
  const { users, projects, departments, managers, addTask, currentUser, getTaskStatuses, getPriorityStatuses } = useAppContext();
  const { translations } = useLanguage();
  const today = new Date();
  
  console.log("TaskCreateDialog - currentUser:", currentUser);
  
  // 상태와 우선순위 목록 가져오기
  const taskStatuses = getTaskStatuses();
  const priorityStatuses = getPriorityStatuses();
  const defaultStatus = taskStatuses.length > 0 ? taskStatuses[0].name : 'To Do';
  const defaultPriority = priorityStatuses.find(p => p.name === 'Normal')?.name || 
                          (priorityStatuses.length > 0 ? priorityStatuses[0].name : 'Normal');
  
  // 업무 단계 상태 추가
  const [taskPhases, setTaskPhases] = useState<TaskPhase[]>([]);
  
  // 다중 담당자 상태 추가
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [primaryAssignee, setPrimaryAssignee] = useState<string>("");
  
  const [formData, setFormData] = useState({
    projectId: "",
    department: "",
    assignedTo: "unassigned", // 초기값은 unassigned로 설정
    startDate: format(today, 'yyyy-MM-dd'),
    dueDate: format(new Date(today.setDate(today.getDate() + 7)), 'yyyy-MM-dd'),
    priority: defaultPriority,
    status: defaultStatus,
    taskPhase: "", // 업무 단계 필드 추가
  });

  // 사용자 옵션 생성 (안전한 기본값 설정)
  const userOptions: Option[] = React.useMemo(() => {
    console.log('👥 사용자 옵션 생성 시작');
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
  
  // 업무 단계 로드
  const loadTaskPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('task_phases')  // 'phases'에서 'task_phases'로 수정
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        console.error('업무 단계 로드 오류:', error);
        return;
      }
      
      console.log('📋 TaskCreateDialog - 업무 단계 로드 성공:', data);
      setTaskPhases(data || []);
      
      // 첫 번째 단계를 기본값으로 설정 (기존 값이 없을 때만)
      if (data && data.length > 0 && !formData.taskPhase) {
        console.log('🔧 기본 업무 단계 설정:', data[0]);
        setFormData(prev => ({ 
          ...prev, 
          taskPhase: data[0].id 
        }));
      }
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
  
  // currentUser가 로드되면 기본 담당자로 설정
  useEffect(() => {
    console.log("useEffect - currentUser 변경:", currentUser);
    if (currentUser && currentUser.id) {
      setSelectedAssignees([currentUser.id]);
      setPrimaryAssignee(currentUser.id);
      setFormData(prev => ({ 
        ...prev, 
        assignedTo: currentUser.id 
      }));
    }
  }, [currentUser]);
  
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() + 7)));
  
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    console.log(`📝 TaskCreateDialog - ${field} 변경:`, value);
    setFormData({ ...formData, [field]: value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const selectedProject = projects.find(p => p.id === formData.projectId);
      const selectedDepartment = departments.find(d => d.id === formData.department);
      const selectedTaskPhase = taskPhases.find(p => p.id === formData.taskPhase);
      
      // 자동으로 제목과 설명 생성
      const autoTitle = selectedTaskPhase ? selectedTaskPhase.name : "업무";
      const autoDescription = `${selectedTaskPhase?.name || "업무"} 관련 작업`;
      
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
        
        // 현재 사용자가 유효한 UUID인지 확인
        if (currentUser?.id && isValidUUID(currentUser.id)) {
          return currentUser.id;
        }
        
        // 모든 검사에 실패하면 null 반환
        return null;
      };

      const validAssignedTo = getValidAssignedTo();
      
      console.log("🚀 업무 생성 디버깅:", {
        formData,
        selectedTaskPhase,
        autoTitle,
        autoDescription,
        selectedAssignees,
        primaryAssignee,
        currentUser,
        validAssignedTo,
        isValidUUID: validAssignedTo ? isValidUUID(validAssignedTo) : false
      });
      
      const newTask: Omit<Task, 'id'> = {
        title: autoTitle,
        description: autoDescription,
        projectId: formData.projectId,
        department: selectedDepartment?.code || formData.department,
        assignedTo: validAssignedTo, // 유효한 UUID만 설정, 그렇지 않으면 null
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        priority: formData.priority,
        status: formData.status,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        taskPhase: formData.taskPhase, // 업무 단계 추가
      };
      
      console.log("💾 생성될 업무 데이터:", newTask);
      console.log("💾 taskPhase 상세:", {
        taskPhaseId: newTask.taskPhase,
        taskPhaseName: taskPhases.find(p => p.id === newTask.taskPhase)?.name
      });
      
      // 업무 생성
      const taskId = await addTask(newTask);
      
      // 다중 담당자 추가 (유효한 UUID만)
      const safeSelectedAssignees = Array.isArray(selectedAssignees) ? selectedAssignees : [];
      const validAssignees = safeSelectedAssignees.filter(id => isValidUUID(id));
      
      if (validAssignees.length > 0 && taskId) {
        const validPrimaryAssignee = primaryAssignee && isValidUUID(primaryAssignee) ? primaryAssignee : validAssignees[0];
        await addTaskAssignees(taskId, validAssignees, validPrimaryAssignee);
      }
      
      // 폼 초기화
      setFormData({
        projectId: "",
        department: "",
        assignedTo: "unassigned",
        startDate: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd'),
        priority: defaultPriority,
        status: defaultStatus,
        taskPhase: taskPhases.length > 0 ? taskPhases[0].id : "",
      });
      
      // 담당자 상태 초기화
      setSelectedAssignees(currentUser ? [currentUser.id] : []);
      setPrimaryAssignee(currentUser?.id || "");
      
      onOpenChange(false);
    } catch (error) {
      console.error("업무 생성 실패:", error);
    }
  };

  // 업무 담당자 추가 함수
  const addTaskAssignees = async (taskId: string, assigneeIds: string[], primaryId: string) => {
    try {
      console.log('🔍 담당자 추가 요청:', { taskId, assigneeIds, primaryId });
      
      // 먼저 user_profiles에 존재하는 사용자만 필터링 (안전한 처리)
      let validUsers = null;
      let userCheckError = null;
      
      try {
        const result = await supabase
          .from('user_profiles')
          .select('id')
          .in('id', assigneeIds);
        
        validUsers = result.data;
        userCheckError = result.error;
      } catch (profileError) {
        console.log('user_profiles 뷰를 사용할 수 없습니다, users 테이블 사용:', profileError);
        const result = await supabase
          .from('users')
          .select('id')
          .in('id', assigneeIds);
        
        validUsers = result.data;
        userCheckError = result.error;
      }
      
      if (userCheckError) {
        console.error('사용자 존재 확인 오류:', userCheckError);
        throw userCheckError;
      }
      
      const validUserIds = validUsers?.map(user => user.id) || [];
      console.log('✅ 유효한 사용자 ID들:', validUserIds);
      console.log('❌ 제외된 사용자 ID들:', assigneeIds.filter(id => !validUserIds.includes(id)));
      
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
        console.error('오류 상세:', error.message, error.details, error.hint);
        
        // task_assignees 테이블이 없는 경우 안내 메시지
        if (error.message?.includes('relation "public.task_assignees" does not exist')) {
          console.warn('⚠️ task_assignees 테이블이 존재하지 않습니다. SQL 스크립트를 먼저 실행해주세요.');
          return; // 오류를 throw하지 않고 조용히 넘어감
        }
        
        throw error;
      }

      console.log('✅ 담당자 추가 성공:', assigneeData);
    } catch (error) {
      console.error('담당자 추가 중 오류:', error);
      // 테이블이 없는 경우가 아니라면 오류를 다시 throw
      if (!(error as any)?.message?.includes('relation "public.task_assignees" does not exist')) {
        throw error;
      }
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>새 업무 생성</DialogTitle>
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

            {/* 프로젝트 및 부서 정보 섹션 */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                🏢 프로젝트 및 부서 정보
              </h3>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="projectId" className="text-right">
                  프로젝트
                </Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => handleInputChange('projectId', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="프로젝트 선택 (선택사항)" />
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
                  담당 부서
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleInputChange('department', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="담당 부서 선택 (선택사항)" />
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

            {/* 일정 및 우선순위 섹션 */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                📅 일정 및 우선순위
              </h3>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  시작일 *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">
                  마감일 *
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="col-span-3"
                  required
                />
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
                        <SelectItem key={priority.name} value={priority.name}>
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
                        <SelectItem key={status.name} value={status.name}>
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
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit">
              업무 생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskCreateDialog;
