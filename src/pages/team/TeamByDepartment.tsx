// import React, { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Progress } from "@/components/ui/progress";
// import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
// import { Button } from "@/components/ui/button";
// import { Eye, MessageSquare } from "lucide-react";
// import { DepartmentCode } from '@/types';
// import { useLanguage } from "@/context/LanguageContext";
// import { format } from 'date-fns';
// import { useAppContext } from "@/context/AppContext";

// // Define the data types
// interface DepartmentData {
//   name: DepartmentCode;
//   users: number;
//   color: string;
// }

// interface ProgressData {
//   name: DepartmentCode;
//   users: number;
//   completionRate: number;
//   progressRate: number;
//   color: string;
// }

// interface EmployeeData {
//   id: string;
//   name: string;
//   position: string;
//   email: string;
//   department: DepartmentCode;
// }

// // Mock data for departments
// const departmentData: DepartmentData[] = [
//   { name: DepartmentCode.SALES, users: 12, color: '#8884d8' },
//   { name: DepartmentCode.DEVELOPMENT, users: 18, color: '#82ca9d' },
//   { name: DepartmentCode.MANUFACTURING, users: 24, color: '#ffc658' },
//   { name: DepartmentCode.QUALITY, users: 9, color: '#ff8042' },
//   { name: DepartmentCode.FINANCE, users: 7, color: '#0088fe' },
//   { name: DepartmentCode.ADMINISTRATION, users: 5, color: '#00C49F' },
//   { name: DepartmentCode.MANAGEMENT, users: 4, color: '#FFBB28' }
// ];

// // Completion and progress data
// const departmentProgress: ProgressData[] = [
//   { name: DepartmentCode.SALES, users: 12, completionRate: 78, progressRate: 85, color: '#8884d8' },
//   { name: DepartmentCode.DEVELOPMENT, users: 18, completionRate: 65, progressRate: 72, color: '#82ca9d' },
//   { name: DepartmentCode.MANUFACTURING, users: 24, completionRate: 89, progressRate: 91, color: '#ffc658' },
//   { name: DepartmentCode.QUALITY, users: 9, completionRate: 92, progressRate: 94, color: '#ff8042' },
//   { name: DepartmentCode.FINANCE, users: 7, completionRate: 83, progressRate: 87, color: '#0088fe' },
//   { name: DepartmentCode.ADMINISTRATION, users: 5, completionRate: 70, progressRate: 75, color: '#00C49F' },
//   { name: DepartmentCode.MANAGEMENT, users: 4, completionRate: 95, progressRate: 97, color: '#FFBB28' }
// ];

// const TeamByDepartment = () => {
//   const [selectedDepartment, setSelectedDepartment] = useState<string>(DepartmentCode.SALES);
//   const { translations, language } = useLanguage();
//   const t = translations;
//   const { employees } = useAppContext();

//   // Format date properly with date-fns
//   const formatDate = (dateString: string) => {
//     if (!dateString) return '';
//     try {
//       return format(new Date(dateString), 'yyyy-MM-dd');
//     } catch (error) {
//       return dateString;
//     }
//   };

//   // Filter employees by selected department
//   const filteredEmployees = employees.filter(
//     (employee) =>
//       selectedDepartment === 'all' ||
//       employee.department === selectedDepartment
//   );

//   // Find completion and progress data for selected department
//   const completionData = departmentProgress.find(
//     (dept) => dept.name === selectedDepartment
//   );
  
//   // Find progress data for selected department
//   const progressData = departmentProgress.find(
//     (dept) => dept.name === selectedDepartment
//   );

//   // 부서명 변환 함수
//   const getDepartmentDisplayName = (dept: DepartmentCode, t: any): string => {
//     const deptMap: Record<DepartmentCode, string> = {
//       [DepartmentCode.SALES]: t?.global?.sales || '영업',
//       [DepartmentCode.DEVELOPMENT]: t?.global?.development || '개발',
//       [DepartmentCode.MANUFACTURING]: t?.global?.manufacturing || '제조',
//       [DepartmentCode.QUALITY]: t?.global?.quality || '품질',
//       [DepartmentCode.FINANCE]: t?.global?.finance || '재무',
//       [DepartmentCode.ADMINISTRATION]: t?.global?.administration || '행정',
//       [DepartmentCode.MANAGEMENT]: t?.global?.management || '경영',
//       [DepartmentCode.ENGINEERING]: t?.global?.engineering || '공학',
//       [DepartmentCode.RND]: t?.global?.rnd || '연구개발',
//       [DepartmentCode.PRODUCTION]: t?.global?.production || '생산',
//       [DepartmentCode.QA]: t?.global?.qa || '품질보증',
//     };
    
//     return deptMap[dept] || String(dept);
//   };

//   // 직책 번역 함수 - 언어에 따라 직책을 번역하여 반환
//   const translatePosition = (position: string) => {
//     if (!position) return "";

//     const positionTranslations: Record<string, Record<string, string>> = {
//       'associate': {
//         'ko': '사원',
//         'en': 'Associate',
//         'zh': '助理',
//         'th': 'ผู้ร่วมงาน'
//       },
//       'employee': {
//         'ko': '직원',
//         'en': 'Employee',
//         'zh': '员工',
//         'th': 'พนักงาน'
//       },
//       'professional': {
//         'ko': '전문가',
//         'en': 'Professional',
//         'zh': '专业人员',
//         'th': 'มืออาชีพ'
//       },
//       'leader': {
//         'ko': '리더',
//         'en': 'Leader',
//         'zh': '领导',
//         'th': 'ผู้นำ'
//       },
//       'mentor': {
//         'ko': '멘토',
//         'en': 'Mentor',
//         'zh': '导师',
//         'th': 'พี่เลี้ยง'
//       },
//       'ceo': {
//         'ko': 'CEO',
//         'en': 'CEO',
//         'zh': '首席执行官',
//         'th': 'ซีอีโอ'
//       },
//       'chairman': {
//         'ko': '회장',
//         'en': 'Chairman',
//         'zh': '董事长',
//         'th': 'ประธาน'
//       },
//       'staff': {
//         'ko': '스태프',
//         'en': 'Staff',
//         'zh': '职员',
//         'th': 'พนักงาน'
//       },
//       'manager': {
//         'ko': '매니저',
//         'en': 'Manager',
//         'zh': '经理',
//         'th': 'ผู้จัดการ'
//       },
//       'director': {
//         'ko': '디렉터',
//         'en': 'Director',
//         'zh': '主管',
//         'th': 'ผู้อำนวยการ'
//       },
//       'engineer': {
//         'ko': '엔지니어',
//         'en': 'Engineer',
//         'zh': '工程师',
//         'th': 'วิศวกร'
//       },
//       'designer': {
//         'ko': '디자이너',
//         'en': 'Designer',
//         'zh': '设计师',
//         'th': 'นักออกแบบ'
//       }
//     };

//     const lowerPosition = position.toLowerCase();
    
//     if (positionTranslations[lowerPosition] && positionTranslations[lowerPosition][language]) {
//       return positionTranslations[lowerPosition][language];
//     }
    
//     // 번역이 없는 경우 원래 직책을 반환
//     return position;
//   };

//   return (
//     <div className="container p-4 mx-auto">
//       <h1 className="text-2xl font-bold mb-6">{t?.team?.department || '부서별 팀 관리'}</h1>
      
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//         <Card className="col-span-1">
//           <CardHeader>
//             <CardTitle className="text-lg">{t?.team?.departmentDistribution ?? '부서 분포'}</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="h-[300px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={departmentData.map(d => ({...d, name: getDepartmentDisplayName(d.name, t)}))}
//                     cx="50%"
//                     cy="50%"
//                     outerRadius={80}
//                     labelLine={false}
//                     label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//                     dataKey="users"
//                     nameKey="name"
//                   >
//                     {departmentData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.color} />
//                     ))}
//                   </Pie>
//                   <Legend layout="vertical" align="center" verticalAlign="bottom" />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card className="col-span-1">
//           <CardHeader>
//             <CardTitle className="text-lg">{t?.team?.completionRate || '프로젝트 완료율'}</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {departmentProgress.map((dept) => (
//                 <div key={dept.name} className="space-y-1">
//                   <div className="flex justify-between text-sm">
//                     <span className="font-medium">{getDepartmentDisplayName(dept.name, t)}</span>
//                     <span>{dept.completionRate}%</span>
//                   </div>
//                   <Progress value={dept.completionRate} className="h-2 bg-gray-200">
//                     <div 
//                       className="h-full bg-green-500 rounded-full" 
//                       style={{ width: `${dept.completionRate}%` }}
//                     />
//                   </Progress>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card className="col-span-1">
//           <CardHeader>
//             <CardTitle className="text-lg">{t?.team?.progressRate || '하위 업무 진행율'}</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {departmentProgress.map((dept) => (
//                 <div key={dept.name} className="space-y-1">
//                   <div className="flex justify-between text-sm">
//                     <span className="font-medium">{getDepartmentDisplayName(dept.name, t)}</span>
//                     <span>{dept.progressRate}%</span>
//                   </div>
//                   <Progress value={dept.progressRate} className="h-2 bg-gray-200">
//                     <div 
//                       className="h-full bg-yellow-400 rounded-full" 
//                       style={{ width: `${dept.progressRate}%` }}
//                     />
//                   </Progress>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
      
//       <Card className="mb-6">
//         <CardHeader>
//           <CardTitle>{t?.team?.employeeList || '부서별 직원 목록'}</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Tabs 
//             defaultValue={DepartmentCode.SALES} 
//             onValueChange={(value) => setSelectedDepartment(value as string)}
//           >
//             <TabsList className="mb-4 flex flex-wrap">
//               {departmentData.map((dept) => (
//                 <TabsTrigger key={dept.name} value={dept.name}>
//                   {getDepartmentDisplayName(dept.name, t)} ({dept.users})
//                 </TabsTrigger>
//               ))}
//             </TabsList>
            
//             {departmentData.map((dept) => (
//               <TabsContent key={dept.name} value={dept.name}>
//                 <div className="rounded-md border">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>{t?.team?.name || '이름'}</TableHead>
//                         <TableHead>{t?.team?.position || '직책'}</TableHead>
//                         <TableHead className="hidden md:table-cell">{t?.team?.email || '이메일'}</TableHead>
//                         <TableHead>{t?.global?.actions || '액션'}</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {filteredEmployees.map((employee) => (
//                         <TableRow key={employee.id}>
//                           <TableCell className="font-medium">{employee.name}</TableCell>
//                           <TableCell>{translatePosition(employee.position)}</TableCell>
//                           <TableCell className="hidden md:table-cell">{employee.email}</TableCell>
//                           <TableCell>
//                             <div className="flex gap-2">
//                               <Button size="sm" variant="ghost">
//                                 <Eye className="mr-1 h-4 w-4" />
//                                 {t?.team?.details || '상세'}
//                               </Button>
//                               <Button size="sm" variant="ghost">
//                                 <MessageSquare className="mr-1 h-4 w-4" />
//                                 {t?.team?.message || '메시지'}
//                               </Button>
//                             </div>
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               </TabsContent>
//             ))}
//           </Tabs>
//         </CardContent>
//       </Card>
      
//       {completionData && progressData && (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">
//                 {getDepartmentDisplayName(selectedDepartment as DepartmentCode, t)} {t?.team?.completionRate || '부서 완료율'}
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="flex items-center justify-center">
//                 <div className="relative h-40 w-40">
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <span className="text-3xl font-bold">{completionData.completionRate}%</span>
//                   </div>
//                   <svg className="h-full w-full" viewBox="0 0 100 100">
//                     <circle
//                       className="text-gray-200 stroke-current"
//                       strokeWidth="10"
//                       cx="50"
//                       cy="50"
//                       r="40"
//                       fill="transparent"
//                     />
//                     <circle
//                       className="text-green-500 stroke-current"
//                       strokeWidth="10"
//                       strokeLinecap="round"
//                       cx="50"
//                       cy="50"
//                       r="40"
//                       fill="transparent"
//                       strokeDasharray={`${completionData.completionRate * 2.51} 251`}
//                       strokeDashoffset="0"
//                       transform="rotate(-90 50 50)"
//                     />
//                   </svg>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
          
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">
//                 {getDepartmentDisplayName(selectedDepartment as DepartmentCode, t)} {t?.team?.progressRate || '부서 진행률'}
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="flex items-center justify-center">
//                 <div className="relative h-40 w-40">
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <span className="text-3xl font-bold">{progressData.progressRate}%</span>
//                   </div>
//                   <svg className="h-full w-full" viewBox="0 0 100 100">
//                     <circle
//                       className="text-gray-200 stroke-current"
//                       strokeWidth="10"
//                       cx="50"
//                       cy="50"
//                       r="40"
//                       fill="transparent"
//                     />
//                     <circle
//                       className="text-yellow-400 stroke-current"
//                       strokeWidth="10"
//                       strokeLinecap="round"
//                       cx="50"
//                       cy="50"
//                       r="40"
//                       fill="transparent"
//                       strokeDasharray={`${progressData.progressRate * 2.51} 251`}
//                       strokeDashoffset="0"
//                       transform="rotate(-90 50 50)"
//                     />
//                   </svg>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TeamByDepartment;
