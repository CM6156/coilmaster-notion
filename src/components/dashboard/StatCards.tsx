import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppContext } from "@/context/AppContext"
import { Activity, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

function StatCards() {
  const { projects, tasks, calculateProjectProgress } = useAppContext();
  const { translations } = useLanguage();
  
  // Using translations
  const t = translations.dashboard;
  
  // 전체 태스크 수
  const totalTasks = tasks.length;
  
  // 완료된 태스크 수
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  
  // 진행중인 태스크 수
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  
  // 지연된 태스크 수 (on-hold, delayed로 변경)
  const delayedTasks = tasks.filter(task => task.status === 'on-hold' || task.status === 'delayed').length;
  
  // 프로젝트 평균 진행률
  const averageProjectProgress = projects.length > 0
    ? Math.round(
        projects.reduce((sum, project) => sum + calculateProjectProgress(project.id), 0) / projects.length
      )
    : 0;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t?.totalProgress || '전체 진행률'}</CardTitle>
          <Activity className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageProjectProgress}%</div>
          <p className="text-xs text-gray-500 mt-1">{t?.projectProgress || '모든 프로젝트 평균'}</p>
          <div className="mt-2 h-2 w-full bg-gray-100 rounded-full">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${averageProjectProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t?.completedTasks || '완료된 업무'}</CardTitle>
          <CheckCircle className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedTasks}</div>
          <p className="text-xs text-gray-500 mt-1">{t?.outOf ? `${totalTasks} ${t.outOf}` : `전체 ${totalTasks}개 중`}</p>
          <div className="mt-2 h-2 w-full bg-gray-100 rounded-full">
            <div 
              className="h-full bg-green-500 rounded-full" 
              style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t?.inProgressTasks || '진행 중인 업무'}</CardTitle>
          <Loader2 className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inProgressTasks}</div>
          <p className="text-xs text-gray-500 mt-1">{t?.outOf ? `${totalTasks} ${t.outOf}` : `전체 ${totalTasks}개 중`}</p>
          <div className="mt-2 h-2 w-full bg-gray-100 rounded-full">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${(inProgressTasks / totalTasks) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t?.delayedTasks || '지연된 업무'}</CardTitle>
          <Clock className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{delayedTasks}</div>
          <p className="text-xs text-gray-500 mt-1">{t?.outOf ? `${totalTasks} ${t.outOf}` : `전체 ${totalTasks}개 중`}</p>
          <div className="mt-2 h-2 w-full bg-gray-100 rounded-full">
            <div 
              className="h-full bg-red-500 rounded-full" 
              style={{ width: `${(delayedTasks / totalTasks) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StatCards;
