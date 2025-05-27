import { useAppContext } from "@/context/AppContext";
import TaskHeader from "@/components/tasks/TaskHeader";
import TaskFilters from "@/components/tasks/TaskFilters";
import TaskList from "@/components/tasks/TaskList";
import TaskCreateDialog from "@/components/tasks/TaskCreateDialog";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ListTodo,
  Kanban,
  Calendar,
  Users,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Target,
  TrendingUp,
  Sparkles,
  FileText,
  Flag,
  Building2,
  Paperclip,
  ExternalLink,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Task } from "@/types";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getDepartmentKoreanName, departmentColors, departmentTextColors } from "@/utils/departmentUtils";

const Tasks = () => {
  const { tasks, getTaskStatuses, getPriorityStatuses, users, managers, departments, getUserNameById, getAssigneeNames } = useAppContext();
  const { translations } = useLanguage();
  
  // 업무 단계 상태 추가
  const [taskPhases, setTaskPhases] = useState<any[]>([]);
  
  // Local state
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('kanban');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 상태별 페이지네이션 상태 추가
  const [statusPages, setStatusPages] = useState<Record<string, number>>({});
  const ITEMS_PER_PAGE = 4; // 페이지당 표시할 업무 수
  
  // 달력 관련 상태
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // 상태 목록 가져오기
  const taskStatuses = getTaskStatuses();
  const priorityStatuses = getPriorityStatuses();
  
  // 영어 상태를 한국어로 변환하는 매핑
  const statusMapping: { [key: string]: string } = {
    'not-started': '할 일',
    'to-do': '할 일',
    'todo': '할 일',
    'in-progress': '진행중',
    'progress': '진행중',
    'doing': '진행중',
    'reviewing': '검토중',
    'review': '검토중',
    'pending': '검토중',
    'completed': '완료',
    'done': '완료',
    'finished': '완료',
    'delayed': '지연',
    'blocked': '지연',
    'on-hold': '보류',
    'paused': '보류'
  };

  // 우선순위 영어를 한국어로 변환하는 매핑
  const priorityMapping: { [key: string]: string } = {
    'low': '낮음',
    'normal': '보통',
    'medium': '보통',
    'high': '높음',
    'urgent': '긴급',
    'critical': '긴급'
  };

  // 업무 데이터의 상태와 우선순위를 한국어로 변환
  const normalizedTasks = tasks.map(task => ({
    ...task,
    status: statusMapping[task.status.toLowerCase()] || task.status,
    priority: priorityMapping[task.priority.toLowerCase()] || task.priority
  }));
  
  // 임시 더미 데이터 추가 (테스트용)
  const dummyTasks: Task[] = normalizedTasks.length === 0 ? [
    {
      id: 'dummy-1',
      title: '데이터베이스 설계',
      description: '새 프로젝트를 위한 데이터베이스 스키마 설계',
      status: '할 일',
      priority: '높음',
      progress: 0,
      startDate: '2024-01-01',
      dueDate: '2024-01-15',
      projectId: 'project-1',
      assignedTo: '김개발',
      department: 'development',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'dummy-2',
      title: 'API 개발',
      description: '사용자 인증 API 개발',
      status: '진행중',
      priority: '높음',
      progress: 60,
      startDate: '2024-01-02',
      dueDate: '2024-01-20',
      projectId: 'project-1',
      assignedTo: '이백엔드',
      department: 'development',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      completionFiles: [
        {
          id: 'file-1',
          name: 'API_문서.pdf',
          size: 1024000,
          type: 'pdf',
          url: '#'
        }
      ],
      completionLinks: [
        {
          id: 'link-1',
          title: 'API 테스트 결과',
          url: 'https://example.com/api-test'
        }
      ]
    },
    {
      id: 'dummy-3',
      title: '프론트엔드 구현',
      description: '사용자 인터페이스 구현',
      status: '검토중',
      priority: '보통',
      progress: 85,
      startDate: '2024-01-03',
      dueDate: '2024-01-25',
      projectId: 'project-1',
      assignedTo: '박프론트',
      department: 'development',
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z'
    },
    {
      id: 'dummy-4',
      title: '테스트 케이스 작성',
      description: '단위 테스트 및 통합 테스트 케이스 작성',
      status: '완료',
      priority: '보통',
      progress: 100,
      startDate: '2024-01-04',
      dueDate: '2024-01-30',
      projectId: 'project-1',
      assignedTo: '최테스터',
      department: 'quality',
      createdAt: '2024-01-04T00:00:00Z',
      updatedAt: '2024-01-04T00:00:00Z',
      completionFiles: [
        {
          id: 'file-2',
          name: '테스트케이스.xlsx',
          size: 512000,
          type: 'document',
          url: '#'
        },
        {
          id: 'file-3',
          name: '테스트결과.pdf',
          size: 2048000,
          type: 'pdf',
          url: '#'
        }
      ],
      completionLinks: [
        {
          id: 'link-2',
          title: '테스트 환경',
          url: 'https://test.example.com'
        },
        {
          id: 'link-3',
          title: '테스트 보고서',
          url: 'https://reports.example.com'
        }
      ]
    },
    {
      id: 'dummy-5',
      title: '품질 검수',
      description: '완성된 제품의 품질 검수',
      status: '할 일',
      priority: '낮음',
      progress: 0,
      startDate: '2024-01-05',
      dueDate: '2024-02-01',
      projectId: 'project-2',
      assignedTo: '강품질',
      department: 'quality',
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-05T00:00:00Z'
    },
    {
      id: 'dummy-6',
      title: '고객 미팅',
      description: '신규 고객과의 요구사항 협의',
      status: '진행중',
      priority: '긴급',
      progress: 30,
      startDate: '2024-01-06',
      dueDate: '2024-01-10',
      projectId: 'project-2',
      assignedTo: '윤영업',
      department: 'sales',
      createdAt: '2024-01-06T00:00:00Z',
      updatedAt: '2024-01-06T00:00:00Z'
    }
  ] : normalizedTasks;
  
  // 부서 UUID를 부서명으로 변환하는 함수
  const getDepartmentNameById = (departmentId: string): string => {
    if (!departmentId) return '미지정';
    
    // departments 배열에서 ID로 부서 찾기
    const department = departments?.find(dept => dept.id === departmentId);
    if (department) {
      // 부서명이 한국어면 그대로 반환, 영어 코드면 한국어로 변환
      return getDepartmentKoreanName(department.code || department.name) || department.name;
    }
    
    // 부서를 찾지 못한 경우, 기존 getDepartmentKoreanName 함수로 변환 시도
    return getDepartmentKoreanName(departmentId) || departmentId;
  };

  // 부서 UUID로 부서 코드를 가져오는 함수 (색상 적용용)
  const getDepartmentCodeById = (departmentId: string): string => {
    if (!departmentId) return '';
    
    // departments 배열에서 ID로 부서 찾기
    const department = departments?.find(dept => dept.id === departmentId);
    if (department) {
      return department.code || department.name;
    }
    
    // 부서를 찾지 못한 경우 원본 값 반환
    return departmentId;
  };

  // 업무의 Stage 번호를 가져오는 함수
  const getTaskStageNumber = (task: Task): string => {
    const phase = taskPhases.find(p => p.id === task.taskPhase);
    const stageNumber = phase?.order_index || 0;
    return String(stageNumber).padStart(2, '0');
  };

  // 디버깅을 위한 콘솔 출력
  console.log("=== Tasks 페이지 디버깅 ===");
  console.log("원본 tasks:", tasks);
  console.log("정규화된 tasks:", normalizedTasks);
  console.log("최종 dummyTasks:", dummyTasks);
  console.log("tasks 개수:", dummyTasks.length);
  console.log("taskStatuses:", taskStatuses);
  console.log("departments:", departments);
  console.log("현재 필터 - statusFilter:", statusFilter);
  console.log("현재 필터 - departmentFilter:", departmentFilter);
  console.log("현재 필터 - searchQuery:", searchQuery);
  
  // 각 업무의 taskPhase 값 확인
  console.log("=== 업무별 taskPhase 확인 ===");
  dummyTasks.forEach((task, index) => {
    console.log(`업무 ${index + 1}: ${task.title}`, {
      id: task.id,
      taskPhase: task.taskPhase,
      taskPhaseType: typeof task.taskPhase,
      hasTaskPhase: !!task.taskPhase
    });
  });
  console.log("=== taskPhases 배열 확인 ===");
  console.log("taskPhases:", taskPhases.map(p => ({ id: p.id, name: p.name, color: p.color })));
  console.log("================================");

  // Apply filters to tasks
  const filteredTasks = dummyTasks.filter(task => {
    const matchesDepartment = !departmentFilter || task.department === departmentFilter;
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    console.log(`Task ${task.title}: department=${task.department}, status=${task.status}, matches dept=${matchesDepartment}, matches status=${matchesStatus}, matches search=${matchesSearch}`);
    
    return matchesDepartment && matchesStatus && matchesSearch;
  });

  console.log("filteredTasks:", filteredTasks);
  console.log("filteredTasks 개수:", filteredTasks.length);

  // 상태별 업무 그룹화 - 동적으로 생성
  const tasksByStatus = taskStatuses.reduce((acc, status) => {
    acc[status.name] = filteredTasks.filter(t => t.status === status.name);
    return acc;
  }, {} as Record<string, Task[]>);

  // 상태별 아이콘 매핑
  const getStatusIcon = (statusName: string) => {
    const lowerName = statusName.toLowerCase();
    if (lowerName.includes('done') || lowerName.includes('complete')) return CheckCircle2;
    if (lowerName.includes('progress') || lowerName.includes('doing')) return Loader2;
    if (lowerName.includes('delay') || lowerName.includes('block')) return AlertCircle;
    return Clock;
  };

  // 우선순위 색상 가져오기
  const getPriorityColor = (priority: string) => {
    const priorityStatus = priorityStatuses.find(p => p.name === priority);
    if (!priorityStatus) return 'outline';
    
    const color = priorityStatus.color;
    if (color === '#ef4444') return 'destructive';
    if (color === '#f59e0b') return 'default';
    if (color === '#3b82f6') return 'secondary';
    return 'outline';
  };

  const getPriorityIcon = (priority: string) => {
    const priorityStatus = priorityStatuses.find(p => p.name === priority);
    if (!priorityStatus) return '📌';
    
    const lowerName = priorityStatus.name.toLowerCase();
    if (lowerName.includes('urgent')) return '🔥';
    if (lowerName.includes('high')) return '⚡';
    if (lowerName.includes('normal') || lowerName.includes('medium')) return '💫';
    if (lowerName.includes('low')) return '🌱';
    return '📌';
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const priorityStatus = priorityStatuses.find(p => p.name === task.priority);
    const translatedPriority = priorityStatus?.translationKey && translations.global?.[priorityStatus.translationKey]
      ? translations.global[priorityStatus.translationKey]
      : task.priority;

    const handleTaskClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedTask(task);
      setIsDetailDialogOpen(true);
    };
    
    // 담당자 이름 가져오기 (유틸리티 함수 사용)
    const assigneeName = getAssigneeNames(task);

    // 업무 단계 정보 가져오기
    const getTaskPhaseInfo = () => {
      console.log('🔍 Tasks 페이지 - getTaskPhaseInfo 호출:', {
        taskId: task.id,
        taskTitle: task.title,
        taskPhase: task.taskPhase,
        taskPhasesLength: taskPhases.length,
        taskPhases: taskPhases.map(p => ({ id: p.id, name: p.name }))
      });
      
      if (!taskPhases || taskPhases.length === 0) {
        console.log('⚠️ taskPhases 배열이 비어있음');
        return { name: '단계 미지정', color: '#6b7280' };
      }
      
      if (!task.taskPhase) {
        console.log('⚠️ task.taskPhase가 없음:', task.taskPhase);
        return { name: '단계 미지정', color: '#6b7280' };
      }
      
      const phase = taskPhases.find(p => p.id === task.taskPhase);
      console.log('🎯 단계 찾기 결과:', { 
        searchId: task.taskPhase, 
        foundPhase: phase,
        allPhaseIds: taskPhases.map(p => p.id)
      });
      
      return phase ? { name: phase.name, color: phase.color || '#3b82f6' } : { name: '단계 미지정', color: '#6b7280' };
    };

    // 기간 경과 일수 계산
    const getDaysRemaining = () => {
      // 완료된 업무는 완료 상태 표시
      if (task.progress >= 100 || task.status === '완료') {
        return { 
          text: '완료됨', 
          isCompleted: true,
          isOverdue: false,
          isToday: false
        };
      }
      
      const today = new Date();
      const dueDate = new Date(task.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { text: `${Math.abs(diffDays)}일 지남`, isOverdue: true, isToday: false, isCompleted: false };
      } else if (diffDays === 0) {
        return { text: '오늘 마감', isToday: true, isOverdue: false, isCompleted: false };
      } else {
        return { text: `${diffDays}일 남음`, isOverdue: false, isToday: false, isCompleted: false };
      }
    };

    // 상태 정보 가져오기
    const getTaskStatusInfo = () => {
      const status = taskStatuses.find(s => s.name === task.status);
      if (status) {
        return {
          name: status.name,
          color: status.color,
          icon: getStatusIcon(status.name)
        };
      }
      return {
        name: task.status,
        color: '#6b7280',
        icon: Clock
      };
    };

    const phaseInfo = getTaskPhaseInfo();
    const daysInfo = getDaysRemaining();
    const statusInfo = getTaskStatusInfo();
    const StatusIcon = statusInfo.icon;
    
    return (
      <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
        <CardContent className="p-4">
          {/* 상단: 업무 단계 배지와 우선순위 */}
          <div className="flex items-start justify-between mb-3">
            <Badge 
              variant="outline" 
              className="text-sm font-medium"
              style={{ 
                backgroundColor: `${phaseInfo.color}20`,
                borderColor: phaseInfo.color,
                color: phaseInfo.color
              }}
            >
              📋 {phaseInfo.name}
            </Badge>
            <Badge variant={getPriorityColor(task.priority)} className="ml-2 text-xs">
              {getPriorityIcon(task.priority)} {translatedPriority}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>
          
          {/* 상태 정보 */}
          <div className="flex items-center gap-2 mb-3">
            <Badge 
              variant="outline" 
              className="text-xs flex items-center gap-1"
              style={{ 
                backgroundColor: `${statusInfo.color}20`,
                borderColor: statusInfo.color,
                color: statusInfo.color
              }}
            >
              <StatusIcon className="h-3 w-3" />
              {statusInfo.name}
            </Badge>
          </div>

          {/* 부서 정보 */}
          <div className="flex items-center gap-2 mb-3">
            <Badge 
              variant="outline" 
              className="text-xs flex items-center gap-1"
              style={{ 
                backgroundColor: `${departmentColors[getDepartmentCodeById(task.department)] || '#6b7280'}20`,
                borderColor: departmentColors[getDepartmentCodeById(task.department)] || '#6b7280',
                color: departmentTextColors[getDepartmentCodeById(task.department)] || '#6b7280'
              }}
            >
              <Building2 className="h-3 w-3" />
              {getDepartmentNameById(task.department)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Users className="h-3 w-3 flex-shrink-0" />
              <div className="flex items-center gap-1 min-w-0">
                {/* 다중 담당자 표시 개선 */}
                {task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0 ? (
                  <div className="flex items-center gap-1 min-w-0">
                    {/* 주 담당자 표시 */}
                    {(() => {
                      const primaryAssignee = task.assignees.find(assignee => assignee.is_primary);
                      const displayAssignee = primaryAssignee || task.assignees[0];
                      const additionalCount = task.assignees.length - 1;
                      
                      return (
                        <>
                          <span className="text-muted-foreground font-medium truncate">
                            {displayAssignee.user_name}
                          </span>
                          {primaryAssignee && (
                            <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                              주
                            </Badge>
                          )}
                          {additionalCount > 0 && (
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">
                              +{additionalCount}
                            </Badge>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <span className="text-muted-foreground truncate">{assigneeName}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end text-xs flex-shrink-0">
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
              <div className={`flex items-center gap-1 ${
                daysInfo.isCompleted ? 'text-green-500 font-medium' :
                daysInfo.isOverdue ? 'text-red-500 font-medium' : 
                daysInfo.isToday ? 'text-orange-500 font-medium' : 
                'text-muted-foreground'
              }`}>
                {daysInfo.isCompleted ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                <span>{daysInfo.text}</span>
              </div>
            </div>
          </div>

          {/* 프로그레스 바 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">진행률</span>
              <span className="text-xs font-medium">{task.progress}%</span>
            </div>
            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>

          {/* 상세정보 버튼 */}
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-3"
              onClick={handleTaskClick}
            >
              <FileText className="h-3 w-3 mr-1" />
              상세정보
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const KanbanColumn = ({ status }: { status: typeof taskStatuses[0] }) => {
    const Icon = getStatusIcon(status.name);
    const tasks = tasksByStatus[status.name] || [];
    
    // 현재 상태의 페이지 번호 가져오기
    const currentPage = statusPages[status.name] || 1;
    
    // 페이지네이션 계산
    const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedTasks = tasks.slice(startIndex, endIndex);
    
    // 페이지 변경 핸들러
    const handlePageChange = (page: number) => {
      setStatusPages(prev => ({
        ...prev,
        [status.name]: page
      }));
    };
    
    // 번역된 상태명 가져오기
    const translatedStatusName = status.translationKey && translations.global?.[status.translationKey]
      ? translations.global[status.translationKey]
      : status.name;

    return (
      <div className={cn("flex-1 rounded-xl p-4 border bg-white dark:bg-slate-800 shadow-sm")}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${status.color}20` }}
            >
              <Icon className="h-4 w-4" style={{ color: status.color }} />
            </div>
            <h3 className="font-semibold">{translatedStatusName}</h3>
            <Badge variant="secondary" className="ml-2">{tasks.length}</Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div 
          className="space-y-3 min-h-[350px] max-h-[500px] overflow-y-auto pr-2"
          style={{ borderTop: `2px solid ${status.color}` }}
        >
          {paginatedTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {translations.tasks?.noTasks || '업무가 없습니다'}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {startIndex + 1}-{Math.min(endIndex, tasks.length)} of {tasks.length}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ‹
                </Button>
                
                {/* 페이지 번호들 */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // 현재 페이지 주변 2개 페이지만 표시
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="h-7 w-7 p-0 text-xs"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  } else if (
                    page === currentPage - 2 || 
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="text-xs text-gray-400 px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  ›
                </Button>
              </div>
            </div>
            
            {/* 페이지 정보 */}
            <div className="text-center mt-2">
              <span className="text-xs text-gray-500">
                페이지 {currentPage} / {totalPages}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 통계 계산 - 한국어 상태명에 맞게 수정
  const stats = {
    total: filteredTasks.length,
    completed: (tasksByStatus['완료'] || []).length,
    inProgress: (tasksByStatus['진행중'] || []).length,
    reviewing: (tasksByStatus['검토중'] || []).length,
    delayed: (tasksByStatus['지연'] || []).length,
  };
  
  // 디버깅용 로그
  console.log('현재 통계:', stats);
  console.log('상태별 업무 분류:', Object.keys(tasksByStatus).map(status => 
    `${status}: ${tasksByStatus[status]?.length || 0}개`
  ));
  
  // 업무 업데이트 콜백
  const handleTaskUpdated = () => {
    console.log("=== handleTaskUpdated 호출됨 ===");
    console.log("현재 refreshKey:", refreshKey);
    console.log("현재 tasks 개수:", dummyTasks.length);
    
    setRefreshKey(prev => {
      console.log("refreshKey 변경:", prev, "->", prev + 1);
      return prev + 1;
    });
    
    // 선택된 업무 정보도 업데이트
    if (selectedTask) {
      console.log("선택된 업무 업데이트 중:", selectedTask.id);
      const updatedTask = dummyTasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        console.log("업데이트된 업무 찾음:", updatedTask);
        setSelectedTask(updatedTask);
      } else {
        // 업무가 삭제된 경우
        console.log("업무가 삭제됨 - 모달 닫기");
        setSelectedTask(null);
        setIsDetailDialogOpen(false);
      }
    }
    console.log("=== handleTaskUpdated 완료 ===");
  };

  // 필터가 변경될 때 페이지를 1로 리셋하는 effect
  useEffect(() => {
    setStatusPages({});
  }, [statusFilter, departmentFilter, searchQuery]);

  // 업무 단계 로드
  const loadTaskPhases = async () => {
    try {
      const { data, error } = await supabase.storage.listBuckets(); // 임시로 supabase import 확인
      const { data: phases, error: phasesError } = await supabase
        .from('task_phases')  // 'phases'에서 'task_phases'로 수정
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (phasesError) {
        console.error('업무 단계 로드 오류:', phasesError);
        return;
      }
      
      console.log('📋 업무 단계 로드 성공:', phases);
      setTaskPhases(phases || []);
    } catch (error) {
      console.error('업무 단계 로드 중 오류:', error);
    }
  };
  
  // 컴포넌트 마운트 시 업무 단계 로드
  useEffect(() => {
    loadTaskPhases();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                  <ListTodo className="h-6 w-6 text-white" />
                </div>
                {translations.tasks?.title || "업무 관리"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {translations.tasks?.subtitle || "팀의 모든 업무를 한눈에 관리하세요"}
              </p>
            </div>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              {translations.tasks?.newTask || "새 업무"}
            </Button>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500/10 to-blue-600/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">전체 업무</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500/10 to-orange-600/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">할일</p>
                    <p className="text-2xl font-bold">{(tasksByStatus['할 일'] || []).length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-500/10 to-yellow-600/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">진행중</p>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                  </div>
                  <Loader2 className="h-8 w-8 text-yellow-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500/10 to-purple-600/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">검토중</p>
                    <p className="text-2xl font-bold">{stats.reviewing}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-500/10 to-green-600/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">완료</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 뷰 모드 선택 */}
          <div className="flex items-center justify-between">
            <TaskFilters
              searchQuery={searchQuery}
              departmentFilter={departmentFilter}
              statusFilter={statusFilter}
              setSearchQuery={setSearchQuery}
              setDepartmentFilter={setDepartmentFilter}
              setStatusFilter={setStatusFilter}
            />
            
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg shadow-md p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3",
                  viewMode === 'kanban' && "bg-primary text-primary-foreground"
                )}
                onClick={() => setViewMode('kanban')}
              >
                <Kanban className="h-4 w-4 mr-2" />
                {translations.global?.view || '보기'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3",
                  viewMode === 'list' && "bg-primary text-primary-foreground"
                )}
                onClick={() => setViewMode('list')}
              >
                <ListTodo className="h-4 w-4 mr-2" />
                {translations.tasks?.allTasks || '목록'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3",
                  viewMode === 'calendar' && "bg-primary text-primary-foreground"
                )}
                onClick={() => setViewMode('calendar')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {translations.calendar?.title || '캘린더'}
              </Button>
            </div>
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {taskStatuses.map((status) => (
              <KanbanColumn key={status.id} status={status} />
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">업무 목록</h3>
                  <div className="text-sm text-muted-foreground">
                    총 {filteredTasks.length}개 업무
                  </div>
                </div>
                
                {/* 테이블 형태 업무 목록 */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-800">
                        <th className="text-left p-3 font-medium text-sm">Stage</th>
                        <th className="text-left p-3 font-medium text-sm">담당</th>
                        <th className="text-left p-3 font-medium text-sm">부서</th>
                        <th className="text-left p-3 font-medium text-sm">Due Date</th>
                        <th className="text-left p-3 font-medium text-sm">상태</th>
                        <th className="text-left p-3 font-medium text-sm">OverDue</th>
                        <th className="text-left p-3 font-medium text-sm">파일/링크</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks
                        .sort((a, b) => {
                          // 업무 단계의 order_index로 정렬
                          const phaseA = taskPhases.find(p => p.id === a.taskPhase);
                          const phaseB = taskPhases.find(p => p.id === b.taskPhase);
                          
                          const orderA = phaseA?.order_index || 999;
                          const orderB = phaseB?.order_index || 999;
                          
                          if (orderA !== orderB) {
                            return orderA - orderB;
                          }
                          
                          // 같은 단계라면 생성일순으로 정렬
                          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                        })
                        .map((task, index) => {
                        const phaseInfo = (() => {
                          if (!taskPhases || taskPhases.length === 0) {
                            return { name: '단계 미지정', color: '#6b7280' };
                          }
                          if (!task.taskPhase) {
                            return { name: '단계 미지정', color: '#6b7280' };
                          }
                          const phase = taskPhases.find(p => p.id === task.taskPhase);
                          return phase ? { name: phase.name, color: phase.color || '#3b82f6' } : { name: '단계 미지정', color: '#6b7280' };
                        })();
                        
                        const daysInfo = (() => {
                          // 완료된 업무는 완료 상태 표시
                          if (task.progress >= 100 || task.status === '완료') {
                            return { 
                              text: '완료됨', 
                              isCompleted: true,
                              isOverdue: false,
                              isToday: false
                            };
                          }
                          
                          const today = new Date();
                          const dueDate = new Date(task.dueDate);
                          const diffTime = dueDate.getTime() - today.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (diffDays < 0) {
                            return { text: `마감 ${Math.abs(diffDays)}일 지남`, isOverdue: true, isToday: false, isCompleted: false };
                          } else if (diffDays === 0) {
                            return { text: '오늘 마감', isToday: true, isOverdue: false, isCompleted: false };
                          } else {
                            return { text: `진행 중 ${diffDays}일 남음`, isOverdue: false, isToday: false, isCompleted: false };
                          }
                        })();
                        

                        
                        return (
                          <tr 
                            key={task.id} 
                            className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedTask(task);
                              setIsDetailDialogOpen(true);
                            }}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {getTaskStageNumber(task)}.
                                </span>
                                <span 
                                  className="text-sm font-medium px-2 py-1 rounded-full"
                                  style={{ 
                                    backgroundColor: `${phaseInfo.color}20`,
                                    color: phaseInfo.color 
                                  }}
                                >
                                  {phaseInfo.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0 ? (
                                  <div className="flex items-center gap-1">
                                    {task.assignees.slice(0, 2).map((assignee, idx) => (
                                      <div key={assignee.id || idx} className="flex items-center gap-1">
                                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
                                          {assignee.user_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <span className="text-sm">
                                          {assignee.user_name}
                                          {assignee.user_department && `(${assignee.user_department})`}
                                        </span>
                                        {assignee.is_primary && (
                                          <Badge variant="secondary" className="text-xs px-1 py-0 h-4">주</Badge>
                                        )}
                                      </div>
                                    ))}
                                    {task.assignees.length > 2 && (
                                      <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                        +{task.assignees.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
                                      {getAssigneeNames(task).charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-sm">{getAssigneeNames(task)}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-sm">
                                {(() => {
                                  if (task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0) {
                                    const primaryAssignee = task.assignees.find(assignee => assignee.is_primary);
                                    const displayAssignee = primaryAssignee || task.assignees[0];
                                    return displayAssignee.user_department ? getDepartmentNameById(displayAssignee.user_department) : getDepartmentNameById(task.department);
                                  }
                                  return getDepartmentNameById(task.department);
                                })()}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <span className="text-sm">
                                {new Date(task.dueDate).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                })}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge 
                                      variant={(() => {
                                        const progress = task.progress || 0;
                                        if (progress === 100) return 'default';
                                        if (progress >= 50) return 'secondary';
                                        return 'outline';
                                      })()} 
                                      className="text-xs"
                                    >
                                      {(() => {
                                        const progress = task.progress || 0;
                                        if (progress === 100) return '완료 100%';
                                        if (progress >= 50) return `진행 ${progress}%`;
                                        return `시작 ${progress}%`;
                                      })()}
                                    </Badge>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all duration-500 ${
                                        task.progress === 100 
                                          ? 'bg-green-500' 
                                          : task.progress >= 50 
                                            ? 'bg-blue-500' 
                                            : 'bg-gray-400'
                                      }`}
                                      style={{ width: `${task.progress || 0}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge 
                                variant={
                                  daysInfo.isCompleted ? "default" :
                                  daysInfo.isOverdue ? "destructive" : 
                                  daysInfo.isToday ? "default" : 
                                  "outline"
                                }
                                className={`text-sm ${
                                  daysInfo.isCompleted ? "bg-green-500 hover:bg-green-500" : ""
                                }`}
                              >
                                {daysInfo.text}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {/* 완료 파일들 표시 */}
                                {task.completionFiles && task.completionFiles.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-blue-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // 첫 번째 파일 미리보기 또는 다운로드
                                        const firstFile = task.completionFiles![0];
                                        if (firstFile.url) {
                                          window.open(firstFile.url, '_blank');
                                        }
                                      }}
                                    >
                                      <Paperclip className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    {task.completionFiles.length > 1 && (
                                      <span className="text-xs text-gray-500">
                                        +{task.completionFiles.length - 1}
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                {/* 완료 링크들 표시 */}
                                {task.completionLinks && task.completionLinks.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-green-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // 첫 번째 링크 열기
                                        const firstLink = task.completionLinks![0];
                                        if (firstLink.url) {
                                          window.open(firstLink.url, '_blank');
                                        }
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4 text-green-600" />
                                    </Button>
                                    {task.completionLinks.length > 1 && (
                                      <span className="text-xs text-gray-500">
                                        +{task.completionLinks.length - 1}
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                {/* 파일이나 링크가 없는 경우 */}
                                {(!task.completionFiles || task.completionFiles.length === 0) && 
                                 (!task.completionLinks || task.completionLinks.length === 0) && (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                                
                                {/* 상세보기 버튼 */}
                                {((task.completionFiles && task.completionFiles.length > 0) || 
                                  (task.completionLinks && task.completionLinks.length > 0)) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTask(task);
                                      setIsDetailDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 text-gray-600" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      조건에 맞는 업무가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {viewMode === 'calendar' && (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* 달력 헤더 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">일정 달력</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newDate = new Date(currentDate);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setCurrentDate(newDate);
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-lg font-medium min-w-[120px] text-center">
                        {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newDate = new Date(currentDate);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setCurrentDate(newDate);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      오늘
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {filteredTasks.length}개 업무 일정
                  </div>
                </div>

                {/* 달력 그리드 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                      <div
                        key={day}
                        className={`p-3 text-center font-medium text-sm ${
                          index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* 달력 날짜들 */}
                  <div className="grid grid-cols-7">
                    {(() => {
                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth();
                      const firstDay = new Date(year, month, 1);
                      const lastDay = new Date(year, month + 1, 0);
                      const startDate = new Date(firstDay);
                      startDate.setDate(startDate.getDate() - firstDay.getDay());
                      
                      const days = [];
                      for (let i = 0; i < 42; i++) {
                        const date = new Date(startDate);
                        date.setDate(startDate.getDate() + i);
                        days.push(date);
                      }
                      
                      const today = new Date();
                      
                      return days.map((date, index) => {
                        const isCurrentMonth = date.getMonth() === month;
                        const isToday = date.toDateString() === today.toDateString();
                        const isSelected = selectedDate?.toDateString() === date.toDateString();
                        
                                                 // 해당 날짜의 업무들 찾기 (마감일 기준)
                         const dayTasks = filteredTasks.filter(task => {
                           const taskDueDate = new Date(task.dueDate);
                           const checkDate = new Date(date);
                           
                           // 마감일이 해당 날짜인 업무들만
                           return taskDueDate.toDateString() === checkDate.toDateString();
                         });
                        
                        const dayKey = index % 7;
                        
                        return (
                          <div
                            key={date.toISOString()}
                            className={cn(
                              "min-h-[120px] p-2 border-b border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                              !isCurrentMonth && "bg-gray-50 dark:bg-gray-900 text-gray-400",
                              isSelected && "bg-blue-50 dark:bg-blue-900/20",
                              dayKey === 0 && "border-l-0", // 일요일은 왼쪽 테두리 제거
                              index >= 35 && "border-b-0" // 마지막 주는 아래 테두리 제거
                            )}
                            onClick={() => setSelectedDate(date)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  isToday && "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs",
                                  !isToday && dayKey === 0 && "text-red-500", // 일요일
                                  !isToday && dayKey === 6 && "text-blue-500", // 토요일
                                  !isCurrentMonth && "text-gray-400"
                                )}
                              >
                                {date.getDate()}
                              </span>
                              {dayTasks.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">
                                  {dayTasks.length}
                                </span>
                              )}
                            </div>
                            
                                                         {/* 업무 목록 (최대 3개까지 표시) */}
                             <div className="space-y-1">
                               {dayTasks.slice(0, 3).map((task) => {
                                 const taskDueDate = new Date(task.dueDate);
                                 const isCompleted = task.progress >= 100 || task.status === '완료';
                                 const isOverdue = taskDueDate < today && !isCompleted;
                                 
                                 const phaseInfo = (() => {
                                   if (!taskPhases || taskPhases.length === 0) {
                                     return { name: '단계 미지정', color: '#6b7280' };
                                   }
                                   if (!task.taskPhase) {
                                     return { name: '단계 미지정', color: '#6b7280' };
                                   }
                                   const phase = taskPhases.find(p => p.id === task.taskPhase);
                                   return phase ? { name: phase.name, color: phase.color || '#3b82f6' } : { name: '단계 미지정', color: '#6b7280' };
                                 })();
                                 
                                 return (
                                   <div
                                     key={task.id}
                                     className={cn(
                                       "text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity border-l-2",
                                       isCompleted ? "bg-green-100 text-green-800 border-green-500" :
                                       isOverdue ? "bg-red-100 text-red-800 border-red-500" :
                                       "bg-orange-100 text-orange-800 border-orange-500"
                                     )}
                                     style={{
                                       backgroundColor: !isCompleted && !isOverdue ? `${phaseInfo.color}15` : undefined,
                                       borderLeftColor: !isCompleted && !isOverdue ? phaseInfo.color : undefined
                                     }}
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setSelectedTask(task);
                                       setIsDetailDialogOpen(true);
                                     }}
                                   >
                                     <div className="font-medium truncate mb-1">
                                       {getTaskStageNumber(task)}. {task.title}
                                     </div>
                                     <div className="flex items-center justify-between text-xs">
                                       <div className="flex items-center gap-1 flex-1 min-w-0">
                                         <span className="text-red-600">📅</span>
                                         <span className="truncate">
                                           {task.assignees && task.assignees.length > 0 
                                             ? task.assignees[0].user_name 
                                             : task.assignedTo}
                                         </span>
                                       </div>
                                       <span className="font-medium ml-1">
                                         {task.progress}%
                                       </span>
                                     </div>
                                     <div className="flex items-center justify-between mt-1">
                                       <span 
                                         className="text-xs px-1.5 py-0.5 rounded-full truncate"
                                         style={{
                                           backgroundColor: `${departmentColors[getDepartmentCodeById(task.department)] || '#6b7280'}20`,
                                           color: departmentTextColors[getDepartmentCodeById(task.department)] || '#6b7280'
                                         }}
                                       >
                                         {getDepartmentNameById(task.department)}
                                       </span>
                                       <span className="text-xs text-gray-500 ml-1">
                                         {task.status}
                                       </span>
                                     </div>
                                   </div>
                                 );
                               })}
                              
                              {/* 더 많은 업무가 있을 때 */}
                              {dayTasks.length > 3 && (
                                <div className="text-xs text-gray-500 text-center py-1">
                                  +{dayTasks.length - 3}개 더
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                                 {/* 선택된 날짜의 업무 상세 */}
                 {selectedDate && (() => {
                   const selectedDayTasks = filteredTasks.filter(task => {
                     const taskDueDate = new Date(task.dueDate);
                     const checkDate = new Date(selectedDate);
                     
                     // 마감일이 해당 날짜인 업무들만
                     return taskDueDate.toDateString() === checkDate.toDateString();
                   });
                   
                   if (selectedDayTasks.length === 0) return null;
                   
                   return (
                     <Card className="mt-4">
                       <CardHeader>
                         <CardTitle className="text-lg">
                           {selectedDate.toLocaleDateString('ko-KR', {
                             year: 'numeric',
                             month: 'long',
                             day: 'numeric',
                             weekday: 'long'
                           })} 마감 업무 ({selectedDayTasks.length}개)
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-2">
                           {selectedDayTasks.map((task) => {
                             const taskDueDate = new Date(task.dueDate);
                             const isCompleted = task.progress >= 100 || task.status === '완료';
                             const isOverdue = taskDueDate < new Date() && !isCompleted;
                             
                             return (
                               <div
                                 key={task.id}
                                 className="p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                                 onClick={() => {
                                   setSelectedTask(task);
                                   setIsDetailDialogOpen(true);
                                 }}
                               >
                                 <div className="flex items-start justify-between">
                                   <div className="flex-1">
                                     <div className="flex items-center gap-2 mb-1">
                                       <h4 className="font-medium">{getTaskStageNumber(task)}. {task.title}</h4>
                                       <Badge variant="destructive" className="text-xs">📅 마감</Badge>
                                     </div>
                                     <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                     <div className="flex items-center gap-4 text-xs text-gray-500">
                                       <span>담당자: {task.assignees?.[0]?.user_name || task.assignedTo}</span>
                                       <span>부서: {getDepartmentNameById(task.department)}</span>
                                       <span>진행률: {task.progress}%</span>
                                       <span>상태: {task.status}</span>
                                       <span>시작일: {new Date(task.startDate).toLocaleDateString('ko-KR')}</span>
                                     </div>
                                   </div>
                                   <div className="flex flex-col items-end gap-1">
                                     {isCompleted && (
                                       <Badge variant="default" className="bg-green-500 hover:bg-green-500">완료</Badge>
                                     )}
                                     {isOverdue && !isCompleted && (
                                       <Badge variant="destructive">지연</Badge>
                                     )}
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       </CardContent>
                     </Card>
                   );
                 })()}
                
                {filteredTasks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>표시할 일정이 없습니다.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <TaskCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <TaskDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        task={selectedTask}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
};

export default Tasks;
