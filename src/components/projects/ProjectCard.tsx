import React from 'react';
import { Project } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, User, Target, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAppContext } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const { clients, managers, phases, tasks, calculateProjectProgress } = useAppContext();
  const { translations } = useLanguage();

  // 디버깅을 위한 로그
  console.log(`ProjectCard - ${project.name}:`, {
    promotionStatus: project.promotionStatus,
    phase: project.phase,
    type: project.type,
    status: project.status
  });

  // 실제 담당자 정보 가져오기
  const getManagerName = (managerId: string | undefined, managerName: string | undefined) => {
    // manager 필드에 이름이 있으면 우선 사용
    if (managerName) return managerName;
    
    // managerId가 있으면 매니저 목록에서 찾기
    if (managerId) {
      const manager = managers.find(m => m.id === managerId);
      if (manager) return manager.name;
    }
    
    return translations.projects?.unassigned || '담당자 미지정';
  };

  // 실제 진행률 계산
  const actualProgress = calculateProjectProgress(project.id);

  // 업무 상태를 표준화하는 함수 (상태와 진행률 모두 고려)
  const normalizeTaskStatus = (status: string, progress: number): 'notStarted' | 'inProgress' | 'completed' => {
    const normalizedStatus = status.toLowerCase().trim();
    
    console.log(`업무 상태 분석: status="${status}", progress=${progress}`);
    
    // 1. 완료 상태 확인 (진행률 100% 또는 완료 상태)
    if (progress === 100 || 
        normalizedStatus === 'completed' || 
        normalizedStatus === 'done' || 
        normalizedStatus === '완료' ||
        normalizedStatus === '완료 100%' ||
        normalizedStatus === 'finished') {
      console.log(`→ 완료로 분류 (진행률: ${progress}%, 상태: ${status})`);
      return 'completed';
    }
    
    // 2. 진행중 상태 확인 (진행중 20%, 40%, 60%, 80% 상태)
    if (normalizedStatus === '진행중 20%' || 
        normalizedStatus === '진행중 40%' || 
        normalizedStatus === '진행중 60%' || 
        normalizedStatus === '진행중 80%' ||
        normalizedStatus === '진행중' ||
        normalizedStatus === 'in-progress' || 
        normalizedStatus === 'in_progress' ||
        normalizedStatus === 'progress' ||
        normalizedStatus === 'doing' ||
        normalizedStatus === 'active' ||
        normalizedStatus === 'reviewing' ||
        normalizedStatus === '검토중' ||
        (progress > 0 && progress < 100)) {
      console.log(`→ 진행중으로 분류 (진행률: ${progress}%, 상태: ${status})`);
      return 'inProgress';
    }
    
    // 3. 시작전으로 처리 (시작전 상태 또는 진행률 0%)
    if (normalizedStatus === '시작전' || 
        normalizedStatus === 'not-started' ||
        normalizedStatus === 'to-do' ||
        normalizedStatus === 'todo' ||
        normalizedStatus === '할 일' ||
        progress === 0) {
      console.log(`→ 시작전으로 분류 (진행률: ${progress}%, 상태: ${status})`);
      return 'notStarted';
    }
    
    // 4. 기본값: 시작전
    console.log(`→ 시작전으로 분류 (기본값) (진행률: ${progress}%, 상태: ${status})`);
    return 'notStarted';
  };

  // 실제 프로젝트 업무 현황 계산
  const getProjectTaskStats = () => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const total = projectTasks.length;
    
    console.log(`=== 프로젝트 "${project.name}" 업무 현황 계산 ===`);
    console.log(`전체 업무 수: ${total}`);
    console.log('프로젝트 업무 목록:', projectTasks.map(t => ({
      title: t.title,
      status: t.status,
      progress: t.progress
    })));
    
    if (total === 0) {
      console.log('업무가 없어서 모든 값을 0으로 반환');
      return { total: 0, notStarted: 0, inProgress: 0, completed: 0 };
    }
    
    // 상태별로 분류
    const statusCounts = projectTasks.reduce((acc, task) => {
      const normalizedStatus = normalizeTaskStatus(task.status, task.progress || 0);
      acc[normalizedStatus]++;
      
      console.log(`업무 "${task.title}": ${task.status} (${task.progress}%) → ${normalizedStatus}`);
      
      return acc;
    }, { notStarted: 0, inProgress: 0, completed: 0 });
    
    console.log('최종 통계:', statusCounts);
    console.log('===============================');
    
    return { 
      total, 
      notStarted: statusCounts.notStarted, 
      inProgress: statusCounts.inProgress, 
      completed: statusCounts.completed 
    };
  };

  const subtaskStats = getProjectTaskStats();

  // 프로모션 단계 번역
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

  // 프로젝트 타입 번역
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

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer p-4"
      onClick={onClick}
    >
      {/* 상단: 제품 이미지와 프로젝트 정보 */}
      <div className="flex gap-3 mb-3">
        {/* 제품 이미지 */}
        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
          {project.image ? (
            <img 
              src={project.image} 
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Target className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* 프로젝트 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate mb-1">
            {project.name}
          </h3>
          
          <div className="flex gap-1 mb-1">
            {/* 프로모션 단계 우선 표시 - 더 작은 크기 */}
            {project.promotionStage && project.promotionStage !== 'Promotion' ? (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-200 text-blue-800 text-[10px] leading-3 font-semibold">
                {getPromotionStageText(project.promotionStage)}
              </Badge>
            ) : project.promotionStage === 'Promotion' ? (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-red-200 text-red-800 text-[10px] leading-3 font-semibold">
                {getPromotionStageText('Promotion')}
              </Badge>
            ) : null}
            
            {/* Phase 정보 표시 (UUID가 아닌 실제 이름이고, 일반적인 상태가 아닌 경우만) */}
            {project.phase && 
             project.phase !== project.promotionStage && 
             !['진행중', '일반', 'planned', 'active', 'in-progress', 'planning'].includes(project.phase.toLowerCase()) &&
             !project.phase.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-[10px] leading-3">
                {project.phase}
              </Badge>
            )}
            
            {/* 프로젝트 타입 표시 (일반적인 타입이 아닌 경우만) */}
            {project.projectType && 
             project.projectType !== project.promotionStage && 
             project.projectType !== project.phase &&
             !['일반', 'general', 'normal'].includes(project.projectType.toLowerCase()) && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-[10px] leading-3">
                {getProjectTypeText(project.projectType)}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-sm text-green-600">
            <User className="h-3 w-3" />
            <span>{getManagerName(project.managerId, project.manager)}</span>
          </div>
        </div>
      </div>

      {/* 진행률 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">{translations.projects?.progress || '진행률'}</span>
          <span className="text-sm font-medium text-gray-900">{actualProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-gray-800 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${actualProgress}%` }}
          />
        </div>
      </div>

      {/* 업무 현황 */}
      <div className="mb-3">
        <h4 className="text-sm text-gray-600 mb-2">{translations.projects?.tasks || '업무 현황'}</h4>
        {subtaskStats.total === 0 ? (
          <div className="text-center text-xs text-gray-400 py-2">
            {translations.projects?.noRelatedTasks || '등록된 업무가 없습니다'}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">○ {translations.projects?.statusNotStarted || '시작전'}</span>
              <span className="text-gray-900">{subtaskStats.notStarted}/{subtaskStats.total}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">○ {translations.projects?.statusInProgress || '진행중'}</span>
              <span className="text-gray-900">{subtaskStats.inProgress}/{subtaskStats.total}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">○ {translations.projects?.statusCompleted || '완료'}</span>
              <span className="text-gray-900">{subtaskStats.completed}/{subtaskStats.total}</span>
            </div>
          </div>
        )}
      </div>

      {/* 하단: 날짜 정보 */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>
            {translations.projects?.startDate || '시작'}: {
              project.startDate && !isNaN(new Date(project.startDate).getTime()) 
                ? format(new Date(project.startDate), 'MM/dd', { locale: ko })
                : '05/26'
            }
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>
            {translations.projects?.dueDate || '마감'}: {
              project.dueDate && !isNaN(new Date(project.dueDate).getTime()) 
                ? format(new Date(project.dueDate), 'MM/dd', { locale: ko })
                : '07/18'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard; 