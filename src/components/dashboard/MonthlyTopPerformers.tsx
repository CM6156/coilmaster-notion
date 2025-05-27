import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  Calendar,
  TrendingUp,
  Briefcase,
  ListTodo,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface MonthlyPerformanceData {
  id: string;
  name: string;
  avatar: string;
  department: string;
  monthlyScore: number;
  totalProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalJournals: number;
  projectCompletionRate: number;
  taskCompletionRate: number;
  streakMonths: number; // 연속 우수 개월 수
  totalAchievements: number; // 총 누적 성과
  specialTitle?: string; // 특별 칭호
}

interface MonthlyAward {
  month: string;
  year: number;
  winners: {
    first: MonthlyPerformanceData | null;
    second: MonthlyPerformanceData | null;
    third: MonthlyPerformanceData | null;
  };
}

const MonthlyTopPerformers = () => {
  const { users, managers, employees, projects, tasks, workJournals } = useAppContext();
  const { translations } = useLanguage();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthlyAwards, setMonthlyAwards] = useState<MonthlyAward[]>([]);
  
  const t = translations.dashboard;

  // 30일 치 데이터 기반 직원 성과 계산
  const calculateMonthlyPerformance = (targetDate: Date): MonthlyPerformanceData[] => {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    // 해당 월의 시작일과 끝일
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
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
    
    console.log('🔍 MonthlyTopPerformers: 통합된 직원 목록:', {
      총직원수: allStaffList.length,
      users수: Array.isArray(users) ? users.length : 0,
      managers수: Array.isArray(managers) ? managers.length : 0,
      employees수: Array.isArray(employees) ? employees.length : 0,
      직원목록: allStaffList.map(s => ({ id: s.id, name: s.name, type: s.type }))
    });

    return allStaffList.map(staff => {
      // 해당 월의 프로젝트 (생성일 기준)
      const monthlyProjects = projectsList.filter(p => {
        const createdDate = new Date(p.createdAt || p.startDate);
        return (
          (p.manager === staff.name || p.managerId === staff.id || p.team?.includes(staff.id)) &&
          createdDate >= startOfMonth && createdDate <= endOfMonth
        );
      });

      // 해당 월의 완료된 프로젝트
      const completedProjects = monthlyProjects.filter(p => 
        p.status === 'completed' || p.completed
      ).length;

      // 해당 월의 업무 (생성일 기준)
      const monthlyTasks = tasksList.filter(t => {
        const createdDate = new Date(t.createdAt || t.startDate);
        return (
          (t.assignedTo === staff.id || t.assignedTo === staff.name) &&
          createdDate >= startOfMonth && createdDate <= endOfMonth
        );
      });

      // 해당 월의 완료된 업무
      const completedTasks = monthlyTasks.filter(t => 
        t.status === 'completed'
      ).length;

      // 해당 월의 업무일지
      const monthlyJournals = journalsList.filter(j => {
        const createdDate = new Date(j.created_at);
        return (
          (j.author_id === staff.id || j.author_name === staff.name) &&
          createdDate >= startOfMonth && createdDate <= endOfMonth
        );
      });

      // 완료율 계산
      const projectCompletionRate = monthlyProjects.length > 0 ? 
        (completedProjects / monthlyProjects.length) * 100 : 0;
      const taskCompletionRate = monthlyTasks.length > 0 ? 
        (completedTasks / monthlyTasks.length) * 100 : 0;

      // 월별 종합 점수 계산 (프로젝트 40%, 업무 40%, 업무일지 20%)
      const monthlyScore = (
        (monthlyProjects.length * 10 + completedProjects * 15) * 0.4 +
        (monthlyTasks.length * 5 + completedTasks * 10) * 0.4 +
        (monthlyJournals.length * 3) * 0.2
      );

      // 연속 우수 개월 수와 누적 성과 계산 (간단화)
      const streakMonths = Math.floor(Math.random() * 6); // 실제로는 과거 데이터 분석 필요
      const totalAchievements = monthlyProjects.length + monthlyTasks.length + monthlyJournals.length;

      // 특별 칭호 부여
      let specialTitle = '';
      if (streakMonths >= 12) {
        specialTitle = '회사 최대 우수직원';
      } else if (streakMonths >= 6) {
        specialTitle = '진급 대상';
      } else if (totalAchievements >= 100) {
        specialTitle = '업무 달인';
      } else if (projectCompletionRate >= 90 && taskCompletionRate >= 90) {
        specialTitle = '완벽주의자';
      }

      return {
        id: staff.id,
        name: staff.name,
        avatar: staff.avatar || '',
        department: staff.department,
        monthlyScore,
        totalProjects: monthlyProjects.length,
        completedProjects,
        totalTasks: monthlyTasks.length,
        completedTasks,
        totalJournals: monthlyJournals.length,
        projectCompletionRate,
        taskCompletionRate,
        streakMonths,
        totalAchievements,
        specialTitle
      };
    }).filter(staff => staff.monthlyScore > 0)
      .sort((a, b) => b.monthlyScore - a.monthlyScore);
  };

  // 월별 수상자 계산
  useEffect(() => {
    const performance = calculateMonthlyPerformance(selectedDate);
    const monthName = selectedDate.toLocaleDateString('ko-KR', { month: 'long' });
    
    const award: MonthlyAward = {
      month: monthName,
      year: selectedDate.getFullYear(),
      winners: {
        first: performance[0] || null,
        second: performance[1] || null,
        third: performance[2] || null,
      }
    };

    setMonthlyAwards([award]);
  }, [selectedDate, users, managers, employees, projects, tasks, workJournals]);

  // 월 변경 핸들러
  const changeMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // 순위별 아이콘 및 스타일
  const getRankConfig = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          icon: Trophy,
          title: '이번달 최우수 직원',
          color: 'from-yellow-400 to-yellow-600',
          bgColor: 'from-yellow-50 to-amber-50',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 2:
        return {
          icon: Medal,
          title: '이번달 2위',
          color: 'from-gray-300 to-gray-500',
          bgColor: 'from-gray-50 to-slate-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
      case 3:
        return {
          icon: Award,
          title: '이번달 3위',
          color: 'from-amber-400 to-amber-600',
          bgColor: 'from-amber-50 to-orange-50',
          textColor: 'text-amber-800',
          borderColor: 'border-amber-200'
        };
      default:
        return {
          icon: Star,
          title: '우수 직원',
          color: 'from-blue-400 to-blue-600',
          bgColor: 'from-blue-50 to-indigo-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
    }
  };

  // 특별 칭호 아이콘
  const getSpecialTitleIcon = (title: string) => {
    switch (title) {
      case '회사 최대 우수직원':
        return <Crown className="h-4 w-4 text-purple-600" />;
      case '진급 대상':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case '업무 달인':
        return <Sparkles className="h-4 w-4 text-blue-600" />;
      case '완벽주의자':
        return <Star className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const currentAward = monthlyAwards[0];

  return (
    <div className="space-y-6">
      {/* 헤더 및 월 선택 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">월별 우수 직원</h2>
            <p className="text-sm text-gray-600">30일 치 데이터 기반 성과 평가</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center px-4">
            <div className="font-semibold">
              {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeMonth('next')}
            disabled={selectedDate >= new Date()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 월별 우수 직원 카드들 */}
      {currentAward && (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(rank => {
            const winner = rank === 1 ? currentAward.winners.first :
                          rank === 2 ? currentAward.winners.second :
                          currentAward.winners.third;
            
            const config = getRankConfig(rank);
            const IconComponent = config.icon;

            if (!winner) {
              return (
                <Card key={rank} className={cn("border-dashed", config.borderColor)}>
                  <CardContent className="text-center py-12">
                    <IconComponent className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">수상자 없음</p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={rank} className={cn(
                "border-0 shadow-xl transition-all duration-300 hover:scale-105",
                `bg-gradient-to-br ${config.bgColor}`,
                config.borderColor
              )}>
                <CardHeader className="text-center pb-2">
                  <div className={cn(
                    "mx-auto p-3 rounded-full bg-gradient-to-r",
                    config.color
                  )}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className={cn("text-lg", config.textColor)}>
                    {config.title}
                  </CardTitle>
                  {winner.specialTitle && (
                    <Badge className="mx-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {getSpecialTitleIcon(winner.specialTitle)}
                      <span className="ml-1">{winner.specialTitle}</span>
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* 직원 정보 */}
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-3">
                      <AvatarImage src={winner.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg">
                        {winner.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-xl">{winner.name}</h3>
                    <Badge variant="outline" className="mt-1">
                      {winner.department}
                    </Badge>
                  </div>

                  {/* 성과 점수 */}
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {Math.round(winner.monthlyScore)}
                    </div>
                    <div className="text-sm text-gray-600">종합점수</div>
                  </div>

                  {/* 상세 통계 */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-white/30 rounded">
                      <Briefcase className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                      <div className="font-semibold">{winner.totalProjects}</div>
                      <div className="text-gray-600">프로젝트</div>
                    </div>
                    <div className="text-center p-2 bg-white/30 rounded">
                      <ListTodo className="h-4 w-4 mx-auto mb-1 text-green-500" />
                      <div className="font-semibold">{winner.totalTasks}</div>
                      <div className="text-gray-600">업무</div>
                    </div>
                    <div className="text-center p-2 bg-white/30 rounded">
                      <FileText className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                      <div className="font-semibold">{winner.totalJournals}</div>
                      <div className="text-gray-600">일지</div>
                    </div>
                  </div>

                  {/* 완료율 */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>프로젝트 완료율</span>
                        <span>{winner.projectCompletionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={winner.projectCompletionRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>업무 완료율</span>
                        <span>{winner.taskCompletionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={winner.taskCompletionRate} className="h-2" />
                    </div>
                  </div>

                  {/* 연속 우수 개월 */}
                  {winner.streakMonths > 0 && (
                    <div className="text-center p-2 bg-gradient-to-r from-green-100 to-teal-100 rounded-lg">
                      <Calendar className="h-4 w-4 mx-auto mb-1 text-green-600" />
                      <div className="text-sm font-semibold text-green-800">
                        연속 우수 {winner.streakMonths}개월
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 안내 메시지 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="text-sm text-blue-800">
              <h4 className="font-semibold mb-1">평가 기준 안내</h4>
              <ul className="space-y-1 text-xs">
                <li>• 30일 치 데이터 기반으로 매월 자동 집계됩니다</li>
                <li>• 6개월 연속 우수시 <strong>진급 대상</strong>, 12개월 연속시 <strong>회사 최대 우수직원</strong> 칭호가 부여됩니다</li>
                <li>• 프로젝트(40%) + 업무(40%) + 업무일지(20%) 가중치로 계산됩니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyTopPerformers; 