import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Plus,
  Building2,
  TrendingUp,
  Users,
  Target,
  FileText,
  Briefcase,
  AlertCircle,
  Sparkles,
  Filter,
  Grid3x3,
  List,
  Table,
  Cog,
  User,
  FolderOpen,
  BarChart3
} from "lucide-react";
import ProjectCreateDialog from "@/components/projects/ProjectCreateDialog";
import ProjectCard from "@/components/projects/ProjectCard";
import { useLanguage } from "@/context/LanguageContext";
import { Project } from "@/types";
import { format, isValid, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

const Projects = () => {
  const { projects, calculateProjectProgress, managers } = useAppContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { translations } = useLanguage();
  const navigate = useNavigate();
  
  // Format date properly
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return dateString;
      return format(date, 'yyyy-MM-dd', { locale: ko });
    } catch (error) {
      return dateString;
    }
  };
  
  // 프로젝트의 실제 진행률 가져오기 (하위 업무 기반)
  const getActualProgress = (project: Project) => {
    return calculateProjectProgress(project.id);
  };

  // 프로젝트 지연 여부 자동 판단
  const isProjectDelayed = (project: Project) => {
    if (!project.endDate) return false;
    
    const endDate = new Date(project.endDate);
    const today = new Date();
    const progress = getActualProgress(project);
    
    // 마감일이 지났고 완료되지 않은 경우
    if (endDate < today && project.status !== 'completed') {
      return true;
    }
    
    // 마감일까지 남은 일수 대비 진행률이 현저히 낮은 경우
    const totalDays = project.startDate ? 
      Math.ceil((endDate.getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 
      0;
    const passedDays = project.startDate ? 
      Math.ceil((today.getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 
      0;
    
    if (totalDays > 0) {
      const expectedProgress = Math.min((passedDays / totalDays) * 100, 100);
      // 예상 진행률보다 20% 이상 뒤처진 경우
      if (progress < expectedProgress - 20 && project.status === 'active') {
        return true;
      }
    }
    
    return false;
  };

  // 동적 프로젝트 상태 계산
  const getProjectStatus = (project: Project) => {
    const progress = getActualProgress(project);
    
    console.log(`=== 프로젝트 상태 계산: ${project.name} ===`);
    console.log(`진행률: ${progress}%`);
    console.log(`프로젝트 상태: ${project.status}`);
    console.log(`시작일: ${project.startDate}`);
    console.log(`마감일: ${project.endDate}`);
    
    // 완료된 프로젝트
    if (progress >= 100 || project.status === 'completed') {
      console.log(`결과: completed (진행률 ${progress}% 또는 상태 completed)`);
      return 'completed';
    }
    
    // 보류된 프로젝트
    if (project.status === 'on-hold') {
      console.log(`결과: on-hold (상태가 on-hold)`);
      return 'on-hold';
    }
    
    // 지연된 프로젝트
    if (isProjectDelayed(project)) {
      console.log(`결과: delayed (지연 조건 충족)`);
      return 'delayed';
    }
    
    // 진행률이 0%인 경우 시작 전으로 분류
    if (progress === 0) {
      console.log(`결과: not-started (진행률 0%)`);
      return 'not-started';
    }
    
    // 진행중인 프로젝트
    console.log(`결과: active (기본값 - 진행중)`);
    return 'active';
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'from-red-500 to-orange-500';
    if (progress < 70) return 'from-yellow-500 to-amber-500';
    return 'from-green-500 to-emerald-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'active': return Loader2;
      case 'delayed': return AlertCircle;
      case 'not-started': return Clock;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'active': return 'default';
      case 'delayed': return 'destructive';
      case 'on-hold': return 'secondary';
      case 'not-started': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return translations.projects?.statusCompleted || '완료';
      case 'active': return translations.projects?.statusActive || '진행중';
      case 'delayed': return translations.projects?.statusDelayed || '지연';
      case 'on-hold': return translations.projects?.statusOnHold || '보류';
      case 'not-started': return translations.projects?.statusNotStarted || '시작전';
      default: return status;
    }
  };

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'planning': return translations.projects?.phasePlanning || '기획';
      case 'development': return translations.projects?.phaseDevelopment || '개발';
      case 'manufacturing': return translations.projects?.phaseManufacturing || '제조';
      case 'quality': return translations.projects?.phaseQuality || '품질';
      case 'production': return translations.projects?.phaseProduction || '양산';
      case 'sales': return translations.projects?.phaseSales || '영업';
      default: return phase;
    }
  };

  const getPromotionStageText = (stage: string) => {
    switch (stage) {
      case 'Promotion':
        return translations.projects?.promotionStagePromotion || 'Promotion';
      case 'Sample':
        return translations.projects?.promotionStageSample || 'Sample 및 견적';
      case '1차검증':
        return translations.projects?.promotionStage1stVerification || '1차 특성 검증';
      case '설계검증':
        return translations.projects?.promotionStageDesignVerification || '설계 검증';
      case 'Set검증':
        return translations.projects?.promotionStageSetVerification || 'Set 검증';
      case '승인':
        return translations.projects?.promotionStageApproval || '승인';
      case '수주':
        return translations.projects?.promotionStageOrder || '수주';
      case 'Drop':
        return translations.projects?.promotionStageDrop || 'Drop';
      default:
        return stage;
    }
  };

  const getProjectTypeText = (type: string) => {
    switch (type) {
      case '1-1':
        return translations.projects?.projectType11 || '1-1. 경쟁사 샘플 입수';
      case '1-2':
        return translations.projects?.projectType12 || '1-2. 경쟁사 샘플 분석';
      case '2-1':
        return translations.projects?.projectType21 || '2-1. 원자재 소싱 견적';
      case '3-1':
        return translations.projects?.projectType31 || '3-1. 설비 소싱 견적';
      case '3-2':
        return translations.projects?.projectType32 || '3-2. 설비 제작 완료';
      case '4-1':
        return translations.projects?.projectType41 || '4-1. E-Service 내용 구성';
      case '4-2':
        return translations.projects?.projectType42 || '4-2. E-Service 영상 제작';
      case '5-1':
        return translations.projects?.projectType51 || '5-1. LINE 그리기';
      case '6-1':
        return translations.projects?.projectType61 || '6-1. 원가 산출';
      case '7-1':
        return translations.projects?.projectType71 || '7-1. PP';
      case '7-2':
        return translations.projects?.projectType72 || '7-2. 품질 문제점 확인';
      case '8-1':
        return translations.projects?.projectType81 || '8-1. 최종 개선';
      case '9-1':
        return translations.projects?.projectType91 || '9-1. Order getting';
      default:
        return type;
    }
  };

  const handleOpenDetails = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  // 동적 상태별 프로젝트 수 계산
  const statusCounts = {
    all: projects.length,
    'not-started': projects.filter(p => getProjectStatus(p) === 'not-started').length,
    active: projects.filter(p => getProjectStatus(p) === 'active').length,
    completed: projects.filter(p => getProjectStatus(p) === 'completed').length,
    delayed: projects.filter(p => getProjectStatus(p) === 'delayed').length,
    'on-hold': projects.filter(p => getProjectStatus(p) === 'on-hold').length,
  };

  // 프로모션 단계별 프로젝트 수 계산
  const promotionStageCounts = {
    all: projects.length,
    '1-1': projects.filter(p => p.type === '1-1').length,
    '1-2': projects.filter(p => p.type === '1-2').length,
    '2-1': projects.filter(p => p.type === '2-1').length,
    '3-1': projects.filter(p => p.type === '3-1').length,
    '3-2': projects.filter(p => p.type === '3-2').length,
    '4-1': projects.filter(p => p.type === '4-1').length,
    '4-2': projects.filter(p => p.type === '4-2').length,
    '5-1': projects.filter(p => p.type === '5-1').length,
    '6-1': projects.filter(p => p.type === '6-1').length,
    '7-1': projects.filter(p => p.type === '7-1').length,
    '7-2': projects.filter(p => p.type === '7-2').length,
    '8-1': projects.filter(p => p.type === '8-1').length,
    '9-1': projects.filter(p => p.type === '9-1').length,
  };

  // 필터링된 프로젝트 (동적 상태 기준)
  const filteredProjects = projects.filter(project => {
    if (filterStatus === 'all') return true;
    
    // 새로운 프로모션 단계로 필터링 (대소문자 구분 없이)
    const phase = (project.phase || '').toLowerCase();
    const status = (project.status || '').toLowerCase();
    const type = (project.type || '').toLowerCase();
    const projectType = (project.projectType || '').toLowerCase();
    const promotionStatus = (project.promotionStatus || '').toLowerCase();
    
    if (filterStatus === 'Promotion') {
      return project.promotionStage === 'Promotion';
    }
    if (filterStatus === 'Sample') {
      return project.promotionStage === 'Sample';
    }
    if (filterStatus === '1차') {
      return project.promotionStage === '1차검증';
    }
    if (filterStatus === '설계') {
      return project.promotionStage === '설계검증';
    }
    if (filterStatus === 'Set') {
      return project.promotionStage === 'Set검증';
    }
    if (filterStatus === '승인') {
      return project.promotionStage === '승인';
    }
    if (filterStatus === '수주') {
      return project.promotionStage === '수주';
    }
    if (filterStatus === 'Drop') {
      return project.promotionStage === 'Drop';
    }
    
    // 기존 프로모션 단계로 필터링 (하위 호환성)
    if (Object.keys(promotionStageCounts).includes(filterStatus)) {
      return project.type === filterStatus;
    }
    
    // 기존 상태로 필터링
    return getProjectStatus(project) === filterStatus;
  });

  // 남은 시간 계산 함수
  const getRemainingTime = (project: Project) => {
    if (!project.dueDate) return "-";
    
    const dueDate = new Date(project.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} ${translations.projects?.daysDelayed || '일 지연'}`;
    } else if (diffDays === 0) {
      return translations.projects?.dueToday || "오늘 마감";
    } else {
      return `${diffDays} ${translations.projects?.daysRemaining || '일 남음'}`;
    }
  };

  // 남은 시간 색상 계산
  const getRemainingTimeColor = (project: Project) => {
    if (!project.dueDate) return "text-gray-500";
    
    const dueDate = new Date(project.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return "text-red-600 font-semibold"; // 지연
    } else if (diffDays <= 3) {
      return "text-orange-600 font-semibold"; // 3일 이내
    } else if (diffDays <= 7) {
      return "text-yellow-600"; // 7일 이내
    } else {
      return "text-green-600"; // 여유
    }
  };

  // 담당자 이름 가져오기 함수
  const getManagerName = (managerId: string | undefined, managerName?: string) => {
    // 1. managerId가 있는 경우 managers 배열에서 찾기
    if (managerId) {
      const manager = managers.find(m => m.id === managerId);
      if (manager?.name) {
        return manager.name;
      }
    }
    
    // 2. managerId로 찾을 수 없는 경우 직접 전달된 manager 이름 사용 (pic_name)
    if (managerName && managerName.trim() !== '') {
      return managerName;
    }
    
    // 3. 둘 다 없는 경우 미지정
    return translations.projects?.unassigned || '미지정';
  };

  // 프로모션 단계별 통계를 실시간으로 계산 (프로젝트 목록이 변경될 때마다 자동 업데이트)
  const promotionStageStats = useMemo(() => {
    console.log('🔄 프로모션 단계 통계 재계산 중...', projects.length, '개 프로젝트');
    console.log('📋 현재 프로젝트 목록:', projects.map(p => ({ 
      name: p.name, 
      promotionStage: p.promotionStage 
    })));
    
    const stages = [
      { key: 'Promotion', label: translations.projects?.promotionStagePromotion || 'Promotion', color: 'red', icon: Target },
      { key: 'Sample', label: translations.projects?.promotionStageSample || 'Sample 및 견적', color: 'orange', icon: Building2 },
      { key: '1차', label: translations.projects?.promotionStage1stVerification || '1차 특성 검증', color: 'yellow', icon: CheckCircle2 },
      { key: '설계', label: translations.projects?.promotionStageDesignVerification || '설계 검증', color: 'green', icon: Cog },
      { key: 'Set', label: translations.projects?.promotionStageSetVerification || 'Set 검증', color: 'cyan', icon: FileText },
      { key: '승인', label: translations.projects?.promotionStageApproval || '승인', color: 'blue', icon: CheckCircle2 },
      { key: '수주', label: translations.projects?.promotionStageOrder || '수주', color: 'purple', icon: TrendingUp },
      { key: 'Drop', label: translations.projects?.promotionStageDrop || 'Drop', color: 'gray', icon: AlertCircle }
    ];

    const result = stages.map((stage) => {
      // 해당 단계의 프로젝트들 필터링
      const stageProjects = projects.filter(p => {
        if (stage.key === 'Promotion') return p.promotionStage === 'Promotion';
        if (stage.key === 'Sample') return p.promotionStage === 'Sample';
        if (stage.key === '1차') return p.promotionStage === '1차검증';
        if (stage.key === '설계') return p.promotionStage === '설계검증';
        if (stage.key === 'Set') return p.promotionStage === 'Set검증';
        if (stage.key === '승인') return p.promotionStage === '승인';
        if (stage.key === '수주') return p.promotionStage === '수주';
        if (stage.key === 'Drop') return p.promotionStage === 'Drop';
        return false;
      });

      const count = stageProjects.length;
      
      // 해당 단계 프로젝트들의 평균 진행률 계산
      const averageProgress = count > 0 
        ? Math.round(
            stageProjects.reduce((sum, project) => {
              return sum + calculateProjectProgress(project.id);
            }, 0) / count
          )
        : 0;

      const percentage = projects.length > 0 ? Math.round((count / projects.length) * 100) : 0;

      console.log(`📊 ${stage.label}: ${count}개 (${percentage}%, 평균진행률: ${averageProgress}%)`);
      if (count > 0) {
        console.log(`   └─ 프로젝트: ${stageProjects.map(p => p.name).join(', ')}`);
      }

      return {
        ...stage,
        count,
        averageProgress,
        percentage,
        projects: stageProjects
      };
    });

    console.log('✅ 프로모션 단계 통계 계산 완료');
    return result;
  }, [projects, calculateProjectProgress]); // projects나 calculateProjectProgress가 변경될 때마다 재계산

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                {translations.projects?.title || "프로젝트 관리"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {translations.projects?.subtitle || "전체 프로젝트 목록 및 현황"}
              </p>
            </div>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              {translations.projects?.new || "새 프로젝트"}
            </Button>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 mb-6">
            {/* 전체 프로젝트 카드 */}
              <Card 
                className={cn(
                "border-0 shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105",
                filterStatus === 'all' && "ring-2 ring-primary shadow-lg scale-105"
                )}
              onClick={() => setFilterStatus('all')}
              >
                <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 rounded-lg mb-2 bg-slate-100 dark:bg-slate-800">
                    <Briefcase className="h-5 w-5 text-slate-600" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{translations.projects?.all || '전체'}</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
              </CardContent>
            </Card>

            {/* 프로모션 단계별 카드 */}
            {promotionStageStats.map((stage) => {
              return (
                <Card 
                  key={stage.key}
                  className={cn(
                    "border-0 shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105",
                    filterStatus === stage.key && "ring-2 ring-primary shadow-lg scale-105"
                  )}
                  onClick={() => setFilterStatus(stage.key)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className={cn(
                        "p-2 rounded-lg mb-2",
                        stage.color === 'red' && "bg-red-100 dark:bg-red-900/20",
                        stage.color === 'orange' && "bg-orange-100 dark:bg-orange-900/20",
                        stage.color === 'yellow' && "bg-yellow-100 dark:bg-yellow-900/20",
                        stage.color === 'green' && "bg-green-100 dark:bg-green-900/20",
                        stage.color === 'cyan' && "bg-cyan-100 dark:bg-cyan-900/20",
                        stage.color === 'blue' && "bg-blue-100 dark:bg-blue-900/20",
                        stage.color === 'purple' && "bg-purple-100 dark:bg-purple-900/20",
                        stage.color === 'gray' && "bg-gray-100 dark:bg-gray-900/20"
                      )}>
                        <stage.icon className={cn(
                          "h-5 w-5",
                          stage.color === 'red' && "text-red-600",
                          stage.color === 'orange' && "text-orange-600",
                          stage.color === 'yellow' && "text-yellow-600",
                          stage.color === 'green' && "text-green-600",
                          stage.color === 'cyan' && "text-cyan-600",
                          stage.color === 'blue' && "text-blue-600",
                          stage.color === 'purple' && "text-purple-600",
                          stage.color === 'gray' && "text-gray-600"
                        )} />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{stage.label}</p>
                      <p className="text-2xl font-bold">{stage.count}</p>
                      
                      {/* 평균 진행률 표시 */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            stage.color === 'red' && "bg-red-500",
                            stage.color === 'orange' && "bg-orange-500",
                            stage.color === 'yellow' && "bg-yellow-500",
                            stage.color === 'green' && "bg-green-500",
                            stage.color === 'cyan' && "bg-cyan-500",
                            stage.color === 'blue' && "bg-blue-500",
                            stage.color === 'purple' && "bg-purple-500",
                            stage.color === 'gray' && "bg-gray-500"
                          )}
                          style={{ width: `${stage.averageProgress}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between w-full mt-1">
                        <span className="text-xs text-muted-foreground">{translations.projects?.averageProgress || '평균 진행률'}</span>
                        <span className="text-xs font-medium text-gray-900">
                          {stage.averageProgress}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-muted-foreground">{translations.projects?.totalRatio || '전체 비율'}</span>
                        <span className="text-xs text-muted-foreground">
                          {stage.percentage}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 뷰 모드 전환 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {filteredProjects.length}{translations.projects?.projectsCount || '개의 프로젝트'}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg shadow-md p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3",
                  viewMode === 'grid' && "bg-primary text-primary-foreground"
                )}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3",
                  viewMode === 'list' && "bg-primary text-primary-foreground"
                )}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 프로젝트 목록 */}
        {viewMode === 'grid' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => handleOpenDetails(project)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translations.projects?.tableProject || '프로젝트'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translations.projects?.tablePromotionStage || '프로모션 단계'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translations.projects?.tableProgress || '진행률'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translations.projects?.tableStartDate || '시작일'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translations.projects?.tableDueDate || '마감일'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translations.projects?.tableRemainingTime || '남은시간'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translations.projects?.tableManager || '담당자'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProjects.map((project) => {
                    const progress = getActualProgress(project);
                    const StatusIcon = getStatusIcon(getProjectStatus(project));
                    
                    return (
                      <tr 
                        key={project.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => handleOpenDetails(project)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {project.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getStatusColor(getProjectStatus(project))} className="text-xs">
                                {getStatusText(getProjectStatus(project))}
                              </Badge>
                              {project.projectType && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {getProjectTypeText(project.projectType)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={cn(
                              "w-3 h-3 rounded-full mr-2",
                              project.promotionStage === 'Promotion' && "bg-red-500",
                              project.promotionStage === 'Sample' && "bg-orange-500",
                              project.promotionStage === '1차검증' && "bg-yellow-500",
                              project.promotionStage === '설계검증' && "bg-green-500",
                              project.promotionStage === 'Set검증' && "bg-cyan-500",
                              project.promotionStage === '승인' && "bg-blue-500",
                              project.promotionStage === '수주' && "bg-purple-500",
                              project.promotionStage === 'Drop' && "bg-gray-500",
                              !project.promotionStage && "bg-gray-300"
                            )} />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {getPromotionStageText(project.promotionStage || 'Promotion')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                              <div
                                className={cn("h-2 rounded-full bg-gradient-to-r", getProgressColor(progress))}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            {formatDate(project.startDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <CalendarDays className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {formatDate(project.dueDate)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            <span className={getRemainingTimeColor(project)}>
                              {(() => {
                                const today = new Date();
                                const dueDate = new Date(project.dueDate);
                                const diffTime = dueDate.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays < 0) {
                                  return (
                                    <span className="text-red-600 font-medium">
                                      {Math.abs(diffDays)} {translations.projects?.daysDelayed || '일 지연'}
                                    </span>
                                  );
                                } else if (diffDays === 0) {
                                  return (
                                    <span className="text-orange-600 font-medium">
                                      {translations.projects?.dueToday || '오늘 마감'}
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="text-green-600 font-medium">
                                      {diffDays} {translations.projects?.daysRemaining || '일 남음'}
                                    </span>
                                  );
                                }
                              })()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {project.manager || translations.projects?.unassigned || '미지정'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Briefcase className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-xl font-medium mb-2">
              {translations.projects?.noProjects || "프로젝트가 없습니다."}
            </div>
            <p className="text-muted-foreground mb-6">
              {translations.projects?.createFirst || "새 프로젝트를 만들어보세요."}
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              {translations.projects?.new || "새 프로젝트"}
            </Button>
          </div>
        )}
      </div>
      
      {/* Project Create Dialog */}
      <ProjectCreateDialog 
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            console.log('✅ 프로젝트 생성 다이얼로그 닫힘 - 통계 자동 업데이트됨');
          }
        }}
      />
    </div>
  );
};

export default Projects;
