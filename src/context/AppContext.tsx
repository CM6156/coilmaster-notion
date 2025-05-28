import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Project, Task, Client, Notification, User, Department, Position, Corporation, Employee, Manager, CreateUserInput, CreateEmployeeInput, CreateManagerInput, CreateClientInput, CreateDepartmentInput, CreatePositionInput, CreateCorporationInput, WorkJournal, CreateWorkJournalInput, CreateWorkJournalFileInput, CreateWorkJournalCollaboratorInput, DepartmentCode, Phase, CreatePhaseInput } from '@/types';
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// Status 타입 정의
export interface Status {
  id: string;
  name: string;
  description: string;
  color: string;
  order_index: number;
  is_active: boolean;
  status_type_id: string;
  status_type?: 'project' | 'task' | 'priority';
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
  const [statuses, setStatuses] = useState<Status[]>([]); // 상태 목록 state 추가

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

      setSubscriptions([clientsSubscription, managersSubscription, projectsSubscription, tasksSubscription, usersSubscription]);
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
                console.error('온라인 상태 업데이트 오류:', onlineError);
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

  const addProject = async (project: Omit<Project, 'id'>) => {
    try {
      // Project 타입을 Supabase 스키마에 맞게 변환
      const insertData: any = {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 각 필드를 Supabase 컬럼명으로 매핑
      if (project.name !== undefined) insertData.name = project.name;
      if (project.description !== undefined) insertData.description = project.description;
      if (project.status !== undefined) insertData.status = project.status;
      if (project.promotionStatus !== undefined) insertData.promotion_status = project.promotionStatus;
      if (project.progress !== undefined) insertData.progress = project.progress;
      if (project.startDate !== undefined) insertData.start_date = project.startDate;
      if (project.dueDate !== undefined) insertData.due_date = project.dueDate;
      if (project.clientId !== undefined) insertData.client_id = project.clientId || null;
      if (project.manager !== undefined) insertData.pic_name = project.manager;
      if (project.managerId !== undefined) insertData.manager_id = project.managerId || null;
      if (project.department !== undefined) insertData.department_id = project.department || null;
      if (project.projectType !== undefined) insertData.project_type = project.projectType;
      if (project.annualQuantity !== undefined) insertData.annual_quantity = project.annualQuantity;
      if (project.averageAmount !== undefined) insertData.average_amount = project.averageAmount;
      if (project.annualAmount !== undefined) insertData.annual_amount = project.annualAmount;
      if (project.competitor !== undefined) insertData.competitor = project.competitor;
      if (project.issueCorporation !== undefined) insertData.issue_corporation_id = project.issueCorporation || null;
      if (project.requestDate !== undefined) insertData.request_date = project.requestDate;
      if (project.targetSOPDate !== undefined) insertData.target_sop_date = project.targetSOPDate;
      if (project.currentPhase !== undefined) insertData.current_phase = project.currentPhase;
      if (project.completed !== undefined) insertData.completed = project.completed;
      if (project.team !== undefined) insertData.team = project.team;
      if (project.image !== undefined) insertData.image = project.image;
      
      // UUID 필드의 빈 문자열을 null로 변환
      ['client_id', 'manager_id', 'department_id', 'issue_corporation_id'].forEach(field => {
        if (insertData[field] === '') {
          insertData[field] = null;
        }
      });
      
      console.log("Sanitized insert data for Supabase:", insertData);
      
      const response = await supabase
        .from('projects')
        .insert([insertData])
        .select()
        .single();

      if (response.error) {
        console.error('프로젝트 생성 오류:', response.error);
        throw new Error(response.error.message);
      }

      const newProject = response.data;
      setProjects([...projectsList, newProject]);

      // 알림 생성
      const userName = currentUser?.name || '사용자';
      const userPosition = getUserPosition(currentUser?.id || '');
      await createNotification(
        'project',
        `${userName} ${userPosition}님이 프로젝트를 등록하였습니다. (${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: ko })})`,
        currentUser?.id
      );

      console.log('프로젝트가 성공적으로 생성되었습니다:', newProject);
    } catch (error) {
      console.error('프로젝트 생성 실패:', error);
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
      
      // 각 필드를 Supabase 컬럼명으로 매핑
      if (updatedProject.name !== undefined) updateData.name = updatedProject.name;
      if (updatedProject.description !== undefined) updateData.description = updatedProject.description;
      if (updatedProject.status !== undefined) updateData.status = updatedProject.status;
      if (updatedProject.promotionStatus !== undefined) updateData.promotion_status = updatedProject.promotionStatus;
      if (updatedProject.progress !== undefined) updateData.progress = updatedProject.progress;
      if (updatedProject.startDate !== undefined) updateData.start_date = updatedProject.startDate;
      if (updatedProject.dueDate !== undefined) updateData.due_date = updatedProject.dueDate;
      if (updatedProject.clientId !== undefined) updateData.client_id = updatedProject.clientId || null;
      if (updatedProject.manager !== undefined) updateData.pic_name = updatedProject.manager;
      if (updatedProject.managerId !== undefined) updateData.manager_id = updatedProject.managerId || null;
      if (updatedProject.department !== undefined) updateData.department_id = updatedProject.department || null;
      if (updatedProject.projectType !== undefined) updateData.project_type = updatedProject.projectType;
      if (updatedProject.annualQuantity !== undefined) updateData.annual_quantity = updatedProject.annualQuantity;
      if (updatedProject.averageAmount !== undefined) updateData.average_amount = updatedProject.averageAmount;
      if (updatedProject.annualAmount !== undefined) updateData.annual_amount = updatedProject.annualAmount;
      if (updatedProject.competitor !== undefined) updateData.competitor = updatedProject.competitor;
      if (updatedProject.issueCorporation !== undefined) updateData.issue_corporation_id = updatedProject.issueCorporation || null;
      if (updatedProject.requestDate !== undefined) updateData.request_date = updatedProject.requestDate;
      if (updatedProject.targetSOPDate !== undefined) updateData.target_sop_date = updatedProject.targetSOPDate;
      if (updatedProject.currentPhase !== undefined) updateData.current_phase = updatedProject.currentPhase;
      if (updatedProject.completed !== undefined) updateData.completed = updatedProject.completed;
      if (updatedProject.team !== undefined) updateData.team = updatedProject.team;
      if (updatedProject.image !== undefined) updateData.image = updatedProject.image;
      
      // UUID 필드의 빈 문자열을 null로 변환
      ['client_id', 'manager_id', 'department_id', 'issue_corporation_id'].forEach(field => {
        if (updateData[field] === '') {
          updateData[field] = null;
        }
      });
      
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
      
      // 알림 생성
      const userName = currentUser?.name || '사용자';
      const userPosition = getUserPosition(currentUser?.id || '');
      await createNotification(
        'project',
        `${userName} ${userPosition}님이 프로젝트를 삭제하였습니다. (${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: ko })})`,
        currentUser?.id
      );
      
    } catch (error) {
      console.error("Error in deleteProject:", error);
      throw error;
    }
  };

  const addTask = async (task: Omit<Task, 'id'>): Promise<string> => {
    try {
      console.log('Creating task with data:', task); // 디버깅 로그 추가
      
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
          assigned_to: task.assignedTo,
          department: task.department,
          task_phase: task.taskPhase, // taskPhase 필드 활성화
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        throw error;
      }

      console.log('Task created successfully:', data);
      await loadTasks(); // 업무 목록 새로고침

      // 알림 생성
      const userName = currentUser?.name || '사용자';
      const userPosition = getUserPosition(currentUser?.id || '');
      await createNotification(
        'task',
        `${userName} ${userPosition}님이 업무 관리에 업무를 등록하였습니다. (${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: ko })})`,
        currentUser?.id
      );

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
      if (updatedTask.department !== undefined) updateData.department = updatedTask.department;
      if (updatedTask.taskPhase !== undefined) updateData.task_phase = updatedTask.taskPhase; // 임시 주석 처리 - 데이터베이스에 컬럼 추가 후 활성화
      
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

  const deleteNotification = async (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const loadDepartments = async () => {
    const { data, error } = await supabase.from("departments").select("*");
    if (error) {
      console.error("Error loading departments:", error);
      return;
    }
    setDepartments(data);
  };

  const loadPositions = async () => {
    const { data, error } = await supabase.from("positions").select("*");
    if (error) {
      console.error("Error loading positions:", error);
      return;
    }
    setPositions(data);
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
    const { data, error } = await supabase
      .from("employees")
      .select(`
        *,
        department:department_id(id, name, code),
        corporation:corporation_id(id, name, code),
        position:position_id(id, name, code)
      `);
    if (error) {
      console.error("Error loading employees:", error);
      return;
    }
    setEmployees(data);
  };

  const loadManagers = async () => {
    const { data } = await supabase
      .from('managers')
      .select('*, department:department_id(id, name)');
    if (data) {
    setManagers(data);
    } else {
      console.error("Error loading managers:", data);
    }
  };

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
      console.log("Loading projects from Supabase...");
      
      const { data, error } = await supabase
        .from("projects")
        .select("*");
      
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
        
        return {
          id: project.id,
          name: project.name,
          description: project.description || '',
          status: project.promotion_status || project.status || 'planned', // promotion_status를 우선 사용
          progress: project.progress || 0,
          startDate: project.start_date,
          dueDate: project.due_date,
          clientId: project.client_id,
          clientName: client?.name || '',
          manager: picName, // pic_name을 manager로 매핑
          managerId: project.manager_id,
          department: project.department_id,
          phase: project.current_phase || 'planning',
          currentPhase: project.current_phase || 'planning',
          requestDate: project.request_date,
          targetSOPDate: project.target_sop_date,
          // 새로 추가된 필드들
          projectType: project.project_type,
          type: project.project_type,
          annualQuantity: project.annual_quantity || 0,
          averageAmount: project.average_amount || 0,
          annualAmount: project.annual_amount || 0,
          promotionStatus: project.promotion_status || 'planned',
          competitor: project.competitor,
          issueCorporation: project.issue_corporation_id,
          completed: project.completed || false,
          team: project.team || [],
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          image: project.image || '', // 이미지 필드 추가
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

  const loadTasks = async () => {
    try {
      console.log("Loading tasks from Supabase...");
      
      // 먼저 tasks_with_assignees 뷰에서 다중 담당자 정보와 함께 로드 시도
      const { data: viewData, error: viewError } = await supabase
        .from("tasks_with_assignees")
        .select("*");
      
      if (!viewError && viewData && viewData.length > 0) {
        console.log("Raw task data from tasks_with_assignees view:", viewData);
        console.log("Number of tasks loaded from view:", viewData.length);
        
        // tasks_with_assignees 뷰 데이터를 Task 타입으로 변환
        const mappedTasks = viewData.map(task => {
          console.log("Processing task with assignees:", task);
          
          // assignees 데이터 파싱
          let assignees = [];
          try {
            if (task.assignees && typeof task.assignees === 'string') {
              assignees = JSON.parse(task.assignees);
            } else if (Array.isArray(task.assignees)) {
              assignees = task.assignees;
            }
          } catch (e) {
            console.error("Error parsing assignees:", e);
            assignees = [];
          }
          
          return {
            id: task.id,
            title: task.title,
            description: task.description || '',
            status: task.status || 'not-started',
            priority: task.priority || 'medium',
            progress: task.progress || 0,
            startDate: task.start_date,
            dueDate: task.due_date,
            projectId: task.project_id,
            assignedTo: task.primary_assignee_id || task.assigned_to, // 주 담당자 ID 사용
            assignees: assignees, // 다중 담당자 배열 추가
            department: task.department || '',
            taskPhase: task.task_phase,
            createdAt: task.created_at,
            updatedAt: task.updated_at,
          };
        });
        
        console.log("Mapped task data with assignees:", mappedTasks);
        setTasks(mappedTasks);
        console.log("Tasks state updated successfully with assignees");
        return;
      }
      
      // 뷰가 없는 경우 기본 tasks 테이블에서 로드
      console.log("tasks_with_assignees view not available, using fallback");
      const { data, error } = await supabase
        .from("tasks")
        .select("*");
      
      if (error) {
        console.error("Error loading tasks:", error);
        // 에러가 있는 경우 더미 데이터 사용
        console.log("Using dummy task data due to Supabase error");
        setTasks(getDummyTasks());
        return;
      }
      
      console.log("Raw task data from Supabase:", data);
      console.log("Number of tasks loaded:", data?.length || 0);
      
      // Supabase에서 로드한 데이터가 있는 경우
      if (data && data.length > 0) {
        // Supabase 데이터를 Task 타입으로 변환 (관련 데이터는 클라이언트 사이드에서 매핑)
        const mappedTasks = data.map(task => {
          console.log("Processing task:", task);
          return {
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
            taskPhase: task.task_phase, // task_phase 필드 추가
            createdAt: task.created_at,
            updatedAt: task.updated_at,
          };
        });
        
        console.log("Mapped task data:", mappedTasks);
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
        assignedTo: usersList.length > 1 ? usersList[1].id : (usersList.length > 0 ? usersList[0].id : 'default-user-001'),
        department: departments.length > 0 ? departments[0].id : 'development',
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
        assignedTo: usersList.length > 2 ? usersList[2].id : (usersList.length > 0 ? usersList[0].id : 'default-user-001'),
        department: departments.length > 0 ? departments[0].id : 'development',
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
        createdAt: '2024-01-06T00:00:00Z',
        updatedAt: '2024-01-06T00:00:00Z'
      }
    ];

    console.log("Generated dummy tasks:", dummyTasks);
    console.log("Available users for assignment:", usersList.map(u => ({ id: u.id, name: u.name })));
    console.log("Available managers for assignment:", managers.map(m => ({ id: m.id, name: m.name })));
    console.log("Available departments:", departments.map(d => ({ id: d.id, name: d.name })));

    return dummyTasks;
  };

  const createUser = async (data: CreateUserInput) => {
    const { error } = await supabase.from("users").insert([data]);
    if (error) throw error;
    loadUsers();
  };

  const createEmployee = async (data: CreateEmployeeInput) => {
    const { error } = await supabase.from("employees").insert([data]);
    if (error) throw error;
    loadEmployees();
  };

  const createManager = async (data: CreateManagerInput) => {
    const { error } = await supabase.from("managers").insert([data]);
    if (error) throw error;
    loadManagers();
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
    const { error } = await supabase.from("departments").insert([data]);
    if (error) throw error;
    loadDepartments();
  };

  const createPosition = async (data: CreatePositionInput) => {
    const { error } = await supabase.from("positions").insert([data]);
    if (error) throw error;
    loadPositions();
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

  const updateManager = async (id: string, data: Partial<Manager>) => {
    const { error } = await supabase
      .from("managers")
      .update(data)
      .eq("id", id);
    if (error) throw error;
    loadManagers();
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

  // 프로젝트의 실제 진행률 계산 (하위 업무 기반)
  const calculateProjectProgress = (projectId: string) => {
    const projectTasks = tasksList.filter(task => task.projectId === projectId);
    
    if (projectTasks.length === 0) {
      return 0; // 업무가 없으면 0%
    }
    
    // 각 업무의 진행률을 합산하여 평균 계산
    const totalProgress = projectTasks.reduce((sum, task) => {
      // 업무 상태에 따른 진행률 계산
      let taskProgress = task.progress || 0;
      
      // 상태에 따른 가중치 적용
      switch (task.status) {
        case 'completed':
          taskProgress = 100;
          break;
        case 'in-progress':
          // 진행 중인 경우 기존 progress 값 사용
          break;
        case 'not-started':
        case 'pending':
          taskProgress = 0;
          break;
        default:
          // 기존 progress 값 사용
          break;
      }
      
      return sum + taskProgress;
    }, 0);
    
    return Math.round(totalProgress / projectTasks.length);
  };

  const createWorkJournal = async (data: CreateWorkJournalInput) => {
    try {
      // 트랜잭션으로 업무 일지 생성
      const { data: journal, error: journalError } = await supabase
        .from('work_journals')
        .insert([{
          project_id: data.project_id,
          task_id: data.task_id,
          content: data.content,
          status: data.status,
          author_id: data.author_id,
          author_name: data.author_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (journalError) {
        console.error('Error creating work journal:', journalError);
        throw journalError;
      }

      console.log('Work journal created successfully:', journal);
      await loadWorkJournals(); // 업무 일지 목록 새로고침

      // 알림 생성
      const userName = currentUser?.name || '사용자';
      const userPosition = getUserPosition(currentUser?.id || '');
      await createNotification(
        'journal',
        `${userName} ${userPosition}님이 금일 업무 일지를 작성하였습니다. (${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: ko })})`,
        currentUser?.id
      );

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

  const loadWorkJournals = async () => {
    try {
      const { data, error } = await supabase
        .from("work_journals")
        .select(`
          *,
          files:work_journal_files(*),
          collaborators:work_journal_collaborators(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading work journals:", error);
        return;
      }

      console.log("Raw work journal data from Supabase:", data);

      // Supabase 데이터를 WorkJournal 타입으로 변환
      const mappedWorkJournals: WorkJournal[] = (data || []).map(journal => ({
        id: journal.id,
        project_id: journal.project_id,
        task_id: journal.task_id,
        content: journal.content || '',
        status: journal.status,
        author_id: journal.author_id,
        author_name: journal.author_name,
        created_at: journal.created_at,
        updated_at: journal.updated_at,
        files: journal.files || [],
        collaborators: journal.collaborators || [],
      }));

      console.log("Mapped work journal data:", mappedWorkJournals);
      setWorkJournals(mappedWorkJournals);
    } catch (error) {
      console.error("Error in loadWorkJournals:", error);
    }
  };

  // 상태 관리 함수들
  const loadStatuses = async () => {
    try {
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
          name: '할 일',
          description: 'Tasks to be performed',
          color: '#8b5cf6', 
          order_index: 1, 
          is_active: true, 
          status_type_id: '2', 
          status_type: 'task',
          translationKey: 'statusTodo',
          descriptionKey: 'statusTodoDesc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '6', 
          name: '진행중',
          description: 'Currently in progress',
          color: '#f59e0b', 
          order_index: 2, 
          is_active: true, 
          status_type_id: '2', 
          status_type: 'task',
          translationKey: 'statusDoing',
          descriptionKey: 'statusDoingDesc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '7', 
          name: '검토중',
          description: 'Tasks under review',
          color: '#06b6d4', 
          order_index: 3, 
          is_active: true, 
          status_type_id: '2', 
          status_type: 'task',
          translationKey: 'statusReviewing',
          descriptionKey: 'statusReviewingDesc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '8', 
          name: '완료',
          description: 'Completed tasks',
          color: '#10b981', 
          order_index: 4, 
          is_active: true, 
          status_type_id: '2', 
          status_type: 'task',
          translationKey: 'statusDone',
          descriptionKey: 'statusDoneDesc',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        // 우선순위
        { 
          id: '9', 
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
          id: '10', 
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
          id: '11', 
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
          id: '12', 
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
      console.error('Error loading statuses:', error);
    }
  };

  const createStatus = async (data: CreateStatusInput) => {
    try {
      const newStatus = {
        ...data,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 로컬 상태 업데이트
      setStatuses(prev => [...prev, newStatus]);
    } catch (error) {
      console.error('Error creating status:', error);
      throw error;
    }
  };

  const updateStatus = async (id: string, data: Partial<Status>) => {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      // 로컬 상태 업데이트
      setStatuses(prev => prev.map(status => 
        status.id === id ? { ...status, ...updateData } : status
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const deleteStatus = async (id: string) => {
    try {
      // 로컬 상태 업데이트
      setStatuses(prev => prev.filter(status => status.id !== id));
    } catch (error) {
      console.error('Error deleting status:', error);
      throw error;
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
  deleteNotification,
  getUserNameById,
  getUserById,
  getAssigneeNames,
  getIntegratedAssignees,
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
