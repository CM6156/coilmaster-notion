import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { Project, Task } from "@/types";
import { cn } from "@/lib/utils";
import { getDepartmentKoreanName } from "@/utils/departmentUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";

const ScheduleView = () => {
  const { projects, tasks, users, calculateProjectProgress } = useAppContext();
  const { translations } = useLanguage();
  const t = translations.dashboard;
  const globalT = translations.global;
  const projectsT = translations.projects;
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Group users by department
  const departmentUsers = users.reduce((acc, user) => {
    const dept = user.department;
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(user);
    return acc;
  }, {} as Record<string, typeof users>);
  
  // Get tasks for a specific project
  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  };
  
  // Get user's projects - in a real app this would use proper assignments
  const getUserProjects = (userId: string) => {
    // For demo purposes, just distribute projects among users
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return [];
    
    return projects.filter((_, index) => index % users.length === userIndex);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };
  
  // Handle project click
  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };
  
  // Handle task click
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
    setShowProjectModal(false);
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'delayed': return 'bg-red-500';
      case 'on-hold': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  // Calculate employee's date range based on their projects
  const getEmployeeDateRange = (userId: string) => {
    const userProjects = getUserProjects(userId);
    
    if (!userProjects.length) return null;
    
    // Find earliest start date and latest end date
    let earliestStart: Date | null = null;
    let latestEnd: Date | null = null;
    
    userProjects.forEach(project => {
      const startDate = new Date(project.requestDate || project.startDate || "");
      const endDate = new Date(project.targetSOPDate || project.endDate || "");
      
      if (!earliestStart || startDate < earliestStart) {
        earliestStart = startDate;
      }
      
      if (!latestEnd || endDate > latestEnd) {
        latestEnd = endDate;
      }
    });
    
    if (!earliestStart || !latestEnd) return null;
    
    return {
      start: formatDate(earliestStart.toISOString()),
      end: formatDate(latestEnd.toISOString())
    };
  };
  
  return (
    <>
      <div className="space-y-8">
        {Object.entries(departmentUsers).map(([department, deptUsers]) => (
          <Card key={department} className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{getDepartmentKoreanName(department as any)} {globalT?.department || "부서"} 일정</CardTitle>
            </CardHeader>
            <CardContent>
              {deptUsers.map(user => {
                const userProjects = getUserProjects(user.id);
                if (userProjects.length === 0) return null;
                
                const dateRange = getEmployeeDateRange(user.id);
                
                return (
                  <div key={user.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium">{user.name} ({user.title || '팀원'})</h3>
                        {dateRange && (
                          <p className="text-xs text-gray-500">
                            {dateRange.start} - {dateRange.end}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="pl-10">
                      <div className="relative w-full overflow-x-auto pb-4">
                        <div className="flex items-center border-b text-xs text-gray-500 py-2">
                          <div className="w-[180px] flex-shrink-0">제품명</div>
                          <div className="flex-1 relative">
                            {/* Timeline dates */}
                            <div className="flex">
                              {Array.from({ length: 12 }, (_, i) => (
                                <div key={i} className="flex-1 text-center border-l">{i + 1}월</div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {userProjects.map(project => {
                          const startDate = new Date(project.requestDate || project.startDate || "");
                          const endDate = new Date(project.targetSOPDate || project.endDate || "");
                          
                          // Calculate position and width for timeline bar (percentage of year)
                          const currentYear = new Date().getFullYear();
                          const yearStart = new Date(currentYear, 0, 1).getTime();
                          const yearEnd = new Date(currentYear, 11, 31).getTime();
                          const yearDuration = yearEnd - yearStart;
                          
                          const projectStart = Math.max(startDate.getTime(), yearStart);
                          const projectEnd = Math.min(endDate.getTime(), yearEnd);
                          
                          const leftPosition = ((projectStart - yearStart) / yearDuration) * 100;
                          const width = ((projectEnd - projectStart) / yearDuration) * 100;
                          
                          return (
                            <div 
                              key={project.id}
                              className="flex items-center py-2 hover:bg-gray-50"
                            >
                              <div className="w-[180px] flex-shrink-0 px-2 font-medium truncate">
                                {project.name || project.title}
                              </div>
                              <div className="flex-1 relative h-8">
                                <div 
                                  className={cn(
                                    "absolute h-6 rounded-md cursor-pointer flex items-center justify-center text-xs text-white",
                                    getStatusColor(project.status)
                                  )}
                                  style={{ 
                                    left: `${leftPosition}%`, 
                                    width: `${width}%`,
                                    minWidth: '50px'
                                  }}
                                  onClick={() => handleProjectClick(project)}
                                >
                                  <span className="px-2 truncate">{project.name || project.title}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Project Modal */}
      <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name || selectedProject?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-500">제품명</div>
                  <div className="font-medium">{selectedProject.name || selectedProject.title}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">진행률</div>
                  <div className="font-medium">{calculateProjectProgress(selectedProject.id)}%</div>
                </div>
              </div>
              
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", getStatusColor(selectedProject.status))}
                  style={{ width: `${calculateProjectProgress(selectedProject.id)}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">시작일</div>
                  <div>{formatDate(selectedProject.requestDate || selectedProject.startDate || "")}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">목표일</div>
                  <div>{formatDate(selectedProject.targetSOPDate || selectedProject.endDate || "")}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">업무 목록</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {getProjectTasks(selectedProject.id).map(task => (
                    <div
                      key={task.id}
                      className="p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{task.title}</div>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", getStatusColor(task.status))}></div>
                          <span className="text-sm">{task.progress}%</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(task.startDate)} ~ {formatDate(task.dueDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">설명</div>
                <div className="mt-1">{selectedTask.description}</div>
              </div>
              
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-500">우선 순위</div>
                  <div className="font-medium">
                    {selectedTask.priority === 'high' ? '높음' : 
                      selectedTask.priority === 'medium' ? '중간' : '낮음'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">진행률</div>
                  <div className="font-medium">{selectedTask.progress}%</div>
                </div>
              </div>
              
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", getStatusColor(selectedTask.status))}
                  style={{ width: `${selectedTask.progress}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">시작일</div>
                  <div>{formatDate(selectedTask.startDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">{projectsT?.dueDate || "마감일"}</div>
                  <div>{formatDate(selectedTask.dueDate)}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">{globalT?.department || "부서"}</div>
                <div>{getDepartmentKoreanName(selectedTask.department as any)}</div>
              </div>

              {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500">의존성</div>
                  <div>{selectedTask.dependencies.length}개 업무 연결됨</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScheduleView;
