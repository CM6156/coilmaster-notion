import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Project, Task, Client, Notification, User, Department, Position, Corporation, Employee, Manager, CreateUserInput, CreateEmployeeInput, CreateManagerInput, CreateClientInput, CreateDepartmentInput, CreatePositionInput, CreateCorporationInput, WorkJournal, CreateWorkJournalInput, CreateWorkJournalFileInput, CreateWorkJournalCollaboratorInput, DepartmentCode, Phase, CreatePhaseInput } from '@/types';
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { telegramScheduler, exposeAppContextData, initializeTelegramScheduler } from '@/services/telegramScheduler';
import { 
  formatDateInTimezone, 
  isOptimalNotificationTime, 
  scheduleNotification,
  getTimezoneDisplayName 
} from '@/utils/timezone';
import { useToast } from "@/components/ui/use-toast";

// Status 타입 정의
export interface Status {
  id: string;
  name: string;
  description: string;
  color: string;
  order_index: number;
  is_active: boolean;
  status_type_id: string;
  status_type?: 'project' | 'task' | 'priority' | 'promotion';
  created_at: string;
  updated_at: string;
  translationKey?: string;
  descriptionKey?: string;
}

export type CreateStatusInput = Omit<Status, 'id' | 'created_at' | 'updated_at'>;

export interface ExtendedAppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  notifications: Notification[];
  departments: Department[];
  positions: Position[];
  phases: Phase[];
  corporations: Corporation[];
  employees: Employee[];
  managers: Manager[];
  workJournals: WorkJournal[];
  statuses: Status[]; // 상태 목록 추가
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updatedProject: Partial<Project>) => Promise<void>;
  removeProject: (id: string) => void;
  deleteProject: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<string>;
  updateTask: (id: string, updatedTask: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  removeTask: (id: string) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, updatedClient: Partial<Client>) => void;
  removeClient: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  createUser: (data: CreateUserInput) => Promise<void>;
  createEmployee: (data: CreateEmployeeInput) => Promise<void>;
  createManager: (data: CreateManagerInput) => Promise<void>;
  createClient: (data: {
    name: string;
    country?: string;
    manager_id: string;
    contact_number?: string;
    contact_email?: string;
    homepage?: string;
    flag?: string;
    remark?: string;
    requirements?: string;
  }) => Promise<void>;
  createDepartment: (data: CreateDepartmentInput) => Promise<void>;
  createPosition: (data: CreatePositionInput) => Promise<void>;
  createPhase: (data: CreatePhaseInput) => Promise<void>;
  createCorporation: (data: CreateCorporationInput) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  updateManager: (id: string, data: Partial<Manager>) => Promise<void>;
  updateDepartment: (id: string, data: Partial<Department>) => Promise<void>;
  updatePosition: (id: string, data: Partial<Position>) => Promise<void>;
  updatePhase: (id: string, data: Partial<Phase>) => Promise<void>;
  updateCorporation: (id: string, data: Partial<Corporation>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  deleteManager: (id: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  deletePosition: (id: string) => Promise<void>;
  deletePhase: (id: string) => Promise<void>;
  deleteCorporation: (id: string) => Promise<void>;
  createSubTask: (data: {
    title: string;
    description: string;
    projectId: string;
    parentTaskId: string;
    assignedTo?: string;
    dueDate: string;
    priority: string;
    department: string;
    status: string;
  }) => Promise<void>;
  calculateProjectProgress: (projectId: string) => number;
  createWorkJournal: (data: CreateWorkJournalInput) => Promise<void>;
  updateWorkJournal: (id: string, data: Partial<WorkJournal>) => Promise<void>;
  deleteWorkJournal: (id: string) => Promise<void>;
  loadWorkJournals: () => Promise<void>;
  loadStatuses: () => Promise<void>;
  createStatus: (data: CreateStatusInput) => Promise<void>;
  updateStatus: (id: string, data: Partial<Status>) => Promise<void>;
  deleteStatus: (id: string) => Promise<void>;
  getProjectStatuses: () => Status[];
  getTaskStatuses: () => Status[];
  getPriorityStatuses: () => Status[];
  createNotification: (type: string, message: string, userId?: string, relatedId?: string) => Promise<void>;
  createTimezoneAwareNotification: (type: string, message: string, targetUserId?: string, relatedId?: string, scheduleDelay?: number) => Promise<Notification>;
  createBulkTimezoneAwareNotifications: (type: string, message: string, userIds: string[], relatedId?: string) => Promise<any[]>;
  deleteNotification: (id: string) => Promise<void>;
  getUserNameById: (userId: string | null | undefined) => string;
  getUserById: (userId: string | null | undefined) => (User | Manager) | null;
  getAssigneeNames: (task: Task) => string;
  getIntegratedAssignees: () => Array<{
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    type: 'user' | 'manager';
    avatar?: string;
  }>;
  refreshAllData: () => Promise<void>;
  refreshCurrentUserRole: () => Promise<void>;
  getTranslatedPositionName: (position: Position, language: string) => string;
  getTranslatedDepartmentName: (department: Department, language: string) => string;
}

export const AppContext = createContext<ExtendedAppContextType>({} as ExtendedAppContextType);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [projectsList, setProjects] = useState<Project[]>([]);
  const [tasksList, setTasks] = useState<Task[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [subscriptions, setSubscriptions] = useState<RealtimeChannel[]>([]);
  const [workJournals, setWorkJournals] = useState<WorkJournal[]>([]);
  
  // console.log('AppContext - workJournals 상태:', {
  //   workJournals: workJournals,
  //   isArray: Array.isArray(workJournals),
  //   length: workJournals?.length || 0
  // });
  const [statuses, setStatuses] = useState<Status[]>([]); // 상태 목록 state 추가

  const { toast } = useToast();

  // UUID를 사용자 이름으로 변환하는 유틸리티 함수들
  const getUserNameById = (userId: string | null | undefined): string => {
    if (!userId || userId.trim() === '' || userId === 'unassigned') {
      return '미할당';
    }

    // users에서 ID로 찾기
    const user = usersList.find(u => u.id === userId);
    if (user) {
      return user.name;
    }

    // users에서 이름으로 찾기 (이미 이름일 수도 있음)
    const userByName = usersList.find(u => u.name === userId);
    if (userByName) {
      return userByName.name;
    }

    // managers에서 ID로 찾기
    const manager = managers.find(m => m.id === userId);
    if (manager) {
      return manager.name;
    }

    // managers에서 이름으로 찾기 (이미 이름일 수도 있음)
    const managerByName = managers.find(m => m.name === userId);
    if (managerByName) {
      return managerByName.name;
    }

    // 찾을 수 없으면 원래 값 반환 (이미 이름일 수도 있음)
    return userId;
  };

  const getUserById = (userId: string | null | undefined): (User | Manager) | null => {
    if (!userId || userId.trim() === '' || userId === 'unassigned') {
      return null;
    }

    // users에서 ID로 찾기
    const user = usersList.find(u => u.id === userId);
    if (user) {
      return user;
    }

    // users에서 이름으로 찾기
    const userByName = usersList.find(u => u.name === userId);
    if (userByName) {
      return userByName;
    }

    // managers에서 ID로 찾기
    const manager = managers.find(m => m.id === userId);
    if (manager) {
      return manager;
    }

    // managers에서 이름으로 찾기
    const managerByName = managers.find(m => m.name === userId);
    if (managerByName) {
      return managerByName;
    }

    return null;
  };

  // 통합된 담당자 목록 (사용자 + 담당자, 이메일 기준 중복 제거)
  const getIntegratedAssignees = () => {
    const emailMap = new Map();
    
    // 사용자 먼저 추가 (우선순위)
    usersList.forEach(user => {
      if (user.email && user.isActive !== false) {
        emailMap.set(user.email, {
          id: user.id,
          name: user.name,
          email: user.email,
          department: typeof user.department === 'string' ? user.department : '',
          role: user.role || 'user',
          type: 'user',
          avatar: user.avatar
        });
      }
    });
    
    // 담당자 추가 (이메일이 중복되지 않는 경우만)
    managers.forEach(manager => {
      if (manager.email && !emailMap.has(manager.email)) {
        emailMap.set(manager.email, {
          id: manager.id,
          name: manager.name,
          email: manager.email,
          department: manager.department?.name || '',
          role: 'manager',
          type: 'manager'
        });
      }
    });
    
    return Array.from(emailMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  // 다중 담당자 이름 포맷팅 함수
  const getAssigneeNames = (task: Task): string => {
    // 다중 담당자 정보가 있는 경우
    if (task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0) {
      const primaryAssignee = task.assignees.find(assignee => assignee.is_primary);
      const displayAssignee = primaryAssignee || task.assignees[0];
      const additionalCount = task.assignees.length - 1;

      if (additionalCount > 0) {
        return `${displayAssignee.user_name} 외 ${additionalCount}명`;
      } else {
        return displayAssignee.user_name;
      }
    }

    // 기존 단일 담당자 방식
    return getUserNameById(task.assignedTo);
  };

  // 사용자 직책 조회 함수
  const getUserPosition = (userId: string): string => {
    // 매니저 목록에서 찾기
    const manager = managers.find(m => m.id === userId);
    if (manager) return '리더';
    
    // 직원 목록에서 찾기  
    const employee = employees.find(e => e.id === userId);
    if (employee?.position?.name) return employee.position.name;
    
    // 사용자 목록에서 찾기
    const user = usersList.find(u => u.id === userId);
    if (user?.position) return user.position;
    
    return '사원';
  };

  // 실시간 구독 설정
  useEffect(() => {
    const setupSubscriptions = async () => {
      console.log("Setting up real-time subscriptions...");
      
      // 기존 구독 정리
      subscriptions.forEach(subscription => subscription.unsubscribe());
      
      // 클라이언트 테이블 구독
      // @ts-ignore - Supabase 타입 문제 무시
      const clientsSubscription = supabase
        .channel('clients_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'clients'
          },
          (payload) => {
            console.log("Client data changed:", payload);
            loadClients();
          }
        )
        .subscribe();

      // 매니저 테이블 구독
      // @ts-ignore - Supabase 타입 문제 무시
      const managersSubscription = supabase
        .channel('managers_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'managers'
          },
          (payload) => {
            console.log("Manager data changed:", payload);
            loadManagers();
          }
        )
        .subscribe();

      // 프로젝트 테이블 구독
      // @ts-ignore - Supabase 타입 문제 무시
      const projectsSubscription = supabase
        .channel('projects_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects'
          },
          (payload) => {
            console.log("Project data changed:", payload);
            loadProjects();
          }
        )
        .subscribe();

      // 업무 테이블 구독
      // @ts-ignore - Supabase 타입 문제 무시
      const tasksSubscription = supabase
        .channel('tasks_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks'
          },
          (payload) => {
            console.log("Task data changed:", payload);
            loadTasks();
          }
        )
        .subscribe();

      // 사용자 테이블 구독
      // @ts-ignore - Supabase 타입 문제 무시
      const usersSubscription = supabase
        .channel('users_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users'
          },
          (payload) => {
            console.log("Users data changed:", payload);
            loadUsers();
          }
        )
        .subscribe();

      // 부서 테이블 구독 추가
      // @ts-ignore - Supabase 타입 문제 무시
      const departmentsSubscription = supabase
        .channel('departments_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'departments'
          },
          (payload) => {
            console.log("🏢 부서 데이터 변경 감지:", payload);
            loadDepartments();
          }
        )
        .subscribe();

      setSubscriptions([
        clientsSubscription, 
        managersSubscription, 
        projectsSubscription, 
        tasksSubscription, 
        usersSubscription,
        departmentsSubscription
      ]);
      console.log("Real-time subscriptions set up successfully");
    };

    setupSubscriptions();

    // 컴포넌트 언마운트 시 구독 정리
    return () => {
      console.log("Cleaning up subscriptions...");
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, []);

  // 초기 데이터 로딩
  useEffect(() => {
    console.log("==== AppProvider useEffect 실행 ====");
    
    // 비동기 데이터 로드
    loadClients();
    loadUsers();
    loadProjects();
    loadDepartments();
    loadPositions();
    loadPhases();
    loadCorporations();
    loadEmployees();
    loadManagers();
    loadWorkJournals();
    loadStatuses();
    
    console.log("==== 데이터 로드 함수들 호출 완료 ====");
  }, []);

  // Supabase 인증 상태 확인 및 currentUser 설정
  useEffect(() => {
    console.log("==== 인증 상태 확인 시작 ====");
    const checkAuthAndSetUser = async () => {
      try {
        // Supabase 인증 상태 확인
        const { data: { user }, error } = await supabase.auth.getUser();
        
        console.log('=== AppContext 인증 확인 ===');
        console.log('Supabase auth user:', user);
        console.log('Auth error:', error);
        
        if (user && !error) {
          // 실제 로그인된 사용자가 있는 경우
          console.log('실제 로그인된 사용자 발견, users 테이블에서 정보 조회');
          
          // users 테이블에서 해당 사용자 정보 조회
          // @ts-ignore - Supabase 타입 문제 무시
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
              *,
              department:department_id(id, name, code),
              corporation:corporation_id(id, name, code),
              position:position_id(id, name, code)
            `)
            .eq('id', user.id)
            .single();
          
          if (userData && !userError) {
            console.log('users 테이블에서 사용자 정보 찾음:', userData);
            setCurrentUser(userData);
            
            // 사용자 온라인 상태로 업데이트
            try {
              // @ts-ignore - Supabase 타입 문제 무시
              const { error: onlineError } = await supabase
                .from('users')
                .update({
                  is_online: true,
                  last_seen: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  current_page: '대시보드'
                })
                .eq('id', user.id);
              
              if (onlineError) {
                // 컬럼이 존재하지 않는 경우 경고만 출력하고 계속 진행
                if (onlineError.code === '42703') {
                  console.log('온라인 상태 추적 컬럼들(is_online, last_seen, current_page)이 존재하지 않습니다.');
                } else {
                  console.error('온라인 상태 업데이트 오류:', onlineError);
                }
              } else {
                console.log('✅ 사용자 온라인 상태로 변경 완료');
              }
            } catch (onlineUpdateError) {
              console.error('온라인 상태 업데이트 중 오류:', onlineUpdateError);
            }
            
            // localStorage에 currentUser 백업
            localStorage.setItem("currentUser", JSON.stringify(userData));
            localStorage.setItem("lastUserLogin", new Date().toISOString());
          } else {
            console.log('users 테이블에 사용자 정보 없음, auth 정보로 기본 사용자 생성');
            // users 테이블에 사용자 정보가 없으면 기본 정보로 설정
            const basicUser = {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
              email: user.email || '',
              role: 'user',
              department: DepartmentCode.MANAGEMENT // 기본 부서 설정
            };
            setCurrentUser(basicUser);
            
            // localStorage에 기본 사용자 백업
            localStorage.setItem("currentUser", JSON.stringify(basicUser));
            localStorage.setItem("lastUserLogin", new Date().toISOString());
          }
        } else {
          console.log('Supabase 로그인 상태 없음, localStorage 확인 중...');
          
          // localStorage에서 최근 로그인 사용자 확인
          const savedUser = localStorage.getItem("currentUser");
          const lastLogin = localStorage.getItem("lastUserLogin");
          
          if (savedUser && lastLogin) {
            try {
              const parsedUser = JSON.parse(savedUser);
              const loginTime = new Date(lastLogin);
              const now = new Date();
              const timeDiff = now.getTime() - loginTime.getTime();
              const hoursDiff = timeDiff / (1000 * 60 * 60);
              
              // 48시간 이내 로그인한 사용자라면 복원
              if (hoursDiff < 48) {
                console.log('localStorage에서 최근 사용자 복원:', parsedUser);
                setCurrentUser(parsedUser);
                return;
              } else {
                console.log('localStorage 사용자 데이터가 너무 오래됨 (48시간 이상)');
                localStorage.removeItem("currentUser");
                localStorage.removeItem("lastUserLogin");
              }
            } catch (parseError) {
              console.error('localStorage 사용자 데이터 파싱 오류:', parseError);
              localStorage.removeItem("currentUser");
              localStorage.removeItem("lastUserLogin");
            }
          }
          
          // 로그인되지 않은 경우에만 더미 사용자 설정
          if (!currentUser) {
            const defaultUser = {
              id: "default-user-001",
              name: "관리자",
              email: "admin@coilmaster.com",
              department: DepartmentCode.MANAGEMENT,
              role: "admin"
            };
            setCurrentUser(defaultUser);
            console.log("기본 더미 사용자 설정:", defaultUser);
          }
        }
        console.log('==============================');
      } catch (error) {
        console.error('인증 상태 확인 중 오류:', error);
        // 오류 발생시에도 더미 사용자 설정
        if (!currentUser) {
          const defaultUser = {
            id: "default-user-001",
            name: "관리자",
            email: "admin@coilmaster.com",
            department: DepartmentCode.MANAGEMENT,
            role: "admin"
          };
          setCurrentUser(defaultUser);
          console.log("오류로 인한 기본 더미 사용자 설정:", defaultUser);
        }
      }
    };

    checkAuthAndSetUser();
  }, []);

  useEffect(() => {
    if (usersList.length > 0 && !currentUser) {
      setCurrentUser(usersList[0]);
    }
  }, [usersList, currentUser]);

  // 텔레그램 스케줄러 데이터 업데이트
  useEffect(() => {
    const contextData = {
      projects: projectsList,
      tasks: tasksList,
      users: usersList,
      managers: managers,
      employees: employees,
      departments: departments,
      positions: positions,
      corporations: corporations
    };
    
    // 전역 데이터 노출
    exposeAppContextData(contextData);
    
    // 텔레그램 설정이 있으면 스케줄러 초기화
    const savedSettings = localStorage.getItem('telegram_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      initializeTelegramScheduler(settings);
    }
  }, [projectsList, tasksList, usersList, managers, employees, departments, positions, corporations]);

  // 컴포넌트 언마운트 시 스케줄러 정리
  useEffect(() => {
    return () => {
      telegramScheduler.destroy();
    };
  }, []);

  const addProject = async (project: Omit<Project, 'id'>) => {
    try {
      console.log('🚀 프로젝트 생성 시작:', project);
      
      // 담당자 정보 조회 (관리자 패널의 담당자 관리와 연동)
      let managerId = null; // 외래키 제약 조건 문제로 일단 null 설정
      let picName = project.manager || '';
      
      if (project.manager) {
        // managers 테이블에서 이름으로 담당자 찾기
        const manager = managers.find(m => m.name === project.manager);
        if (manager) {
          // managerId = manager.id; // 외래키 제약 조건 문제로 주석 처리
          picName = manager.name;
          console.log('✅ 담당자 연동 성공 (이름만):', { name: picName });
        } else {
          console.log('⚠️ 담당자를 찾을 수 없어 이름만 저장:', project.manager);
        }
      }
      
      // 프로모션 단계 정보 조회 (phases 테이블과 연동)
      let currentPhaseId = null;
      if (project.promotionStage) {
        const phase = phases.find(p => p.name === project.promotionStage);
        if (phase) {
          currentPhaseId = phase.id;
          console.log('✅ 프로모션 단계 연동 성공:', { name: project.promotionStage, id: currentPhaseId });
        } else {
          console.log('⚠️ 프로모션 단계를 찾을 수 없음:', project.promotionStage);
        }
      }
      
      // Supabase에 저장할 프로젝트 데이터 (간소화)
      const insertData = {
        name: project.name || '',
        description: project.description || '',
        current_phase_id: currentPhaseId, // 프로모션 단계 ID (phases 테이블과 연동)
        progress: 0, // 시작 시 0%
        start_date: project.startDate,
        due_date: project.dueDate,
        pic_name: picName, // 담당자 이름만 저장
        // department_id: project.department, // 임시로 department_id 사용 (SQL 스크립트 실행 전까지)
        department_id: project.department, // 임시로 department_id 사용 (SQL 스크립트 실행 전까지)
        project_type: '일반', // 기본값
        request_date: project.requestDate || project.startDate,
        target_sop_date: project.targetSOPDate || project.dueDate,
        completed: false,
        team: JSON.stringify(project.team || []), // JSON 형태로 저장
        image: project.image || '', // 프로젝트 이미지
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📋 Supabase 저장 데이터:', insertData);
      console.log('📋 각 필드 확인:');
      console.log('- name:', insertData.name);
      console.log('- description:', insertData.description);
      console.log('- current_phase_id:', insertData.current_phase_id);
      console.log('- progress:', insertData.progress);
      console.log('- start_date:', insertData.start_date);
      console.log('- due_date:', insertData.due_date);
      console.log('- pic_name:', insertData.pic_name);
      console.log('- department_id:', insertData.department_id);
      console.log('- project_type:', insertData.project_type);
      console.log('- request_date:', insertData.request_date);
      console.log('- target_sop_date:', insertData.target_sop_date);
      console.log('- team (JSON):', insertData.team);
      console.log('- completed:', insertData.completed);
      
      const response = await supabase
        .from('projects')
        .insert([insertData])
        .select()
        .single();

      if (response.error) {
        console.error('❌ 프로젝트 생성 오류:', response.error);
        console.error('❌ 오류 상세 정보:');
        console.error('  - 코드:', response.error.code);
        console.error('  - 메시지:', response.error.message);
        console.error('  - 세부사항:', response.error.details);
        console.error('  - 힌트:', response.error.hint);
        throw new Error(response.error.message);
      }

      console.log('✅ 프로젝트 생성 성공:', response.data);
      
      // 로컬 상태에 프로젝트 추가
      const newProject = {
        ...response.data,
        clientName: '',
        manager: picName,
        // managerId는 제거
        phase: project.promotionStage || 'Promotion',
        type: '일반',
        projectType: '일반',
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at
      };
      
      setProjects([...projectsList, newProject]);

      // 성공 알림 생성 (시간대 기반)
      const userName = currentUser?.name || '사용자';
      const userPosition = getUserPosition(currentUser?.id || '');
      await createTimezoneAwareNotification(
        'project',
        `${userName} ${userPosition}님이 "${project.name}" 프로젝트를 등록하였습니다.`,
        currentUser?.id,
        newProject.id
      );

      console.log('🎉 프로젝트가 성공적으로 생성되었습니다!');
      return response.data;
      
    } catch (error) {
      console.error('❌ 프로젝트 생성 실패:', error);
      throw error;
    }
  };

  const updateProject = async (id: string, updatedProject: Partial<Project>) => {
    try {
      console.log("Updating project in Supabase:", id, updatedProject);
      
      // Project 타입을 Supabase 스키마에 맞게 변환
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // 실제 존재하는 컬럼들만 매핑
      if (updatedProject.name !== undefined) updateData.name = updatedProject.name;
      if (updatedProject.description !== undefined) updateData.description = updatedProject.description;
      // status와 promotion_status는 제약 조건 문제로 제거
      // if (updatedProject.status !== undefined) updateData.status = updatedProject.status;
      // if (updatedProject.promotionStatus !== undefined) updateData.promotion_status = updatedProject.promotionStatus;
      if (updatedProject.progress !== undefined) updateData.progress = updatedProject.progress;
      if (updatedProject.startDate !== undefined) updateData.start_date = updatedProject.startDate;
      if (updatedProject.dueDate !== undefined) updateData.due_date = updatedProject.dueDate;
      if (updatedProject.manager !== undefined) updateData.pic_name = updatedProject.manager;
      if (updatedProject.projectType !== undefined) updateData.project_type = updatedProject.projectType;
      if (updatedProject.requestDate !== undefined) updateData.request_date = updatedProject.requestDate;
      if (updatedProject.targetSOPDate !== undefined) updateData.target_sop_date = updatedProject.targetSOPDate;
      if (updatedProject.completed !== undefined) updateData.completed = updatedProject.completed;
      if (updatedProject.team !== undefined) updateData.team = updatedProject.team;
      if (updatedProject.image !== undefined) updateData.image = updatedProject.image;
      // 부서 정보 업데이트 수정 - department 필드 사용
      // if (updatedProject.department !== undefined) updateData.department = updatedProject.department;
      // 임시로 department 대신 department_id 사용 (SQL 스크립트 실행 전까지)
      if (updatedProject.department !== undefined) updateData.department_id = updatedProject.department;
      // 프로모션 단계 업데이트 (phases 테이블과 연동)
      if (updatedProject.promotionStage !== undefined) {
        const phase = phases.find(p => p.name === updatedProject.promotionStage);
        if (phase) {
          updateData.current_phase_id = phase.id;
        }
      }
      
      console.log("Sanitized update data for Supabase:", updateData);
      
      const { error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", id);
      
      if (error) {
        console.error("Error updating project in Supabase:", error);
        throw error;
      }
      
      console.log("Project updated successfully in Supabase");
      
      // 로컬 상태도 업데이트
    setProjects(
      projectsList.map((project) =>
        project.id === id
          ? { ...project, ...updatedProject, updatedAt: new Date().toISOString() }
          : project
      )
    );
      
    } catch (error) {
      console.error("Error in updateProject:", error);
      throw error;
    }
  };

  const removeProject = (id: string) => {
    setProjects(projectsList.filter((project) => project.id !== id));
  };

  const deleteProject = async (id: string) => {
    try {
      console.log("Deleting project from Supabase:", id);
      
      // 1. 먼저 해당 프로젝트의 모든 업무 삭제
      console.log("Deleting related tasks first...");
      const { error: tasksError } = await supabase
        .from("tasks")
        .delete()
        .eq("project_id", id);
      
      if (tasksError) {
        console.error("Error deleting related tasks:", tasksError);
        throw tasksError;
      }
      
      console.log("Related tasks deleted successfully");
      
      // 2. 프로젝트 삭제
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("Error deleting project from Supabase:", error);
        throw error;
      }
      
      console.log("Project deleted successfully from Supabase");
      
      // 로컬 상태에서도 제거 (실시간 구독이 있지만 즉시 반영을 위해)
      setProjects(projectsList.filter((project) => project.id !== id));
      
      // 관련 업무들도 로컬 상태에서 제거
      setTasks(tasksList.filter((task) => task.projectId !== id));
      
      // 알림 생성 (시간대 기반)
      const userName = currentUser?.name || '사용자';
      const userPosition = getUserPosition(currentUser?.id || '');
      await createTimezoneAwareNotification(
        'project',
        `${userName} ${userPosition}님이 프로젝트를 삭제하였습니다.`,
        currentUser?.id,
        id
      );
      
    } catch (error) {
      console.error("Error in deleteProject:", error);
      throw error;
    }
  };

  const addTask = async (task: Omit<Task, 'id'>): Promise<string> => {
    try {
      console.log('🚀 addTask 시작 - 입력 데이터:', task);
      
      // 삽입할 데이터 준비
      const insertData = {
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        progress: task.progress || 0,
        start_date: task.startDate || format(new Date(), 'yyyy-MM-dd'),
        due_date: task.dueDate,
        project_id: task.projectId,
        assigned_to: task.assignedTo,
        department: task.department,
        task_phase: task.taskPhase,
        parent_task_id: task.parentTaskId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // assigned_to 필드 처리 - 빈 문자열이나 'unassigned'인 경우 null로 변환
      const assignedToValue = task.assignedTo && task.assignedTo !== '' && task.assignedTo !== 'unassigned' 
        ? task.assignedTo 
        : null;
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          progress: task.progress || 0,
          start_date: task.startDate || format(new Date(), 'yyyy-MM-dd'),
          due_date: task.dueDate,
          project_id: task.projectId,
          assigned_to: assignedToValue, // 수정된 값 사용
          department: task.department, // 다시 추가
          task_phase: task.taskPhase, // taskPhase 필드 활성화
          parent_task_id: task.parentTaskId, // 부모 업무 ID 추가
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('Insert data that caused error:', insertData);
        throw error;
      }

      console.log('Task created successfully:', data);
      await loadTasks(); // 업무 목록 새로고침

      // 알림 생성
      const userName = currentUser?.name || '사용자';
      const userPosition = getUserPosition(currentUser?.id || '');
      
      // 하위 업무인지 확인
      const isSubtask = task.parentTaskId !== undefined && task.parentTaskId !== null;
      
      if (isSubtask) {
        await createNotification(
          'task',
          `${userName}님이 프로젝트에 하위 업무를 등록하였습니다. (${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: ko })})`,
          currentUser?.id
        );
      } else {
        await createNotification(
          'task',
          `${userName} ${userPosition}님이 업무 관리에 업무를 등록하였습니다. (${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: ko })})`,
          currentUser?.id
        );
      }

      return data.id; // 생성된 업무 ID 반환

    } catch (error) {
      console.error('Error in addTask:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, updatedTask: Partial<Task>) => {
    try {
      console.log("Updating task in Supabase:", id, updatedTask);
      
      // Task 타입을 Supabase 스키마에 맞게 변환
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // 각 필드를 Supabase 컬럼명으로 매핑
      if (updatedTask.title !== undefined) updateData.title = updatedTask.title;
      if (updatedTask.description !== undefined) updateData.description = updatedTask.description;
      if (updatedTask.status !== undefined) updateData.status = updatedTask.status;
      if (updatedTask.priority !== undefined) updateData.priority = updatedTask.priority;
      if (updatedTask.progress !== undefined) updateData.progress = updatedTask.progress;
      if (updatedTask.startDate !== undefined) updateData.start_date = updatedTask.startDate;
      if (updatedTask.dueDate !== undefined) updateData.due_date = updatedTask.dueDate;
      if (updatedTask.projectId !== undefined) updateData.project_id = updatedTask.projectId;
      if (updatedTask.assignedTo !== undefined) updateData.assigned_to = updatedTask.assignedTo === '' ? null : updatedTask.assignedTo;
      if (updatedTask.department !== undefined) updateData.department = updatedTask.department; // 다시 추가
      if (updatedTask.taskPhase !== undefined) updateData.task_phase = updatedTask.taskPhase; // task_phase 활성화
      if (updatedTask.parentTaskId !== undefined) updateData.parent_task_id = updatedTask.parentTaskId; // 부모 업무 ID 추가
      
      // 상태가 "완료"로 변경되는 경우 진행률도 100%로 설정 (이미 설정되지 않은 경우)
      if (updatedTask.status === '완료' && updatedTask.progress === undefined) {
        updateData.progress = 100;
        console.log('상태가 완료로 변경됨 - 진행률을 100%로 자동 설정');
      }
      // 상태가 "완료"가 아닌 다른 상태로 변경되고 진행률이 100%인 경우 적절히 조정
      else if (updatedTask.status && updatedTask.status !== '완료' && updatedTask.progress === undefined) {
        // 현재 업무의 진행률이 100%인지 확인
        const currentTask = tasksList.find(t => t.id === id);
        if (currentTask && currentTask.progress === 100) {
          updateData.progress = 80; // 진행중 상태로 간주하여 80%로 설정
          console.log('완료 상태에서 다른 상태로 변경됨 - 진행률을 80%로 자동 조정');
        }
      }
      
      console.log("Sanitized update data for Supabase:", updateData);
      
      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", id);
      
      if (error) {
        console.error("Error updating task in Supabase:", error);
        throw error;
      }
      
      console.log("Task updated successfully in Supabase");
      
      // 로컬 상태도 업데이트 (실시간 구독이 있지만 즉시 반영을 위해)
      setTasks(
        tasksList.map((task) =>
          task.id === id
            ? { ...task, ...updatedTask, updatedAt: new Date().toISOString() }
            : task
        )
      );
      
    } catch (error) {
      console.error("Error in updateTask:", error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      console.log("Deleting task from Supabase:", id);
      
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("Error deleting task from Supabase:", error);
        throw error;
      }
      
      console.log("Task deleted successfully from Supabase");
      
      // 로컬 상태에서도 제거 (실시간 구독이 있지만 즉시 반영을 위해)
      setTasks(tasksList.filter((task) => task.id !== id));
      
    } catch (error) {
      console.error("Error in deleteTask:", error);
      throw error;
    }
  };

  const removeTask = (id: string) => {
    setTasks(tasksList.filter((task) => task.id !== id));
  };

  const addClient = async (client: Omit<Client, 'id'>) => {
    try {
      console.log("Adding client to Supabase:", client);
      
      // 데이터 준비
      const insertData = {
        name: client.name,
        country: client.country || '',
        contact_person: client.contact_person || client.contactPerson || '',
        contact_email: client.contact_email || client.contactEmail || client.email || '',
        contact_number: client.contact_number || client.phone || '',
        sales_rep_id: client.sales_rep_id || client.salesRepId || null,
        manager_id: client.manager_id || null,
        requirements: client.requirements || '',
        homepage: client.homepage || '',
        flag: client.flag || '',
        remark: client.remark || '',
        files: client.files || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // UUID 필드의 빈 문자열을 null로 변환
      if (insertData.sales_rep_id === '') insertData.sales_rep_id = null;
      if (insertData.manager_id === '') insertData.manager_id = null;
      
      console.log("Sanitized insert data:", insertData);
      
      // Supabase에 클라이언트 데이터 삽입
      const { data, error } = await supabase
        .from("clients")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error("Error creating client in Supabase:", error);
        throw error;
      }

      console.log("Client created successfully:", data);
      
    } catch (error) {
      console.error("Error in addClient:", error);
      throw error;
    }
  };

  const updateClient = async (id: string, updatedClient: Partial<Client>) => {
    try {
      console.log("Updating client in Supabase:", id, updatedClient);
      
      const updateData = {
        name: updatedClient.name,
        country: updatedClient.country,
        contact_person: updatedClient.contact_person || updatedClient.contactPerson,
        contact_email: updatedClient.contact_email || updatedClient.contactEmail || updatedClient.email,
        contact_number: updatedClient.contact_number || updatedClient.phone,
        sales_rep_id: updatedClient.sales_rep_id || updatedClient.salesRepId,
        manager_id: updatedClient.manager_id,
        requirements: updatedClient.requirements,
        homepage: updatedClient.homepage,
        flag: updatedClient.flag,
        remark: updatedClient.remark,
        files: updatedClient.files,
        updated_at: new Date().toISOString(),
      };
      
      // undefined 값들과 빈 문자열들을 제거/변환
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
        // UUID 필드들의 빈 문자열을 null로 변환
        else if ((key === 'sales_rep_id' || key === 'manager_id') && updateData[key] === '') {
          updateData[key] = null;
        }
        // 일반 문자열 필드의 빈 문자열도 null로 변환 (선택사항)
        else if (typeof updateData[key] === 'string' && updateData[key] === '') {
          updateData[key] = null;
        }
      });
      
      console.log("Sanitized update data:", updateData);

      const { error } = await supabase
        .from("clients")
        .update(updateData)
        .eq("id", id);

      if (error) {
        console.error("Error updating client in Supabase:", error);
        console.error("Error details:", error.message, error.details, error.hint);
        throw error;
      }

      console.log("Client updated successfully");
      
    } catch (error) {
      console.error("Error in updateClient:", error);
      throw error;
    }
  };

  const removeClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting client from Supabase:", error);
        throw error;
      }

      // 실시간 구독으로 자동 업데이트되므로 추가 로컬 상태 업데이트는 불필요
      console.log("Client deleted successfully");
      
    } catch (error) {
      console.error("Error in removeClient:", error);
      throw error;
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true }))
    );
  };

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification = {
      ...notification,
      id: `notification-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setNotifications([newNotification as Notification, ...notifications]);
  };

  // 외부 텔레그램 알림 전송
  const sendExternalTimezoneNotification = async (message: string, userTimezone: string) => {
    try {
      console.log(`[외부 알림] 텔레그램 전송 준비: ${message} (${getTimezoneDisplayName(userTimezone)})`);
      
      // 여기서 텔레그램 서비스를 사용하여 외부 알림 전송
      // 텔레그램 설정이 완료된 후 실제 API 호출 구현
      
      // 임시로 콘솔 로그만 출력
      console.log(`📱 [텔레그램 알림] ${message}`);
      console.log(`🌍 시간대: ${getTimezoneDisplayName(userTimezone)}`);
      console.log(`⏰ 발송 시간: ${formatDateInTimezone(new Date(), userTimezone)}`);
      
    } catch (error) {
      console.error('외부 텔레그램 알림 전송 실패:', error);
    }
  };

  // 외부 알림 스케줄링
  const scheduleExternalNotification = async (message: string, userTimezone: string, scheduledTime: Date) => {
    try {
      console.log(`[외부 알림 스케줄] ${message}`);
      console.log(`⏰ 예정 시간: ${formatDateInTimezone(scheduledTime, userTimezone)}`);
      console.log(`🌍 시간대: ${getTimezoneDisplayName(userTimezone)}`);
      
      // 실제 스케줄링 로직 구현 (예: 타이머, 큐 시스템 등)
      // 현재는 로그만 출력
    } catch (error) {
      console.error('외부 알림 스케줄링 실패:', error);
    }
  };

  const createNotification = async (type: string, message: string, userId?: string, relatedId?: string) => {
    const newNotification: Notification = {
      id: `notification-${Date.now()}`,
      type,
      message,
      userId,
      read: false,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setNotifications([newNotification, ...notifications]);
  };

  // 시간대를 고려한 새로운 알림 생성 함수
  const createTimezoneAwareNotification = async (
    type: string, 
    message: string, 
    targetUserId?: string, 
    relatedId?: string,
    scheduleDelay: number = 0 // 분 단위
  ) => {
    try {
      // 대상 사용자의 시간대 정보 조회
      let userTimezone = 'Asia/Seoul'; // 기본값
      let targetUser = null;

      if (targetUserId) {
        // users 테이블에서 사용자 정보 조회
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, name, timezone')
          .eq('id', targetUserId)
          .single();

        if (!error && userData) {
          targetUser = userData;
          userTimezone = userData.timezone || 'Asia/Seoul';
        } else {
          // users 테이블에서 찾을 수 없으면 현재 사용자들에서 찾기
          const user = usersList.find(u => u.id === targetUserId);
          if (user && (user as any).timezone) {
            userTimezone = (user as any).timezone;
            targetUser = user;
          }
        }
      } else if (currentUser && (currentUser as any).timezone) {
        // 현재 사용자의 시간대 사용
        userTimezone = (currentUser as any).timezone;
        targetUser = currentUser;
      }

      console.log(`🕐 알림 생성 - 사용자: ${targetUser?.name || '알 수 없음'}, 시간대: ${userTimezone}`);

      // 현재 시간이 최적 알림 시간인지 확인
      const isOptimalTime = isOptimalNotificationTime(userTimezone);
      const currentTimeInUserTz = formatDateInTimezone(new Date(), userTimezone);

      console.log(`⏰ 현재 ${getTimezoneDisplayName(userTimezone)} 시간: ${currentTimeInUserTz}`);
      console.log(`📊 최적 알림 시간인가: ${isOptimalTime ? '예' : '아니오'}`);

      // 알림 메시지에 시간대 정보 추가
      let enhancedMessage = message;
      if (scheduleDelay > 0) {
        const scheduledTime = scheduleNotification(userTimezone, scheduleDelay);
        const scheduledTimeStr = formatDateInTimezone(scheduledTime, userTimezone);
        enhancedMessage += `\n⏰ 예정 시간: ${scheduledTimeStr} (${getTimezoneDisplayName(userTimezone)})`;
      } else {
        enhancedMessage += `\n⏰ 발송 시간: ${currentTimeInUserTz} (${getTimezoneDisplayName(userTimezone)})`;
      }

      // 최적 시간이 아닌 경우 경고 메시지 추가
      if (!isOptimalTime && scheduleDelay === 0) {
        enhancedMessage += `\n⚠️ 현재는 ${getTimezoneDisplayName(userTimezone)} 기준 비활성 시간입니다.`;
      }

      const newNotification: Notification = {
        id: `notification-${Date.now()}`,
        type,
        message: enhancedMessage,
        userId: targetUserId,
        read: false,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        // 추가 메타데이터
        metadata: {
          userTimezone,
          isOptimalTime,
          scheduleDelay,
          originalMessage: message
        }
      };

      setNotifications([newNotification, ...notifications]);

      // 외부 텔레그램 알림 전송
      if (isOptimalTime && scheduleDelay === 0) {
        // 최적 시간이면 즉시 외부 알림 전송
        await sendExternalTimezoneNotification(message, userTimezone);
      } else {
        // 스케줄된 알림의 경우 추가 처리
        if (scheduleDelay > 0) {
          console.log(`📅 ${scheduleDelay}분 후 알림 스케줄됨`);
          const scheduledTime = scheduleNotification(userTimezone, scheduleDelay);
          await scheduleExternalNotification(message, userTimezone, scheduledTime);
        } else {
          // 최적 시간이 아닌 경우 다음 최적 시간으로 스케줄
          const optimalTime = scheduleNotification(userTimezone);
          await scheduleExternalNotification(message, userTimezone, optimalTime);
        }
      }

      console.log('✅ 시간대 기반 알림 생성 완료 (외부 알림 포함)');
      return newNotification;
    } catch (error) {
      console.error('❌ 시간대 기반 알림 생성 실패:', error);
      // 에러 발생 시 기본 알림 생성하여 반환
      const fallbackNotification: Notification = {
        id: `notification-${Date.now()}`,
        type,
        message: `${message}\n⚠️ 시간대 처리 중 오류 발생`,
        userId: targetUserId,
        read: false,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        metadata: {
          userTimezone: 'Asia/Seoul',
          isOptimalTime: false,
          scheduleDelay: 0,
          originalMessage: message,
          error: true
        }
      };
      setNotifications([fallbackNotification, ...notifications]);
      return fallbackNotification;
    }
  };

  // 여러 사용자에게 각자의 시간대로 알림 전송
  const createBulkTimezoneAwareNotifications = async (
    type: string,
    message: string,
    userIds: string[],
    relatedId?: string
  ) => {
    const results = [];
    
    for (const userId of userIds) {
      try {
        const notification = await createTimezoneAwareNotification(type, message, userId, relatedId);
        results.push({ userId, success: true, notification });
      } catch (error) {
        console.error(`❌ 사용자 ${userId}에게 알림 전송 실패:`, error);
        results.push({ userId, success: false, error });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`📊 bulk 알림 전송 완료: ${successCount}/${userIds.length} 성공`);
    
    return results;
  };

  const deleteNotification = async (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const loadDepartments = async () => {
    try {
      console.log('🏢 부서 목록 로딩 시작...');
      
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("❌ 부서 로딩 오류:", error);
        return;
      }
      
      console.log('📊 Supabase에서 로드된 부서 데이터:', data);
      console.log('📊 부서 개수:', data?.length || 0);
      
      setDepartments(data || []);
      
      console.log('✅ 부서 목록 상태 업데이트 완료');
      
    } catch (error) {
      console.error("❌ loadDepartments 함수 오류:", error);
    }
  };

  const loadPositions = async () => {
    try {
      console.log("🔄 positions 데이터 로드 시작...");
      
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .order("level", { ascending: true });
        
      console.log("positions 데이터:", data);
      console.log("positions 에러:", error);
      
      if (error) {
        console.error("❌ positions 로드 에러:", error);
        
        // RLS 정책 문제일 수 있으니 임시로 빈 배열 설정
        setPositions([]);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log("⚠️ positions 테이블에 데이터 없음 - 기본 데이터 생성 권장");
        setPositions([]);
        return;
      }
      
      console.log(`✅ ${data.length}개의 positions 데이터 로드 성공`);
      setPositions(data || []);
    } catch (error) {
      console.error("❌ loadPositions 예외 발생:", error);
      setPositions([]);
    }
  };

  const loadPhases = async () => {
    try {
      const { data, error } = await supabase
        .from("phases")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
        
      if (error) {
        console.error("Error loading phases:", error);
        return;
      }
      
      // Supabase 데이터를 Phase 타입으로 변환
      const mappedPhases = (data || []).map(phase => ({
        id: phase.id,
        name: phase.name,
        description: phase.description || '',
        color: phase.color || '#3b82f6',
        order: phase.order_index,
        created_at: phase.created_at,
        updated_at: phase.updated_at,
      }));
      
      setPhases(mappedPhases);
    } catch (error) {
      console.error("Error in loadPhases:", error);
    }
  };

  const loadCorporations = async () => {
    const { data, error } = await supabase.from("corporations").select("*");
    if (error) {
      console.error("Error loading corporations:", error);
      return;
    }
    setCorporations(data);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        department:department_id(id, name, code),
        corporation:corporation_id(id, name, code),
        position:position_id(id, name, code)
      `);
    if (error) {
      console.error("Error loading users:", error);
      return;
    }
    setUsersList(data);
  };

  const loadEmployees = async () => {
    try {
      console.log("🔄 loadEmployees 시작 - employees 데이터 로드 중...");
      
      // 먼저 기본 employees 데이터만 조회
      const { data: basicData, error: basicError } = await supabase
        .from("employees")
        .select("*");
      
      console.log("기본 employees 데이터:", basicData);
      console.log("기본 employees 에러:", basicError);
      
      if (basicError) {
        console.error("❌ 기본 employees 조회 에러:", basicError);
        return;
      }
      
      if (!basicData || basicData.length === 0) {
        console.log("⚠️ employees 테이블에 데이터 없음");
        setEmployees([]);
        return;
      }
      
      console.log(`✅ ${basicData.length}개의 기본 employees 데이터 발견`);
      
      // JOIN을 포함한 상세 데이터 조회
      console.log("2️⃣ 관계형 데이터 포함한 상세 조회 시작...");
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          department:department_id(id, name, code),
          corporation:corporation_id(id, name, code),
          position:position_id(id, name, code)
        `);
        
      console.log("상세 employees 데이터:", data);
      console.log("상세 employees 에러:", error);
      
      if (error) {
        console.error("❌ 상세 employees 조회 에러:", error);
        // 에러가 있어도 기본 데이터라도 설정
        setEmployees(basicData || []);
        return;
      }
      
      console.log(`✅ ${data?.length || 0}개의 상세 employees 데이터 로드 성공`);
      
      // avatar 데이터 로그
      if (data && data.length > 0) {
        console.log('=== Avatar 데이터 확인 ===');
        data.forEach(emp => {
          if (emp.avatar) {
            console.log(`직원 ${emp.name}의 avatar:`, emp.avatar);
          } else {
            console.log(`직원 ${emp.name}의 avatar: 없음`);
          }
        });
      }
      
      setEmployees(data || []);
      
    } catch (error) {
      console.error("❌ loadEmployees 전체 에러:", error);
      setEmployees([]);
    }
  };

  const loadManagers = async () => {
    console.log("🔄 loadManagers 시작 - Supabase에서 담당자 로드 중...");
    
    try {
      // 담당자 테이블에서 전체 데이터를 로드하되, 조인 사용하지 않음
      console.log("1️⃣ managers 테이블 조회 시작...");
      const { data, error } = await supabase
        .from('managers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("❌ managers 조회 에러:", error);
        setManagers([]);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log("⚠️ managers 테이블에 데이터 없음");
        setManagers([]);
        return;
      }
      
      console.log(`✅ ${data.length}개의 managers 데이터 로드 성공`);
      
      // 관계형 데이터 수동 처리 (관련 항목 매핑)
      const enhancedManagers = data.map(manager => {
        // 법인 정보 찾기
        const corpData = corporations.find(c => c.id === manager.corporation_id);
        const corporation = corpData ? {
          id: corpData.id,
          name: corpData.name,
          code: corpData.code
        } : undefined;
        
        // 부서 정보 찾기
        const deptData = departments.find(d => d.id === manager.department_id);
        const department = deptData ? {
          id: deptData.id,
          name: deptData.name,
          code: deptData.code
        } : undefined;
        
        // 직책 정보 찾기
        const posData = positions.find(p => p.id === manager.position_id);
        const position = posData ? {
          id: posData.id,
          name: posData.name,
          code: posData.code
        } : undefined;
        
        // 확장된 담당자 객체 반환
        return {
          ...manager,
          corporation,
          department,
          position
        };
      });
      
      console.log(`✅ ${enhancedManagers.length}개의 확장 담당자 데이터 생성 완료`);
      console.log("첫 번째 담당자 샘플:", enhancedManagers.length > 0 ? enhancedManagers[0] : "없음");
      
      setManagers(enhancedManagers);
    } catch (catchError) {
      console.error("❌ loadManagers catch 에러:", catchError);
      
      // 최후의 수단으로 간단한 조회 시도
      try {
        const { data: fallbackData } = await supabase
          .from('managers')
          .select('id, name, email, created_at, updated_at');
        console.log("💡 폴백 데이터:", fallbackData);
        setManagers(fallbackData || []);
      } catch (fallbackError) {
        console.error("❌ 폴백 조회도 실패:", fallbackError);
        setManagers([]);
      }
    }
  };
  
  // 테스트용 함수 추가
  const testManagersConnection = async () => {
    console.log("🧪 managers 테이블 연결 테스트 시작...");
    
    try {
      const { data, error, count } = await supabase
        .from('managers')
        .select('*', { count: 'exact', head: false });
      
      console.log("테스트 결과:");
      console.log("- 데이터:", data);
      console.log("- 에러:", error);
      console.log("- 총 개수:", count);
      
      if (error) {
        console.log("테이블 접근 권한 또는 RLS 정책 문제일 수 있습니다.");
      }
      
      return { data, error, count };
    } catch (err) {
      console.error("테스트 중 오류:", err);
      return { data: null, error: err, count: 0 };
    }
  };
  
  // 전역에서 테스트 함수 접근 가능하도록 설정
  if (typeof window !== 'undefined') {
    (window as any).testManagersConnection = testManagersConnection;
  }

  const loadClients = async () => {
    try {
      console.log("Loading clients from Supabase...");
      
    const { data, error } = await supabase
      .from("clients")
      .select(`
        *,
        manager:manager_id(id, name, email)
      `);
      
    if (error) {
      console.error("Error loading clients:", error);
      return;
    }
      
      console.log("Raw client data from Supabase:", data);
      
      // Supabase 데이터를 Client 타입으로 변환
      const mappedClients = (data || []).map(client => ({
        id: client.id,
        name: client.name,
        manager_id: client.manager_id,
        country: client.country || '',
        contact_number: client.contact_number || '',
        contact_person: client.contact_person || '',
        contact_email: client.contact_email || '',
        sales_rep_id: (client.sales_rep_id || client.salesRepId || null) === '' ? null : (client.sales_rep_id || client.salesRepId || null),
        requirements: client.requirements || '',
        homepage: client.homepage || '',
        flag: client.flag || '',
        remark: client.remark || '',
        files: client.files || [],
        created_at: client.created_at,
        updated_at: client.updated_at,
        manager: client.manager,
        // 호환성을 위한 legacy 필드들
        contactPerson: client.contact_person || '',
        contactEmail: client.contact_email || '',
        salesRepId: client.sales_rep_id,
        salesRepName: client.manager?.name || '',
        email: client.contact_email || '',
        phone: client.contact_number || '',
        address: '',
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      }));
      
      console.log("Mapped client data:", mappedClients);
      console.log("Setting clients list with", mappedClients.length, "clients");
      
      setClientsList(mappedClients);
    } catch (error) {
      console.error("Error in loadClients:", error);
    }
  };

  const loadProjects = async () => {
    try {
      console.log("🔄 loadProjects 시작 - Supabase에서 프로젝트 로드 중...");
      
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          phase:current_phase_id(id, name, color, order_index)
        `);
      
      if (error) {
        console.error("Error loading projects:", error);
        return;
      }
      
      console.log("Raw project data from Supabase:", data);
      
      // Supabase 데이터를 Project 타입으로 변환 (관련 데이터는 클라이언트 사이드에서 매핑)
      const mappedProjects = (data || []).map(project => {
        // 클라이언트 정보 찾기
        const client = clientsList.find(c => c.id === project.client_id);
        // 매니저 정보는 pic_name에서 가져오기 (담당자는 PIC 필드에 저장됨)
        const picName = project.pic_name || '';
        
        // Phase 정보 처리 - promotion_stage 우선 사용
        let promotionStageValue = 'Promotion'; // 기본값
        
        // 1. 먼저 promotion_stage 필드 확인 (DB에 저장된 실제 값)
        if (project.promotion_stage) {
          promotionStageValue = project.promotion_stage;
        }
        // 2. phase 객체에서 이름 가져오기 (phases 테이블과 JOIN된 경우)
        else if (project.phase?.name) {
          promotionStageValue = project.phase.name;
        }
        // 3. current_phase_id가 있으면 phases 목록에서 찾기
        else if (project.current_phase_id && phases.length > 0) {
          const foundPhase = phases.find(p => p.id === project.current_phase_id);
          if (foundPhase) {
            promotionStageValue = foundPhase.name;
          }
        }
        
        console.log(`프로젝트 "${project.name}" 프로모션 단계 매핑:`, {
          promotion_stage: project.promotion_stage,
          phase_name: project.phase?.name,
          current_phase_id: project.current_phase_id,
          최종값: promotionStageValue
        });
        
        const phaseColor = project.phase?.color || '#ef4444';
        
        return {
          id: project.id,
          name: project.name,
          description: project.description || '',
          status: project.promotion_status || project.status || 'planned',
          progress: project.progress || 0,
          startDate: project.start_date,
          dueDate: project.due_date,
          clientId: project.client_id,
          clientName: client?.name || '',
          manager: picName, // pic_name을 manager로 매핑
          managerId: project.manager_id,
          department_id: project.department_id,
          department: project.department || project.department_id, // department 필드 추가
          phase: promotionStageValue, // 실제 프로모션 단계 사용
          currentPhase: promotionStageValue, // 실제 프로모션 단계 사용
          requestDate: project.request_date,
          targetSOPDate: project.target_sop_date,
          // 새로 추가된 필드들
          projectType: project.project_type,
          type: project.project_type,
          // 기본값들
          annualQuantity: 0,
          averageAmount: 0,
          annualAmount: 0,
          promotionStatus: project.promotion_status || 'planned',
          promotionStage: promotionStageValue as Project['promotionStage'], // 타입 캐스팅으로 안전하게 변환
          competitor: project.competitor || '',
          issueCorporation: project.issue_corporation_id || '',
          completed: project.completed || false,
          team: Array.isArray(project.team) ? project.team : (project.team ? JSON.parse(project.team) : []),
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          image: project.image || '',
        };
      });
      
      console.log("Mapped project data:", mappedProjects);
      console.log("Setting projects list with", mappedProjects.length, "projects");
      
      setProjects(mappedProjects);
      loadTasks();
    } catch (error) {
      console.error("Error in loadProjects:", error);
    }
  };

  // 완료 상태 업무들의 진행률을 100%로 수정하는 함수
  const fixCompletedTasksProgress = async () => {
    try {
      console.log('🔧 완료 상태 업무들의 진행률 수정 시작...');
      
      // 완료 상태이지만 진행률이 100%가 아닌 업무들 찾기
      const { data: incompleteTasks, error } = await supabase
        .from('tasks')
        .select('id, title, status, progress')
        .eq('status', '완료')
        .neq('progress', 100);

      if (error) {
        console.error('완료 상태 업무 조회 오류:', error);
        return;
      }

      if (!incompleteTasks || incompleteTasks.length === 0) {
        console.log('✅ 수정이 필요한 완료 상태 업무가 없습니다.');
        return;
      }

      console.log(`🔧 수정이 필요한 완료 상태 업무: ${incompleteTasks.length}개`);
      console.log('수정 대상 업무들:', incompleteTasks.map(t => ({ id: t.id, title: t.title, progress: t.progress })));

      // 일괄 업데이트
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          progress: 100,
          updated_at: new Date().toISOString()
        })
        .eq('status', '완료')
        .neq('progress', 100);

      if (updateError) {
        console.error('완료 상태 업무 진행률 수정 오류:', updateError);
        return;
      }

      console.log(`✅ ${incompleteTasks.length}개 완료 상태 업무의 진행률을 100%로 수정 완료`);
      
    } catch (error) {
      console.error('완료 상태 업무 진행률 수정 중 오류:', error);
    }
  };

  const loadTasks = async () => {
    try {
      console.log("🔄 loadTasks 시작 - Supabase에서 업무 로드 중...");
      
      // 완료 상태 업무들의 진행률을 먼저 수정
      await fixCompletedTasksProgress();
      
      // 기본 tasks 테이블에서 로드
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("❌ Supabase 업무 로드 오류:", error);
        console.error("❌ 오류 상세:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // 에러가 있는 경우 더미 데이터 사용
        console.log("🔄 더미 데이터로 폴백");
        setTasks(getDummyTasks());
        return;
      }
      
      console.log("✅ Supabase에서 업무 로드 성공:", data?.length || 0, "개");
      console.log("📋 로드된 원본 데이터:", data);
      
      // Supabase에서 로드한 데이터가 있는 경우
      if (data && data.length > 0) {
        // Supabase 데이터를 Task 타입으로 변환
        const mappedTasks = data.map(task => {
          const mappedTask = {
            id: task.id,
            title: task.title,
            description: task.description || '',
            status: task.status || 'not-started',
            priority: task.priority || 'medium',
            progress: task.progress || 0,
            startDate: task.start_date,
            dueDate: task.due_date,
            projectId: task.project_id,
            assignedTo: task.assigned_to,
            department: task.department || '',
            taskPhase: task.task_phase,
            parentTaskId: task.parent_task_id,
            createdAt: task.created_at,
            updatedAt: task.updated_at,
          };
          
          console.log("🔄 업무 매핑:", {
            원본: { id: task.id, title: task.title, task_phase: task.task_phase },
            변환: { id: mappedTask.id, title: mappedTask.title, taskPhase: mappedTask.taskPhase }
          });
          
          return mappedTask;
        });
        
        console.log("Mapped task data:", mappedTasks);
        console.log("Tasks with parent_task_id:", mappedTasks.filter(t => t.parentTaskId));
        console.log("Setting tasks list with", mappedTasks.length, "tasks");
        
        setTasks(mappedTasks);
        console.log("Tasks state updated successfully");
      } else {
        // Supabase에서 데이터가 없는 경우 더미 데이터 사용
        console.log("No data from Supabase, using dummy task data");
        setTasks(getDummyTasks());
      }
    } catch (error) {
      console.error("Error in loadTasks:", error);
      // 예외 발생시에도 더미 데이터 사용
      console.log("Using dummy task data due to exception");
      setTasks(getDummyTasks());
    }
  };

  // 더미 업무 데이터 생성 함수
  const getDummyTasks = () => {
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

    const dummyTasks = [
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
        assignedTo: usersList.length > 0 ? usersList[0].id : 'default-user-001',
        department: departments.length > 0 ? departments[0].id : 'development',
        taskPhase: 'phase-1', // 기획 단계
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      // 하위 업무 추가
      {
        id: 'dummy-1-1',
        title: 'ERD 작성',
        description: '엔티티 관계 다이어그램 작성',
        status: '진행중',
        priority: '높음',
        progress: 50,
        startDate: '2024-01-01',
        dueDate: '2024-01-10',
        projectId: 'project-1',
        assignedTo: usersList.length > 0 ? usersList[0].id : 'default-user-001',
        department: departments.length > 0 ? departments[0].id : 'development',
        taskPhase: 'phase-1', // 기획 단계
        parentTaskId: 'dummy-1', // 부모 업무 ID 추가
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'dummy-1-2',
        title: '테이블 스키마 정의',
        description: '각 테이블의 컬럼과 제약조건 정의',
        status: '할 일',
        priority: '보통',
        progress: 0,
        startDate: '2024-01-05',
        dueDate: '2024-01-12',
        projectId: 'project-1',
        assignedTo: usersList.length > 1 ? usersList[1].id : (usersList.length > 0 ? usersList[0].id : 'default-user-001'),
        department: departments.length > 0 ? departments[0].id : 'development',
        taskPhase: 'phase-1', // 기획 단계
        parentTaskId: 'dummy-1', // 부모 업무 ID 추가
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
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
        assignedTo: usersList.length > 1 ? usersList[1].id : (usersList.length > 0 ? usersList[0].id : 'default-user-001'),
        department: departments.length > 0 ? departments[0].id : 'development',
        taskPhase: 'phase-2', // 개발 단계
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
      // API 개발의 하위 업무들
      {
        id: 'dummy-2-1',
        title: '로그인 API',
        description: '사용자 로그인 엔드포인트 개발',
        status: '완료',
        priority: '높음',
        progress: 100,
        startDate: '2024-01-02',
        dueDate: '2024-01-10',
        projectId: 'project-1',
        assignedTo: usersList.length > 1 ? usersList[1].id : (usersList.length > 0 ? usersList[0].id : 'default-user-001'),
        department: departments.length > 0 ? departments[0].id : 'development',
        taskPhase: 'phase-2', // 개발 단계
        parentTaskId: 'dummy-2', // 부모 업무 ID 추가
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      },
      {
        id: 'dummy-2-2',
        title: '회원가입 API',
        description: '사용자 회원가입 엔드포인트 개발',
        status: '진행중',
        priority: '보통',
        progress: 70,
        startDate: '2024-01-05',
        dueDate: '2024-01-15',
        projectId: 'project-1',
        assignedTo: usersList.length > 2 ? usersList[2].id : (usersList.length > 0 ? usersList[0].id : 'default-user-001'),
        department: departments.length > 0 ? departments[0].id : 'development',
        taskPhase: 'phase-2', // 개발 단계
        parentTaskId: 'dummy-2', // 부모 업무 ID 추가
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z'
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
        assignedTo: usersList.length > 2 ? usersList[2].id : (usersList.length > 0 ? usersList[0].id : 'default-user-001'),
        department: departments.length > 0 ? departments[0].id : 'development',
        taskPhase: 'phase-2', // 개발 단계
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
        assignedTo: managers.length > 0 ? managers[0].id : (usersList.length > 0 ? usersList[0].id : 'default-user-001'),
        department: departments.length > 1 ? departments[1].id : (departments.length > 0 ? departments[0].id : 'quality'),
        taskPhase: 'phase-3', // 테스트 단계
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
        assignedTo: managers.length > 1 ? managers[1].id : (managers.length > 0 ? managers[0].id : (usersList.length > 0 ? usersList[0].id : 'default-user-001')),
        department: departments.length > 1 ? departments[1].id : (departments.length > 0 ? departments[0].id : 'quality'),
        taskPhase: 'phase-3', // 테스트 단계
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
        assignedTo: usersList.length > 3 ? usersList[3].id : (usersList.length > 0 ? usersList[0].id : 'default-user-001'),
        department: departments.length > 2 ? departments[2].id : (departments.length > 0 ? departments[0].id : 'sales'),
        taskPhase: 'phase-1', // 기획 단계
        createdAt: '2024-01-06T00:00:00Z',
        updatedAt: '2024-01-06T00:00:00Z'
      }
    ];

    console.log("Generated dummy tasks:", dummyTasks);
    console.log("Dummy tasks with parentTaskId:", dummyTasks.filter(t => t.parentTaskId));
    console.log("Available users for assignment:", usersList.map(u => ({ id: u.id, name: u.name })));
    console.log("Available managers for assignment:", managers.map(m => ({ id: m.id, name: m.name })));
    console.log("Available departments:", departments.map(d => ({ id: d.id, name: d.name })));

    return dummyTasks;
  };

  const createUser = async (data: any) => {
    try {
      // 데이터를 실제 데이터베이스 구조에 맞게 변환
      const insertData = {
        name: data.name,
        email: data.email,
        password_hash: data.password ? data.password : null, // 임시 비밀번호
        department_id: data.department, // department를 department_id로 변환
        position_id: data.position,     // position을 position_id로 변환
        phone: data.phone || null,
        role: data.role || 'user',
        is_active: data.isActive !== false,
        country: data.country || '',
        corporation_id: data.corporation || null
      };

      console.log('Creating user with data:', insertData);

      const { error } = await supabase.from("users").insert([insertData]);
      if (error) {
        console.error('User creation error:', error);
        throw error;
      }
      
      await loadUsers();
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  };

  const createEmployee = async (data: CreateEmployeeInput) => {
    console.log('=== createEmployee 함수 시작 ===');
    console.log('입력 데이터:', data);
    console.log('avatar 데이터 상세:', {
      avatar: data.avatar,
      type: typeof data.avatar,
      length: data.avatar?.length,
      isBase64: data.avatar?.startsWith('data:'),
      preview: data.avatar?.substring(0, 100) + '...'
    });
    
    const { data: result, error } = await supabase.from("employees").insert([data]).select().single();
    
    if (error) {
      console.error('=== Supabase 삽입 오류 ===');
      console.error('Error creating employee:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('=== Supabase 삽입 성공 ===');
    console.log('생성된 직원 데이터:', result);
    console.log('저장된 avatar:', result.avatar);
    console.log('avatar 저장 확인:', {
      saved: !!result.avatar,
      length: result.avatar?.length,
      matches: result.avatar === data.avatar
    });
    
    // 데이터 새로고침
    await loadEmployees();
    console.log('=== loadEmployees 완료 ===');
  };

  const createManager = async (data: CreateManagerInput) => {
    try {
      console.log("담당자 생성 데이터:", data);
      const { error } = await supabase.from("managers").insert([data]);
      if (error) throw error;
      await loadManagers();
    } catch (err) {
      console.error("담당자 생성 오류:", err);
      throw err;
    }
  };

  const createClient = async (data: {
    name: string;
    country?: string;
    manager_id: string;
    contact_number?: string;
    contact_email?: string;
    homepage?: string;
    flag?: string;
    remark?: string;
    requirements?: string;
  }) => {
    try {
      const { data: result, error } = await supabase
        .from('clients')
        .insert([{
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating client:', error);
        throw error;
      }

      console.log('Client created successfully:', result);
      await loadClients(); // 클라이언트 목록 새로고침

      // 알림 생성
      const userName = currentUser?.name || '사용자';
      const userPosition = getUserPosition(currentUser?.id || '');
      await createNotification(
        'customer',
        `${userName} ${userPosition}님이 새로운 고객을 추가하였습니다. (${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: ko })})`,
        currentUser?.id
      );

    } catch (error) {
      console.error('Error in createClient:', error);
      throw error;
    }
  };

  const createDepartment = async (data: CreateDepartmentInput) => {
    try {
      console.log('🏢 부서 생성 시작:', data);
      
      // Supabase에 부서 데이터 삽입
      const { data: result, error } = await supabase
        .from("departments")
        .insert([{
          name: data.name,
          code: data.code,
          description: data.description || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ 부서 생성 오류:', error);
        throw error;
      }

      console.log('✅ 부서 생성 성공:', result);
      
      // 부서 목록 새로고침
      await loadDepartments();
      
      console.log('🔄 부서 목록 새로고침 완료');
      
    } catch (error) {
      console.error('❌ createDepartment 함수 오류:', error);
      throw error;
    }
  };

  const createPosition = async (data: CreatePositionInput) => {
    try {
      console.log('🔄 createPosition 시작...');
      console.log('입력 데이터:', data);
      
      const insertData = {
        name: data.name,
        code: data.code,
        level: data.level,
        description: data.description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('삽입할 데이터:', insertData);
      
      const { data: result, error } = await supabase
        .from("positions")
        .insert([insertData])
        .select()
        .single();
        
      console.log('삽입 결과:', result);
      console.log('삽입 에러:', error);
      
      if (error) {
        console.error('❌ 직책 생성 오류:', error);
        throw error;
      }
      
      console.log('✅ 직책 생성 성공:', result);
      await loadPositions();
      console.log('🔄 직책 목록 새로고침 완료');
      
    } catch (error) {
      console.error('❌ createPosition 함수 오류:', error);
      throw error;
    }
  };

  const createPhase = async (phaseData: CreatePhaseInput) => {
    try {
      const insertData = {
        name: phaseData.name,
        description: phaseData.description || null,
        color: phaseData.color || '#3b82f6',
        order_index: phaseData.order,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("phases")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error("Error creating phase:", error);
        throw error;
      }

      console.log("Phase created successfully:", data);
      await loadPhases();
    } catch (error) {
      console.error("Error in createPhase:", error);
      throw error;
    }
  };

  const createCorporation = async (data: CreateCorporationInput) => {
    const { error } = await supabase.from("corporations").insert([data]);
    if (error) throw error;
    loadCorporations();
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    const { error } = await supabase
      .from("users")
      .update(data)
      .eq("id", id);
    if (error) throw error;
    loadUsers();
  };

  const updateEmployee = async (id: string, data: Partial<Employee>) => {
    const { error } = await supabase
      .from("employees")
      .update(data)
      .eq("id", id);
    if (error) throw error;
    loadEmployees();
  };

  const updateManager = async (id: string, data: Partial<Manager>): Promise<void> => {
    try {
      console.log("==== updateManager 함수 호출 ====");
      console.log("ID:", id);
      console.log("업데이트 데이터:", data);
      
      if (!id) {
        console.error("ID가 없습니다. 업데이트를 진행할 수 없습니다.");
        throw new Error("Manager ID is required for update");
      }
      
      // 단순화된 접근법: 필요한 데이터만 추출
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // 정의된 필드만 추가
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.corporation_id !== undefined) updateData.corporation_id = data.corporation_id;
      if (data.department_id !== undefined) updateData.department_id = data.department_id;
      if (data.position_id !== undefined) updateData.position_id = data.position_id;
      if (data.profile_image !== undefined) updateData.profile_image = data.profile_image;
      
      console.log("최종 업데이트 데이터:", updateData);
      
      // Supabase 직접 업데이트
      const { error } = await supabase
        .from("managers")
        .update(updateData)
        .eq("id", id);
      
      if (error) {
        console.error("담당자 업데이트 오류:", error);
        console.error("오류 세부정보:", error.details);
        throw error;
      }
      
      console.log("담당자 업데이트 성공!");
      
      // 데이터 새로고침
      await loadManagers();
      console.log("담당자 목록 새로고침 완료");
      
      // UI에 변경사항이 바로 반영되도록 managers 배열 수동 업데이트
      setManagers(prevManagers => 
        prevManagers.map(manager => 
          manager.id === id 
            ? { 
                ...manager, 
                ...updateData,
                // 관계형 데이터 업데이트
                corporation: manager.corporation ? {
                  ...manager.corporation,
                  id: data.corporation_id || manager.corporation_id || manager.corporation?.id
                } : undefined,
                department: manager.department ? {
                  ...manager.department,
                  id: data.department_id || manager.department_id || manager.department?.id
                } : undefined,
                position: manager.position ? {
                  ...manager.position,
                  id: data.position_id || manager.position_id || manager.position?.id
                } : undefined
              } 
            : manager
        )
      );
    } catch (err) {
      console.error("담당자 업데이트 처리 중 오류 발생:", err);
      throw err;
    }
  };

  const updateDepartment = async (id: string, data: Partial<Department>) => {
    const { error } = await supabase
      .from("departments")
      .update(data)
      .eq("id", id);
    if (error) throw error;
    loadDepartments();
  };

  const updatePosition = async (id: string, data: Partial<Position>) => {
    const { error } = await supabase
      .from("positions")
      .update(data)
      .eq("id", id);
    if (error) throw error;
    loadPositions();
  };

  const updatePhase = async (id: string, updates: Partial<Phase>) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Phase 타입을 Supabase 컬럼명으로 매핑
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.order !== undefined) updateData.order_index = updates.order;

      const { error } = await supabase
        .from("phases")
        .update(updateData)
        .eq("id", id);

      if (error) {
        console.error("Error updating phase:", error);
        throw error;
      }

      console.log("Phase updated successfully");
      await loadPhases();
    } catch (error) {
      console.error("Error in updatePhase:", error);
      throw error;
    }
  };

  const updateCorporation = async (id: string, data: Partial<Corporation>) => {
    const { error } = await supabase
      .from("corporations")
      .update(data)
      .eq("id", id);
    if (error) throw error;
    loadCorporations();
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;
    loadUsers();
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) throw error;
    loadEmployees();
  };

  const deleteManager = async (id: string) => {
    const { error } = await supabase.from("managers").delete().eq("id", id);
    if (error) throw error;
    loadManagers();
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw error;
    loadClients();
  };

  const deleteDepartment = async (id: string) => {
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) throw error;
    loadDepartments();
  };

  const deletePosition = async (id: string) => {
    const { error } = await supabase.from("positions").delete().eq("id", id);
    if (error) throw error;
    loadPositions();
  };

  const deletePhase = async (id: string) => {
    try {
      // 논리 삭제 (is_active를 false로 설정)
      const { error } = await supabase
        .from("phases")
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) {
        console.error("Error deleting phase:", error);
        throw error;
      }

      console.log("Phase deleted successfully");
      await loadPhases();
    } catch (error) {
      console.error("Error in deletePhase:", error);
      throw error;
    }
  };

  const deleteCorporation = async (id: string) => {
    const { error } = await supabase.from("corporations").delete().eq("id", id);
    if (error) throw error;
    loadCorporations();
  };

  const createSubTask = async (data: {
    title: string;
    description: string;
    projectId: string;
    parentTaskId: string;
    assignedTo?: string;
    dueDate: string;
    priority: string;
    department: string;
    status: string;
  }) => {
    try {
      // 하위 업무 생성
      const { error } = await supabase.from("subtasks").insert([{
        project_id: data.projectId,
        parent_task_id: data.parentTaskId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        progress: 0,
        start_date: new Date().toISOString(),
        due_date: data.dueDate,
        assigned_to: data.assignedTo,
        department: data.department,
      }]);

      if (error) throw error;
    } catch (error) {
      console.error("Error creating subtask:", error);
      throw error;
    }
  };

  // 상태에서 진행률 추출 함수
  const extractProgressFromStatus = (status: string): number => {
    if (!status) return 0;
    
    // 상태에서 숫자 추출 (예: "진행중 80%" -> 80, "완료 100%" -> 100)
    const percentMatch = status.match(/(\d+)%/);
    if (percentMatch) {
      return parseInt(percentMatch[1], 10);
    }
    
    // 특정 상태에 대한 기본 진행률 매핑
    const statusProgressMap: { [key: string]: number } = {
      '완료': 100,
      'completed': 100,
      '완료 100%': 100,
      '진행중': 50, // 기본 진행중 상태
      'in-progress': 50,
      '시작전': 0,
      'not-started': 0,
      'pending': 0,
      '시작전 0%': 0
    };
    
    return statusProgressMap[status] || 0;
  };

  // 프로젝트의 실제 진행률 계산 (하위 업무 기반)
  const calculateProjectProgress = (projectId: string) => {
    const projectTasks = tasksList.filter(task => task.projectId === projectId);
    
    if (projectTasks.length === 0) {
      return 0; // 업무가 없으면 0%
    }
    
    console.log(`=== 프로젝트 진행률 계산 시작 ===`);
    console.log(`프로젝트 ID: ${projectId}`);
    console.log(`전체 업무 수: ${projectTasks.length}`);
    
    // 각 업무의 진행률을 합산하여 평균 계산
    const totalProgress = projectTasks.reduce((sum, task) => {
      // 1. progress 필드가 있고 0보다 크면 그것을 사용
      let taskProgress = task.progress || 0;
      
      // 2. progress가 0이거나 없으면 상태에서 진행률 추출
      if (taskProgress === 0) {
        taskProgress = extractProgressFromStatus(task.status);
      }
      
      console.log(`업무 "${task.title}": ${task.status} -> 계산된 진행률: ${taskProgress}%`);
      
      return sum + taskProgress;
    }, 0);
    
    const averageProgress = Math.round(totalProgress / projectTasks.length);
    console.log(`총 진행률 합계: ${totalProgress}`);
    console.log(`평균 진행률: ${averageProgress}%`);
    console.log(`=== 프로젝트 진행률 계산 완료 ===`);
    
    return averageProgress;
  };

  const createWorkJournal = async (data: any) => {
    try {
      console.log('=== createWorkJournal 시작 ===');
      console.log('입력 데이터:', data);
      console.log('현재 사용자:', currentUser);
      
      // 현재 사용자 인증 상태 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Supabase 인증 사용자:', user);
      console.log('인증 오류:', authError);
      
      // Supabase 인증이 없다면 localStorage 사용자 ID 강제 사용
      if (!user && currentUser) {
        console.log('⚠️ Supabase 인증 없음, localStorage 사용자 ID 사용:', currentUser.id);
      }
      
      // 데이터 매핑 - localStorage 백업으로 사용
      const userId = data.userId || data.user_id || user?.id || currentUser?.id || '4277bb33-db38-4586-9481-b3b9f4d54129';
      const authorId = data.author_id || user?.id || currentUser?.id || '4277bb33-db38-4586-9481-b3b9f4d54129';
      const authorName = data.author_name || currentUser?.name || user?.email || 'Joon(최용수)';
      
      console.log('=== 사용자 ID 확인 ===');
      console.log('Supabase user.id:', user?.id);
      console.log('localStorage currentUser.id:', currentUser?.id);
      console.log('최종 userId:', userId);
      console.log('최종 authorId:', authorId);
      console.log('최종 authorName:', authorName);
      
      if (!userId) {
        console.error('사용자 ID를 찾을 수 없습니다!');
        console.error('Supabase user:', user);
        console.error('currentUser:', currentUser);
        throw new Error('사용자 ID가 필요합니다. Supabase 인증 상태를 확인하세요.');
      }
      
      const insertData: any = {
        user_id: userId,
        date: data.date || new Date().toISOString().split('T')[0],
        status: data.status || 'in-progress'
      };

      // 테이블에 해당 컬럼이 존재하는 경우에만 추가
      if (data.title) insertData.title = data.title;
      if (data.content) insertData.content = data.content;
      if (authorId) insertData.author_id = authorId;
      if (authorName) insertData.author_name = authorName;
      if (data.work_hours) insertData.work_hours = data.work_hours;
      if (data.overtime_hours) insertData.overtime_hours = data.overtime_hours;
      if (data.category) insertData.category = data.category;
      if (data.mood) insertData.mood = data.mood;
      if (data.productivity_score) insertData.productivity_score = data.productivity_score;

      // 선택적 필드들
      if (data.project_id) insertData.project_id = data.project_id;
      if (data.task_id || data.taskId) insertData.task_id = data.task_id || data.taskId;
      if (data.tags && Array.isArray(data.tags)) insertData.tags = data.tags;

      console.log('=== 삽입할 데이터 ===');
      console.log('Insert data:', insertData);
      console.log('사용자 ID 검증:', {
        userId: insertData.user_id,
        authorId: insertData.author_id,
        hasUserId: !!insertData.user_id,
        hasAuthorId: !!insertData.author_id,
        userIdType: typeof insertData.user_id,
        authorIdType: typeof insertData.author_id
      });

      // work_journals 테이블이 존재하는지 확인
      try {
        console.log('=== work_journals 테이블 접근 테스트 ===');
        const { data: testData, error: testError } = await supabase
          .from('work_journals')
          .select('id')
          .limit(1);
        
        console.log('테이블 접근 테스트 결과:', { testData, testError });
        
        if (testError) {
          console.error('테이블 접근 불가:', testError);
          throw new Error(`work_journals 테이블에 접근할 수 없습니다: ${testError.message}`);
        }
      } catch (accessError) {
        console.error('테이블 접근 중 오류:', accessError);
        throw accessError;
      }

      // 트랜잭션으로 업무 일지 생성
      console.log('=== 데이터 삽입 시도 ===');
      const { data: journal, error: journalError } = await supabase
        .from('work_journals')
        .insert([insertData])
        .select()
        .single();

      if (journalError) {
        console.error('=== 업무 일지 생성 오류 ===');
        console.error('Error creating work journal:', journalError);
        console.error('Error code:', journalError.code);
        console.error('Error message:', journalError.message);
        console.error('Error details:', journalError.details);
        console.error('Error hint:', journalError.hint);
        throw journalError;
      }

      console.log('Work journal created successfully:', journal);

      // 저장 직후 데이터 확인
      console.log('=== 저장 직후 데이터 확인 ===');
      const { data: savedData, error: checkError } = await supabase
        .from("work_journals")
        .select("*")
        .eq('id', journal.id)
        .single();
        
      console.log('저장된 데이터:', savedData);
      console.log('확인 오류:', checkError);
      
      // 첨부파일이 있는 경우 처리
      if (data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0) {
        console.log('첨부파일 처리 시작:', data.attachments.length, '개');
        
        for (const attachment of data.attachments) {
          try {
            const attachmentData = {
              work_journal_id: journal.id,
              file_name: attachment.name,
              file_size: attachment.size,
              file_type: attachment.type,
              file_extension: attachment.name.split('.').pop()?.toLowerCase() || '',
              storage_path: attachment.storage_path,
              public_url: attachment.public_url,
              bucket_name: 'uploads',
              is_image: attachment.type?.startsWith('image/') || false,
              uploaded_by: authorId
            };
            
            const { error: attachmentError } = await supabase
              .from('work_journal_attachments')
              .insert([attachmentData]);
              
            if (attachmentError) {
              console.error('첨부파일 저장 오류:', attachmentError);
            }
          } catch (attachmentError) {
            console.error('첨부파일 처리 중 오류:', attachmentError);
          }
        }
      }

      console.log('🔄 업무일지 목록 새로고침 시작...');
      await loadWorkJournals(); // 업무 일지 목록 새로고침
      console.log('✅ 업무일지 목록 새로고침 완료');

      // 저장 성공 확인을 위한 추가 검증
      console.log('🔍 저장 후 전체 업무일지 개수 확인...');
      const { data: allJournals } = await supabase
        .from("work_journals")
        .select("id");
      console.log('전체 업무일지 개수:', allJournals?.length || 0);

      // 알림 생성
      const userName = currentUser?.name || '사용자';
      await createNotification(
        'journal',
        `${userName}님이 업무 일지를 작성하였습니다. (${format(new Date(), 'yyyy-MM-dd HH:mm')})`,
        currentUser?.id
      );

      return journal; // 생성된 일지 반환

    } catch (error) {
      console.error('Error in createWorkJournal:', error);
      throw error;
    }
  };

  const updateWorkJournal = async (id: string, data: Partial<WorkJournal>) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // 허용된 필드만 업데이트
      if (data.content !== undefined) updateData.content = data.content;
      if (data.status !== undefined) updateData.status = data.status;

      const { error } = await supabase
        .from("work_journals")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      
      await loadWorkJournals(); // 목록 새로고침
    } catch (error) {
      console.error("Error updating work journal:", error);
      throw error;
    }
  };

  const deleteWorkJournal = async (id: string) => {
    try {
      // 관련 파일 및 협업자 정보도 함께 삭제됨 (CASCADE 설정)
      const { error } = await supabase
        .from("work_journals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      await loadWorkJournals(); // 목록 새로고침
    } catch (error) {
      console.error("Error deleting work journal:", error);
      throw error;
    }
  };

  // 업무일지 댓글 관리 함수들
  const createWorkJournalComment = async (workJournalId: string, content: string, commentType: string = 'comment') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('사용자 인증이 필요합니다.');

      const commentData = {
        work_journal_id: workJournalId,
        content: content.trim(),
        author_id: user.id,
        author_name: currentUser?.name || user.email || '사용자',
        comment_type: commentType
      };

      const { data, error } = await supabase
        .from('work_journal_comments')
        .insert([commentData])
        .select()
        .single();

      if (error) throw error;

      console.log('댓글 생성 성공:', data);
      return data;
    } catch (error) {
      console.error('댓글 생성 오류:', error);
      throw error;
    }
  };

  const getWorkJournalComments = async (workJournalId: string) => {
    try {
      const { data, error } = await supabase
        .from('work_journal_comments')
        .select('*')
        .eq('work_journal_id', workJournalId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('댓글 조회 오류:', error);
      return [];
    }
  };

  const deleteWorkJournalComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('work_journal_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      console.log('댓글 삭제 성공');
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      throw error;
    }
  };

  // 업무일지 첨부파일 관리 함수들
  const getWorkJournalAttachments = async (workJournalId: string) => {
    try {
      const { data, error } = await supabase
        .from('work_journal_attachments')
        .select('*')
        .eq('work_journal_id', workJournalId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('첨부파일 조회 오류:', error);
      return [];
    }
  };

  const deleteWorkJournalAttachment = async (attachmentId: string) => {
    try {
      // 먼저 첨부파일 정보 조회
      const { data: attachment, error: fetchError } = await supabase
        .from('work_journal_attachments')
        .select('storage_path, bucket_name')
        .eq('id', attachmentId)
        .single();

      if (fetchError) throw fetchError;

      // Storage에서 파일 삭제
      if (attachment?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from(attachment.bucket_name || 'uploads')
          .remove([attachment.storage_path]);
        
        if (storageError) {
          console.error('Storage 파일 삭제 오류:', storageError);
        }
      }

      // 데이터베이스에서 첨부파일 정보 삭제
      const { error } = await supabase
        .from('work_journal_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
      console.log('첨부파일 삭제 성공');
    } catch (error) {
      console.error('첨부파일 삭제 오류:', error);
      throw error;
    }
  };

  const loadWorkJournals = async () => {
    try {
      console.log("=== loadWorkJournals 시작 ===");
      
      // 현재 인증된 사용자 확인
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log("=== 사용자 인증 상태 확인 ===");
      console.log("현재 인증된 사용자 ID:", authUser?.id);
      console.log("사용자 이메일:", authUser?.email);
      console.log("인증 사용자 전체 정보:", authUser);
      console.log("currentUser 상태:", currentUser);
      console.log("localStorage currentUser:", localStorage.getItem('currentUser'));
      
      const { data, error } = await supabase
        .from("work_journals")
        .select("*")
        .order('created_at', { ascending: false });

      console.log("=== Supabase 조회 결과 ===");
      console.log("데이터:", data);
      console.log("오류:", error);
      console.log("데이터 개수:", data?.length || 0);

      if (error) {
        console.error("Error loading work journals:", error);
        console.error("오류 세부사항:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return;
      }

      if (!data || data.length === 0) {
        console.log("조회된 업무일지가 없습니다.");
        setWorkJournals([]);
        return;
      }

      console.log("Raw work journal data from Supabase:", data);
      console.log("첫 번째 레코드:", data[0]);

      // Supabase 데이터를 WorkJournal 타입으로 변환
      const mappedWorkJournals: WorkJournal[] = (data || []).map(journal => {
        console.log("매핑 중인 일지:", journal);
        
        const mappedJournal = {
          id: journal.id,
          project_id: journal.project_id,
          task_id: journal.task_id,
          title: journal.title || '업무일지',
          content: journal.content || '',
          date: journal.date || journal.created_at?.split('T')[0],
          user_id: journal.user_id,
          status: journal.status,
          author_id: journal.author_id,
          author_name: journal.author_name || getUserNameById(journal.user_id) || '알 수 없는 사용자',
          work_hours: journal.work_hours,
          overtime_hours: journal.overtime_hours,
          category: journal.category,
          has_attachments: journal.has_attachments,
          attachment_count: journal.attachment_count,
          created_at: journal.created_at,
          updated_at: journal.updated_at,
          files: journal.files || [],
          collaborators: journal.collaborators || [],
        };
        
        console.log("매핑된 일지:", mappedJournal);
        return mappedJournal;
      });

      console.log("=== 최종 매핑 결과 ===");
      console.log("매핑된 업무일지 목록:", mappedWorkJournals);
      console.log("매핑된 개수:", mappedWorkJournals.length);
      
      setWorkJournals(mappedWorkJournals);
      
      console.log("업무일지 상태 업데이트 완료");
    } catch (error) {
      console.error("Error in loadWorkJournals:", error);
    }
  };

  // 상태 관리 함수들
  const loadStatuses = async () => {
    try {
      console.log('🔍 상태 목록 로딩 시작...');
      
      // Supabase에서 statuses 테이블에서 상태 데이터 로드 시도
      console.log('🔍 statuses 테이블에서 데이터 조회 중...');
      const { data: statusData, error: statusError } = await supabase
        .from('statuses')
        .select('*')
        .eq('is_active', true)
        .order('status_type_id, order_index');

      console.log('🔍 Supabase 조회 결과:', {
        data: statusData?.length || 0,
        error: statusError
      });

      if (statusData && !statusError && statusData.length > 0) {
        // Supabase에서 데이터를 성공적으로 가져온 경우
        console.log('📊 Supabase 원본 데이터:', statusData);
        
        const mappedStatuses: Status[] = statusData.map(status => {
          // status_type_id를 기반으로 직접 매핑
          let statusType: 'project' | 'task' | 'priority' | 'promotion' = 'project';
          if (status.status_type_id === '2') statusType = 'task';
          else if (status.status_type_id === '3') statusType = 'priority';
          else if (status.status_type_id === '4') statusType = 'promotion';
        
        return {
            id: status.id,
            name: status.name,
            description: status.description || '',
            color: status.color,
            order_index: status.order_index,
            is_active: status.is_active,
            status_type_id: status.status_type_id,
            status_type: statusType,
            created_at: status.created_at,
            updated_at: status.updated_at
          };
        });
        
        console.log('📊 매핑된 상태 데이터:', mappedStatuses);
        setStatuses(mappedStatuses);
        console.log('✅ Supabase에서 상태 데이터 로드 성공:', mappedStatuses.length, '개');
        console.log('📈 프로젝트 상태:', mappedStatuses.filter(s => s.status_type === 'project').length, '개');
        console.log('📈 업무 상태:', mappedStatuses.filter(s => s.status_type === 'task').length, '개');
        console.log('📈 우선순위:', mappedStatuses.filter(s => s.status_type === 'priority').length, '개');
        console.log('📈 프로모션 단계:', mappedStatuses.filter(s => s.status_type === 'promotion').length, '개');
        return;
      }

      // Supabase에 데이터가 없거나 연결 실패 시 기본 상태 설정
      console.log('⚠️ Supabase 상태 테이블에서 데이터를 가져올 수 없습니다. 기본 상태를 사용합니다.');
      console.log('⚠️ 오류 원인:', statusError);
      
      // 기본 상태 설정 (Supabase 연동 전까지 사용)
      const defaultStatuses: Status[] = [
        // 프로젝트 상태
        { 
          id: '1', 
          name: '계획중',
          description: 'Project planning phase',
          color: '#3b82f6', 
          order_index: 1, 
          is_active: true, 
          status_type_id: '1', 
          status_type: 'project',
          translationKey: 'statusPlanning',
          descriptionKey: 'statusPlanningDesc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '2', 
          name: '진행중',
          description: 'Project in progress',
          color: '#f59e0b', 
          order_index: 2, 
          is_active: true, 
          status_type_id: '1', 
          status_type: 'project',
          translationKey: 'statusInProgress',
          descriptionKey: 'statusInProgressDesc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '3', 
          name: '완료',
          description: 'Project completed',
          color: '#10b981', 
          order_index: 3, 
          is_active: true, 
          status_type_id: '1', 
          status_type: 'project',
          translationKey: 'statusCompleted',
          descriptionKey: 'statusCompletedDesc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '4', 
          name: '보류',
          description: 'Project on hold',
          color: '#6b7280', 
          order_index: 4, 
          is_active: true, 
          status_type_id: '1', 
          status_type: 'project',
          translationKey: 'statusOnHold',
          descriptionKey: 'statusOnHoldDesc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        // 업무 상태
        { 
          id: '5', 
          name: '시작전',
          description: 'Tasks not started',
          color: '#6b7280', 
          order_index: 1, 
          is_active: true, 
          status_type_id: '2', 
          status_type: 'task',
          translationKey: 'statusNotStarted',
          descriptionKey: 'statusNotStartedDesc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '6', 
          name: '진행중 20%',
          description: 'In progress 20%',
          color: '#f59e0b', 
          order_index: 2, 
          is_active: true, 
          status_type_id: '2', 
          status_type: 'task',
          translationKey: 'statusProgress20',
          descriptionKey: 'statusProgress20Desc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '7', 
          name: '진행중 40%',
          description: 'In progress 40%',
          color: '#f59e0b', 
          order_index: 3, 
          is_active: true, 
          status_type_id: '2', 
          status_type: 'task',
          translationKey: 'statusProgress40',
          descriptionKey: 'statusProgress40Desc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '8', 
          name: '진행중 60%',
          description: 'In progress 60%',
          color: '#f59e0b', 
          order_index: 4, 
          is_active: true, 
          status_type_id: '2', 
          status_type: 'task',
          translationKey: 'statusProgress60',
          descriptionKey: 'statusProgress60Desc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '9', 
          name: '진행중 80%',
          description: 'In progress 80%',
          color: '#f59e0b', 
          order_index: 5, 
          is_active: true, 
          status_type_id: '2', 
          status_type: 'task',
          translationKey: 'statusProgress80',
          descriptionKey: 'statusProgress80Desc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '10', 
          name: '완료 100%',
          description: 'Completed 100%',
          color: '#10b981', 
          order_index: 6, 
          is_active: true, 
          status_type_id: '2', 
          status_type: 'task',
          translationKey: 'statusCompleted100',
          descriptionKey: 'statusCompleted100Desc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        // 우선순위
        { 
          id: '11', 
          name: '낮음',
          description: 'Low priority',
          color: '#6b7280', 
          order_index: 1, 
          is_active: true, 
          status_type_id: '3', 
          status_type: 'priority',
          translationKey: 'priorityLow',
          descriptionKey: 'priorityLowDesc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '12', 
          name: '보통',
          description: 'Normal priority',
          color: '#3b82f6', 
          order_index: 2, 
          is_active: true, 
          status_type_id: '3', 
          status_type: 'priority',
          translationKey: 'priorityNormal',
          descriptionKey: 'priorityNormalDesc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '13', 
          name: '높음',
          description: 'High priority',
          color: '#f59e0b', 
          order_index: 3, 
          is_active: true, 
          status_type_id: '3', 
          status_type: 'priority',
          translationKey: 'priorityHigh',
          descriptionKey: 'priorityHighDesc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '14', 
          name: '긴급',
          description: 'Urgent priority',
          color: '#ef4444', 
          order_index: 4, 
          is_active: true, 
          status_type_id: '3', 
          status_type: 'priority',
          translationKey: 'priorityUrgent',
          descriptionKey: 'priorityUrgentDesc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
      ];
      setStatuses(defaultStatuses);
    } catch (error) {
      console.error('❌ 상태 로드 중 오류 발생:', error);
      
      // 오류 발생 시에도 기본 상태는 설정
      const defaultStatuses: Status[] = [
        { 
          id: '1', 
          name: '계획중',
          description: 'Project planning phase',
          color: '#3b82f6', 
          order_index: 1, 
          is_active: true, 
          status_type_id: '1', 
          status_type: 'project',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '2', 
          name: '진행중',
          description: 'Project in progress',
          color: '#f59e0b', 
          order_index: 2, 
          is_active: true, 
          status_type_id: '1', 
          status_type: 'project',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '3', 
          name: '완료',
          description: 'Project completed',
          color: '#10b981', 
          order_index: 3, 
          is_active: true, 
          status_type_id: '1', 
          status_type: 'project',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setStatuses(defaultStatuses);
    }
  };

  const createStatus = async (data: CreateStatusInput) => {
    try {
      console.log('🔍 상태 생성 함수 시작');
      console.log('입력 데이터:', data);
      
      // Supabase에 상태 저장 시도
      const insertPayload = {
        name: data.name,
        description: data.description,
        color: data.color,
        order_index: data.order_index,
        is_active: data.is_active,
        status_type_id: data.status_type_id
      };
      
      console.log('🔍 Supabase 삽입 데이터:', insertPayload);
      
      const { data: insertData, error: insertError } = await supabase
        .from('statuses')
        .insert([insertPayload])
        .select()
        .single();

      console.log('🔍 Supabase 응답 데이터:', insertData);
      console.log('🔍 Supabase 오류:', insertError);

      if (insertData && !insertError) {
        // Supabase 생성 성공 시 상태 목록 다시 로드
        console.log('✅ Supabase에 상태 생성 성공:', insertData);
        console.log('🔄 상태 목록 새로고침 중...');
        await loadStatuses(); // 상태 목록 새로고침
        console.log('✅ 상태 목록 새로고침 완료');
        return;
      } else {
        // Supabase 실패 시 로컬에만 저장
        console.log('⚠️ Supabase 상태 생성 실패, 로컬에만 저장');
        console.log('⚠️ 오류 상세:', insertError);
      }
      
      // 로컬 상태에만 저장 (폴백)
      const newStatus: Status = {
        id: `local-${Date.now()}`,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 로컬 상태 저장:', newStatus);
      setStatuses(prev => [...prev, newStatus]);
      
    } catch (error) {
      console.error('❌ 상태 생성 중 예외 발생:', error);
      
      // 오류 발생 시에도 로컬에는 저장
      const newStatus: Status = {
        id: `local-${Date.now()}`,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 예외 발생 시 로컬 상태 저장:', newStatus);
      setStatuses(prev => [...prev, newStatus]);
    }
  };

  const updateStatus = async (id: string, data: Partial<Status>) => {
    try {
      console.log('🔍 상태 수정 시작:', id, data);
      
      // Supabase에서 상태 업데이트 시도
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.order_index !== undefined) updateData.order_index = data.order_index;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      console.log('🔍 Supabase 업데이트 데이터:', updateData);

      const { error } = await supabase
        .from('statuses')
        .update(updateData)
        .eq('id', id);

      if (!error) {
        console.log('✅ Supabase에서 상태 업데이트 성공');
        await loadStatuses(); // 상태 목록 새로고침
      } else {
        console.log('⚠️ Supabase 상태 업데이트 실패:', error);
        // 로컬 상태만 업데이트
        setStatuses(prev => prev.map(status => 
          status.id === id ? { ...status, ...data, updated_at: new Date().toISOString() } : status
        ));
      }
      
    } catch (error) {
      console.error('❌ 상태 업데이트 중 오류:', error);
      
      // 오류 발생 시에도 로컬 상태는 업데이트
      setStatuses(prev => prev.map(status => 
        status.id === id ? { ...status, ...data, updated_at: new Date().toISOString() } : status
      ));
    }
  };

  const deleteStatus = async (id: string) => {
    try {
      console.log('🔍 상태 삭제 시작:', id);
      
      // Supabase에서 상태 삭제 시도
      const { error } = await supabase
        .from('statuses')
        .delete()
        .eq('id', id);

      if (!error) {
        console.log('✅ Supabase에서 상태 삭제 성공');
        await loadStatuses(); // 상태 목록 새로고침
      } else {
        console.log('⚠️ Supabase 상태 삭제 실패:', error);
        // 로컬 상태만 삭제
        setStatuses(prev => prev.filter(status => status.id !== id));
      }
      
    } catch (error) {
      console.error('❌ 상태 삭제 중 오류:', error);
      
      // 오류 발생 시에도 로컬 상태는 삭제
      setStatuses(prev => prev.filter(status => status.id !== id));
    }
  };

  const getProjectStatuses = () => {
    return statuses.filter(status => status.status_type === 'project' && status.is_active).sort((a, b) => a.order_index - b.order_index);
  };

  const getTaskStatuses = () => {
    return statuses.filter(status => status.status_type === 'task' && status.is_active).sort((a, b) => a.order_index - b.order_index);
  };

  const getPriorityStatuses = () => {
    return statuses.filter(status => status.status_type === 'priority' && status.is_active).sort((a, b) => a.order_index - b.order_index);
  };

  // 번역된 직책명 반환 함수
  const getTranslatedPositionName = (position: Position, language: string): string => {
    if (!position) return '';
    
    switch (language) {
      case 'en':
        return position.name_en || position.name;
      case 'zh':
        return position.name_zh || position.name;
      case 'th':
        return position.name_th || position.name;
      default:
        return position.name;
    }
  };

  // 번역된 부서명 반환 함수
  const getTranslatedDepartmentName = (department: Department, language: string): string => {
    if (!department) return '';
    
    switch (language) {
      case 'en':
        return department.name_en || department.name;
      case 'zh':
        return department.name_zh || department.name;
      case 'th':
        return department.name_th || department.name;
      default:
        return department.name;
    }
  };

  // 사용자 역할 정보 강제 새로고침 함수 추가
  const refreshCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ 인증된 사용자 없음');
        return;
      }

      console.log('🔄 사용자 역할 정보 강제 새로고침 시작');
      console.log('현재 인증된 사용자 ID:', user.id);

      // users 테이블에서 최신 사용자 정보 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('DB 조회 결과:', { userData, userError });

      if (userData && !userError) {
        console.log('✅ 최신 사용자 정보 조회 성공:', userData);
        console.log('사용자 역할:', userData.role);
        
        // currentUser 업데이트
        setCurrentUser(userData);
        
        // localStorage도 업데이트
        localStorage.setItem("currentUser", JSON.stringify(userData));
        localStorage.setItem("lastUserLogin", new Date().toISOString());
        
        console.log('✅ currentUser 및 localStorage 업데이트 완료');
      } else {
        console.log('❌ 사용자 정보 조회 실패:', userError);
      }
    } catch (error) {
      console.error('❌ 사용자 역할 새로고침 중 오류:', error);
    }
  };

  const value: ExtendedAppContextType = {
    currentUser,
    setCurrentUser,
    users: usersList,
    projects: projectsList,
    tasks: tasksList,
    clients: clientsList,
    notifications,
    departments,
    positions,
    phases,
    corporations,
    employees,
    managers,
    workJournals,
    statuses,
    addProject,
    updateProject,
    removeProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    removeTask,
    addClient,
    updateClient,
    removeClient,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addNotification,
    createUser,
    createEmployee,
    createManager,
    createClient,
    createDepartment,
    createPosition,
    createPhase,
    createCorporation,
    updateUser,
    updateEmployee,
    updateManager,
    updateDepartment,
    updatePosition,
    updatePhase,
    updateCorporation,
    deleteUser,
    deleteEmployee,
    deleteManager,
    deleteClient,
    deleteDepartment,
    deletePosition,
    deletePhase,
    deleteCorporation,
    createSubTask,
    calculateProjectProgress,
    createWorkJournal,
    updateWorkJournal,
    deleteWorkJournal,
    loadWorkJournals,
    loadStatuses,
    createStatus,
    updateStatus,
    deleteStatus,
    getProjectStatuses,
    getTaskStatuses,
    getPriorityStatuses,
    createNotification,
    createTimezoneAwareNotification,
    createBulkTimezoneAwareNotifications,
    deleteNotification,
  getUserNameById,
  getUserById,
  getAssigneeNames,
  getIntegratedAssignees,
  refreshAllData: async () => {
    await loadClients();
    await loadUsers();
    await loadProjects();
    await loadDepartments();
    await loadPositions();
    await loadPhases();
    await loadCorporations();
    await loadEmployees();
    await loadManagers();
    await loadWorkJournals();
    await loadStatuses();
  },
  refreshCurrentUserRole: async () => {
    await refreshCurrentUserRole();
  },
  getTranslatedPositionName,
  getTranslatedDepartmentName,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
