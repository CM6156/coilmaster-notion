import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppContext } from '@/context/AppContext';
import { 
  Trophy, 
  Medal, 
  Award, 
  Star, 
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  FileText,
  Briefcase,
  ListTodo
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffStats {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  totalProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalJournals: number;
  projectCompletionRate: number;
  taskCompletionRate: number;
  overallScore: number;
}

const StaffWorkloadRanking = () => {
  const { users, managers, employees, projects, tasks, workJournals } = useAppContext();

  // 직원별 통계 계산
  const calculateStaffStats = (): StaffStats[] => {
    // 모든 직원 데이터를 중복 없이 통합
    const allStaffMap = new Map();
    
    // 1. users 추가
    if (Array.isArray(users)) {
      users.forEach(user => {
        allStaffMap.set(user.id, {
          id: user.id,
          name: user.name,
          avatar: user.avatar || '',
          department: (user.department as any)?.name || user.department || '미분류',
          type: 'user'
        });
      });
    }
    
    // 2. managers 추가 (중복 시 덮어쓰기)
    if (Array.isArray(managers)) {
      managers.forEach(manager => {
        allStaffMap.set(manager.id, {
          id: manager.id,
          name: manager.name,
          avatar: (manager as any).avatar || '',
          department: manager.department?.name || '미분류',
          type: 'manager'
        });
      });
    }
    
    // 3. employees 추가 (중복 시 덮어쓰기)
    if (Array.isArray(employees)) {
      employees.forEach(employee => {
        allStaffMap.set(employee.id, {
          id: employee.id,
          name: employee.name,
          avatar: (employee as any).avatar || '',
          department: employee.department?.name || '미분류',
          type: 'employee'
        });
      });
    }
    
    const allStaffList = Array.from(allStaffMap.values());
    const projectsList = Array.isArray(projects) ? projects : [];
    const tasksList = Array.isArray(tasks) ? tasks : [];
    const journalsList = Array.isArray(workJournals) ? workJournals : [];
    
    console.log('🔍 StaffWorkloadRanking: 통합된 직원 목록:', {
      총직원수: allStaffList.length,
      users수: Array.isArray(users) ? users.length : 0,
      managers수: Array.isArray(managers) ? managers.length : 0,
      employees수: Array.isArray(employees) ? employees.length : 0,
      직원목록: allStaffList.map(s => ({ id: s.id, name: s.name, type: s.type }))
    });

    return allStaffList.map(staff => {
      // 직원별 프로젝트 통계
      const staffProjects = projectsList.filter(p => 
        p.manager === staff.name || p.managerId === staff.id || p.team?.includes(staff.id)
      );
      const completedProjects = staffProjects.filter(p => p.status === 'completed' || p.completed).length;

      // 직원별 업무 통계
      const staffTasks = tasksList.filter(t => 
        t.assignedTo === staff.id || t.assignedTo === staff.name
      );
      const completedTasks = staffTasks.filter(t => t.status === 'completed').length;

      // 직원별 업무일지 통계
      const staffJournals = journalsList.filter(j => 
        j.author_id === staff.id || j.author_name === staff.name
      );

      // 완료율 계산
      const projectCompletionRate = staffProjects.length > 0 ? 
        (completedProjects / staffProjects.length) * 100 : 0;
      const taskCompletionRate = staffTasks.length > 0 ? 
        (completedTasks / staffTasks.length) * 100 : 0;

      // 종합 점수 계산 (프로젝트 40%, 업무 40%, 업무일지 20%)
      const overallScore = (
        (staffProjects.length * 10 + completedProjects * 15) * 0.4 +
        (staffTasks.length * 5 + completedTasks * 10) * 0.4 +
        (staffJournals.length * 3) * 0.2
      );

      return {
        id: staff.id,
        name: staff.name,
        avatar: staff.avatar,
        department: staff.department,
        totalProjects: staffProjects.length,
        completedProjects,
        totalTasks: staffTasks.length,
        completedTasks,
        totalJournals: staffJournals.length,
        projectCompletionRate,
        taskCompletionRate,
        overallScore
      };
    }).sort((a, b) => b.overallScore - a.overallScore);
  };

  const staffStats = calculateStaffStats();
  const topPerformers = staffStats.slice(0, 5);

  // 업무일지를 꾸준히 작성한 직원 (최근 30일 기준)
  const getConsistentJournalWriters = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const journalStats = staffStats.map(staff => {
      const recentJournals = Array.isArray(workJournals) ? 
        workJournals.filter(j => 
          (j.author_id === staff.id || j.author_name === staff.name) &&
          new Date(j.created_at) >= thirtyDaysAgo
        ) : [];

      // 최근 30일 중 업무일지를 작성한 일수 계산
      const journalDays = new Set(
        recentJournals.map(j => 
          new Date(j.created_at).toDateString()
        )
      ).size;

      return {
        ...staff,
        journalDays,
        consistency: journalDays / 30 * 100 // 30일 중 작성한 비율
      };
    }).filter(s => s.journalDays > 0)
      .sort((a, b) => b.consistency - a.consistency)
      .slice(0, 5);

    return journalStats;
  };

  const consistentWriters = getConsistentJournalWriters();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <Star className="h-5 w-5 text-blue-500" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2: return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3: return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default: return "bg-gradient-to-r from-blue-400 to-blue-600 text-white";
    }
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      '개발': 'bg-blue-100 text-blue-800',
      '영업': 'bg-green-100 text-green-800',
      '제조': 'bg-orange-100 text-orange-800',
      '품질': 'bg-purple-100 text-purple-800',
      '경리': 'bg-pink-100 text-pink-800',
      '경영': 'bg-red-100 text-red-800',
      '관리': 'bg-gray-100 text-gray-800',
    };
    return colors[department] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* 종합 업무 성과 순위 */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            직원별 업무 성과 순위
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              TOP 5
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topPerformers.map((staff, index) => (
            <div 
              key={staff.id}
              className={cn(
                "p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                index === 0 && "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200",
                index === 1 && "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200",
                index === 2 && "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200",
                index > 2 && "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge className={cn("px-2 py-1", getRankBadgeColor(index + 1))}>
                    {getRankIcon(index + 1)}
                    <span className="ml-1 font-bold">{index + 1}위</span>
                  </Badge>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={staff.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {staff.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-lg">{staff.name}</div>
                    <Badge className={cn("text-xs", getDepartmentColor(staff.department))}>
                      {staff.department}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(staff.overallScore)}
                  </div>
                  <div className="text-xs text-gray-500">종합점수</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-2 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">프로젝트</span>
                  </div>
                  <div className="text-lg font-bold">{staff.totalProjects}</div>
                  <div className="text-xs text-gray-500">
                    완료: {staff.completedProjects}
                  </div>
                  <Progress 
                    value={staff.projectCompletionRate} 
                    className="h-1 mt-1"
                  />
                </div>

                <div className="text-center p-2 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ListTodo className="h-4 w-4 text-green-500" />
                    <span className="font-medium">업무</span>
                  </div>
                  <div className="text-lg font-bold">{staff.totalTasks}</div>
                  <div className="text-xs text-gray-500">
                    완료: {staff.completedTasks}
                  </div>
                  <Progress 
                    value={staff.taskCompletionRate} 
                    className="h-1 mt-1"
                  />
                </div>

                <div className="text-center p-2 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">업무일지</span>
                  </div>
                  <div className="text-lg font-bold">{staff.totalJournals}</div>
                  <div className="text-xs text-gray-500">총 작성</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 업무일지 꾸준히 작성한 직원 */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50 dark:from-slate-900 dark:to-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            업무일지 성실 작성자
            <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
              최근 30일
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {consistentWriters.length > 0 ? (
            consistentWriters.map((staff, index) => (
              <div 
                key={staff.id}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                  index === 0 && "bg-gradient-to-r from-green-50 to-teal-50 border-green-200",
                  index > 0 && "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge className={cn(
                      "px-2 py-1",
                      index === 0 ? "bg-gradient-to-r from-green-500 to-teal-500 text-white" :
                      "bg-gradient-to-r from-blue-400 to-blue-600 text-white"
                    )}>
                      {index === 0 ? <Trophy className="h-4 w-4 mr-1" /> : <Star className="h-4 w-4 mr-1" />}
                      {index + 1}위
                    </Badge>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={staff.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
                        {staff.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-lg">{staff.name}</div>
                      <Badge className={cn("text-xs", getDepartmentColor(staff.department))}>
                        {staff.department}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {staff.journalDays}일
                    </div>
                    <div className="text-xs text-gray-500">작성일수</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>작성 일관성</span>
                    <span className="font-medium">{Math.round(staff.consistency)}%</span>
                  </div>
                  <Progress 
                    value={staff.consistency} 
                    className="h-2"
                  />
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>총 {staff.totalJournals}개 작성</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span>30일 중 {staff.journalDays}일 작성</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>최근 30일 내 업무일지 작성자가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffWorkloadRanking; 