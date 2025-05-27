import React from 'react';
import { Project } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, User, Building2, Target, Clock, CheckCircle, PlayCircle, PauseCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAppContext } from '@/context/AppContext';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const { clients, managers, phases, tasks, calculateProjectProgress } = useAppContext();

  // 실제 클라이언트 정보 가져오기
  const getClientName = (clientId: string | undefined) => {
    if (!clientId) return '고객사 미지정';
    const client = clients.find(c => c.id === clientId);
    return client?.name || '고객사 미지정';
  };

  // 실제 담당자 정보 가져오기
  const getManagerName = (managerId: string | undefined, managerName: string | undefined) => {
    // manager 필드에 이름이 있으면 우선 사용
    if (managerName) return managerName;
    
    // managerId가 있으면 매니저 목록에서 찾기
    if (managerId) {
      const manager = managers.find(m => m.id === managerId);
      if (manager) return manager.name;
    }
    
    return '담당자 미지정';
  };

  // 실제 단계 정보 가져오기
  const getPhaseInfo = (phaseId: string | undefined) => {
    if (!phaseId) return { name: '단계 미지정', color: 'bg-gray-400' };
    
    const phase = phases.find(p => p.id === phaseId);
    if (phase) {
      return {
        name: phase.name,
        color: `bg-[${phase.color}]` || 'bg-blue-500'
      };
    }
    
    return { name: '단계 미지정', color: 'bg-gray-400' };
  };

  // 실제 진행률 계산
  const actualProgress = calculateProjectProgress(project.id);

  // 업무 상태를 표준화하는 함수
  const normalizeTaskStatus = (status: string, progress: number): 'notStarted' | 'inProgress' | 'completed' => {
    const normalizedStatus = status.toLowerCase().trim();
    
    // 완료 상태 확인
    if (normalizedStatus === 'completed' || 
        normalizedStatus === 'done' || 
        normalizedStatus === '완료' ||
        normalizedStatus === 'finished' ||
        progress === 100) {
      return 'completed';
    }
    
    // 진행중 상태 확인
    if (normalizedStatus === 'in-progress' || 
        normalizedStatus === 'in_progress' ||
        normalizedStatus === 'progress' ||
        normalizedStatus === 'doing' ||
        normalizedStatus === '진행중' ||
        normalizedStatus === 'active' ||
        normalizedStatus === 'reviewing' ||
        normalizedStatus === '검토중' ||
        (progress > 0 && progress < 100)) {
      return 'inProgress';
    }
    
    // 나머지는 모두 시작전으로 처리
    return 'notStarted';
  };

  // 실제 프로젝트 업무 현황 계산
  const getProjectTaskStats = () => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const total = projectTasks.length;
    
    if (total === 0) {
      return { total: 0, notStarted: 0, inProgress: 0, completed: 0 };
    }
    
    // 상태별로 분류
    const statusCounts = projectTasks.reduce((acc, task) => {
      const normalizedStatus = normalizeTaskStatus(task.status, task.progress || 0);
      acc[normalizedStatus]++;
      return acc;
    }, { notStarted: 0, inProgress: 0, completed: 0 });
    
    return { 
      total, 
      notStarted: statusCounts.notStarted, 
      inProgress: statusCounts.inProgress, 
      completed: statusCounts.completed 
    };
  };

  const subtaskStats = getProjectTaskStats();

  return (
    <div 
      className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* 배경 그라디언트 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
      
      {/* 상단: 이미지 및 기본 정보 */}
      <div className="relative z-10 mb-4">
        <div className="flex items-start gap-4">
          {/* 제품 이미지 */}
          <div className="flex-shrink-0 w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden border-2 border-white shadow-md">
            {project.image ? (
              <img 
                src={project.image} 
                alt={project.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700">
                <Target className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              </div>
            )}
          </div>

          {/* 기본 정보 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {project.name}
            </h3>
            
            {/* 배지들 */}
            <div className="flex flex-wrap gap-2">
              {/* 프로젝트 단계 배지 */}
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {getPhaseInfo(project.phase)?.name}
              </Badge>
              
              {/* 담당자 배지 */}
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                👤 {getManagerName(project.managerId, project.manager)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 진행률 */}
      <div className="relative z-10 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">진행률</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{actualProgress}%</span>
        </div>
        <Progress value={actualProgress} className="h-2 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${actualProgress}%` }}
          />
        </Progress>
      </div>

      {/* 하위업무 상태 */}
      <div className="relative z-10 mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">업무 현황</h4>
        {subtaskStats.total === 0 ? (
          <div className="text-center py-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">등록된 업무가 없습니다</span>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PauseCircle className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">시작전</span>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {subtaskStats.notStarted}/{subtaskStats.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">진행중</span>
              </div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {subtaskStats.inProgress}/{subtaskStats.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">완료</span>
              </div>
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                {subtaskStats.completed}/{subtaskStats.total}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 하단: 날짜 정보 */}
      <div className="relative z-10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>
            시작: {
              project.startDate && !isNaN(new Date(project.startDate).getTime()) 
                ? format(new Date(project.startDate), 'MM/dd', { locale: ko })
                : '미정'
            }
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>
            마감: {
              project.dueDate && !isNaN(new Date(project.dueDate).getTime()) 
                ? format(new Date(project.dueDate), 'MM/dd', { locale: ko })
                : '미정'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard; 