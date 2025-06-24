import { useAppContext } from "@/context/AppContext";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  CalendarDays,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar as CalendarIcon,
  ArrowUpDown,
  TrendingUp,
  Target,
  Award,
  Zap,
  Star,
  Activity,
  BarChart3,
  PieChart,
  Rocket,
  Flame,
  Sparkles,
  Users,
  Building2,
  FileText,
  Eye,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  Calendar as CalendarSchedule,
  Briefcase,
  Globe,
  Heart,
  Diamond,
  Crown,
  ThumbsUp
} from "lucide-react";
import { Project } from "@/types";
import { format, isAfter, isBefore, addDays, differenceInDays } from "date-fns";
import { ko } from "date-fns/locale";

const MyProjects = () => {
  const { 
    projects, 
    currentUser,
    users,
    managers,
    calculateProjectProgress,
    getProjectStatuses
  } = useAppContext();
  
  const { translations } = useLanguage();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<'name' | 'dueDate' | 'progress' | 'status'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // 내 프로젝트만 필터링
  const myProjects = projects.filter(project => {
    // 현재 사용자가 매니저이거나 담당자인 프로젝트
    return project.managerId === currentUser?.id || 
           project.manager === currentUser?.name ||
           project.team?.includes(currentUser?.id || '');
  });

  // 필터링된 프로젝트
  const filteredProjects = myProjects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesAssignee = assigneeFilter === "all" || project.managerId === assigneeFilter;
    
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  // 정렬된 프로젝트
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'dueDate':
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        comparison = dateA - dateB;
        break;
      case 'progress':
        const progressA = calculateProjectProgress ? calculateProjectProgress(a.id) : (a.progress || 0);
        const progressB = calculateProjectProgress ? calculateProjectProgress(b.id) : (b.progress || 0);
        comparison = progressA - progressB;
        break;
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // 프로젝트 분류
  const overdueProjects = myProjects.filter(project => 
    project.dueDate && 
    isBefore(new Date(project.dueDate), new Date()) && 
    project.status !== '완료'
  );
  
  const inProgressProjects = myProjects.filter(project => 
    project.status === '진행중' || project.status === '계획중'
  );
  
  const completedProjects = myProjects.filter(project => 
    project.status === '완료'
  );

  const urgentProjects = myProjects.filter(project => 
    project.dueDate && 
    differenceInDays(new Date(project.dueDate), new Date()) <= 7 &&
    differenceInDays(new Date(project.dueDate), new Date()) >= 0 &&
    project.status !== '완료'
  );

  // 달력용 프로젝트 (마감일 기준)
  const projectsWithDueDate = myProjects.filter(project => project.dueDate);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case '완료': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-sm';
      case '진행중': return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-300 shadow-sm';
      case '계획중': return 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-300 shadow-sm';
      case '보류': return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-300 shadow-sm';
      case '지연': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300 shadow-sm';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'text-emerald-600';
    if (progress >= 75) return 'text-green-600';
    if (progress >= 50) return 'text-blue-600';
    if (progress >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressGradient = (progress: number) => {
    if (progress >= 90) return 'from-emerald-400 to-green-500';
    if (progress >= 75) return 'from-green-400 to-emerald-500';
    if (progress >= 50) return 'from-blue-400 to-cyan-500';
    if (progress >= 25) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };

  const getPriorityIcon = (project: Project) => {
    const progress = calculateProjectProgress ? calculateProjectProgress(project.id) : (project.progress || 0);
    
    if (project.status === '완료') return <Award className="h-4 w-4 text-green-600" />;
    if (overdueProjects.some(p => p.id === project.id)) return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (urgentProjects.some(p => p.id === project.id)) return <Flame className="h-4 w-4 text-orange-600" />;
    if (progress >= 75) return <Star className="h-4 w-4 text-yellow-600" />;
    if (progress >= 50) return <Target className="h-4 w-4 text-blue-600" />;
    return <Rocket className="h-4 w-4 text-purple-600" />;
  };

  const getDaysLeftText = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return `${Math.abs(days)}일 지연`;
    if (days === 0) return '오늘 마감';
    if (days === 1) return '내일 마감';
    if (days <= 7) return `${days}일 후 마감`;
    return `${days}일 남음`;
  };

  const renderProjectCard = (project: Project) => {
    const progress = calculateProjectProgress ? calculateProjectProgress(project.id) : (project.progress || 0);
    const isHovered = hoveredCard === project.id;
    const daysLeft = project.dueDate ? differenceInDays(new Date(project.dueDate), new Date()) : null;
    
    return (
      <Card 
        key={project.id} 
        className={cn(
          "group relative overflow-hidden transition-all duration-500 ease-out cursor-pointer",
          "hover:shadow-2xl hover:shadow-blue-500/25 hover:-translate-y-2",
          "bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-lg",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-600/0 before:to-purple-600/0",
          "hover:before:from-blue-600/5 hover:before:to-purple-600/5 before:transition-all before:duration-500",
          isHovered && "scale-105 shadow-2xl shadow-purple-500/30"
        )}
        onMouseEnter={() => setHoveredCard(project.id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        {/* 상단 그라데이션 바 */}
        <div className={cn(
          "h-1 w-full bg-gradient-to-r transition-all duration-300",
          project.status === '완료' ? 'from-green-400 to-emerald-500' :
          project.status === '진행중' ? 'from-blue-400 to-cyan-500' :
          project.status === '계획중' ? 'from-purple-400 to-violet-500' :
          project.status === '보류' ? 'from-yellow-400 to-orange-500' :
          'from-gray-400 to-slate-500'
        )} />
        
        <CardHeader className="pb-3 relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getPriorityIcon(project)}
                <CardTitle className={cn(
                  "text-lg font-bold line-clamp-1 transition-all duration-300",
                  "bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent",
                  isHovered && "from-blue-600 to-purple-600"
                )}>
                  {project.name}
                </CardTitle>
              </div>
              <CardDescription 
                className="line-clamp-2 text-gray-600 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: project.description || '프로젝트 설명이 없습니다.' }}
              />
            </div>
            
            <div className="flex flex-col items-end gap-2 ml-3">
              <Badge 
                variant="outline" 
                className={cn(
                  "font-medium shadow-sm transition-all duration-300",
                  getStatusBadgeColor(project.status || ''),
                  isHovered && "scale-110 shadow-md"
                )}
              >
                {project.status || '미정'}
              </Badge>
              {daysLeft !== null && (
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  daysLeft < 0 ? 'bg-red-100 text-red-700' :
                  daysLeft <= 3 ? 'bg-orange-100 text-orange-700' :
                  daysLeft <= 7 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                )}>
                  {getDaysLeftText(project.dueDate!)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 진행률 섹션 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 font-medium">진행률</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("font-bold text-lg", getProgressColor(progress))}>
                  {progress}%
                </span>
                <div className="flex items-center">
                  {Array.from({length: 5}).map((_, i) => (
                    <Star 
                      key={i} 
                      className={cn(
                        "h-3 w-3 transition-all duration-300",
                        i < Math.floor(progress / 20) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      )} 
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden",
                  "bg-gradient-to-r shadow-sm",
                  getProgressGradient(progress)
                )}
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                <div className={cn(
                  "absolute inset-0 opacity-0 transition-opacity duration-300",
                  "bg-gradient-to-r from-transparent via-white/40 to-transparent",
                  "animate-pulse",
                  isHovered && "opacity-100"
                )} />
              </div>
            </div>
          </div>

          {/* 정보 그리드 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 마감일 */}
            {project.dueDate && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide font-medium">
                  <CalendarSchedule className="h-3 w-3" />
                  마감일
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {format(new Date(project.dueDate), 'MM월 dd일', { locale: ko })}
                </div>
              </div>
            )}

            {/* 담당자 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide font-medium">
                <User className="h-3 w-3" />
                담당자
              </div>
              <div className="text-sm font-semibold text-gray-900 truncate">
                {project.manager || '미지정'}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className={cn(
            "flex items-center justify-between pt-2 border-t border-gray-100",
            "transition-all duration-300",
            isHovered && "border-blue-200"
          )}>
            <div className="flex items-center gap-3">
              {project.status === '진행중' ? (
                <div className="flex items-center gap-1 text-blue-600">
                  <PlayCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">진행중</span>
                </div>
              ) : project.status === '보류' ? (
                <div className="flex items-center gap-1 text-yellow-600">
                  <PauseCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">보류</span>
                </div>
              ) : project.status === '완료' ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">완료</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-purple-600">
                  <Target className="h-4 w-4" />
                  <span className="text-xs font-medium">계획중</span>
                </div>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              className={cn(
                "h-8 px-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50",
                "transition-all duration-300 group-hover:scale-105"
              )}
            >
              <Eye className="h-3 w-3 mr-1" />
              <span className="text-xs font-medium">상세보기</span>
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardContent>

        {/* 호버 효과 오버레이 */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0",
          "transition-all duration-500 pointer-events-none",
          isHovered && "from-blue-500/5 to-purple-500/5"
        )} />

        {/* 글로우 효과 */}
        <div className={cn(
          "absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-0",
          "transition-all duration-500 -z-10",
          isHovered && "opacity-20"
        )} />
      </Card>
    );
  };

  const renderStatCard = (icon: React.ReactNode, title: string, value: number, color: string, bgGradient: string) => (
    <Card className={cn(
      "relative overflow-hidden border-0 shadow-lg transition-all duration-500",
      "hover:shadow-xl hover:-translate-y-1 cursor-pointer group",
      bgGradient
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-white/80 text-sm font-medium">{title}</p>
            <p className="text-white text-3xl font-bold">{value}</p>
          </div>
          <div className={cn(
            "p-3 rounded-full bg-white/20 backdrop-blur-sm",
            "transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30"
          )}>
            {icon}
          </div>
        </div>
        
        {/* 반짝이는 효과 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-600/10 dark:to-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 dark:from-cyan-600/10 dark:to-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-gray-100 dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                    {translations.projects?.myProjects || "내 프로젝트"}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    {translations.projects?.myProjectsSubtitle || "내가 담당하는 프로젝트들의 현황과 진행 상태를 한눈에 확인하세요"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge 
                variant="outline" 
                className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-4 py-2 text-base shadow-sm"
              >
                <Globe className="h-4 w-4 mr-2" />
                {translations.projects?.totalProjectsCount?.replace('{count}', myProjects.length.toString()) || `총 ${myProjects.length}개 프로젝트`}
              </Badge>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {renderStatCard(
              <Clock className="h-6 w-6 text-white" />,
              translations.projects?.tabInProgress || "진행중",
              inProgressProjects.length,
              "blue",
              "bg-gradient-to-r from-blue-500 to-blue-600"
            )}
            {renderStatCard(
              <AlertTriangle className="h-6 w-6 text-white" />,
              translations.projects?.tabOverdue || "기간 경과",
              overdueProjects.length,
              "red",
              "bg-gradient-to-r from-red-500 to-pink-600"
            )}
            {renderStatCard(
              <CheckCircle className="h-6 w-6 text-white" />,
              translations.projects?.tabCompleted || "완료",
              completedProjects.length,
              "green",
              "bg-gradient-to-r from-green-500 to-emerald-600"
            )}
            {renderStatCard(
              <Flame className="h-6 w-6 text-white" />,
              translations.projects?.urgent || "긴급",
              urgentProjects.length,
              "orange",
              "bg-gradient-to-r from-orange-500 to-red-600"
            )}
          </div>
        </div>

        {/* 필터 섹션 */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder={translations.projects?.searchProjectsPlaceholder || "프로젝트 검색..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white/50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600 focus:border-blue-400 focus:ring-blue-400/20 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 h-12 bg-white/50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder={translations.projects?.statusFilter || "상태 필터"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                  <SelectItem value="all" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700">{translations.projects?.allStatuses || "모든 상태"}</SelectItem>
                  <SelectItem value="계획중" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700">{translations.projects?.planning || "계획중"}</SelectItem>
                  <SelectItem value="진행중" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700">{translations.projects?.tabInProgress || "진행중"}</SelectItem>
                  <SelectItem value="완료" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700">{translations.projects?.tabCompleted || "완료"}</SelectItem>
                  <SelectItem value="보류" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700">{translations.projects?.onHold || "보류"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-48 h-12 bg-white/50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder={translations.projects?.assigneeFilter || "담당자 필터"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                  <SelectItem value="all" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700">{translations.projects?.allAssignees || "모든 담당자"}</SelectItem>
                  {[...users, ...managers].filter(person => person.id && person.name).map((person) => (
                    <SelectItem key={person.id} value={person.id} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700">
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg p-2">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="h-auto p-2 hover:bg-blue-50 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300"
                >
                  {translations.projects?.sortByName || "이름"} {sortBy === 'name' && <ArrowUpDown className="h-3 w-3 ml-1" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('dueDate')}
                  className="h-auto p-2 hover:bg-blue-50 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300"
                >
                  {translations.projects?.sortByDueDate || "마감일"} {sortBy === 'dueDate' && <ArrowUpDown className="h-3 w-3 ml-1" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('progress')}
                  className="h-auto p-2 hover:bg-blue-50 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300"
                >
                  {translations.projects?.sortByProgress || "진행률"} {sortBy === 'progress' && <ArrowUpDown className="h-3 w-3 ml-1" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 탭 섹션 */}
        <Tabs defaultValue="overdue" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl p-2 h-auto">
            <TabsTrigger 
              value="overdue" 
              className="flex items-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-gray-700 dark:text-gray-300"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">{translations.projects?.tabOverdue || "기간 경과"}</span>
              <Badge variant="secondary" className="bg-white/20 text-current border-0">
                {overdueProjects.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="progress" 
              className="flex items-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-gray-700 dark:text-gray-300"
            >
              <Clock className="h-4 w-4" />
              <span className="font-medium">{translations.projects?.tabInProgress || "진행중"}</span>
              <Badge variant="secondary" className="bg-white/20 text-current border-0">
                {inProgressProjects.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="flex items-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-gray-700 dark:text-gray-300"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">{translations.projects?.tabCompleted || "완료"}</span>
              <Badge variant="secondary" className="bg-white/20 text-current border-0">
                {completedProjects.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="timeline" 
              className="flex items-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-gray-700 dark:text-gray-300"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="font-medium">{translations.projects?.tabTimeline || "타임라인"}</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="overdue">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {overdueProjects.length > 0 ? (
                  overdueProjects.map(renderProjectCard)
                ) : (
                  <Card className="col-span-full text-center py-12 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                    <CardContent>
                      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                      <h3 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-2">{translations.projects?.excellentMessage || "훌륭합니다! 🎉"}</h3>
                      <p className="text-green-600 dark:text-green-400">{translations.projects?.noOverdueProjects || "기간이 경과된 프로젝트가 없습니다."}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="progress">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgressProjects.length > 0 ? (
                  inProgressProjects.map(renderProjectCard)
                ) : (
                  <Card className="col-span-full text-center py-12 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                    <CardContent>
                      <Target className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                      <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-300 mb-2">새로운 시작을 준비하세요</h3>
                      <p className="text-blue-600 dark:text-blue-400">현재 진행중인 프로젝트가 없습니다.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedProjects.length > 0 ? (
                  completedProjects.map(renderProjectCard)
                ) : (
                  <Card className="col-span-full text-center py-12 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
                    <CardContent>
                      <Award className="h-16 w-16 mx-auto mb-4 text-purple-500" />
                      <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-300 mb-2">첫 번째 완료를 향해!</h3>
                      <p className="text-purple-600 dark:text-purple-400">완료된 프로젝트가 없습니다.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 달력 */}
                <div className="lg:col-span-1">
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-t-lg">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <CalendarSchedule className="h-5 w-5" />
                        프로젝트 달력
                      </CardTitle>
                      <CardDescription className="text-purple-100">마감일 기준</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        modifiers={{
                          hasDueDate: projectsWithDueDate.map(p => new Date(p.dueDate!))
                        }}
                        modifiersStyles={{
                          hasDueDate: { 
                            backgroundColor: '#8b5cf6', 
                            color: 'white',
                            fontWeight: 'bold',
                            borderRadius: '6px'
                          }
                        }}
                        className="rounded-md border-0 text-gray-900 dark:text-gray-100"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* 선택된 날짜의 프로젝트 목록 */}
                <div className="lg:col-span-2">
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-lg">
                      <CardTitle className="text-xl">
                        {selectedDate ? format(selectedDate, 'yyyy년 MM월 dd일', { locale: ko }) : '날짜를 선택하세요'}
                      </CardTitle>
                      <CardDescription className="text-blue-100">해당 날짜의 마감 프로젝트</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {selectedDate && projectsWithDueDate
                          .filter(project => {
                            const dueDate = new Date(project.dueDate!);
                            return format(dueDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                          })
                          .map(project => {
                            const progress = calculateProjectProgress ? calculateProjectProgress(project.id) : (project.progress || 0);
                            return (
                              <div 
                                key={project.id}
                                className="group flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-xl hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 bg-gradient-to-r from-white to-gray-50/50 dark:from-slate-700 dark:to-slate-600/50"
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  {getPriorityIcon(project)}
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {project.name}
                                    </h4>
                                    <div 
                                      className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{ __html: project.description || '설명이 없습니다.' }}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className={getStatusBadgeColor(project.status || '')}>
                                    {project.status || '미정'}
                                  </Badge>
                                  <div className="text-right">
                                    <span className={cn("text-lg font-bold", getProgressColor(progress))}>
                                      {progress}%
                                    </span>
                                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                                      <div 
                                        className={cn("h-full rounded-full bg-gradient-to-r", getProgressGradient(progress))}
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        }
                        {selectedDate && projectsWithDueDate.filter(project => {
                          const dueDate = new Date(project.dueDate!);
                          return format(dueDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                        }).length === 0 && (
                          <div className="text-center py-12">
                            <CalendarSchedule className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">일정이 없는 날</h3>
                            <p className="text-gray-500 dark:text-gray-400">해당 날짜에 마감되는 프로젝트가 없습니다.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default MyProjects; 