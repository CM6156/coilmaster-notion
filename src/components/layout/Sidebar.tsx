import { NavLink, useLocation } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { useUserActivity } from "@/context/UserActivityContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar as CalendarIcon,
  ClipboardList,
  Cog,
  Folder,
  LayoutDashboard,
  Users,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  FileText,
  ListFilter,
  Briefcase,
  Building,
  Grid3x3,
  Sparkles,
  Activity,
  Bell,
  Settings,
  Zap,
  Star,
  Crown,
  Shield,
  Palette,
  Globe,
  Heart,
  Coffee,
  Rocket,
  Target,
  TrendingUp,
  Award,
  Gem,
  Flame,
  Eye,
  MessageCircle,
  UserCheck,
  Clock,
  Wifi,
  WifiOff
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentPage?: string;
  lastSeen?: string;
  role?: string;
}

interface NotificationItem {
  id: string;
  type: 'task' | 'project' | 'system' | 'mention' | 'journal';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

const Sidebar = () => {
  const { currentUser, tasks, projects, notifications, departments, workJournals } = useAppContext();
  const { translations, language } = useLanguage();
  const { currentUsers, getUsersOnPage } = useUserActivity();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarNotifications] = useState<NotificationItem[]>([
    { id: '1', type: 'task', title: '새 업무 할당', message: '프로젝트 A 업무가 할당되었습니다', time: '2분 전', read: false, priority: 'high' },
    { id: '2', type: 'project', title: '프로젝트 업데이트', message: '프로젝트 B가 완료되었습니다', time: '1시간 전', read: false, priority: 'medium' },
    { id: '3', type: 'mention', title: '멘션', message: '김관리자님이 언급했습니다', time: '3시간 전', read: true, priority: 'low' }
  ]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    "/projects": true,
    "/tasks": true,
    "/team": true
  });
  const location = useLocation();

  // 실제 데이터 기반 계산
  const tasksList = Array.isArray(tasks) ? tasks : [];
  const projectsList = Array.isArray(projects) ? projects : [];
  const notificationsList = Array.isArray(notifications) ? notifications : sidebarNotifications;
  const workJournalsList = Array.isArray(workJournals) ? workJournals : [];

  // 업무 관련 통계 계산
  const totalTasks = tasksList.length;
  const activeTasks = tasksList.filter(task => 
    task.status === 'in-progress' || task.status === 'pending' || task.status === 'not-started'
  ).length;
  
  // 업무 일지 관련 - 새로운 일지 알림 개수
  const journalNotifications = notificationsList.filter(n => n.type === 'journal' && !n.read).length;

  // 프로젝트 관련 통계
  const activeProjects = projectsList.filter(project => 
    project.status === 'in-progress' || project.status === 'planning'
  ).length;

  // 읽지 않은 알림 수
  const unreadNotifications = notificationsList.filter(n => !n.read).length;
  
  // 실제 온라인 사용자만 필터링
  const actualOnlineUsers = onlineUsers.filter(user => user.status === 'online');
  const onlineCount = actualOnlineUsers.length;

  // 새로운 기능이나 업데이트가 있는지 확인 (실제로는 서버에서 가져와야 함)
  const hasNewFeatures = false; // 실제 구현 시 서버에서 확인

  // 시스템 변경사항 상태 추가
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // 시스템 로그 가져오기
  useEffect(() => {
    const fetchSystemLogs = async () => {
      // 로딩 중이면 중복 요청 방지
      if (loadingLogs) {
        console.log('🔄 시스템 로그 이미 조회 중...');
        return;
      }
      
      try {
        setLoadingLogs(true);
        console.log('🔍 시스템 로그 조회 시작');
        
        const { data: logs, error } = await supabase
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) {
          console.error('시스템 로그 조회 오류:', error);
          return;
        }
        
        console.log('📋 시스템 로그:', logs);
        setSystemLogs(logs || []);
        
      } catch (error) {
        console.error('시스템 로그 가져오기 실패:', error);
      } finally {
        setLoadingLogs(false);
      }
    };

    // 초기 로드
    fetchSystemLogs();
    
    // 30초마다 로그 새로고침
    const logInterval = setInterval(fetchSystemLogs, 30000);
    
    return () => clearInterval(logInterval);
  }, []); // 의존성 배열에서 loadingLogs 제거

  // 실시간 온라인 사용자 데이터 가져오기
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        console.log('👥 온라인 사용자 조회 시작');
        
        // 모든 사용자를 조회 (활성화된 사용자만)
        const { data: users, error } = await supabase
          .from('users')
          .select('id, name, email, avatar, role, last_seen, updated_at, current_page, is_online')
          .eq('is_active', true)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('온라인 사용자 조회 오류:', error);
          return;
        }
        
        console.log('👤 전체 사용자 목록:', users?.length || 0, '명');
        
        // 최근 10분 이내에 활동한 사용자를 온라인으로 간주
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        const onlineUserList = (users || [])
          .map(user => {
            const lastActivity = new Date(user.updated_at || user.last_seen || 0);
            const isRecentlyActive = lastActivity > tenMinutesAgo;
            const isOnline = user.is_online && isRecentlyActive;
            
            return {
              id: user.id,
              name: user.name || user.email || 'Unknown',
              avatar: user.avatar,
              status: isOnline ? 'online' : 'offline',
              currentPage: user.current_page || (isOnline ? '활동 중' : '오프라인'),
              lastSeen: lastActivity.toLocaleString('ko-KR'),
              role: user.role
            } as OnlineUser;
          })
          .filter(user => user.status === 'online')
          .slice(0, 20); // 최대 20명까지 표시
            
        setOnlineUsers(onlineUserList);
        console.log('✅ 온라인 사용자 업데이트:', onlineUserList.length, '명');
        
      } catch (error) {
        console.error('온라인 사용자 가져오기 실패:', error);
      }
    };

    fetchOnlineUsers();

    // 30초마다 온라인 사용자 새로고침
    const userInterval = setInterval(fetchOnlineUsers, 30000);

    return () => clearInterval(userInterval);
  }, [location.pathname]);

  // 사용자 활동 상태 업데이트 (실시간 온라인 상태 관리)
  useEffect(() => {
    let updateInProgress = false;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 30 * 1000; // 30초마다 업데이트 (더 빈번하게)
    
    const updateUserActivity = async (forceUpdate = false) => {
      const now = Date.now();
      
      // 강제 업데이트가 아니고 이미 업데이트 중이거나 최근에 업데이트했으면 건너뛰기
      if (!forceUpdate && (updateInProgress || (now - lastUpdateTime) < UPDATE_INTERVAL)) {
        return;
      }
      
      updateInProgress = true;
      
      try {
        if (currentUser || userProfile) {
          const userId = currentUser?.id || userProfile?.id;
          const userName = currentUser?.name || userProfile?.name;
          
          if (!userId || typeof userId !== 'string') {
            console.log('유효하지 않은 사용자 ID:', userId);
            return;
          }

          // UUID 형식 검증
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(userId)) {
            console.log('유효하지 않은 UUID 형식:', userId);
            return;
          }

          const currentPageName = getCurrentPageName();
          console.log('👤 사용자 활동 상태 업데이트:', userName, '현재 페이지:', currentPageName);
          
          // 사용자 온라인 상태 업데이트
          const { error } = await supabase
            .from('users')
            .update({
              updated_at: new Date().toISOString(),
              last_seen: new Date().toISOString(),
              current_page: currentPageName,
              is_online: true
            })
            .eq('id', userId);

          if (error) {
            console.error('사용자 활동 상태 업데이트 오류:', error);
          } else {
            console.log('✅ 사용자 활동 상태 업데이트 성공 - 페이지:', currentPageName);
            lastUpdateTime = now;
          }
        }
      } catch (error) {
        console.error('사용자 활동 상태 업데이트 중 오류:', error);
      } finally {
        updateInProgress = false;
      }
    };

    // 초기 활동 상태 업데이트
    updateUserActivity(true);

    // 페이지 변경 시 활동 상태 업데이트
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => updateUserActivity(true), 500); // 즉시 업데이트
      }
    };

    // 주기적으로 활동 상태 업데이트 (2분마다)
    const regularUpdateInterval = setInterval(() => updateUserActivity(false), 2 * 60 * 1000);

    // 사용자 활동 감지 (클릭, 키보드 입력 시)
    let activityTimeout: NodeJS.Timeout;
    const handleUserActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => updateUserActivity(false), 10 * 1000); // 10초 후 업데이트
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mousedown', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);

    return () => {
      clearTimeout(activityTimeout);
      clearInterval(regularUpdateInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mousedown', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity);
    };
  }, []); // currentUser, userProfile 의존성 완전 제거로 무한 루프 방지

  // 페이지 변경 감지 및 즉시 업데이트
  useEffect(() => {
    let updateInProgress = false;
    
    const updateCurrentPage = async () => {
      if (updateInProgress) return;
      updateInProgress = true;
      
      try {
        if (currentUser || userProfile) {
          const userId = currentUser?.id || userProfile?.id;
          
          if (!userId || typeof userId !== 'string') {
            return;
          }

          // UUID 형식 검증
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(userId)) {
            return;
          }

          const currentPageName = getCurrentPageName();
          console.log('🔄 페이지 변경 감지 - 즉시 업데이트:', currentPageName);
          
          // 현재 페이지만 즉시 업데이트
          const { error } = await supabase
            .from('users')
            .update({
              current_page: currentPageName,
              updated_at: new Date().toISOString(),
              last_seen: new Date().toISOString(),
              is_online: true
            })
            .eq('id', userId);

          if (error) {
            console.error('페이지 변경 업데이트 오류:', error);
          } else {
            console.log('✅ 페이지 변경 업데이트 성공:', currentPageName);
          }
        }
      } catch (error) {
        console.error('페이지 변경 업데이트 중 오류:', error);
      } finally {
        updateInProgress = false;
      }
    };

    // 페이지 변경 시 즉시 업데이트
    updateCurrentPage();
  }, [location.pathname]); // 라우터 경로 변경 감지

  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    }
  }, []);

  // 실시간 프로필 동기화 (currentUser 변경 시)
  useEffect(() => {
    if (currentUser) {
      console.log('사이드바 - currentUser 업데이트:', currentUser);
      setUserProfile(currentUser);
    }
  }, [currentUser]);

  // 사용자 역할 정보 동기화 (최적화됨)
  useEffect(() => {
    let syncInProgress = false;
    let lastSyncTime = 0;
    const SYNC_INTERVAL = 10 * 60 * 1000; // 10분마다만 동기화
    
    const syncUserRole = async () => {
      const now = Date.now();
      
      // 조건 체크: 사용자 ID 없음, 이미 진행 중, 최근에 동기화함
      if (!currentUser?.id || syncInProgress || (now - lastSyncTime) < SYNC_INTERVAL) {
        console.log('사용자 역할 동기화 건너뜀:', {
          hasUserId: !!currentUser?.id,
          inProgress: syncInProgress,
          timeSinceLastSync: now - lastSyncTime,
          interval: SYNC_INTERVAL
        });
        return;
      }
      
      syncInProgress = true;
      
      try {
        console.log('🔄 사이드바 - 사용자 역할 정보 동기화 비활성화됨 (리소스 절약)');
        
        // 실제 DB 동기화는 비활성화하고 로컬 데이터만 사용
        lastSyncTime = now;
        
      } catch (error: any) {
        console.log('사이드바 - 역할 동기화 중 오류:', error);
      } finally {
        syncInProgress = false;
      }
    };

    // 초기 동기화는 건너뛰기
    // syncUserRole();

    // 동기화 간격을 매우 길게 설정 (30분마다)
    const interval = setInterval(syncUserRole, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // 페이지별 프로필 업데이트 체크 (최적화됨)
  useEffect(() => {
    let lastCheckTime = 0;
    const CHECK_INTERVAL = 30 * 1000; // 30초마다만 체크
    
    const checkProfileUpdate = () => {
      const now = Date.now();
      
      // 너무 빈번한 체크 방지
      if (now - lastCheckTime < CHECK_INTERVAL) {
        console.log('프로필 업데이트 체크 건너뜀 - 너무 빈번함');
        return;
      }
      
      lastCheckTime = now;
      
      try {
      const storedProfile = localStorage.getItem("userProfile");
      
      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile);
            // 현재 userProfile과 비교하여 다른 경우에만 업데이트
          if (JSON.stringify(parsedProfile) !== JSON.stringify(userProfile)) {
            console.log('사이드바 - localStorage 프로필 업데이트 감지:', parsedProfile);
            setUserProfile(parsedProfile);
          }
        } catch (e) {
          console.error('프로필 파싱 오류:', e);
        }
      }
      } catch (error) {
        console.log('프로필 업데이트 체크 중 오류:', error);
      }
    };

    // 초기 체크
    checkProfileUpdate();

    // 2분마다 체크 (10초 -> 2분으로 변경)
    const interval = setInterval(checkProfileUpdate, 2 * 60 * 1000);
    
    // 페이지 포커스 시에만 체크 (throttle 적용)
    const handleFocus = () => {
      setTimeout(() => {
      console.log('사이드바 - 페이지 포커스 감지, 프로필 새로고침');
      checkProfileUpdate();
      }, 1000); // 1초 지연
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // userProfile 의존성 제거하여 무한 루프 방지

  const handleLogout = async () => {
    try {
      // 로그아웃 시 온라인 상태를 offline로 변경
      if (currentUser || userProfile) {
        const userId = currentUser?.id || userProfile?.id;
        if (userId && typeof userId === 'string') {
          // UUID 형식 검증
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(userId)) {
            try {
              console.log('🔴 사용자 오프라인 상태로 변경:', currentUser?.name || userProfile?.name);
              
              // 오프라인 상태로 업데이트
              const updateData: any = {
                is_online: false,
                last_seen: new Date().toISOString(),
                current_page: null,
                updated_at: new Date().toISOString()
              };

              const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', userId);
              
              if (error) {
                console.error('오프라인 상태 변경 실패:', error);
              } else {
                console.log('✅ 사용자 오프라인 상태로 변경 완료');
              }
            } catch (error) {
              console.error('오프라인 상태 변경 중 오류:', error);
            }
          }
        }
      }

      // Supabase 로그아웃
      await supabase.auth.signOut();
      
      // 로컬 데이터 정리
      localStorage.removeItem("userProfile");
      localStorage.removeItem("user");
      
      // 홈으로 리다이렉트
      window.location.href = "/";
    } catch (error) {
      console.error("로그아웃 중 오류:", error);
      // 오류가 발생해도 로컬 데이터는 정리
      localStorage.removeItem("userProfile");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
  };

  const t = translations?.sidebar || {
    dashboard: "대시보드",
    projects: "프로젝트",
    tasks: "업무",
    team: "팀",
    calendar: "일정",
    reports: "보고서",
    clients: "고객사",
    admin: "관리자",
    adminPanel: "관리자 패널",
    settings: "설정",
    profile: "프로필",
    logout: "로그아웃",
    clientsAndPartners: "고객사 & 협업사",
    taskManagement: "업무 관리",
    taskJournal: "업무 일지",
    taskJournalList: "업무 일지 목록",
    byCompany: "법인별",
    teamCorporation: "법인별",
    byDepartment: "부서별",
    teamDepartment: "부서별",
    byExecutive: "임원별",
    teamExecutive: "임원별",
    byEmployee: "직원별",
    online: "온라인",
    systemStatus: "시스템 정상"
  };

  interface SubmenuItem {
    name: string;
    path: string;
    icon: React.ReactElement;
    adminOnly?: boolean;
    badge?: string | number;
    color?: string;
  }

  interface MenuItem {
    name: string;
    icon: React.ReactElement;
    path: string;
    submenu?: SubmenuItem[];
    badge?: string | number;
    color?: string;
    gradient?: string;
  }

  const menuItems: MenuItem[] = [
    // {
    //   name: t.dashboard,
    //   icon: <LayoutDashboard className="h-5 w-5" />,
    //   path: "/",
    //   gradient: "from-blue-500 to-purple-600",
    //   badge: hasNewFeatures ? "NEW" : undefined
    // },
    {
      name: t.projects,
      icon: <Folder className="h-5 w-5" />,
      path: "/projects",
      gradient: "from-green-500 to-teal-600",
      badge: activeProjects > 0 ? activeProjects : undefined,
      submenu: [
        {
          name: t.projects,
          path: "/projects",
          icon: <FolderOpen className="h-4 w-4" />,
          color: "text-green-600",
          badge: activeProjects > 0 ? activeProjects : undefined
        },
        // {
        //   name: t.clients || "고객사",
        //   path: "/clients",
        //   icon: <Briefcase className="h-4 w-4" />,
        //   color: "text-blue-600"
        // },
      ],
    },
    {
      name: t.tasks,
      icon: <ClipboardList className="h-5 w-5" />,
      path: "/tasks",
      gradient: "from-orange-500 to-red-600",
      badge: totalTasks > 0 ? totalTasks : undefined,
      submenu: [
        {
          name: t.taskManagement || "업무 관리",
          path: "/tasks",
          icon: <ClipboardList className="h-4 w-4" />,
          color: "text-orange-600",
          badge: activeTasks > 0 ? activeTasks : undefined
        },
        {
          name: t.taskJournalList || "업무 일지 목록",
          path: "/tasks/journal-list",
          icon: <ListFilter className="h-4 w-4" />,
          color: "text-red-600",
          badge: journalNotifications > 0 ? journalNotifications : undefined
        },
      ],
    },
    // {
    //   name: t.chat || "채팅",
    //   icon: <MessageCircle className="h-5 w-5" />,
    //   path: "/chat",
    //   gradient: "from-indigo-500 to-cyan-600",
    //   badge: undefined, // 읽지 않은 메시지 수로 나중에 업데이트
    //   submenu: [
    //     {
    //       name: t.chatRooms || "채팅방",
    //       path: "/chat",
    //       icon: <MessageCircle className="h-4 w-4" />,
    //       color: "text-indigo-600"
    //     },
    //     {
    //       name: t.directMessages || "개인 메시지",
    //       path: "/chat/direct",
    //       icon: <UserCheck className="h-4 w-4" />,
    //       color: "text-cyan-600"
    //     },
    //   ],
    // },
    // 관리자 및 매니저만 접근 가능한 관리자 패널
    ...(userProfile?.role === 'admin' || userProfile?.role === 'manager' || currentUser?.role === 'admin' || currentUser?.role === 'manager' ? [{
      name: t.adminPanel || "관리자 패널",
      icon: <Cog className="h-5 w-5" />,
      path: "/admin",
      gradient: "from-purple-500 to-pink-600",
      badge: hasNewFeatures ? "NEW" : undefined
    }] : []),
  ];

  const toggleSubmenu = (path: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="h-3 w-3" />;
      case 'away': return <Clock className="h-3 w-3" />;
      case 'busy': return <WifiOff className="h-3 w-3" />;
      case 'offline': return <WifiOff className="h-3 w-3" />;
      default: return <WifiOff className="h-3 w-3" />;
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'manager': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const isAdmin = userProfile?.role === "admin" || currentUser?.role === "admin";

  // 현재 페이지 이름 가져오기
  const getCurrentPageName = () => {
    const pathname = location.pathname;
    
    // 메인 메뉴에서 현재 경로와 일치하는 항목 찾기
    for (const item of menuItems) {
      if (pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path))) {
        // 서브메뉴가 있는 경우 서브메뉴에서도 찾기
        if (item.submenu) {
          const submenuItem = item.submenu.find(sub => pathname === sub.path || pathname.startsWith(sub.path));
          if (submenuItem) {
            return submenuItem.name;
          }
        }
        return item.name;
      }
    }
    
    // 프로필 페이지
    if (pathname === "/profile") return t.profile || "프로필";
    
    // 기타 경로에 대한 매핑
    const pathMap: Record<string, string> = {
      "/": t.projects || "프로젝트",
      "/projects": t.projects || "프로젝트",
      "/tasks": t.taskManagement || "업무 관리",
      "/tasks/journal": t.taskJournal || "업무 일지",
      "/tasks/journal-list": t.taskJournalList || "업무 일지 목록",
      "/tasks/journals": t.taskJournalList || "업무 일지 목록",
      "/admin": t.adminPanel || "관리자 패널",
      "/profile": t.profile || "프로필"
    };
    
    return pathMap[pathname] || "알 수 없는 페이지";
  };

  return (
    <TooltipProvider>
      <aside className={cn(
        "hidden md:flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white h-screen transition-all duration-300 shadow-2xl border-r border-slate-700/50",
        isCollapsed ? "w-32" : "w-72"
      )}>
        {/* 헤더 */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
          <div className={cn("relative border-b border-slate-700/50", isCollapsed ? "p-2" : "p-4")}>
            <div className={cn("flex items-center", isCollapsed ? "flex-col space-y-2" : "gap-3")}>
              <div className="relative flex justify-center">
                <img 
                  src="/Coilmaster%20Logo.ico" 
                  alt="Coilmaster Logo" 
                  className={cn("rounded-xl shadow-lg", isCollapsed ? "w-8 h-8" : "w-10 h-10")}
                  onError={(e) => {
                    console.error("Logo not found, falling back to text");
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className={cn("absolute bg-green-500 rounded-full border-2 border-slate-900 animate-pulse", 
                  isCollapsed ? "-top-0.5 -right-0.5 w-2.5 h-2.5" : "-top-1 -right-1 w-3 h-3")}></div>
      </div>
              {/* 접힌 상태에서도 제목 표시 */}
              <div className={cn("flex flex-col", isCollapsed ? "items-center text-center" : "")}>
                <h2 className={cn(
                  "font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent",
                  isCollapsed ? "text-sm" : "text-lg"
                )}>
                  {isCollapsed ? "Coilmaster" : "Coilmaster Notion"}
                </h2>
                <p className={cn("text-slate-400", isCollapsed ? "text-xs" : "text-xs")}>
                  {isCollapsed ? "System" : "Enterprise System"}
                </p>
          </div>
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="ml-auto text-slate-400 hover:text-white hover:bg-slate-700/50"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              )}
            </div>
            {/* 접힌 상태에서의 토글 버튼 */}
            {isCollapsed && (
              <div className="flex justify-center mt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50 w-8 h-8"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 사용자 프로필 */}
        <div className={cn("border-b border-slate-700/50", isCollapsed ? "p-2" : "p-4")}>
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
            <div className="relative flex justify-center">
              <Avatar className={cn("border-2 border-gradient-to-r from-blue-500 to-purple-500", 
                isCollapsed ? "h-10 w-10" : "h-12 w-12")}>
                <AvatarImage src={userProfile?.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                  {userProfile?.name?.charAt(0) || currentUser?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className={cn("absolute rounded-full border-2 border-slate-900", 
                getStatusColor('online'),
                isCollapsed ? "-bottom-0.5 -right-0.5 w-3 h-3" : "-bottom-1 -right-1 w-4 h-4")}></div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-white truncate">
                    {userProfile?.name || currentUser?.name || "사용자"}
                  </div>
                  <Badge className={cn(
                    "text-xs px-2 py-0.5 text-white border-0",
                    (() => {
                      // 우선순위: userProfile.role > currentUser.role
                      const role = userProfile?.role || currentUser?.role || 'user';
                      
                      console.log('사이드바 역할 정보 디버그:', {
                        userProfileRole: userProfile?.role,
                        currentUserRole: currentUser?.role,
                        finalRole: role,
                        userProfileData: userProfile,
                        currentUserData: currentUser
                      });
                      
                      return role === 'admin' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                             role === 'manager' ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                             'bg-gradient-to-r from-green-500 to-emerald-500';
                    })()
                  )}>
                    {(() => {
                      // 우선순위: userProfile.role > currentUser.role
                      const role = userProfile?.role || currentUser?.role || 'user';
                      
                      switch (role) {
                        case 'admin':
                          return '관리자';
                        case 'manager':
                          return '매니저';
                        case 'user':
                        default:
                          return '사용자';
                      }
                    })()}
                  </Badge>
                </div>
                
                {/* 이메일 */}
                <div className="text-xs text-slate-300 truncate mb-1">
                  {userProfile?.email || currentUser?.email}
                </div>
                
                {/* 부서 및 추가 정보 */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {(userProfile?.department_name || (currentUser as any)?.department_name || 
                    userProfile?.department || currentUser?.department) && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-300">
                      <Building className="h-2.5 w-2.5 mr-1" />
                      {(() => {
                        // 부서 정보를 안전하게 가져오기
                        const userDept = userProfile?.department || currentUser?.department;
                        const userDeptId = userProfile?.department_id || (currentUser as any)?.department_id;
                        const deptName = userProfile?.department_name || (currentUser as any)?.department_name;
                        
                        // 디버깅용 로그
                        console.log('사이드바 부서 정보 디버그:', {
                          userDept,
                          userDeptId,
                          deptName,
                          departments: departments.length,
                          userProfile,
                          currentUser
                        });
                        
                        // 이미 이름이 있으면 사용
                        if (deptName) return deptName;
                        
                        // 부서 ID로 departments 배열에서 찾기
                        if (userDeptId && departments.length > 0) {
                          const foundDept = departments.find(dept => dept.id === userDeptId);
                          if (foundDept) return foundDept.name;
                        }
                        
                        // 부서가 객체인 경우 name 속성 사용
                        if (typeof userDept === 'object' && userDept?.name) {
                          return userDept.name;
                        }
                        
                        // 부서 코드로 departments 배열에서 찾기
                        if (typeof userDept === 'string' && departments.length > 0) {
                          const foundDept = departments.find(dept => dept.code === userDept);
                          if (foundDept) return foundDept.name;
                        }
                        
                        // 부서가 문자열인 경우 fallback 번역 (departments 데이터가 없을 때만)
                        if (typeof userDept === 'string') {
                          if (language === "ko") {
                            switch (userDept) {
                              case "sales": return "영업";
                              case "development": return "개발";
                              case "manufacturing": return "제조";
                              case "quality": return "품질";
                              case "finance": return "경리";
                              case "management": return "경영";
                              case "administration": return "관리";
                              default: return userDept;
                            }
                          }
                          return userDept;
                        }
                        
                        return "-";
                      })()}
                    </Badge>
                  )}
                  
                  {/* 언어 배지 */}
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-300">
                    <Globe className="h-2.5 w-2.5 mr-1" />
                    {language === 'ko' ? '한국어' : language === 'en' ? 'English' : language === 'th' ? 'ไทย' : '中文'}
                  </Badge>
                  
                  {/* 활성화 상태 */}
                  <Badge variant="secondary" className={cn(
                    "text-xs px-2 py-0.5",
                    (() => {
                      // 우선순위: userProfile.is_active > currentUser.is_active > currentUser.isActive
                      const isActive = userProfile?.is_active !== undefined 
                        ? userProfile.is_active 
                        : (currentUser as any)?.is_active !== undefined 
                          ? (currentUser as any).is_active 
                          : currentUser?.isActive !== false;
                      
                      console.log('사이드바 활성화 상태 디버그:', {
                        userProfileIsActive: userProfile?.is_active,
                        currentUserIsActive: (currentUser as any)?.is_active,
                        currentUserIsActiveAlt: currentUser?.isActive,
                        finalIsActive: isActive,
                        userProfileData: userProfile,
                        currentUserData: currentUser
                      });
                      
                      return isActive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300";
                    })()
                  )}>
                    <Activity className="h-2.5 w-2.5 mr-1" />
                    {(() => {
                      // 우선순위: userProfile.is_active > currentUser.is_active > currentUser.isActive
                      const isActive = userProfile?.is_active !== undefined 
                        ? userProfile.is_active 
                        : (currentUser as any)?.is_active !== undefined 
                          ? (currentUser as any).is_active 
                          : currentUser?.isActive !== false;
                      
                      return isActive ? '활성' : '비활성';
                    })()}
                  </Badge>
                </div>
                
                {/* 멤버십 정보 */}
                <div className="flex items-center gap-1 mt-1">
                  <Award className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-yellow-400 font-medium">Premium Member</span>
                </div>
                
                {/* Microsoft 로그인 정보 */}
                {(userProfile?.loginMethod === "azure" || userProfile?.login_method === "microsoft") && (
                  <div className="text-xs text-blue-400 mt-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 23 23" className="mr-1">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                Microsoft
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 알림 */}
        {!isCollapsed ? (
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">{t.notifications || "알림"}</span>
              </div>
              {unreadNotifications > 0 && (
                <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                  {unreadNotifications}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          /* 접힌 상태에서의 알림 아이콘 */
          <div className="p-2 border-b border-slate-700/50">
            <div className="flex flex-col items-center space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative flex flex-col items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl w-12 h-12"
                    >
                      <Bell className="h-5 w-5" />
                    </Button>
                    {unreadNotifications > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white flex items-center justify-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </Badge>
                    )}
                    <span className="text-xs font-medium text-center leading-tight mt-1">알림</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t.notifications || "알림"} {unreadNotifications > 0 ? `(${unreadNotifications})` : ''}</p>
                  <p>온라인 사용자: {onlineUsers.length}명</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* 온라인 사용자 */}
        {!isCollapsed ? (
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">온라인 사용자</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">{onlineUsers.length}</span>
              </div>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {onlineUsers.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-2">
                  현재 온라인 사용자가 없습니다
                </div>
              ) : (
                onlineUsers.map((user) => (
                  <Tooltip key={user.id}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-700/30 transition-colors cursor-pointer">
                        <div className="relative">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xs bg-slate-600">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-slate-900"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="text-xs font-medium text-white truncate">{user.name}</div>
                            {user.role && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs px-1 py-0 border-0",
                                  user.role === 'admin' ? 'bg-red-500/20 text-red-300' :
                                  user.role === 'manager' ? 'bg-blue-500/20 text-blue-300' :
                                  'bg-green-500/20 text-green-300'
                                )}
                              >
                                {user.role === 'admin' ? '관리자' : 
                                 user.role === 'manager' ? '매니저' : '사용자'}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate">{user.currentPage}</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div className="space-y-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs">상태: 온라인</p>
                        <p className="text-xs">현재: {user.currentPage}</p>
                        {user.role && (
                          <p className="text-xs">역할: {
                            user.role === 'admin' ? '관리자' : 
                            user.role === 'manager' ? '매니저' : '사용자'
                          }</p>
                        )}
                        <p className="text-xs">최근 활동: {user.lastSeen}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))
              )}
            </div>
          </div>
        ) : null}

        {/* 네비게이션 메뉴 */}
        <nav className={cn("flex-1 overflow-y-auto", isCollapsed ? "p-2" : "p-3")}>
          <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              {item.submenu ? (
                  <div className="space-y-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                  <button
                    onClick={() => toggleSubmenu(item.path)}
                    className={cn(
                            "group relative flex items-center rounded-xl text-slate-300 hover:text-white transition-all duration-200 overflow-hidden w-full",
                            "hover:bg-gradient-to-r hover:shadow-lg hover:shadow-blue-500/25",
                            item.gradient && `hover:${item.gradient}`,
                            (location.pathname.startsWith(item.path)) && "bg-gradient-to-r text-white shadow-lg",
                            (location.pathname.startsWith(item.path)) && item.gradient,
                            isCollapsed ? "flex-col justify-center items-center p-2 h-16" : "justify-start text-left gap-3 px-3 py-3"
                          )}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                               style={{ background: item.gradient ? `linear-gradient(to right, var(--tw-gradient-stops))` : undefined }} />
                          <div className={cn("relative flex items-center", isCollapsed ? "justify-center mb-1" : "flex-shrink-0")}>
                            <div className="flex items-center justify-center min-w-[20px] w-5 h-5">
                      {item.icon}
                              {item.badge && (
                                <Badge className={cn(
                                  "absolute text-xs px-1 py-0 bg-red-500 text-white",
                                  isCollapsed ? "-top-1 -right-1" : "-top-2 -right-2"
                                )}>
                                  {isCollapsed && typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                                </Badge>
                              )}
                            </div>
                    </div>
                          {isCollapsed ? (
                            <span className="text-xs font-medium text-center leading-tight">{item.name}</span>
                          ) : (
                            <>
                              <span className="font-medium flex-grow">{item.name}</span>
                              <div className="flex-shrink-0">
                    {expandedItems[item.path] ? (
                                  <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                    ) : (
                                  <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                                )}
                              </div>
                            </>
                    )}
                  </button>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          <p>{item.name}</p>
                          {item.badge && <p>{t.notifications || "알림"}: {item.badge}</p>}
                        </TooltipContent>
                      )}
                    </Tooltip>
                    
                    {/* 서브메뉴 */}
                    {expandedItems[item.path] && item.submenu && !isCollapsed && (
                      <ul className="ml-6 space-y-1 border-l-2 border-slate-700/50 pl-4">
                      {item.submenu.map((subitem) => {
                        if (subitem.adminOnly && !isAdmin) return null;
                        
                        return (
                          <li key={subitem.path}>
                            <NavLink
                              to={subitem.path}
                              className={({ isActive }) =>
                                cn(
                                    "group flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 text-sm relative overflow-hidden w-full",
                                    isActive && "text-white bg-slate-700/70 shadow-md",
                                    subitem.color
                                )
                              }
                            >
                                <div className="flex items-center justify-center min-w-[20px] w-5 h-5 flex-shrink-0">
                              {subitem.icon}
                                </div>
                                <span className="flex-grow">{subitem.name}</span>
                                  {subitem.badge && (
                                  <Badge className="text-xs px-1 py-0 bg-orange-500 text-white">
                                      {subitem.badge}
                                    </Badge>
                                  )}
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    cn(
                            "group relative flex items-center rounded-xl text-slate-300 hover:text-white transition-all duration-200 overflow-hidden w-full",
                            "hover:bg-gradient-to-r hover:shadow-lg hover:shadow-blue-500/25",
                            item.gradient && `hover:${item.gradient}`,
                            isActive && "bg-gradient-to-r text-white shadow-lg",
                            isActive && item.gradient,
                            isCollapsed ? "flex-col justify-center items-center p-2 h-16" : "justify-start gap-3 px-3 py-3"
                          )
                        }
                      >
                        <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                             style={{ background: item.gradient ? `linear-gradient(to right, var(--tw-gradient-stops))` : undefined }} />
                        <div className={cn("relative flex items-center", isCollapsed ? "justify-center mb-1" : "flex-shrink-0")}>
                          <div className="flex items-center justify-center min-w-[20px] w-5 h-5">
                  {item.icon}
                            {item.badge && (
                              <Badge className={cn(
                                "absolute text-xs px-1 py-0 bg-red-500 text-white",
                                isCollapsed ? "-top-1 -right-1" : "-top-2 -right-2"
                              )}>
                                {isCollapsed && typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isCollapsed ? (
                          <span className="text-xs font-medium text-center leading-tight">{item.name}</span>
                        ) : (
                          <span className="font-medium flex-grow">{item.name}</span>
                        )}
                </NavLink>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        <p>{item.name}</p>
                        {item.badge && <p>{t.notifications || "알림"}: {item.badge}</p>}
                      </TooltipContent>
                    )}
                  </Tooltip>
              )}
            </li>
          ))}
        </ul>
      </nav>



        {/* 하단 메뉴 */}
        <div className={cn("border-t border-slate-700/50 space-y-2", isCollapsed ? "p-2" : "p-3")}>
          <Tooltip>
            <TooltipTrigger asChild>
        <NavLink
          to="/profile"
          className={({ isActive }) => cn(
                  "group flex items-center rounded-xl text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 w-full",
                  isActive && "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg",
                  isCollapsed ? "flex-col justify-center items-center p-2 h-16" : "justify-start gap-3 px-3 py-3"
          )}
        >
                <div className={cn("flex items-center", isCollapsed ? "justify-center mb-1" : "flex-shrink-0")}>
                  <div className="flex items-center justify-center min-w-[20px] w-5 h-5">
          <User className="h-5 w-5" />
                  </div>
                </div>
                {isCollapsed ? (
                  <span className="text-xs font-medium text-center leading-tight">{t.profile || "프로필"}</span>
                ) : (
                  <span className="font-medium flex-grow">{t.profile || "프로필"}</span>
                )}
        </NavLink>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>{t.profile || "프로필"}</p>
              </TooltipContent>
            )}
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
                className={cn(
                  "group text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 transition-all duration-200 rounded-xl w-full",
                  isCollapsed ? "flex-col justify-center items-center p-2 h-16" : "justify-start px-3 py-3"
                )}
          onClick={handleLogout}
        >
                <div className={cn("flex items-center", isCollapsed ? "justify-center mb-1" : "flex-shrink-0")}>
                  <div className="flex items-center justify-center min-w-[20px] w-5 h-5">
                    <LogOut className="h-5 w-5" />
                  </div>
                </div>
                {isCollapsed ? (
                  <span className="text-xs font-medium text-center leading-tight">{t.logout || "로그아웃"}</span>
                ) : (
                  <span className="font-medium flex-grow">{t.logout || "로그아웃"}</span>
                )}
        </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>{t.logout || "로그아웃"}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* 하단 상태 표시 */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{t.systemStatus || "시스템 정상"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <span>99.9%</span>
              </div>
            </div>
            <Progress value={85} className="mt-2 h-1" />
            <div className="text-xs text-slate-500 mt-1">{t.serverStatus || "서버 상태: 양호"}</div>
      </div>
        )}
    </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
