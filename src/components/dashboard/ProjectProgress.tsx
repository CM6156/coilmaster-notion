import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { Project } from '@/types';

const ProjectProgress = () => {
  const { projects, calculateProjectProgress } = useAppContext();
  const { translations } = useLanguage();
  const t = translations.dashboard;
  
  // Check if projects is not an array or is undefined, and provide a fallback
  const projectList = Array.isArray(projects) ? projects : [];
  
  // Sort by progress and take top 5
  const topProjects = [...projectList]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  // 프로젝트의 실제 진행률 가져오기
  const getActualProgress = (project: Project) => {
    return calculateProjectProgress(project.id);
  };

  // 진행률에 따른 색상 결정
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-gradient-to-r from-green-400 to-green-500";
    if (progress >= 50) return "bg-gradient-to-r from-blue-400 to-blue-500";
    if (progress >= 30) return "bg-gradient-to-r from-yellow-400 to-yellow-500";
    return "bg-gradient-to-r from-red-400 to-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{t?.projectProgress || '프로젝트 진행상황'}</CardTitle>
      </CardHeader>
      <CardContent>
        {topProjects.length > 0 ? (
          <div className="space-y-5">
            {topProjects.map((project) => (
              <div key={project.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="w-36 sm:w-48 truncate">
                    <h3 className="text-sm font-medium truncate" title={project.name}>
                      {project.name}
                    </h3>
                  </div>
                  <div
                    className={cn(
                      "font-medium",
                      getActualProgress(project) >= 80 ? "text-green-600" :
                      getActualProgress(project) >= 50 ? "text-blue-600" :
                      getActualProgress(project) >= 30 ? "text-yellow-600" :
                      "text-red-600"
                    )}
                  >
                    {getActualProgress(project)}% {t?.projectComplete || '완료'}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        getProgressColor(getActualProgress(project))
                      )}
                      style={{ width: `${getActualProgress(project)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            {t?.noProjects || '표시할 프로젝트가 없습니다'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectProgress;
