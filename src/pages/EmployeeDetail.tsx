import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { toast } from "../hooks/use-toast";
import { cn } from "../lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Building2,
  User,
  Briefcase,
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
  Users,
  Activity,
  Award,
  Shield,
  Crown,
  Star,
  Plus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// 슬라이드 패널 컴포넌트들
import SlidePanel from '../components/ui/slide-panel';
import JournalDetailPanel from '../components/journal/JournalDetailPanel';

const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    employees, 
    users, 
    departments, 
    positions, 
    corporations, 
    tasks, 
    projects,
    updateEmployee
  } = useAppContext();

  const [employee, setEmployee] = useState<any>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    english_name: '',
    employee_number: '',
    department_id: '',
    position_id: '',
    corporation_id: ''
  });

  // 할일 관리 상태
  const [todos, setTodos] = useState<any[]>([]);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: format(new Date(), 'yyyy-MM-dd')
  });

  // 업무 일지 상태
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [journal, setJournal] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    plans: '',
    completed: '',
    notes: '',
    nextDayPlans: ''
  });
  const [journals, setJournals] = useState<any[]>([
    {
      id: '1',
      date: '2025-06-05',
      plans: '프로젝트 테스트 진행\n클라이언트 미팅 준비\n코드 리뷰 및 버그 수정',
      completed: '테스트 케이스 작성 완료\n미팅 자료 준비 완료\n3개 버그 수정 완료',
      notes: '클라이언트가 새로운 요구사항을 제시함\n성능 최적화 필요\n다음 주 배포 예정',
      nextDayPlans: '새 기능 개발 시작\n팀 회의 참석\n문서 업데이트',
      createdAt: '2025-06-05T09:00:00.000Z',
      updatedAt: '2025-06-05T18:30:00.000Z'
    },
    {
      id: '2',
      date: '2025-06-04',
      plans: 'API 설계 및 구현\n데이터베이스 스키마 검토',
      completed: 'REST API 3개 엔드포인트 구현\n데이터베이스 정규화 완료',
      notes: 'API 응답 시간 개선 필요\n보안 검토 예정',
      nextDayPlans: '프론트엔드 연동 테스트\n보안 점검',
      createdAt: '2025-06-04T09:15:00.000Z'
    },
    {
      id: '3',
      date: '2025-06-03',
      plans: '요구사항 분석\n프로토타입 개발',
      completed: '요구사항 문서 작성\n기본 UI 프로토타입 완성',
      notes: '사용자 피드백 긍정적\n추가 기능 요청 있음',
      nextDayPlans: 'API 개발 착수\n상세 설계 진행',
      createdAt: '2025-06-03T10:00:00.000Z'
    }
  ]);

  // 슬라이드 패널 상태
  const [isJournalPanelOpen, setIsJournalPanelOpen] = useState(false);
  const [selectedJournalForDetail, setSelectedJournalForDetail] = useState<any>(null);

  // 직원 데이터 찾기
  useEffect(() => {
    if (id) {
      let foundEmployee = employees.find(emp => emp.id === id);
      if (!foundEmployee) {
        foundEmployee = users.find(user => user.id === id) as any;
      }
      setEmployee(foundEmployee);
    }
  }, [id, employees, users]);

  // 선택된 날짜가 변경되면 해당 날짜의 일지 로드
  useEffect(() => {
    loadJournalForDate(selectedDate);
  }, [selectedDate]);

  // 2주치 달력을 위한 상태
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    return monday;
  });

  // 2주치 날짜 배열 생성
  const getTwoWeeksDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // 날짜별 일지 및 할일 데이터 가져오기
  const getScheduleForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayJournal = journals.find(j => j.date === dateStr);
    const dayTodos = todos.filter(todo => todo.dueDate === dateStr);
    
    return {
      journal: dayJournal,
      todos: dayTodos,
      hasEvents: !!dayJournal || dayTodos.length > 0
    };
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return dateString;
      return format(date, 'yyyy-MM-dd', { locale: ko });
    } catch (error) {
      return dateString;
    }
  };

  // 부서명 가져오기 함수
  const getDepartmentName = (employee: any) => {
    if (employee.department && typeof employee.department === 'object' && employee.department.name) {
      return employee.department.name;
    }
    if (employee.department_id) {
      const dept = departments.find(d => d.id === employee.department_id);
      if (dept) return dept.name;
    }
    if (typeof employee.department === 'string') {
      const dept = departments.find(d => d.code === employee.department);
      if (dept) return dept.name;
      return employee.department;
    }
    return '미지정';
  };

  // 법인명 가져오기 함수
  const getCorporationName = (corporationId?: string) => {
    if (!corporationId) return '미지정';
    const corporation = corporations.find(c => c.id === corporationId);
    return corporation?.name || '미지정';
  };

  // 직책명 가져오기 함수
  const getPositionName = (positionId?: string) => {
    if (!positionId) return '미지정';
    const position = positions.find(p => p.id === positionId);
    return position?.name || '미지정';
  };

  // 직원의 업무 통계 계산
  const employeeStats = useMemo(() => {
    if (!employee) return {
      totalTasks: 0,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      totalProjects: 0,
      projectsInvolved: []
    };

    const employeeTasks = tasks.filter(task => task.assignedTo === employee.id);
    const projectsInvolved = projects.filter(project => 
      employeeTasks.some(task => task.projectId === project.id)
    );

    const today = new Date();
    const overdue = employeeTasks.filter(task => {
      if (task.status === 'completed' || task.status === 'done') return false;
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < today;
    }).length;

    return {
      totalTasks: employeeTasks.length,
      notStarted: employeeTasks.filter(task => task.status === 'not-started' || task.status === 'planned').length,
      inProgress: employeeTasks.filter(task => task.status === 'in-progress' || task.status === 'active').length,
      completed: employeeTasks.filter(task => task.status === 'completed' || task.status === 'done').length,
      overdue,
      totalProjects: projectsInvolved.length,
      projectsInvolved
    };
  }, [employee, tasks, projects]);

  // 역할 정보 가져오기
  const getRoleInfo = (role?: string) => {
    switch (role) {
      case 'admin':
        return { name: '관리자', icon: Crown, color: 'bg-red-500', textColor: 'text-red-600' };
      case 'manager':
        return { name: '매니저', icon: Shield, color: 'bg-blue-500', textColor: 'text-blue-600' };
      default:
        return { name: '사용자', icon: Star, color: 'bg-green-500', textColor: 'text-green-600' };
    }
  };

  // 프로필 수정 핸들러
  const handleEditProfile = () => {
    setProfileData({
      name: employee.name || '',
      english_name: employee.english_name || '',
      employee_number: employee.employee_number || '',
      department_id: employee.department_id || '',
      position_id: employee.position_id || '',
      corporation_id: employee.corporation_id || ''
    });
    setIsEditProfileOpen(true);
  };

  // 프로필 저장 핸들러
  const handleSaveProfile = async () => {
    try {
      await updateEmployee(employee.id, profileData);
      toast({
        title: "성공",
        description: "프로필이 업데이트되었습니다.",
      });
      setIsEditProfileOpen(false);
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      toast({
        title: "오류",
        description: "프로필 업데이트에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // 할일 관리 함수들
  const handleAddTodo = () => {
    if (!newTodo.title.trim()) return;
    
    const todo = {
      id: Date.now().toString(),
      title: newTodo.title,
      description: newTodo.description,
      priority: newTodo.priority,
      dueDate: newTodo.dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
      employeeId: employee.id
    };
    
    setTodos([...todos, todo]);
    setNewTodo({ title: '', description: '', priority: 'Medium', dueDate: format(new Date(), 'yyyy-MM-dd') });
    setIsAddingTodo(false);
    
    toast({
      title: "할일 추가됨",
      description: "새로운 할일이 추가되었습니다.",
    });
  };

  const toggleTodoComplete = (todoId: string) => {
    setTodos(todos.map(todo => 
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (todoId: string) => {
    setTodos(todos.filter(todo => todo.id !== todoId));
    toast({
      title: "할일 삭제됨",
      description: "할일이 삭제되었습니다.",
    });
  };

  const updateTodoPriority = (todoId: string, priority: string) => {
    setTodos(todos.map(todo => 
      todo.id === todoId ? { ...todo, priority } : todo
    ));
  };

  // 업무 일지 함수들
  const handleSaveJournal = () => {
    const existingIndex = journals.findIndex(j => j.date === journal.date);
    
    if (existingIndex >= 0) {
      const updatedJournals = [...journals];
      updatedJournals[existingIndex] = { ...journal, updatedAt: new Date().toISOString() };
      setJournals(updatedJournals);
    } else {
      setJournals([...journals, { ...journal, id: Date.now().toString(), createdAt: new Date().toISOString() }]);
    }
    
    toast({
      title: "일지 저장됨",
      description: "업무 일지가 저장되었습니다.",
    });
  };

  const loadJournalForDate = (date: string) => {
    const existingJournal = journals.find(j => j.date === date);
    if (existingJournal) {
      setJournal(existingJournal);
    } else {
      setJournal({
        date,
        plans: '',
        completed: '',
        notes: '',
        nextDayPlans: ''
      });
    }
  };

  // 일지 상세 보기 핸들러
  const handleJournalClick = (journalEntry: any) => {
    setSelectedJournalForDetail(journalEntry);
    setIsJournalPanelOpen(true);
  };

  // 일지 편집 핸들러 (슬라이드 패널에서)
  const handleEditJournalFromPanel = () => {
    if (selectedJournalForDetail) {
      setSelectedDate(selectedJournalForDetail.date);
      loadJournalForDate(selectedJournalForDetail.date);
      setIsJournalPanelOpen(false);
      // 일지 탭으로 이동
      const tabs = document.querySelector('[data-state="active"][value="journal"]');
      if (!tabs) {
        const journalTab = document.querySelector('[value="journal"]') as HTMLElement;
        journalTab?.click();
      }
    }
  };

  // 우선순위별 할일 그룹화
  const todosByPriority = useMemo(() => {
    return {
      'High': todos.filter(todo => todo.priority === 'High' && !todo.completed),
      'Medium': todos.filter(todo => todo.priority === 'Medium' && !todo.completed),
      'Low': todos.filter(todo => todo.priority === 'Low' && !todo.completed),
      'Completed': todos.filter(todo => todo.completed)
    };
  }, [todos]);

  // 우선순위별 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800';
      case 'Medium': return 'border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800';
      case 'Low': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800';
      case 'Completed': return 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-900/10 dark:border-gray-800';
    }
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                직원을 찾을 수 없습니다
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                요청한 직원이 존재하지 않거나 삭제되었습니다.
              </p>
              <Button onClick={() => navigate('/employees')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                직원 목록으로 돌아가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const roleInfo = getRoleInfo(employee.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/employees')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              직원 목록
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {employee.name}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={handleEditProfile} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              프로필 수정
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 직원 프로필 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 왼쪽: 직원 프로필 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  직원 프로필
                </h3>
                
                <div className="flex items-start gap-6">
                  <Avatar className="w-32 h-32 shadow-lg ring-4 ring-gray-200 dark:ring-gray-700">
                    <AvatarImage
                      src={employee.avatar}
                      alt={employee.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {employee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                        {employee.name}
                      </h4>
                      {employee.english_name && (
                        <p className="text-gray-600 dark:text-gray-400">
                          {employee.english_name}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <roleInfo.icon className={`w-4 h-4 ${roleInfo.textColor}`} />
                      <Badge className={cn(roleInfo.color, "text-white")}>
                        {roleInfo.name}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4 mr-2" />
                        <span>{employee.employee_number || '사번 미지정'}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Building2 className="w-4 h-4 mr-2" />
                        <span>{getDepartmentName(employee)}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Briefcase className="w-4 h-4 mr-2" />
                        <span>{getPositionName(employee.position_id)}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>입사일: {formatDate(employee.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 업무현황 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  업무현황
                </h3>
                
                {/* 업무 진행률 */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">전체 업무 진행률</span>
                    <span className="text-lg font-bold text-blue-600">
                      {employeeStats.totalTasks > 0 ? Math.round((employeeStats.completed / employeeStats.totalTasks) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={employeeStats.totalTasks > 0 ? (employeeStats.completed / employeeStats.totalTasks) * 100 : 0} 
                    className="h-3" 
                  />
                </div>

                {/* 상태별 업무 분포 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">상태별 업무 분포</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{employeeStats.totalTasks}</div>
                      <div className="text-xs text-blue-600">총 업무</div>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-orange-600">{employeeStats.inProgress}</div>
                      <div className="text-xs text-orange-600">진행중</div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{employeeStats.completed}</div>
                      <div className="text-xs text-green-600">완료</div>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">{employeeStats.overdue}</div>
                      <div className="text-xs text-red-600">지연</div>
                    </div>
                  </div>
                </div>

                {/* 최근 업무 활동 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">최근 업무 활동</h4>
                  
                  {employeeStats.totalTasks > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {tasks.filter(task => task.assignedTo === employee.id).slice(0, 5).map((task) => {
                        const project = projects.find(p => p.id === task.projectId);
                        return (
                          <div key={task.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded border">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {task.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {project?.name || '미지정'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  task.status === 'completed' || task.status === 'done' 
                                    ? "border-green-500 text-green-600" 
                                    : task.status === 'in-progress' || task.status === 'active'
                                    ? "border-orange-500 text-orange-600"
                                    : "border-gray-500 text-gray-600"
                                )}
                              >
                                {task.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">담당한 업무가 없습니다</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 탭 섹션 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  담당 업무
                </TabsTrigger>
                <TabsTrigger value="todos" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  할일
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  일정
                </TabsTrigger>
                <TabsTrigger value="journal" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  업무 일지
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium">프로젝트 담당 업무 ({employeeStats.totalTasks}개)</h4>
                  </div>
                  
                  {employeeStats.totalTasks > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>업무명</TableHead>
                            <TableHead>프로젝트</TableHead>
                            <TableHead>상태</TableHead>
                            <TableHead>마감일</TableHead>
                            <TableHead>진행률</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks.filter(task => task.assignedTo === employee.id && task.projectId).map((task) => {
                            const project = projects.find(p => p.id === task.projectId);
                            return (
                              <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{project?.name || '미지정'}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline"
                                    className={cn(
                                      task.status === 'completed' || task.status === 'done' 
                                        ? "border-green-500 text-green-600" 
                                        : task.status === 'in-progress' || task.status === 'active'
                                        ? "border-orange-500 text-orange-600"
                                        : "border-gray-500 text-gray-600"
                                    )}
                                  >
                                    {task.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDate(task.dueDate)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress value={task.progress || 0} className="w-16" />
                                    <span className="text-sm">{task.progress || 0}%</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>프로젝트에 등록된 담당 업무가 없습니다</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* 할일 탭 - Notion 스타일 */}
              <TabsContent value="todos" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium flex items-center gap-2">
                      ⭐ TO-DO LIST
                    </h4>
                    <Button onClick={() => setIsAddingTodo(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      새 할일
                    </Button>
                  </div>

                  {/* 새 할일 추가 폼 */}
                  {isAddingTodo && (
                    <Card className="p-4 border-2 border-dashed border-blue-300">
                      <div className="space-y-3">
                        <Input
                          placeholder="할일 제목을 입력하세요"
                          value={newTodo.title}
                          onChange={(e) => setNewTodo({...newTodo, title: e.target.value})}
                        />
                        <Textarea
                          placeholder="설명 (선택사항)"
                          value={newTodo.description}
                          onChange={(e) => setNewTodo({...newTodo, description: e.target.value})}
                          rows={2}
                        />
                        <div className="flex gap-3">
                          <Select value={newTodo.priority} onValueChange={(value) => setNewTodo({...newTodo, priority: value})}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">높음</SelectItem>
                              <SelectItem value="Medium">보통</SelectItem>
                              <SelectItem value="Low">낮음</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="date"
                            value={newTodo.dueDate}
                            onChange={(e) => setNewTodo({...newTodo, dueDate: e.target.value})}
                            className="w-40"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddTodo} size="sm">추가</Button>
                          <Button onClick={() => setIsAddingTodo(false)} variant="outline" size="sm">취소</Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* 칸반 보드 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(todosByPriority).map(([priority, priorityTodos]) => (
                      <div key={priority} className={`rounded-lg border-2 p-4 ${getPriorityColor(priority)}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {priority === 'High' ? '🔴 높음' : 
                               priority === 'Medium' ? '🟡 보통' : 
                               priority === 'Low' ? '🔵 낮음' : '✅ 완료'}
                            </span>
                            <span className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
                              {priorityTodos.length}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {priorityTodos.map((todo) => (
                            <Card key={todo.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-2 flex-1">
                                    <button
                                      onClick={() => toggleTodoComplete(todo.id)}
                                      className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center ${
                                        todo.completed 
                                          ? 'bg-green-500 border-green-500' 
                                          : 'border-gray-300 hover:border-gray-400'
                                      }`}
                                    >
                                      {todo.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                                    </button>
                                    <div className="flex-1">
                                      <h5 className={`font-medium text-sm ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                                        {todo.title}
                                      </h5>
                                      {todo.description && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          {todo.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                    onClick={() => deleteTodo(todo.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>📅 {formatDate(todo.dueDate)}</span>
                                  <Select value={todo.priority} onValueChange={(value) => updateTodoPriority(todo.id, value)}>
                                    <SelectTrigger className="h-6 w-16 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="High">높음</SelectItem>
                                      <SelectItem value="Medium">보통</SelectItem>
                                      <SelectItem value="Low">낮음</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </Card>
                          ))}
                          
                          {priorityTodos.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                              할일이 없습니다
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* 일정 탭 - 2주치 달력 */}
              <TabsContent value="schedule" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium flex items-center gap-2">
                      🗓️ 일정 관리
                    </h4>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newStart = new Date(currentWeekStart);
                          newStart.setDate(currentWeekStart.getDate() - 14);
                          setCurrentWeekStart(newStart);
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        이전 2주
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          const dayOfWeek = today.getDay();
                          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                          const monday = new Date(today);
                          monday.setDate(today.getDate() + mondayOffset);
                          setCurrentWeekStart(monday);
                        }}
                      >
                        오늘
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newStart = new Date(currentWeekStart);
                          newStart.setDate(currentWeekStart.getDate() + 14);
                          setCurrentWeekStart(newStart);
                        }}
                      >
                        다음 2주
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 2주치 달력 */}
                  <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                    {/* 첫 번째 주 */}
                    <div className="mb-4">
                      {/* 첫 번째 주 헤더 */}
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 text-center">
                        <h5 className="font-semibold">
                          {format(currentWeekStart, 'yyyy년 M월 d일', { locale: ko })} - {format(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000), 'M월 d일', { locale: ko })}
                        </h5>
                      </div>

                      {/* 첫 번째 주 요일 헤더 */}
                      <div className="grid grid-cols-7 bg-gray-100 dark:bg-gray-600">
                        {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                          <div key={index} className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-500 last:border-r-0">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* 첫 번째 주 날짜 그리드 */}
                      <div className="grid grid-cols-7">
                        {getTwoWeeksDates().slice(0, 7).map((date, index) => {
                          const schedule = getScheduleForDate(date);
                          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                          
                          return (
                            <div 
                              key={index} 
                              className={`
                                relative p-2 border-r border-b border-gray-200 dark:border-gray-600 last:border-r-0 min-h-[120px] cursor-pointer transition-all hover:bg-blue-50 dark:hover:bg-gray-600
                                ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : ''}
                                ${isWeekend ? 'bg-red-50 dark:bg-red-900/10' : ''}
                                ${schedule.hasEvents ? 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20' : ''}
                              `}
                              onClick={() => {
                                setSelectedDate(format(date, 'yyyy-MM-dd'));
                                loadJournalForDate(format(date, 'yyyy-MM-dd'));
                              }}
                            >
                              {/* 날짜 표시 */}
                              <div className={`
                                text-sm font-medium mb-1
                                ${isToday ? 'text-blue-700 dark:text-blue-300' : ''}
                                ${isWeekend ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
                              `}>
                                {format(date, 'd')}
                              </div>

                              {/* 일지가 있는 경우 */}
                              {schedule.journal && (
                                <div className="mb-1">
                                  <div className="w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-1"></div>
                                  <div className="text-xs text-green-700 dark:text-green-300 font-medium truncate">
                                    📝 업무일지
                                  </div>
                                </div>
                              )}

                              {/* 할일이 있는 경우 */}
                              {schedule.todos.length > 0 && (
                                <div className="space-y-1">
                                  {schedule.todos.slice(0, 2).map((todo, todoIndex) => (
                                    <div 
                                      key={todoIndex}
                                      className={`
                                        text-xs p-1 rounded text-white text-center truncate
                                        ${todo.priority === 'High' ? 'bg-red-500' : 
                                          todo.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}
                                        ${todo.completed ? 'opacity-50 line-through' : ''}
                                      `}
                                    >
                                      {todo.completed ? '✅' : '📌'} {todo.title}
                                    </div>
                                  ))}
                                  {schedule.todos.length > 2 && (
                                    <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                                      +{schedule.todos.length - 2}개 더
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 오늘 표시 */}
                              {isToday && (
                                <div className="absolute top-1 right-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 두 번째 주 */}
                    <div>
                      {/* 두 번째 주 헤더 */}
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 text-center">
                        <h5 className="font-semibold">
                          {format(new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000), 'yyyy년 M월 d일', { locale: ko })} - {format(new Date(currentWeekStart.getTime() + 13 * 24 * 60 * 60 * 1000), 'M월 d일', { locale: ko })}
                        </h5>
                      </div>

                      {/* 두 번째 주 요일 헤더 */}
                      <div className="grid grid-cols-7 bg-gray-100 dark:bg-gray-600">
                        {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                          <div key={index} className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-500 last:border-r-0">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* 두 번째 주 날짜 그리드 */}
                      <div className="grid grid-cols-7">
                        {getTwoWeeksDates().slice(7, 14).map((date, index) => {
                          const schedule = getScheduleForDate(date);
                          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                          
                          return (
                            <div 
                              key={index + 7} 
                              className={`
                                relative p-2 border-r border-b border-gray-200 dark:border-gray-600 last:border-r-0 min-h-[120px] cursor-pointer transition-all hover:bg-blue-50 dark:hover:bg-gray-600
                                ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : ''}
                                ${isWeekend ? 'bg-red-50 dark:bg-red-900/10' : ''}
                                ${schedule.hasEvents ? 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20' : ''}
                              `}
                              onClick={() => {
                                setSelectedDate(format(date, 'yyyy-MM-dd'));
                                loadJournalForDate(format(date, 'yyyy-MM-dd'));
                              }}
                            >
                              {/* 날짜 표시 */}
                              <div className={`
                                text-sm font-medium mb-1
                                ${isToday ? 'text-blue-700 dark:text-blue-300' : ''}
                                ${isWeekend ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
                              `}>
                                {format(date, 'd')}
                              </div>

                              {/* 일지가 있는 경우 */}
                              {schedule.journal && (
                                <div className="mb-1">
                                  <div className="w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-1"></div>
                                  <div className="text-xs text-green-700 dark:text-green-300 font-medium truncate">
                                    📝 업무일지
                                  </div>
                                </div>
                              )}

                              {/* 할일이 있는 경우 */}
                              {schedule.todos.length > 0 && (
                                <div className="space-y-1">
                                  {schedule.todos.slice(0, 2).map((todo, todoIndex) => (
                                    <div 
                                      key={todoIndex}
                                      className={`
                                        text-xs p-1 rounded text-white text-center truncate
                                        ${todo.priority === 'High' ? 'bg-red-500' : 
                                          todo.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}
                                        ${todo.completed ? 'opacity-50 line-through' : ''}
                                      `}
                                    >
                                      {todo.completed ? '✅' : '📌'} {todo.title}
                                    </div>
                                  ))}
                                  {schedule.todos.length > 2 && (
                                    <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                                      +{schedule.todos.length - 2}개 더
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 오늘 표시 */}
                              {isToday && (
                                <div className="absolute top-1 right-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 선택된 날짜 상세 정보 */}
                  {selectedDate && (
                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
                      <CardContent className="p-4">
                        <h5 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          📅 {format(parseISO(selectedDate), 'yyyy년 M월 d일 (eee)', { locale: ko })} 상세
                        </h5>
                        
                        {(() => {
                          const selectedSchedule = getScheduleForDate(parseISO(selectedDate));
                          
                          if (!selectedSchedule.hasEvents) {
                            return (
                              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>이 날짜에는 일정이 없습니다</p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-3">
                              {/* 업무 일지 */}
                              {selectedSchedule.journal && (
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                  <h6 className="font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                                    📝 업무 일지
                                  </h6>
                                  {selectedSchedule.journal.plans && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                      <strong>계획:</strong> {selectedSchedule.journal.plans}
                                    </p>
                                  )}
                                  {selectedSchedule.journal.completed && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      <strong>완료:</strong> {selectedSchedule.journal.completed}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* 할일 목록 */}
                              {selectedSchedule.todos.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <h6 className="font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                                    📌 할일 ({selectedSchedule.todos.length}개)
                                  </h6>
                                  <div className="space-y-2">
                                    {selectedSchedule.todos.map((todo, index) => (
                                      <div key={index} className="flex items-center gap-2">
                                        <div className={`
                                          w-2 h-2 rounded-full
                                          ${todo.priority === 'High' ? 'bg-red-500' : 
                                            todo.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}
                                        `}></div>
                                        <span className={`
                                          text-sm flex-1
                                          ${todo.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}
                                        `}>
                                          {todo.completed ? '✅' : '⏳'} {todo.title}
                                        </span>
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs ${
                                            todo.priority === 'High' ? 'border-red-500 text-red-600' : 
                                            todo.priority === 'Medium' ? 'border-orange-500 text-orange-600' : 'border-blue-500 text-blue-600'
                                          }`}
                                        >
                                          {todo.priority === 'High' ? '높음' : todo.priority === 'Medium' ? '보통' : '낮음'}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* 업무 일지 탭 */}
              <TabsContent value="journal" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium">업무 일지</h4>
                    <div className="flex items-center gap-3">
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          loadJournalForDate(e.target.value);
                        }}
                        className="w-40"
                      />
                      <Button onClick={handleSaveJournal} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        저장
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 왼쪽: 일지 작성 */}
                    <div className="space-y-4">
                      <Card className="p-4">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="plans" className="text-sm font-medium">
                              📋 오늘의 계획
                            </Label>
                            <Textarea
                              id="plans"
                              value={journal.plans}
                              onChange={(e) => setJournal({...journal, plans: e.target.value})}
                              placeholder="오늘 할 일과 목표를 작성하세요..."
                              rows={4}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label htmlFor="completed" className="text-sm font-medium">
                              ✅ 완료한 업무
                            </Label>
                            <Textarea
                              id="completed"
                              value={journal.completed}
                              onChange={(e) => setJournal({...journal, completed: e.target.value})}
                              placeholder="완료한 업무와 성과를 기록하세요..."
                              rows={4}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label htmlFor="notes" className="text-sm font-medium">
                              📝 특이사항 및 메모
                            </Label>
                            <Textarea
                              id="notes"
                              value={journal.notes}
                              onChange={(e) => setJournal({...journal, notes: e.target.value})}
                              placeholder="회의 내용, 중요한 사항, 아이디어 등을 기록하세요..."
                              rows={3}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label htmlFor="nextDayPlans" className="text-sm font-medium">
                              🔮 내일 할 일
                            </Label>
                            <Textarea
                              id="nextDayPlans"
                              value={journal.nextDayPlans}
                              onChange={(e) => setJournal({...journal, nextDayPlans: e.target.value})}
                              placeholder="내일 해야 할 일과 준비사항을 미리 정리하세요..."
                              rows={3}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* 오른쪽: 일지 히스토리 */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium">📅 작성된 일지</h5>
                      
                      {journals.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {journals
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((journalEntry) => (
                            <Card 
                              key={journalEntry.id} 
                              className="p-4 hover:shadow-md transition-all cursor-pointer group border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                              onClick={() => handleJournalClick(journalEntry)}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    <span className="font-medium">{formatDate(journalEntry.date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {new Date(journalEntry.date).toLocaleDateString('ko', { weekday: 'short' })}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleJournalClick(journalEntry);
                                      }}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {journalEntry.plans && (
                                  <div>
                                    <span className="text-xs text-gray-500">계획:</span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                      {journalEntry.plans}
                                    </p>
                                  </div>
                                )}
                                
                                {journalEntry.completed && (
                                  <div>
                                    <span className="text-xs text-gray-500">완료:</span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                      {journalEntry.completed}
                                    </p>
                                  </div>
                                )}

                                {/* 클릭 힌트 */}
                                <div className="text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity pt-1 border-t border-gray-100 dark:border-gray-600">
                                  💡 클릭하여 상세 정보 보기
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>작성된 업무 일지가 없습니다</p>
                          <p className="text-sm">오늘부터 일지를 작성해보세요!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 일지 통계 */}
                  <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{journals.length}</div>
                        <div className="text-sm text-gray-600">총 작성 일수</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round((journals.length / 30) * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">이달 작성률</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {journals.filter(j => j.completed?.trim()).length}
                        </div>
                        <div className="text-sm text-gray-600">실제 완료 기록</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* 프로필 수정 다이얼로그 */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>프로필 수정</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">이름 *</Label>
                <Input
                  id="profile-name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-english-name">영문명</Label>
                <Input
                  id="profile-english-name"
                  value={profileData.english_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, english_name: e.target.value }))}
                  placeholder="영문명을 입력하세요"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-employee-number">사번</Label>
              <Input
                id="profile-employee-number"
                value={profileData.employee_number}
                onChange={(e) => setProfileData(prev => ({ ...prev, employee_number: e.target.value }))}
                placeholder="사번을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-department">부서</Label>
                <Select
                  value={profileData.department_id}
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, department_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="부서 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-position">직책</Label>
                <Select
                  value={profileData.position_id}
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, position_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="직책 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id}>
                        {pos.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-corporation">법인</Label>
              <Select
                value={profileData.corporation_id}
                onValueChange={(value) => setProfileData(prev => ({ ...prev, corporation_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="법인 선택" />
                </SelectTrigger>
                <SelectContent>
                  {corporations.map((corp) => (
                    <SelectItem key={corp.id} value={corp.id}>
                      {corp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveProfile}>
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일지 상세 정보 슬라이드 패널 */}
      <SlidePanel
        isOpen={isJournalPanelOpen}
        onClose={() => setIsJournalPanelOpen(false)}
        title="📝 업무 일지 상세"
        width="lg"
      >
        {selectedJournalForDetail && (
          <JournalDetailPanel
            journal={selectedJournalForDetail}
            onEdit={handleEditJournalFromPanel}
          />
        )}
      </SlidePanel>
    </div>
  );
};

export default EmployeeDetail;
