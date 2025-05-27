

import RecentDocuments from "@/components/dashboard/RecentDocuments";
import RecentTasks from "@/components/dashboard/RecentTasks";
import StatCards from "@/components/dashboard/StatCards";
import TasksByDepartment from "@/components/dashboard/TasksByDepartment";


const Index = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-slate-600">전자부품 제조 프로젝트 현황</p>
      </div>
      
      <div className="space-y-6">
        <StatCards />
        
        <div className="grid gap-6 md:grid-cols-1">
          <RecentTasks />
        </div>
        
        <div className="grid gap-6 md:grid-cols-1">
          <TasksByDepartment />
        </div>
        
        <RecentDocuments />
      </div>
    </div>
  );
};

export default Index;
