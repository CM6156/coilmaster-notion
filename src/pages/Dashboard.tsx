import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button"; 
import { Badge } from "@/components/ui/badge";
import StatCards from '@/components/dashboard/StatCards';
import TasksByDepartment from '@/components/dashboard/TasksByDepartment';
import RecentTasks from '@/components/dashboard/RecentTasks';


import RecentDocuments from '@/components/dashboard/RecentDocuments';
import ScheduleView from '@/components/dashboard/ScheduleView';
import StaffWorkloadRanking from '@/components/dashboard/StaffWorkloadRanking';
import StaffWorkDetails from '@/components/dashboard/StaffWorkDetails';
import { useLanguage } from '@/context/LanguageContext';

import RecentProjects from '@/components/dashboard/RecentProjects';
import StaffProjectOverview from '@/components/dashboard/StaffProjectOverview';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  TrendingUp,
  Activity,
  Building2,
  UserCircle,
  Sparkles,
  Clock,
  Target,
  Trophy,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MonthlyTopPerformers from '@/components/dashboard/MonthlyTopPerformers';

const Dashboard = () => {
  const { translations } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [viewMode, setViewMode] = useState<string>("department");
  
  // Using translations
  const t = translations.dashboard;

  const { tasks, users, projects, clients, currentUser, notifications } = useAppContext();
  const { userProfile } = useAuth();

  // 현재 시간대별 인사말
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t?.goodMorning || "좋은 아침입니다";
    if (hour >= 12 && hour < 17) return t?.goodAfternoon || "좋은 오후입니다";
    if (hour >= 17 && hour < 21) return t?.goodEvening || "좋은 저녁입니다";
    return t?.hello || "안녕하세요";
  };

  const tabIcons = {
    overview: LayoutDashboard,
    schedule: CalendarDays,
    staff: Users
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* 헤더 섹션 - 그라디언트 배경과 애니메이션 */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 animate-pulse" />
              <span className="text-lg font-medium opacity-90">{getGreeting()}</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              {translations.global?.dashboard || '대시보드'}
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Activity className="h-3 w-3 mr-1" />
                실시간
              </Badge>
            </h1>
            <p className="text-white/80 text-lg">
              {t?.teamCollaborationMessage || '팀과 함께 더 나은 성과를 만들어가세요'}
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="h-14 p-1.5 bg-white dark:bg-slate-800 shadow-lg border-0">
              {Object.entries(tabIcons).map(([value, Icon]) => (
                <TabsTrigger 
                  key={value}
                  value={value} 
                  className={cn(
                    "h-11 px-6 font-medium transition-all duration-200",
                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500",
                    "data-[state=active]:text-white data-[state=active]:shadow-lg",
                    "hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {value === 'overview' && (t?.overview || '개요')}
                  {value === 'schedule' && (t?.staffWorkTab || '직원별 업무')}
                  {value === 'staff' && (t?.staffRankingTab || '직원 순위')}
                </TabsTrigger>
              ))}
            </TabsList>

            {activeTab === 'overview' && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg shadow-md p-1">
                <Button
                  variant="ghost" 
                  size="sm"
                  className={cn(
                    "h-9 px-4 font-medium transition-all duration-200",
                    viewMode === "department" && "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90"
                  )}
                  onClick={() => setViewMode("department")}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  {t?.byDepartment || '부서별'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 px-4 font-medium transition-all duration-200",
                    viewMode === "individual" && "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90"
                  )}
                  onClick={() => setViewMode("individual")}
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  {t?.staffWorkloadByIndividual || '개인별'}
                </Button>
              </div>
            )}
          </div>
          
          <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-500">
            {/* 통계 카드 - 호버 효과와 그라디언트 추가 */}
            <div className="transform transition-all duration-300 hover:scale-[1.01]">
              <StatCards />
            </div>
            
            {viewMode === "department" ? (
              <>
                {/* 직원별 프로젝트 진행 현황 - 모던 카드 스타일 */}
                <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:shadow-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">{t?.staffProjectProgress || '직원별 프로젝트 진행 현황'}</h2>
                  </div>
                  <StaffProjectOverview />
                </div>
                
                {/* 최근 등록된 프로젝트 - 글래스모피즘 효과 */}
                <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:shadow-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">{t?.recentProjects || '최근 프로젝트'}</h2>
                  </div>
                  <RecentProjects projects={projects} tasks={tasks} users={users} />
                </div>
                
                {/* 부서별 업무 현황 - 단일 카드 */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      {t?.departmentTaskStatus || '부서별 업무 현황'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <TasksByDepartment />
                  </CardContent>
                </Card>

                {/* 최근 업무 - 인터랙티브 카드 */}
                <div className="transform transition-all duration-300 hover:scale-[1.02]">
                  <RecentTasks />
                </div>
                
                {/* 최근 문서 - 미니멀한 디자인 */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6">
                  <RecentDocuments />
                </div>
              </>
            ) : (
              /* 개인별 업무량 뷰 */
              <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:shadow-2xl">
                <StaffWorkDetails />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="schedule" className="animate-in slide-in-from-right duration-500">
            <div className="space-y-6">
              {/* 직원별 업무 상세 정보 */}
              <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">{t?.staffWorkDetails || '직원별 업무 상세'}</h2>
                  <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    상세 분석
                  </Badge>
                </div>
                <StaffWorkDetails />
              </div>


            </div>
          </TabsContent>
          
          <TabsContent value="staff" className="space-y-6 animate-in slide-in-from-left duration-500">
            {/* 월별 우수 직원 - 메인 섹션 */}
            <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:shadow-2xl">
              <MonthlyTopPerformers />
            </div>

            {/* 직원별 업무 성과 순위 - 세부 섹션 */}
            <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">{t?.staffWorkPerformanceRanking || '직원별 업무 성과 및 순위'}</h2>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  {t?.realTimeUpdate || '실시간 업데이트'}
                </Badge>
              </div>
              <StaffWorkloadRanking />
            </div>


            
            {/* 부서별 업무 현황 - 단일 카드 */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  {t?.departmentTaskStatus || '부서별 업무 현황'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TasksByDepartment />
              </CardContent>
            </Card>
            
            {/* 최근 업무 - 리스트 스타일 개선 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
              <RecentTasks />
            </div>
            
            {/* 직원별 프로젝트 진행 현황 */}
            <div className="backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
              <StaffProjectOverview />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
