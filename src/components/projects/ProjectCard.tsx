import React from 'react';
import { Project } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, User, Target, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAppContext } from '@/context/AppContext';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const { clients, managers, phases, tasks, calculateProjectProgress } = useAppContext();

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
          
          <div className="flex gap-2 mb-1">
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              Promotion
            </Badge>
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
          <span className="text-sm text-gray-600">진행률</span>
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
        <h4 className="text-sm text-gray-600 mb-2">업무 현황</h4>
        {subtaskStats.total === 0 ? (
          <div className="text-center text-xs text-gray-400 py-2">
            등록된 업무가 없습니다
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">○ 시작전</span>
              <span className="text-gray-900">{subtaskStats.notStarted}/{subtaskStats.total}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">○ 진행중</span>
              <span className="text-gray-900">{subtaskStats.inProgress}/{subtaskStats.total}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">○ 완료</span>
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
            시작: {
              project.startDate && !isNaN(new Date(project.startDate).getTime()) 
                ? format(new Date(project.startDate), 'MM/dd', { locale: ko })
                : '05/26'
            }
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>
            마감: {
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