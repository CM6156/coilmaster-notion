import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Users, 
  UserCheck, 
  Building2, 
  Briefcase, 
  Award,
  Settings,
  Database,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Activity,
  Globe,
  Layers,
  Palette,
  UserCog,
  FolderOpen
} from "lucide-react";
import { UserManagement } from "@/components/admin/UserManagement";
import { ClientManagement } from "@/components/admin/ClientManagement";
import { DataManagement } from "@/components/admin/DataManagement";
import SettingsManagement from "@/components/admin/SettingsManagement";
import EmployeesManagement from "@/components/admin/EmployeesManagement";
import ManagersManagement from "@/components/admin/ManagersManagement";
import DepartmentsManagement from "@/components/admin/DepartmentsManagement";
import PositionsManagement from "@/components/admin/PositionsManagement";
import CorporationsManagement from "@/components/admin/CorporationsManagement";
import StatusManagement from "@/components/admin/StatusManagement";
import PhaseManagement2 from "@/components/admin/PhaseManagement2";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

const Admin = () => {
  const { users, clients, projects, tasks } = useAppContext();
  const { translations } = useLanguage();
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    { value: "users", label: translations.global?.userManagement || "사용자", icon: Users, gradient: "from-blue-500 to-purple-500" },
    { value: "employees", label: translations.global?.employeeManagement || "직원", icon: UserCheck, gradient: "from-purple-500 to-pink-500" },
    { value: "managers", label: translations.global?.managerManagement || "담당자", icon: UserCog, gradient: "from-pink-500 to-red-500" },
    { value: "departments", label: translations.global?.departmentManagement || "부서", icon: Building2, gradient: "from-orange-500 to-yellow-500" },
    { value: "positions", label: translations.global?.positionManagement || "직책", icon: Award, gradient: "from-yellow-500 to-green-500" },
    { value: "corporations", label: translations.global?.corporationManagement || "법인", icon: Globe, gradient: "from-green-500 to-teal-500" },
    { value: "clients", label: translations.global?.clientManagement || "고객사", icon: Briefcase, gradient: "from-teal-500 to-blue-500" },
    { value: "status", label: translations.global?.statusManagement || "상태", icon: Palette, gradient: "from-indigo-500 to-purple-500" },
    { value: "data", label: translations.global?.dataManagement || "데이터", icon: Database, gradient: "from-purple-500 to-pink-500" },
    { value: "settings", label: translations.global?.settingsManagement || "설정", icon: Settings, gradient: "from-gray-500 to-gray-700" },
    { value: "phase", label: translations.global?.phaseManagement || "프로젝트 단계", icon: Layers, gradient: "from-teal-500 to-blue-500" }
  ];

  const stats = [
    { 
      title: "전체 사용자", 
      value: users.length, 
      icon: Users, 
      color: "bg-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    { 
      title: "활성 프로젝트", 
      value: projects.filter(p => p.status === 'active').length, 
      icon: Activity, 
      color: "bg-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    { 
      title: "전체 고객사", 
      value: clients.length, 
      icon: Briefcase, 
      color: "bg-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    },
    { 
      title: "진행중 업무", 
      value: tasks.filter(t => t.status === 'in-progress').length, 
      icon: BarChart3, 
      color: "bg-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20"
    }
  ];

  const getCurrentTab = () => {
    return tabs.find(tab => tab.value === activeTab) || tabs[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold flex items-center gap-2">
                        {translations.global?.adminPanel || "관리자 패널"}
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      </h1>
                      <p className="text-white/80 text-lg">
                        시스템 설정 및 데이터 관리
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  새로고침
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-full", stat.bgColor, "group-hover:scale-110 transition-transform")}>
                    <stat.icon className={cn("h-6 w-6", stat.color.replace('bg-', 'text-'))} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-2">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-transparent h-auto p-0">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200",
                    "hover:bg-slate-100 dark:hover:bg-slate-700",
                    "data-[state=active]:text-white data-[state=active]:shadow-lg",
                    "overflow-hidden group"
                  )}
                >
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-data-[state=active]:opacity-100 transition-opacity",
                    "bg-gradient-to-r",
                    tab.gradient
                  )} />
                  <tab.icon className="h-5 w-5 relative z-10" />
                  <span className="text-xs font-medium relative z-10">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {/* 현재 탭 정보 표시 */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className={cn("h-2 bg-gradient-to-r", getCurrentTab().gradient)} />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const currentTab = getCurrentTab();
                  const IconComponent = currentTab.icon;
                  return (
                    <div className={cn("p-3 rounded-xl bg-gradient-to-r text-white", currentTab.gradient)}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-xl font-bold">
                    {getCurrentTab().label}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'users' && '시스템 사용자 계정을 관리합니다'}
                    {activeTab === 'employees' && '직원 정보를 관리합니다'}
                    {activeTab === 'managers' && '담당자 정보를 관리합니다'}
                    {activeTab === 'departments' && '부서 정보를 관리합니다'}
                    {activeTab === 'positions' && '직책 정보를 관리합니다'}
                    {activeTab === 'corporations' && '법인 정보를 관리합니다'}
                    {activeTab === 'clients' && '고객사 정보를 관리합니다'}
                    {activeTab === 'status' && '프로젝트 및 업무 상태를 관리합니다'}
                    {activeTab === 'data' && '시스템 데이터를 관리합니다'}
                    {activeTab === 'settings' && '시스템 설정을 관리합니다'}
                    {activeTab === 'phase' && '프로젝트 단계를 관리합니다'}
                  </p>
                </div>
              </div>
              
              {/* 각 탭 컨텐츠 */}
              <div className="mt-6">
                {/* 사용자 관리 */}
                {activeTab === 'users' && <UserManagement />}
                
                {/* 직원 관리 */}
                {activeTab === 'employees' && <EmployeesManagement />}
                
                {/* 담당자 관리 */}
                {activeTab === 'managers' && <ManagersManagement />}
                
                {/* 부서 관리 */}
                {activeTab === 'departments' && <DepartmentsManagement />}
                
                {/* 직책 관리 */}
                {activeTab === 'positions' && <PositionsManagement />}
                
                {/* 법인 관리 */}
                {activeTab === 'corporations' && <CorporationsManagement />}
                
                {/* 고객사 관리 */}
                {activeTab === 'clients' && <ClientManagement clients={clients} projects={projects} />}
                
                {/* 상태 관리 */}
                {activeTab === 'status' && <StatusManagement />}
                
                {/* 데이터 관리 */}
                {activeTab === 'data' && <DataManagement />}
                
                {/* 시스템 설정 */}
                {activeTab === 'settings' && <SettingsManagement />}
                
                {/* 프로젝트 단계 관리 */}
                {activeTab === 'phase' && <PhaseManagement2 />}
              </div>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
