import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppContext } from "@/context/AppContext"
import { Users, Building2, UserCheck, ClipboardList } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

function StatCards() {
  const { projects, tasks, managers } = useAppContext();
  const { translations } = useLanguage();
  
  // Using translations
  const t = translations.dashboard;
  
  // 전체 사용자 수 (고정값)
  const totalUsers = 3;
  
  // 활성 프로젝트 수 (등록된 모든 프로젝트)
  const activeProjects = projects.length;
  
  // 담당자 수 (담당자 관리에 등록된 담당자)
  const totalManagers = managers.length;
  
  // 진행중 업무 수 (업무 데이터베이스에 등록된 모든 업무)
  const totalTasks = tasks.length;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-gray-500 mt-1">등록된 사용자</p>
          <div className="mt-2 h-2 w-full bg-gray-100 rounded-full">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: '100%' }}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">활성 프로젝트</CardTitle>
          <Building2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProjects}</div>
          <p className="text-xs text-gray-500 mt-1">등록된 프로젝트</p>
          <div className="mt-2 h-2 w-full bg-gray-100 rounded-full">
            <div 
              className="h-full bg-green-500 rounded-full" 
              style={{ width: activeProjects > 0 ? '100%' : '0%' }}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">담당자 수</CardTitle>
          <UserCheck className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalManagers}</div>
          <p className="text-xs text-gray-500 mt-1">등록된 담당자</p>
          <div className="mt-2 h-2 w-full bg-gray-100 rounded-full">
            <div 
              className="h-full bg-purple-500 rounded-full" 
              style={{ width: totalManagers > 0 ? '100%' : '0%' }}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">진행중 업무</CardTitle>
          <ClipboardList className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTasks}</div>
          <p className="text-xs text-gray-500 mt-1">등록된 업무</p>
          <div className="mt-2 h-2 w-full bg-gray-100 rounded-full">
            <div 
              className="h-full bg-orange-500 rounded-full" 
              style={{ width: totalTasks > 0 ? '100%' : '0%' }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StatCards;
