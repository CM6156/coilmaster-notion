import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppContext } from "@/context/AppContext";
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  CalendarIcon,
  UserIcon,
  BuildingIcon,
  ClockIcon,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Ban,
  Briefcase,
  ListTodo,
  Target,
  TrendingUp,
  Users,
  FileText,
  Activity,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from '@/lib/supabase';

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

interface StaffDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string | null;
  staffName: string | null;
}

interface StaffDetailData {
  staffId: string;
  staffName: string;
  department: string;
  projects: {
    id: string;
    name: string;
    startDate: string;
    dueDate: string;
    status: string;
    progress: number;
    clientName: string;
    description: string;
  }[];
  tasks: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    progress: number;
    dueDate: string;
    projectName: string;
    taskPhase?: string;
    taskPhaseName?: string;
  }[];
  stats: {
    totalProjects: number;
    completedProjects: number;
    inProgressProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    projectCompletionRate: number;
    taskCompletionRate: number;
    overallWorkload: number;
  };
}

const StaffDetailDialog = ({ open, onOpenChange, staffId, staffName }: StaffDetailDialogProps) => {
  const { projects, tasks, managers, calculateProjectProgress } = useAppContext();
  const { translations } = useLanguage();
  
  // 업무 단계 상태 추가
  const [taskPhases, setTaskPhases] = useState<TaskPhase[]>([]);
  
  const t = translations.dashboard;
  const projectsT = translations.projects;
  const tasksT = translations.tasks;
  const globalT = translations.global;

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
      
      console.log('📋 StaffDetailDialog: 업무 단계 로드 성공:', data);
      setTaskPhases(data || []);
    } catch (error) {
      console.error('업무 단계 로드 중 오류:', error);
    }
  };

  // 업무 단계 정보 가져오기
  const getTaskPhaseInfo = (phaseId?: string) => {
    console.log('🔍 StaffDetailDialog: getTaskPhaseInfo 호출:', {
      phaseId,
      taskPhasesLength: taskPhases.length,
      taskPhases: taskPhases.map(p => ({ id: p.id, name: p.name }))
    });
    
    if (!taskPhases || taskPhases.length === 0) {
      console.log('⚠️ taskPhases 배열이 비어있음');
      return { name: '단계 미지정', color: '#6b7280' };
    }
    
    if (!phaseId) {
      console.log('⚠️ phaseId가 없음:', phaseId);
      return { name: '단계 미지정', color: '#6b7280' };
    }
    
    const phase = taskPhases.find(p => p.id === phaseId);
    console.log('🎯 단계 찾기 결과:', { 
      searchId: phaseId, 
      foundPhase: phase,
      allPhaseIds: taskPhases.map(p => p.id)
    });
    
    return phase ? { name: phase.name, color: phase.color || '#3b82f6' } : { name: '단계 미지정', color: '#6b7280' };
  };

  // 컴포넌트 마운트 시 업무 단계 로드
  useEffect(() => {
    if (open) {
      loadTaskPhases();
    }
  }, [open]);

  // 직원 상세 데이터 생성
  const getStaffDetailData = (): StaffDetailData | null => {
    if (!staffId || !staffName) return null;

    // 직원의 프로젝트 찾기
    const staffProjects = projects.filter(project => {
      // project.manager 이름 매칭 또는 managerId 매칭
      return project.manager === staffName || project.managerId === staffId;
    });

    // 직원의 업무 찾기 - 개선된 매칭 로직
    const staffTasks = tasks.filter(task => {
      console.log(`StaffDetailDialog: 업무 ${task.title} 확인 중...`);
      console.log(`- task.assignedTo: ${task.assignedTo}`);
      console.log(`- staffId: ${staffId}, staffName: ${staffName}`);
      
      // ID로 매칭
      const isAssignedById = task.assignedTo === staffId;
      // 이름으로 매칭
      const isAssignedByName = task.assignedTo === staffName;
      // 다중 담당자에서 매칭
      const isAssignedInAssignees = task.assignees && Array.isArray(task.assignees) && 
        task.assignees.some(assignee => assignee.user_id === staffId || assignee.user_name === staffName);
      
      const match = isAssignedById || isAssignedByName || isAssignedInAssignees;
      
      if (match) {
        console.log(`✅ 업무 매치: ${task.title}`);
      }
      
      return match;
    });

    // 매니저 정보 찾기
    const managerInfo = managers.find(m => m.id === staffId || m.name === staffName);

    // 프로젝트 데이터 가공
    const processedProjects = staffProjects.map(project => ({
      id: project.id,
      name: project.name,
      startDate: project.startDate || '',
      dueDate: project.dueDate || '',
      status: project.status || 'planned',
      progress: calculateProjectProgress(project.id),
      clientName: project.clientName || '미지정',
      description: project.description || ''
    }));

    // 업무 데이터 가공
    const processedTasks = staffTasks.map(task => {
      const project = projects.find(p => p.id === task.projectId);
      const phaseInfo = getTaskPhaseInfo(task.taskPhase);
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        progress: task.progress || 0,
        dueDate: task.dueDate,
        projectName: project?.name || '일반 업무',
        taskPhase: task.taskPhase,
        taskPhaseName: phaseInfo.name
      };
    });

    // 통계 계산 - 한국어 상태명 고려
    const completedProjects = processedProjects.filter(p => 
      p.status === 'completed' || p.status === '완료'
    ).length;
    const inProgressProjects = processedProjects.filter(p => 
      p.status === 'in-progress' || p.status === '진행중'
    ).length;
    const completedTasks = processedTasks.filter(t => 
      t.status === 'completed' || t.status === '완료' || (t.progress && t.progress >= 100)
    ).length;
    const inProgressTasks = processedTasks.filter(t => 
      t.status === 'in-progress' || t.status === '진행중'
    ).length;

    const projectCompletionRate = processedProjects.length > 0 ? 
      (completedProjects / processedProjects.length) * 100 : 0;
    const taskCompletionRate = processedTasks.length > 0 ? 
      (completedTasks / processedTasks.length) * 100 : 0;
    
    // 전체 업무량 계산 (프로젝트 40%, 업무 60%)
    const overallWorkload = (processedProjects.length * 10 + processedTasks.length * 5);

    return {
      staffId,
      staffName,
      department: managerInfo?.department?.name || '미지정',
      projects: processedProjects,
      tasks: processedTasks,
      stats: {
        totalProjects: processedProjects.length,
        completedProjects,
        inProgressProjects,
        totalTasks: processedTasks.length,
        completedTasks,
        inProgressTasks,
        projectCompletionRate,
        taskCompletionRate,
        overallWorkload
      }
    };
  };

  const staffData = getStaffDetailData();

  // 상태 뱃지 가져오기
  const getStatusBadge = (status: string, type: 'project' | 'task' = 'project') => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'completed':
          return { color: 'bg-green-100 text-green-700', icon: CheckCircle2, text: '완료' };
        case 'in-progress':
          return { color: 'bg-blue-100 text-blue-700', icon: Clock3, text: '진행중' };
        case 'delayed':
          return { color: 'bg-red-100 text-red-700', icon: AlertCircle, text: '지연' };
        case 'on-hold':
          return { color: 'bg-amber-100 text-amber-700', icon: Ban, text: '보류' };
        case 'planned':
          return { color: 'bg-gray-100 text-gray-700', icon: ClockIcon, text: '예정' };
        case 'reviewing':
          return { color: 'bg-purple-100 text-purple-700', icon: Activity, text: '검토중' };
        default:
          return { color: 'bg-gray-100 text-gray-700', icon: ClockIcon, text: '미정' };
      }
    };

    const config = getStatusConfig(status);
    const IconComponent = config.icon;

    return (
      <div className={cn(
        "inline-flex items-center px-2 py-1 rounded-md text-sm font-medium",
        config.color
      )}>
        <IconComponent className="w-3 h-3 mr-1" />
        <span>{config.text}</span>
      </div>
    );
  };

  // 우선순위 뱃지
  const getPriorityBadge = (priority: string) => {
    const getPriorityConfig = (priority: string) => {
      switch (priority.toLowerCase()) {
        case 'urgent':
        case '긴급':
          return { color: 'bg-red-100 text-red-700', text: '긴급', icon: '🔥' };
        case 'high':
        case '높음':
          return { color: 'bg-orange-100 text-orange-700', text: '높음', icon: '⚡' };
        case 'normal':
        case 'medium':
        case '보통':
          return { color: 'bg-blue-100 text-blue-700', text: '보통', icon: '💫' };
        case 'low':
        case '낮음':
          return { color: 'bg-green-100 text-green-700', text: '낮음', icon: '🌱' };
        default:
          return { color: 'bg-gray-100 text-gray-700', text: '보통', icon: '📌' };
      }
    };

    const config = getPriorityConfig(priority);
    return (
      <Badge className={cn("text-xs", config.color)}>
        {config.icon} {config.text}
      </Badge>
    );
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '미정';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '미정';
      return format(date, 'MM.dd', { locale: ko });
    } catch (error) {
      return '미정';
    }
  };

  if (!staffData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            {staffData.staffName} 상세 정보
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">직원명</span>
                  <p className="text-lg font-medium">{staffData.staffName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">부서</span>
                  <p className="text-lg font-medium">{staffData.department}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 업무 통계 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                업무 통계
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">프로젝트</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{staffData.stats.totalProjects}</div>
                  <div className="text-xs text-gray-500">
                    완료: {staffData.stats.completedProjects}개
                  </div>
                  <Progress 
                    value={staffData.stats.projectCompletionRate} 
                    className="h-2 mt-2"
                  />
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ListTodo className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">업무</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{staffData.stats.totalTasks}</div>
                  <div className="text-xs text-gray-500">
                    완료: {staffData.stats.completedTasks}개
                  </div>
                  <Progress 
                    value={staffData.stats.taskCompletionRate} 
                    className="h-2 mt-2"
                  />
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">프로젝트 완료율</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {staffData.stats.projectCompletionRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    진행중: {staffData.stats.inProgressProjects}개
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">업무 완료율</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {staffData.stats.taskCompletionRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    진행중: {staffData.stats.inProgressTasks}개
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 담당 프로젝트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                담당 프로젝트 ({staffData.projects.length}개)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {staffData.projects.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>프로젝트명</TableHead>
                      <TableHead>고객사</TableHead>
                      <TableHead>기간</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>진행률</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffData.projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {project.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{project.clientName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarIcon className="w-3 h-3" />
                            {formatDate(project.startDate)} ~ {formatDate(project.dueDate)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(project.status, 'project')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={calculateProjectProgress(project.id)} className="w-16" />
                            <span className="text-sm text-gray-500 min-w-[2rem]">
                              {calculateProjectProgress(project.id)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  담당 프로젝트가 없습니다.
                </div>
              )}
            </CardContent>
          </Card>

          {/* 하위 업무 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                하위 업무 ({staffData.tasks.length}개)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {staffData.tasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>단계명</TableHead>
                      <TableHead>프로젝트</TableHead>
                      <TableHead>우선순위</TableHead>
                      <TableHead>마감일</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>진행률</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffData.tasks.map((task) => {
                      const phaseInfo = getTaskPhaseInfo(task.taskPhase);
                      return (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                <span 
                                  className="inline-block w-3 h-3 rounded-full"
                                  style={{ backgroundColor: phaseInfo.color }}
                                />
                                {task.taskPhaseName || phaseInfo.name}
                              </div>
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {task.title}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {task.projectName}
                            </Badge>
                          </TableCell>
                          <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <CalendarIcon className="w-3 h-3" />
                              {formatDate(task.dueDate)}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(task.status, 'task')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={task.progress} className="w-16" />
                              <span className="text-sm text-gray-500 min-w-[2rem]">
                                {task.progress}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  할당된 업무가 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StaffDetailDialog; 