import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Menu } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
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
  Crown,
  Shield,
  Wifi,
  WifiOff,
  Clock
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentPage?: string;
  lastSeen?: string;
}

interface NotificationItem {
  id: string;
  type: 'task' | 'project' | 'system' | 'mention';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

const MobileSidebar = () => {
  const { currentUser, tasks, projects, notifications } = useAppContext();
  const { translations, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sidebarNotifications] = useState<NotificationItem[]>([
    { id: '1', type: 'task', title: '새 업무 할당', message: '프로젝트 A 업무가 할당되었습니다', time: '2분 전', read: false, priority: 'high' },
    { id: '2', type: 'project', title: '프로젝트 업데이트', message: '프로젝트 B가 완료되었습니다', time: '1시간 전', read: false, priority: 'medium' }
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

  // 업무 관련 통계 계산
  const totalTasks = tasksList.length;
  const activeTasks = tasksList.filter(task => 
    task.status === 'in-progress' || task.status === 'pending' || task.status === 'not-started'
  ).length;
  
  // 업무 일지 관련 통계 (실제 데이터가 있다면 사용, 없으면 0)
  const journalEntries = 0; // 실제 업무 일지 데이터가 있다면 여기서 계산

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

  // 실제 온라인 사용자 상태 확인 및 업데이트
  useEffect(() => {
    const checkOnlineUsers = async () => {
      try {
        // 현재 사용자만으로 기본 온라인 사용자 목록 생성
        const fallbackUsers: OnlineUser[] = [];
        if (currentUser || userProfile) {
          fallbackUsers.push({
            id: currentUser?.id || userProfile?.id || 'current-user',
            name: currentUser?.name || userProfile?.name || '현재 사용자',
            status: 'online',
            currentPage: '대시보드',
            avatar: userProfile?.avatar
          });
        }

        // 간단하게 현재 사용자만 온라인으로 표시 (모바일에서는 복잡한 로직 제거)
        setOnlineUsers(fallbackUsers);
        
      } catch (error) {
        console.error('온라인 사용자 확인 중 오류:', error);
        setOnlineUsers([]);
      }
    };

    checkOnlineUsers();

    // 실시간 온라인 상태 업데이트를 위한 interval
    const interval = setInterval(checkOnlineUsers, 60000); // 1분마다 확인 (모바일은 덜 자주)

    return () => clearInterval(interval);
  }, [currentUser, userProfile]);

  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    }
  }, []);

  const handleLogout = () => {
    // 로그아웃 시 온라인 상태를 offline로 변경
    if (currentUser || userProfile) {
      // 실제 구현에서는 사용자 상태를 offline로 업데이트
      console.log('사용자 오프라인 상태로 변경:', currentUser?.name || userProfile?.name);
    }
    
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("loginMethod");
    window.location.href = "/login";
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
    notifications: "알림",
    online: "온라인",
    systemStatus: "시스템 정상",
    serverStatus: "서버 상태: 양호"
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
          badge: journalEntries > 0 ? journalEntries : undefined
        },
      ],
    },
    {
      name: t.adminPanel || "관리자 패널",
      icon: <Cog className="h-5 w-5" />,
      path: "/admin",
      gradient: "from-purple-500 to-pink-600",
      badge: hasNewFeatures ? "NEW" : undefined
    },
  ];

  const toggleSubmenu = (path: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon" className="ml-2 relative">
          <Menu className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white">
              {unreadNotifications}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700">
        {/* 헤더 */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
          <div className="relative p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/Coilmaster%20Logo.ico" 
                  alt="Coilmaster Logo" 
                  className="w-10 h-10 rounded-xl shadow-lg"
                  onError={(e) => {
                    console.error("Logo not found, falling back to text");
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Coilmaster Notion
                </h2>
                <p className="text-xs text-slate-400">Mobile Enterprise</p>
              </div>
            </div>
          </div>
        </div>

        {/* 사용자 프로필 */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-gradient-to-r from-blue-500 to-purple-500">
                <AvatarImage src={userProfile?.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                  {userProfile?.name?.charAt(0) || currentUser?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-slate-900", getStatusColor('online'))}></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-white truncate">
                  {userProfile?.name || currentUser?.name || "사용자"}
                </div>
                {getRoleIcon(userProfile?.role || currentUser?.role)}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {userProfile?.position || currentUser?.role || ""}
                {userProfile?.department && (
                  <> • {language === "ko" ? 
                    userProfile.department === "sales" ? "영업" :
                    userProfile.department === "development" ? "개발" :
                    userProfile.department === "manufacturing" ? "제조" :
                    userProfile.department === "quality" ? "품질" :
                    userProfile.department === "finance" ? "경리" :
                    userProfile.department === "management" ? "경영" :
                    userProfile.department === "administration" ? "관리" :
                    userProfile.department
                  : userProfile.department}
                  </>
                )}
              </div>
              {userProfile?.loginMethod === "microsoft" && (
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
          </div>
        </div>

        {/* 알림 및 온라인 사용자 */}
        <div className="p-4 border-b border-slate-700/50 space-y-3">
          {/* 알림 */}
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

          {/* 온라인 사용자 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-300">{t.online || "온라인"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">{onlineCount}</span>
            </div>
          </div>

          {/* 온라인 사용자 목록 */}
          <div className="space-y-2 max-h-24 overflow-y-auto">
            {actualOnlineUsers.slice(0, 2).map((user) => (
              <div key={user.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
                <div className="relative">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-xs bg-slate-600">
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900", getStatusColor(user.status))}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{user.name}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {user.currentPage || user.lastSeen}
                  </div>
                </div>
                {getStatusIcon(user.status)}
              </div>
            ))}
          </div>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                {item.submenu ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleSubmenu(item.path)}
                      className={cn(
                        "group relative flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-slate-300 hover:text-white transition-all duration-200 w-full text-left overflow-hidden",
                        "hover:bg-gradient-to-r hover:shadow-lg hover:shadow-blue-500/25",
                        item.gradient && `hover:${item.gradient}`,
                        (location.pathname.startsWith(item.path)) && "bg-gradient-to-r text-white shadow-lg",
                        (location.pathname.startsWith(item.path)) && item.gradient
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                           style={{ background: item.gradient ? `linear-gradient(to right, var(--tw-gradient-stops))` : undefined }} />
                      <div className="relative flex items-center gap-3 w-full">
                        <div className="relative flex items-center">
                          <div className="relative flex items-center justify-center min-w-[20px] w-5 h-5">
                            {item.icon}
                            {item.badge && (
                              <Badge className="absolute -top-2 -right-2 text-xs px-1 py-0 bg-red-500 text-white">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </div>
                      <div className="relative">
                        {expandedItems[item.path] ? (
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                        )}
                      </div>
                    </button>
                    
                    {/* 서브메뉴 */}
                    {expandedItems[item.path] && item.submenu && (
                      <ul className="ml-6 space-y-1 border-l-2 border-slate-700/50 pl-4">
                        {item.submenu.map((subitem) => {
                          if (subitem.adminOnly && !isAdmin) return null;
                          
                          return (
                            <li key={subitem.path}>
                              <NavLink
                                to={subitem.path}
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                  cn(
                                    "group flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 text-sm relative overflow-hidden w-full",
                                    (isActive || location.pathname === subitem.path || location.pathname.startsWith(subitem.path + "/")) && "text-white bg-slate-700/70 shadow-md",
                                    subitem.color
                                  )
                                }
                              >
                                <div className="relative flex items-center justify-center min-w-[16px] w-4 h-4">
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
                  <NavLink
                    to={item.path}
                    end={item.path === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:text-white transition-all duration-200 overflow-hidden",
                        "hover:bg-gradient-to-r hover:shadow-lg hover:shadow-blue-500/25",
                        item.gradient && `hover:${item.gradient}`,
                        (isActive || (item.path !== "/" && location.pathname.startsWith(item.path))) && "bg-gradient-to-r text-white shadow-lg",
                        (isActive || (item.path !== "/" && location.pathname.startsWith(item.path))) && item.gradient
                      )
                    }
                  >
                    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                         style={{ background: item.gradient ? `linear-gradient(to right, var(--tw-gradient-stops))` : undefined }} />
                    <div className="relative flex items-center gap-3 w-full">
                      <div className="relative flex items-center">
                        <div className="relative flex items-center justify-center min-w-[20px] w-5 h-5">
                          {item.icon}
                          {item.badge && (
                            <Badge className="absolute -top-2 -right-2 text-xs px-1 py-0 bg-red-500 text-white">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </div>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* 하단 메뉴 */}
        <div className="p-3 border-t border-slate-700/50 space-y-2">
          <NavLink
            to="/profile"
            onClick={() => setOpen(false)}
            className={({ isActive }) => cn(
              "group flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 transition-all duration-200",
              isActive && "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center justify-center w-5 h-5">
                <User className="h-5 w-5" />
              </div>
              <span className="font-medium flex-1">{t.profile || "프로필"}</span>
            </div>
          </NavLink>
          
          <Button 
            variant="ghost" 
            className="group w-full justify-start text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 transition-all duration-200 rounded-xl px-3 py-3"
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center justify-center w-5 h-5">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="font-medium flex-1">{t.logout || "로그아웃"}</span>
            </div>
          </Button>
        </div>

        {/* 하단 상태 표시 */}
        <div className="p-3 border-t border-slate-700/50 space-y-2">
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
          <div className="text-xs text-slate-500">{t.serverStatus || "서버 상태: 양호"}</div>
          
          {/* 현재 페이지 표시 */}
          <div className="mt-3 pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-slate-400">현재 페이지</span>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-2">
              <div className="text-sm font-medium text-white truncate">
                {getCurrentPageName()}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {location.pathname}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;
