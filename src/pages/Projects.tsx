import { useState } from "react";
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
  Table
} from "lucide-react";
import ProjectCreateDialog from "@/components/projects/ProjectCreateDialog";
import ProjectCard from "@/components/projects/ProjectCard";
import { useLanguage } from "@/context/LanguageContext";
import ProjectDetailsDialog from "@/components/projects/ProjectDetailsDialog";
import { Project } from "@/types";
import { format, isValid, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

const Projects = () => {
  const { projects, calculateProjectProgress } = useAppContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { translations } = useLanguage();
  
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
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'active': return 'default';
      case 'delayed': return 'destructive';
      case 'on-hold': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return translations.projects?.statusCompleted || '완료';
      case 'active': return translations.projects?.statusActive || '진행중';
      case 'delayed': return translations.projects?.statusDelayed || '지연';
      case 'on-hold': return translations.projects?.statusOnHold || '보류';
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

  const getProjectTypeText = (type: string) => {
    const projectTypes: Record<string, string> = {
      // 기존 타입들
      competitor_analysis: "경쟁사 분석",
      raw_material_check: "원자재 확인",
      equipment_check: "설비 확인",
      eservice_creation: "E-Service 제작",
      process_configuration: "공정구성",
      cost_analysis: "원가 분석",
      mass_production_verification: "양산검증",
      // 새로운 타입들
      "1-1": "1-1. 경쟁사 샘플 입수",
      "1-2": "1-2. 경쟁사 샘플 분석",
      "2-1": "2-1. 원자재 소싱 견적",
      "3-1": "3-1. 설비 소싱 견적",
      "3-2": "3-2. 설비 제작 완료",
      "4-1": "4-1. E-Service 내용 구성",
      "4-2": "4-2. E-Service 영상 제작",
      "5-1": "5-1. LINE 그리기",
      "6-1": "6-1. 원가 산출",
      "7-1": "7-1. PP",
      "7-2": "7-2. 품질 문제점 확인",
      "8-1": "8-1. 최종 개선",
      "9-1": "9-1. Order getting"
    };
    
    return projectTypes[type] || type;
  };

  const handleOpenDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsDialogOpen(true);
  };

  // 필터링된 프로젝트
  const filteredProjects = projects.filter(project => {
    if (filterStatus === 'all') return true;
    return project.status === filterStatus;
  });

  // 상태별 프로젝트 수
  const statusCounts = {
    all: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    delayed: projects.filter(p => p.status === 'delayed').length,
    'on-hold': projects.filter(p => p.status === 'on-hold').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Card 
                key={status}
                className={cn(
                  "border-0 shadow-md cursor-pointer transition-all duration-200",
                  filterStatus === status && "ring-2 ring-primary shadow-lg scale-105"
                )}
                onClick={() => setFilterStatus(status)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {status === 'all' && '전체'}
                        {status === 'active' && '진행중'}
                        {status === 'completed' && '완료'}
                        {status === 'delayed' && '지연'}
                        {status === 'on-hold' && '보류'}
                      </p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <div className={cn(
                      "p-2 rounded-lg",
                      status === 'all' && "bg-slate-100 dark:bg-slate-800",
                      status === 'active' && "bg-blue-100 dark:bg-blue-900/30",
                      status === 'completed' && "bg-green-100 dark:bg-green-900/30",
                      status === 'delayed' && "bg-red-100 dark:bg-red-900/30",
                      status === 'on-hold' && "bg-gray-100 dark:bg-gray-900/30"
                    )}>
                      {status === 'all' && <Briefcase className="h-5 w-5" />}
                      {status === 'active' && <Loader2 className="h-5 w-5 text-blue-600" />}
                      {status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {status === 'delayed' && <AlertCircle className="h-5 w-5 text-red-600" />}
                      {status === 'on-hold' && <Clock className="h-5 w-5 text-gray-600" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 뷰 모드 전환 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {filteredProjects.length}개의 프로젝트
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
                      프로젝트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      고객사
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      진행률
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      마감일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      담당자
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProjects.map((project) => {
                    const progress = getActualProgress(project);
                    const StatusIcon = getStatusIcon(project.status);
                    
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
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {project.projectType && getProjectTypeText(project.projectType)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {project.clientName || '미지정'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusColor(project.status)} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {getStatusText(project.status)}
                          </Badge>
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
                            {formatDate(project.dueDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-gray-400 mr-2" />
                            {project.manager || '미지정'}
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
        onOpenChange={setIsCreateDialogOpen} 
      />

      {/* Project Details Dialog */}
      <ProjectDetailsDialog
        project={selectedProject}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </div>
  );
};

export default Projects;
