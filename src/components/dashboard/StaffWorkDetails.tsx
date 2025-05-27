import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppContext } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  User, 
  Briefcase, 
  ListTodo, 
  CheckCircle,
  TrendingUp,
  BarChart3,
  Target,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffWorkStats {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  totalProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  projectRegistrationRate: number;
  taskRegistrationRate: number;
  projectCompletionRate: number;
  taskCompletionRate: number;
}

const StaffWorkDetails = () => {
  const { users, projects, tasks } = useAppContext();
  const { translations } = useLanguage();
  const t = translations.dashboard;

  // 직원별 업무 통계 계산
  const calculateStaffWorkStats = (): StaffWorkStats[] => {
    console.log("=== StaffWorkDetails: calculateStaffWorkStats 시작 ===");
    
    const usersList = Array.isArray(users) ? users : [];
    const projectsList = Array.isArray(projects) ? projects : [];
    const tasksList = Array.isArray(tasks) ? tasks : [];
    
    console.log("사용자 목록:", usersList.map(u => ({ id: u.id, name: u.name })));
    console.log("프로젝트 목록:", projectsList.map(p => ({ id: p.id, name: p.name, manager: p.manager, managerId: p.managerId })));
    console.log("업무 목록:", tasksList.map(t => ({ id: t.id, title: t.title, assignedTo: t.assignedTo, status: t.status })));

    // 매니저 목록도 가져오기
    const { managers } = useAppContext();
    const managersList = Array.isArray(managers) ? managers : [];
    console.log("매니저 목록:", managersList.map(m => ({ id: m.id, name: m.name })));

    // 전체 프로젝트 및 업무 수
    const totalProjectsCount = projectsList.length;
    const totalTasksCount = tasksList.length;

    // 모든 사용자 (users + managers) 합치기
    const allStaffList = [
      ...usersList.map(u => ({ ...u, type: 'user' })),
      ...managersList.map(m => ({ ...m, type: 'manager' }))
    ];

    return allStaffList.map(staff => {
      console.log(`\n=== ${staff.name} (${staff.type}) 분석 ===`);
      
      // 사용자별 프로젝트 통계
      const userProjects = projectsList.filter(p => {
        const isManager = p.manager === staff.name || p.managerId === staff.id;
        const isTeamMember = p.team?.includes(staff.id);
        const match = isManager || isTeamMember;
        
        if (match) {
          console.log(`프로젝트 매치: ${p.name} (manager: ${p.manager}, managerId: ${p.managerId})`);
        }
        
        return match;
      });
      
      const completedProjects = userProjects.filter(p => {
        const isCompleted = p.status === 'completed' || p.status === '완료' || p.completed;
        return isCompleted;
      }).length;

      // 사용자별 업무 통계 - 개선된 매칭 로직
      const userTasks = tasksList.filter(t => {
        // ID로 매칭
        const isAssignedById = t.assignedTo === staff.id;
        // 이름으로 매칭
        const isAssignedByName = t.assignedTo === staff.name;
        // 다중 담당자에서 매칭
        const isAssignedInAssignees = t.assignees && Array.isArray(t.assignees) && 
          t.assignees.some(assignee => assignee.user_id === staff.id || assignee.user_name === staff.name);
        
        const match = isAssignedById || isAssignedByName || isAssignedInAssignees;
        
        if (match) {
          console.log(`업무 매치: ${t.title} (assignedTo: ${t.assignedTo}, status: ${t.status})`);
        }
        
        return match;
      });
      
      const completedTasks = userTasks.filter(t => {
        // 한국어 상태명도 고려
        const isCompleted = t.status === 'completed' || t.status === '완료' || t.progress >= 100;
        return isCompleted;
      }).length;

      console.log(`${staff.name} 결과:`);
      console.log(`- 프로젝트: ${userProjects.length}개 (완료: ${completedProjects}개)`);
      console.log(`- 업무: ${userTasks.length}개 (완료: ${completedTasks}개)`);

      // 등록율 계산 (전체 대비 개인이 담당한 비율)
      const projectRegistrationRate = totalProjectsCount > 0 ? 
        (userProjects.length / totalProjectsCount) * 100 : 0;
      const taskRegistrationRate = totalTasksCount > 0 ? 
        (userTasks.length / totalTasksCount) * 100 : 0;

      // 완료율 계산 (개인 담당 업무 중 완료한 비율)
      const projectCompletionRate = userProjects.length > 0 ? 
        (completedProjects / userProjects.length) * 100 : 0;
      const taskCompletionRate = userTasks.length > 0 ? 
        (completedTasks / userTasks.length) * 100 : 0;

      return {
        id: staff.id,
        name: staff.name,
        avatar: (staff as any).avatar,
        department: (staff.department as any)?.name || staff.department || '미분류',
        totalProjects: userProjects.length,
        completedProjects,
        totalTasks: userTasks.length,
        completedTasks,
        projectRegistrationRate,
        taskRegistrationRate,
        projectCompletionRate,
        taskCompletionRate
      };
    }).filter(staff => {
      const hasWork = staff.totalProjects > 0 || staff.totalTasks > 0;
      console.log(`${staff.name}: 업무 있음? ${hasWork} (프로젝트: ${staff.totalProjects}, 업무: ${staff.totalTasks})`);
      return hasWork;
    }).sort((a, b) => (b.totalProjects + b.totalTasks) - (a.totalProjects + a.totalTasks));
  };

  const staffWorkStats = calculateStaffWorkStats();

  const getDepartmentColor = (department: string) => {
    const colors = {
      '개발': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      '영업': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      '제조': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      '품질': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      '경리': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      '경영': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      '관리': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      'development': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'sales': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'manufacturing': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'quality': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'finance': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      'management': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'administration': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[department] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-blue-500';
    if (rate >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* 통합된 헤더 섹션 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 border border-indigo-200/50 dark:border-slate-600 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t?.staffWorkDetails || '직원별 업무 상세'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                전체 직원의 프로젝트 및 업무 진행 현황을 확인하세요
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* 인원 표시 */}
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">총 인원</div>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-500" />
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {staffWorkStats.length}명
                </span>
              </div>
            </div>
            
            {/* 전체 평균 진행률 */}
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">평균 진행률</div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Math.round(
                    staffWorkStats.reduce((acc, staff) => 
                      acc + (staff.projectCompletionRate + staff.taskCompletionRate) / 2, 0
                    ) / (staffWorkStats.length || 1)
                  )}%
                </span>
              </div>
            </div>
            
            {/* 총 프로젝트 수 */}
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">총 프로젝트</div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {staffWorkStats.reduce((acc, staff) => acc + staff.totalProjects, 0)}개
                </span>
              </div>
            </div>
            
            {/* 총 업무 수 */}
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">총 업무</div>
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-purple-500" />
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {staffWorkStats.reduce((acc, staff) => acc + staff.totalTasks, 0)}개
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 상세 분석 요약 */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/60 dark:bg-slate-700/60 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">완료율 80% 이상</span>
            </div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {staffWorkStats.filter(staff => 
                (staff.projectCompletionRate + staff.taskCompletionRate) / 2 >= 80
              ).length}명
            </div>
          </div>
          
          <div className="bg-white/60 dark:bg-slate-700/60 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">완료율 60-79%</span>
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {staffWorkStats.filter(staff => {
                const avgRate = (staff.projectCompletionRate + staff.taskCompletionRate) / 2;
                return avgRate >= 60 && avgRate < 80;
              }).length}명
            </div>
          </div>
          
          <div className="bg-white/60 dark:bg-slate-700/60 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">완료율 40-59%</span>
            </div>
            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
              {staffWorkStats.filter(staff => {
                const avgRate = (staff.projectCompletionRate + staff.taskCompletionRate) / 2;
                return avgRate >= 40 && avgRate < 60;
              }).length}명
            </div>
          </div>
          
          <div className="bg-white/60 dark:bg-slate-700/60 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">완료율 40% 미만</span>
            </div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {staffWorkStats.filter(staff => 
                (staff.projectCompletionRate + staff.taskCompletionRate) / 2 < 40
              ).length}명
            </div>
          </div>
        </div>
      </div>

      {/* 직원별 상세 카드 */}
      <div className="grid gap-6">
        {staffWorkStats.length > 0 ? (
          staffWorkStats.map((staff, index) => (
            <Card 
              key={staff.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <CardHeader className="relative pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 ring-2 ring-indigo-100 dark:ring-indigo-900">
                      <AvatarImage src={staff.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold">
                        {staff.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">{staff.name}</h3>
                      <Badge className={cn("text-xs", getDepartmentColor(staff.department))}>
                        {staff.department}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t?.overallProgress || '전체 진행률'}
                    </div>
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round((staff.projectCompletionRate + staff.taskCompletionRate) / 2)}%
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6">
                {/* 등록 통계 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-indigo-500" />
                    <h4 className="font-semibold text-lg">{t?.registrationStats || '등록 통계'}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/50 dark:bg-slate-700/50 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-sm">{t?.staffProjectRegistrationRate || '직원 프로젝트 등록율'}</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {staff.projectRegistrationRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t?.projectsRegistered || '등록한 프로젝트'}: {staff.totalProjects}개
                      </div>
                      <Progress 
                        value={staff.projectRegistrationRate} 
                        className="h-2 mt-2"
                        style={{ '--progress-background': getProgressColor(staff.projectRegistrationRate) } as React.CSSProperties}
                      />
                    </div>

                    <div className="p-4 bg-white/50 dark:bg-slate-700/50 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                      <div className="flex items-center gap-2 mb-2">
                        <ListTodo className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-sm">{t?.staffTaskRegistrationRate || '직원 하위업무 등록율'}</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {staff.taskRegistrationRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t?.tasksRegistered || '등록한 하위업무'}: {staff.totalTasks}개
                      </div>
                      <Progress 
                        value={staff.taskRegistrationRate} 
                        className="h-2 mt-2"
                        style={{ '--progress-background': getProgressColor(staff.taskRegistrationRate) } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>

                {/* 완료 통계 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <h4 className="font-semibold text-lg">{t?.completionStats || '완료 통계'}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/50 dark:bg-slate-700/50 rounded-lg border border-green-100 dark:border-green-900/30">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        <span className="font-medium text-sm">{t?.staffProjectCompletionRate || '직원 프로젝트 완료율'}</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        {staff.projectCompletionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t?.projectsCompleted || '완료한 프로젝트'}: {staff.completedProjects}개
                      </div>
                      <Progress 
                        value={staff.projectCompletionRate} 
                        className="h-2 mt-2"
                        style={{ '--progress-background': getProgressColor(staff.projectCompletionRate) } as React.CSSProperties}
                      />
                    </div>

                    <div className="p-4 bg-white/50 dark:bg-slate-700/50 rounded-lg border border-green-100 dark:border-green-900/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-sm">{t?.staffTaskCompletionRate || '직원 하위업무 완료율'}</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                        {staff.taskCompletionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        완료한 하위업무: {staff.completedTasks}개
                      </div>
                      <Progress 
                        value={staff.taskCompletionRate} 
                        className="h-2 mt-2"
                        style={{ '--progress-background': getProgressColor(staff.taskCompletionRate) } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                업무가 할당된 직원이 없습니다.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StaffWorkDetails; 