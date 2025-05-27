
// import { Card } from "@/components/ui/card";
// import { useAppContext } from "@/context/AppContext";
// import { cn } from "@/lib/utils";
// import { Task } from "@/types";
// import { CheckCircle, Clock, Loader2 } from "lucide-react";
// import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
// import { useLanguage } from "@/context/LanguageContext";

// const generateCorporationColor = (corporation: string) => {
//   // Simple hash function to generate consistent colors for corporations
//   let hash = 0;
//   for (let i = 0; i < corporation.length; i++) {
//     hash = corporation.charCodeAt(i) + ((hash << 5) - hash);
//   }
  
//   const colors = [
//     'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
//     'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
//   ];
  
//   return colors[Math.abs(hash) % colors.length];
// };

// const getCorporationColor = (corporation: string) => {
//   const colors: Record<string, string> = {
//     '본사': '#3b82f6', // blue
//     '서울지사': '#10b981', // green
//     '부산지사': '#f59e0b', // amber
//     '대구지사': '#ef4444', // red
//     '인천지사': '#8b5cf6', // violet
//     '광주지사': '#ec4899', // pink
//     '대전지사': '#6366f1', // indigo
//     '울산지사': '#14b8a6', // teal
//   };
  
//   return colors[corporation] || '#64748b'; // default: slate
// };

// const TeamByCorporation = () => {
//   const { users, tasks } = useAppContext();
//   const { translations } = useLanguage();
  
//   // Group users by corporation
//   const corporations = [...new Set(users.map(user => user.corporation || '본사'))];
  
//   // Initialize corporation statistics
//   const corporationStats = corporations.map(corporation => {
//     const corporationUsers = users.filter(user => (user.corporation || '본사') === corporation);
    
//     // Get tasks for this corporation's users
//     const userIds = corporationUsers.map(user => user.id);
//     const corporationTasks = tasks.filter(task => userIds.includes(task.assignedTo));
    
//     const completedTasks = corporationTasks.filter(task => task.status === 'completed').length;
//     const totalTasks = corporationTasks.length;
//     const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
//     const totalProgress = corporationTasks.reduce((sum, task) => sum + task.progress, 0);
//     const progressRate = totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;
    
//     return {
//       name: corporation,
//       color: getCorporationColor(corporation),
//       userCount: corporationUsers.length,
//       taskCount: totalTasks,
//       completedTaskCount: completedTasks,
//       completionRate,
//       progressRate,
//     };
//   });
  
//   // Data for charts
//   const completionData = corporationStats.map(corp => ({
//     name: corp.name,
//     value: corp.completionRate,
//     color: corp.color
//   }));
  
//   const progressData = corporationStats.map(corp => ({
//     name: corp.name,
//     value: corp.progressRate,
//     color: corp.color
//   }));

//   return (
//     <div className="container mx-auto p-4 sm:p-6 animate-fade-in">
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold">{translations.team?.corporation || '법인별'}</h1>
//         <p className="text-slate-600">법인별 업무 현황 및 진행률</p>
//       </div>
      
//       {/* Charts */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//         <Card className="p-4">
//           <h2 className="text-lg font-semibold mb-4">{translations.team?.completionRate || '완료율'} (%)</h2>
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={completionData}
//                   cx="50%"
//                   cy="50%"
//                   labelLine={false}
//                   outerRadius={80}
//                   fill="#8884d8"
//                   dataKey="value"
//                   label={({ name, value }) => `${name}: ${value}%`}
//                 >
//                   {completionData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip formatter={(value) => [`${value}%`, '완료율']} />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </Card>
        
//         <Card className="p-4">
//           <h2 className="text-lg font-semibold mb-4">{translations.team?.progressRate || '진행률'} (%)</h2>
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={progressData}
//                   cx="50%"
//                   cy="50%"
//                   labelLine={false}
//                   outerRadius={80}
//                   fill="#8884d8"
//                   dataKey="value"
//                   label={({ name, value }) => `${name}: ${value}%`}
//                 >
//                   {progressData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip formatter={(value) => [`${value}%`, '진행률']} />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </Card>
//       </div>

//       {/* Corporation List */}
//       <div className="space-y-6">
//         {corporationStats.map((corp) => (
//           <Card key={corp.name} className="p-4">
//             <div className="flex items-center gap-2 mb-4">
//               <div 
//                 className={cn("w-4 h-4 rounded-full")}
//                 style={{backgroundColor: corp.color}}
//               />
//               <h2 className="text-xl font-bold">{corp.name}</h2>
//               <span className="text-sm text-gray-500">
//                 (인원: {corp.userCount}명, 업무: {corp.taskCount}개)
//               </span>
//             </div>
            
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//               <div className="p-4 bg-slate-50 rounded-lg">
//                 <div className="text-sm text-slate-500">업무 완료율</div>
//                 <div className="text-2xl font-bold">{corp.completionRate}%</div>
//                 <div className="mt-2 h-2 bg-slate-200 rounded-full">
//                   <div 
//                     className={cn(
//                       "h-full rounded-full",
//                       corp.completionRate < 30 ? 'bg-red-500' :
//                       corp.completionRate < 70 ? 'bg-yellow-500' : 'bg-green-500'
//                     )} 
//                     style={{ width: `${corp.completionRate}%` }}
//                   />
//                 </div>
//               </div>
              
//               <div className="p-4 bg-slate-50 rounded-lg">
//                 <div className="text-sm text-slate-500">업무 진행률</div>
//                 <div className="text-2xl font-bold">{corp.progressRate}%</div>
//                 <div className="mt-2 h-2 bg-slate-200 rounded-full">
//                   <div 
//                     className={cn(
//                       "h-full rounded-full",
//                       corp.progressRate < 30 ? 'bg-red-500' :
//                       corp.progressRate < 70 ? 'bg-yellow-500' : 'bg-green-500'
//                     )} 
//                     style={{ width: `${corp.progressRate}%` }}
//                   />
//                 </div>
//               </div>
              
//               <div className="p-4 bg-slate-50 rounded-lg">
//                 <div className="flex items-center justify-between">
//                   <div className="text-sm text-slate-500">완료된 업무</div>
//                   <CheckCircle className="h-4 w-4 text-green-500" />
//                 </div>
//                 <div className="text-2xl font-bold">
//                   {corp.completedTaskCount} / {corp.taskCount}
//                 </div>
//                 <div className="text-xs text-slate-400 mt-1">
//                   {corp.taskCount > 0 ? `${Math.round((corp.completedTaskCount / corp.taskCount) * 100)}%` : '0%'}
//                 </div>
//               </div>
              
//               <div className="p-4 bg-slate-50 rounded-lg">
//                 <div className="flex items-center justify-between">
//                   <div className="text-sm text-slate-500">평균 업무량</div>
//                   <Clock className="h-4 w-4 text-blue-500" />
//                 </div>
//                 <div className="text-2xl font-bold">
//                   {corp.userCount > 0 ? Math.round(corp.taskCount / corp.userCount * 10) / 10 : 0}
//                 </div>
//                 <div className="text-xs text-slate-400 mt-1">
//                   인당 업무 수
//                 </div>
//               </div>
//             </div>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default TeamByCorporation;
