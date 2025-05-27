
// import { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useAppContext } from "@/context/AppContext";
// import { Download, Filter } from "lucide-react";
// import { 
//   getProjectProgressData, 
//   getTasksByDepartmentData, 
//   getTasksByStatusData 
// } from "@/components/reports/ReportDataUtils";
// import { ProjectProgressTab } from "@/components/reports/ProjectProgressTab";
// import { DepartmentTab } from "@/components/reports/DepartmentTab";
// import { TaskStatusTab } from "@/components/reports/TaskStatusTab";
// import { CorporationTab } from "@/components/reports/CorporationTab";
// import { useToast } from "@/hooks/use-toast";
// import * as XLSX from 'xlsx';

// export default function Reports() {
//   const { projects, tasks, users } = useAppContext();
//   const { toast } = useToast();
//   const [reportType, setReportType] = useState("project");
//   const [timeFrame, setTimeFrame] = useState("month");

//   // 프로젝트 진행률 데이터
//   const projectProgressData = getProjectProgressData(projects);

//   // 부서별 데이터
//   const tasksByDepartmentData = getTasksByDepartmentData(tasks);
  
//   // 업무 상태별 데이터
//   const tasksByStatusData = getTasksByStatusData(tasks);

//   // 상태별 색상
//   const statusColors = ["#e5e7eb", "#3b82f6", "#10b981", "#ef4444"];
  
//   // 법인별 데이터 계산
//   const getCorporationsData = () => {
//     // 법인 목록
//     const corporations = [...new Set(users.map(user => user.corporation || '본사'))];
    
//     const corporationData = corporations.map(corporation => {
//       // 해당 법인 사용자들
//       const corporationUsers = users.filter(user => (user.corporation || '본사') === corporation);
//       const userIds = corporationUsers.map(user => user.id);
      
//       // 해당 법인의 업무들
//       const corporationTasks = tasks.filter(task => userIds.includes(task.assignedTo));
      
//       // 완료된 업무 계산
//       const completedTasks = corporationTasks.filter(task => task.status === 'completed').length;
//       const totalTasks = corporationTasks.length;
//       const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
//       // 진행률 계산
//       const totalProgress = corporationTasks.reduce((sum, task) => sum + task.progress, 0);
//       const progressRate = totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;
      
//       return {
//         name: corporation,
//         value: totalTasks, // 차트에 표시할 값
//         totalTasks,
//         completedTasks,
//         completionRate,
//         progressRate,
//         corporation
//       };
//     });
    
//     return corporationData;
//   };
  
//   const corporationsData = getCorporationsData();

//   // Excel 내보내기
//   const handleExport = () => {
//     let data: Array<any> = [];
//     let fileName = '';
    
//     // 선택한 보고서 유형에 따라 데이터 준비
//     if (reportType === 'project') {
//       data = projects.map(project => ({
//         '프로젝트명': project.name,
//         '상태': project.status,
//         '시작일': project.startDate,
//         '종료일': project.dueDate,
//         '진행률': `${project.progress}%`,
//         '담당자': users.find(u => u.id === project.manager)?.name || '',
//         '우선순위': project.priority
//       }));
//       fileName = `프로젝트_진행현황_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.xlsx`;
//     } 
//     else if (reportType === 'department') {
//       data = tasks.map(task => {
//         const assignedUser = users.find(u => u.id === task.assignedTo);
//         return {
//           '업무명': task.title,
//           '상태': task.status,
//           '진행률': `${task.progress}%`,
//           '부서': assignedUser?.department || '',
//           '담당자': assignedUser?.name || '',
//           '마감일': task.dueDate
//         };
//       });
//       fileName = `부서별_업무_현황_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.xlsx`;
//     }
//     else if (reportType === 'status') {
//       data = tasks.map(task => ({
//         '업무명': task.title,
//         '상태': task.status,
//         '진행률': `${task.progress}%`,
//         '우선순위': task.priority,
//         '마감일': task.dueDate,
//         '담당자': users.find(u => u.id === task.assignedTo)?.name || ''
//       }));
//       fileName = `업무_상태_분석_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.xlsx`;
//     }
//     else if (reportType === 'corporation') {
//       data = corporationsData.map(corp => ({
//         '법인': corp.name,
//         '총 업무 수': corp.totalTasks,
//         '완료된 업무': corp.completedTasks,
//         '완료율': `${corp.completionRate}%`,
//         '진행률': `${corp.progressRate}%`
//       }));
//       fileName = `법인별_업무_현황_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.xlsx`;
//     }
    
//     // 워크시트 생성
//     const ws = XLSX.utils.json_to_sheet(data);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "보고서");
    
//     // 파일 다운로드
//     XLSX.writeFile(wb, fileName);
    
//     toast({
//       title: "내보내기 완료",
//       description: `${fileName} 파일이 다운로드되었습니다.`,
//     });
//   };

//   return (
//     <div className="container mx-auto p-4 sm:p-6 animate-fade-in">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-2xl font-bold">보고서</h1>
//           <p className="text-slate-600">프로젝트 및 업무 현황 분석</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Select value={timeFrame} onValueChange={setTimeFrame}>
//             <SelectTrigger className="w-[120px]">
//               <SelectValue placeholder="기간" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="week">주간</SelectItem>
//               <SelectItem value="month">월간</SelectItem>
//               <SelectItem value="quarter">분기별</SelectItem>
//               <SelectItem value="year">연간</SelectItem>
//             </SelectContent>
//           </Select>
//           <Button variant="outline">
//             <Filter className="h-4 w-4 mr-2" /> 필터
//           </Button>
//           <Button onClick={handleExport}>
//             <Download className="h-4 w-4 mr-2" /> 내보내기
//           </Button>
//         </div>
//       </div>

//       <Tabs defaultValue="project" onValueChange={setReportType} className="space-y-4">
//         <TabsList>
//           <TabsTrigger value="project">프로젝트 진행현황</TabsTrigger>
//           <TabsTrigger value="department">부서별 업무 현황</TabsTrigger>
//           <TabsTrigger value="status">업무 상태 분석</TabsTrigger>
//           <TabsTrigger value="corporation">법인별 업무 현황</TabsTrigger>
//         </TabsList>
        
//         <TabsContent value="project" className="space-y-4">
//           <ProjectProgressTab 
//             projects={projects} 
//             projectProgressData={projectProgressData} 
//           />
//         </TabsContent>
        
//         <TabsContent value="department">
//           <DepartmentTab 
//             tasksByDepartmentData={tasksByDepartmentData} 
//             tasks={tasks} 
//           />
//         </TabsContent>
        
//         <TabsContent value="status">
//           <TaskStatusTab 
//             tasksByStatusData={tasksByStatusData} 
//             statusColors={statusColors} 
//             tasks={tasks} 
//           />
//         </TabsContent>
        
//         <TabsContent value="corporation">
//           <CorporationTab 
//             corporationsData={corporationsData}
//             tasks={tasks}
//           />
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }
