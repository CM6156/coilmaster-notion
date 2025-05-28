import React, { useState, useEffect } from 'react';
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
import { Button } from "@/components/ui/button";
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
  Filter,
  ChevronDownIcon,
  ChevronUpIcon,
  ListTodo,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";
import StaffDetailDialog from './StaffDetailDialog';
import { supabase } from '@/lib/supabase';

interface StaffProjectData {
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
    tasks?: {
      id: string;
      title: string;
      status: string;
      progress: number;
      dueDate: string;
      taskPhase?: string;
      taskPhaseName?: string;
    }[];
  }[];
}

const StaffProjectOverview = () => {
  const { projects, managers, users, tasks, calculateProjectProgress } = useAppContext();
  const { translations } = useLanguage();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // 업무 단계 상태 추가
  const [taskPhases, setTaskPhases] = useState<any[]>([]);
  
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
      
      setTaskPhases(data || []);
    } catch (error) {
      console.error('업무 단계 로드 중 오류:', error);
    }
  };

  // 업무 단계 정보 가져오기
  const getTaskPhaseInfo = (phaseId?: string) => {
    if (!taskPhases || taskPhases.length === 0) {
      return { name: '단계 미지정', color: '#6b7280' };
    }
    
    if (!phaseId) {
      return { name: '단계 미지정', color: '#6b7280' };
    }
    
    const phase = taskPhases.find(p => p.id === phaseId);
    return phase ? { name: phase.name, color: phase.color || '#3b82f6' } : { name: '단계 미지정', color: '#6b7280' };
  };

  // 컴포넌트 마운트 시 업무 단계 로드
  useEffect(() => {
    loadTaskPhases();
  }, []);
  
  // 직원 상세 모달 상태 추가
  const [isStaffDetailOpen, setIsStaffDetailOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedStaffName, setSelectedStaffName] = useState<string | null>(null);
  
  // 프로젝트별 하위 업무 확장/축소 상태
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const t = translations.dashboard;
  const projectsT = translations.projects;
  const globalT = translations.global;

  // 상태 뱃지 가져오기
  const getStatusBadge = (status: string) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'completed':
          return { color: 'bg-green-900/20 text-green-400 border-green-800', icon: CheckCircle2, text: projectsT?.statusCompleted || '완료' };
        case 'in-progress':
          return { color: 'bg-blue-900/20 text-blue-400 border-blue-800', icon: Clock3, text: projectsT?.statusActive || '진행중' };
        case 'delayed':
          return { color: 'bg-red-900/20 text-red-400 border-red-800', icon: AlertCircle, text: projectsT?.statusDelayed || '지연' };
        case 'on-hold':
          return { color: 'bg-amber-900/20 text-amber-400 border-amber-800', icon: Ban, text: projectsT?.statusOnHold || '보류' };
        case 'planned':
          return { color: 'bg-gray-800/20 text-gray-400 border-gray-700', icon: ClockIcon, text: t?.planned || '예정' };
        default:
          return { color: 'bg-gray-800/20 text-gray-400 border-gray-700', icon: ClockIcon, text: t?.unset || '미정' };
      }
    };

    const config = getStatusConfig(status);
    const IconComponent = config.icon;

    return (
      <div className={cn(
        "inline-flex items-center px-2 py-1 rounded-md text-sm font-medium border",
        config.color
      )}>
        <IconComponent className="w-3 h-3 mr-1" />
        <span>{config.text}</span>
      </div>
    );
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t?.unset || '미정';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t?.unset || '미정';
      return format(date, 'MM.dd', { locale: ko });
    } catch (error) {
      return t?.unset || '미정';
    }
  };

  // 직원별 프로젝트 데이터 생성
  const getStaffProjectData = (): StaffProjectData[] => {
    const staffMap = new Map<string, StaffProjectData>();

    console.log("=== StaffProjectOverview 디버깅 ===");
    console.log("매니저 데이터:", managers);
    console.log("사용자 데이터:", users);
    console.log("프로젝트 데이터:", projects);

    // 매니저 데이터 초기화
    managers.forEach(manager => {
      console.log(`매니저 추가: ${manager.name} (${manager.department?.name || '부서없음'})`);
      staffMap.set(manager.id, {
        staffId: manager.id,
        staffName: manager.name,
        department: manager.department?.name || (t?.unassigned || '미지정'),
        projects: []
      });
    });

    // 사용자 데이터도 추가 (매니저에 없는 사용자들)
    if (Array.isArray(users)) {
      users.forEach(user => {
        if (!staffMap.has(user.id)) {
          console.log(`사용자 추가: ${user.name} (${(user.department as any)?.name || user.department || '부서없음'})`);
          staffMap.set(user.id, {
            staffId: user.id,
            staffName: user.name,
            department: (user.department as any)?.name || user.department || (t?.unassigned || '미지정'),
            projects: []
          });
        }
      });
    }

    // 프로젝트별로 담당자 확인 및 매핑
    projects.forEach(project => {
      console.log(`프로젝트 처리: ${project.name}`);
      console.log(`- project.manager: ${project.manager}`);
      console.log(`- project.managerId: ${project.managerId}`);
      
      // PIC (project.manager) 기준으로 담당자 찾기
      let assignedStaffId = null;
      let assignedStaffInfo = null;
      
      // 먼저 project.manager로 매니저 찾기 (managers와 users 모두에서)
      if (project.manager) {
        const managerByName = managers.find(m => m.name === project.manager);
        if (managerByName) {
          assignedStaffId = managerByName.id;
          assignedStaffInfo = managerByName;
          console.log(`- 매니저에서 이름으로 찾음: ${managerByName.name} (${managerByName.department?.name})`);
        } else if (Array.isArray(users)) {
          const userByName = users.find(u => u.name === project.manager);
          if (userByName) {
            assignedStaffId = userByName.id;
            assignedStaffInfo = userByName;
            console.log(`- 사용자에서 이름으로 찾음: ${userByName.name} (${(userByName.department as any)?.name || userByName.department})`);
          } else {
            console.log(`- 이름으로 매니저/사용자 못찾음: ${project.manager}`);
          }
        }
      }
      
      // 그 다음 managerId로 찾기 (managers와 users 모두에서)
      if (!assignedStaffId && project.managerId) {
        const managerById = managers.find(m => m.id === project.managerId);
        if (managerById) {
          assignedStaffId = project.managerId;
          assignedStaffInfo = managerById;
          console.log(`- 매니저에서 ID로 찾음: ${managerById.name} (${managerById.department?.name})`);
        } else if (Array.isArray(users)) {
          const userById = users.find(u => u.id === project.managerId);
          if (userById) {
            assignedStaffId = project.managerId;
            assignedStaffInfo = userById;
            console.log(`- 사용자에서 ID로 찾음: ${userById.name} (${(userById.department as any)?.name || userById.department})`);
          } else {
            console.log(`- ID로 매니저/사용자 못찾음: ${project.managerId}`);
          }
        }
      }

      // 해당 프로젝트의 하위 업무 중 직원이 담당한 업무들 찾기
      const getProjectTasksForStaff = (staffId: string, staffName: string, projectId: string) => {
        const projectTasks = tasks.filter(task => {
          if (task.projectId !== projectId) return false;
          
          // ID로 매칭
          const isAssignedById = task.assignedTo === staffId;
          // 이름으로 매칭
          const isAssignedByName = task.assignedTo === staffName;
          // 다중 담당자에서 매칭
          const isAssignedInAssignees = task.assignees && Array.isArray(task.assignees) && 
            task.assignees.some(assignee => assignee.user_id === staffId || assignee.user_name === staffName);
          
          return isAssignedById || isAssignedByName || isAssignedInAssignees;
        });

        return projectTasks.map(task => {
          const phaseInfo = getTaskPhaseInfo(task.taskPhase);
          return {
            id: task.id,
            title: task.title,
            status: task.status,
            progress: task.progress || 0,
            dueDate: task.dueDate,
            taskPhase: task.taskPhase,
            taskPhaseName: phaseInfo.name
          };
        });
      };

      // 담당자가 있는 경우 프로젝트 추가
      if (assignedStaffId && staffMap.has(assignedStaffId)) {
        const staffData = staffMap.get(assignedStaffId)!;
        const projectTasks = getProjectTasksForStaff(assignedStaffId, staffData.staffName, project.id);
        
        staffData.projects.push({
          id: project.id,
          name: project.name,
          startDate: project.startDate || '',
          dueDate: project.dueDate || '',
          status: project.status || 'planned',
          progress: calculateProjectProgress(project.id),
          clientName: project.clientName || (t?.unassigned || '미지정'),
          tasks: projectTasks
        });
        console.log(`- 프로젝트 추가됨: ${project.name} → ${staffData.staffName} (하위 업무 ${projectTasks.length}개)`);
      } else if (assignedStaffId && assignedStaffInfo) {
        // staffMap에 없는 경우 새로 추가
        console.log(`- 새 담당자 추가: ${assignedStaffInfo.name}`);
        const projectTasks = getProjectTasksForStaff(assignedStaffId, assignedStaffInfo.name, project.id);
        
        const newStaff: StaffProjectData = {
          staffId: assignedStaffId,
          staffName: assignedStaffInfo.name,
          department: (assignedStaffInfo.department as any)?.name || assignedStaffInfo.department || (t?.unassigned || '미지정'),
          projects: [{
            id: project.id,
            name: project.name,
            startDate: project.startDate || '',
            dueDate: project.dueDate || '',
            status: project.status || 'planned',
            progress: calculateProjectProgress(project.id),
            clientName: project.clientName || (t?.unassigned || '미지정'),
            tasks: projectTasks
          }]
        };
        staffMap.set(assignedStaffId, newStaff);
        console.log(`- 새 담당자로 프로젝트 추가됨: ${project.name} → ${newStaff.staffName} (하위 업무 ${projectTasks.length}개)`);
      } else {
        console.log(`- 프로젝트 담당자 없음: ${project.name}`);
      }
    });

    // 배열로 변환 후 필터링
    let result = Array.from(staffMap.values());
    console.log("필터링 전 결과:", result);

    // 부서별 필터링
    if (selectedDepartment !== "all") {
      console.log(`부서 필터링: ${selectedDepartment}`);
      result = result.filter(staff => {
        console.log(`- ${staff.staffName}: ${staff.department} === ${selectedDepartment}? ${staff.department === selectedDepartment}`);
        return staff.department === selectedDepartment;
      });
    }

    // 상태별 필터링
    if (selectedStatus !== "all") {
      console.log(`상태 필터링: ${selectedStatus}`);
      result = result.filter(staff => 
        staff.projects.some(project => {
          console.log(`- ${project.name}: ${project.status} === ${selectedStatus}? ${project.status === selectedStatus}`);
          return project.status === selectedStatus;
        })
      );
    }

    // 프로젝트가 있는 직원만 표시
    const finalResult = result.filter(staff => staff.projects.length > 0);
    console.log("최종 결과:", finalResult);
    console.log("=== 디버깅 끝 ===");

    return finalResult;
  };

  const staffProjectData = getStaffProjectData();

  // 고유 부서 목록 가져오기 (managers와 users 모두 포함)
  const departments = Array.from(new Set([
    ...managers.map(m => m.department?.name).filter(Boolean),
    ...(Array.isArray(users) ? users.map(u => (u.department as any)?.name || u.department).filter(Boolean) : [])
  ]));

  // 직원명 클릭 핸들러
  const handleStaffClick = (staffId: string, staffName: string) => {
    setSelectedStaffId(staffId);
    setSelectedStaffName(staffName);
    setIsStaffDetailOpen(true);
  };

  // 프로젝트 하위 업무 확장/축소 토글
  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t?.staffProjectOverview || "직원별 프로젝트 진행 현황"}</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={globalT?.department || "부서 선택"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t?.allDepartments || "전체 부서"}</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={globalT?.status || "상태 선택"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t?.allStatus || "전체 상태"}</SelectItem>
                <SelectItem value="in-progress">{projectsT?.statusActive || "진행중"}</SelectItem>
                <SelectItem value="planned">{t?.planned || "예정"}</SelectItem>
                <SelectItem value="completed">{projectsT?.statusCompleted || "완료"}</SelectItem>
                <SelectItem value="delayed">{projectsT?.statusDelayed || "지연"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t?.staffName || "직원명"}</TableHead>
              <TableHead>{globalT?.department || "부서"}</TableHead>
              <TableHead>{projectsT?.name || "프로젝트명"}</TableHead>
              <TableHead>{t?.clientName || "고객사"}</TableHead>
              <TableHead>{t?.period || "기간"}</TableHead>
              <TableHead>{globalT?.status || "상태"}</TableHead>
              <TableHead>{projectsT?.progress || "진행률"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffProjectData.map((staff) => {
              // 각 직원의 모든 프로젝트와 하위 업무를 포함한 행들을 계산
              const totalRows = staff.projects.reduce((acc, project) => {
                const isExpanded = expandedProjects.has(project.id);
                return acc + 1 + (isExpanded ? (project.tasks?.length || 0) : 0);
              }, 0);

              let currentRowIndex = 0;
              
              return staff.projects.map((project, projectIndex) => {
                const isExpanded = expandedProjects.has(project.id);
                const projectTasks = project.tasks || [];
                const isFirstProject = projectIndex === 0;
                
                const projectRow = (
                  <TableRow key={`${staff.staffId}-${project.id}`} className="border-b">
                    {isFirstProject && (
                      <>
                        <TableCell 
                          rowSpan={totalRows}
                          className="font-medium border-r bg-gray-50 dark:bg-gray-800/50"
                        >
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <Button
                              variant="link"
                              className="p-0 h-auto font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              onClick={() => handleStaffClick(staff.staffId, staff.staffName)}
                            >
                              {staff.staffName}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell 
                          rowSpan={totalRows}
                          className="border-r bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                        >
                          <div className="flex items-center gap-2">
                            <BuildingIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            {staff.department}
                          </div>
                        </TableCell>
                      </>
                    )}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {projectTasks.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleProjectExpansion(project.id)}
                          >
                            {isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                          </Button>
                        )}
                        <span>{project.name}</span>
                        {projectTasks.length > 0 && (
                          <Badge variant="outline" className="text-xs border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-600 dark:bg-gray-800/30 dark:text-gray-300">
                            {projectTasks.length}개 업무
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{project.clientName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <CalendarIcon className="w-3 h-3 text-gray-400" />
                        {formatDate(project.startDate)} ~ {formatDate(project.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="w-16" />
                        <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[2rem]">
                          {project.progress}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
                
                // 하위 업무 행들
                const taskRows = isExpanded ? projectTasks.map((task, taskIndex) => (
                  <TableRow key={`${staff.staffId}-${project.id}-task-${task.id}`} className="bg-blue-50/50 dark:bg-gray-800/30">
                    <TableCell className="pl-8">
                      <div className="flex items-center gap-2 text-sm">
                        <ListTodo className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                        <span 
                          className="inline-block w-2 h-2 rounded-full mr-1"
                          style={{ backgroundColor: getTaskPhaseInfo(task.taskPhase).color }}
                        />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{task.taskPhaseName}</span>
                        {task.title && task.title !== "업무" && task.title !== "제품 입력" && (
                          <span className="text-gray-500 dark:text-gray-400">({task.title})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">-</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <CalendarIcon className="w-3 h-3 text-gray-400" />
                        {formatDate(task.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={task.progress} className="w-16" />
                        <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[2rem]">
                          {task.progress}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : [];
                
                return [projectRow, ...taskRows];
              }).flat();
            }).flat()}
            {staffProjectData.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {t?.noMatchingProjects || "선택한 조건에 맞는 프로젝트가 없습니다."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    
    {/* 직원 상세 정보 모달 */}
    <StaffDetailDialog
      open={isStaffDetailOpen}
      onOpenChange={setIsStaffDetailOpen}
      staffId={selectedStaffId}
      staffName={selectedStaffName}
    />
    </>
  );
};

export default StaffProjectOverview; 