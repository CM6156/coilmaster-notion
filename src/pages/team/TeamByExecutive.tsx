
// import { useState, useEffect } from 'react';
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, 
//   XAxis, YAxis, CartesianGrid, Tooltip, Legend
// } from 'recharts';
// import { User } from 'lucide-react';

// interface TeamMember {
//   id: string;
//   name: string;
//   position: string;
//   department: string;
//   tasksCompleted: number;
//   tasksTotal: number;
//   email: string;
// }

// const departmentColors: Record<string, string> = {
//   'development': '#3b82f6', // blue
//   'sales': '#ef4444',      // red
//   'marketing': '#10b981',   // green
//   'design': '#f59e0b',      // amber
//   'customer': '#8b5cf6',    // violet
//   'manufacturing': '#6366f1', // indigo
//   'quality': '#ec4899',    // pink
//   'finance': '#14b8a6',    // teal
//   'management': '#6b7280',  // gray
//   'administration': '#8b5cf6', // violet
// };

// interface ExecutiveStats {
//   name: string;
//   position: string;
//   completionRate: number;
//   teamSize: number;
//   departments: string[];
// }

// export default function TeamByExecutive() {
//   const [executives, setExecutives] = useState<ExecutiveStats[]>([]);
//   const [selectedExecutive, setSelectedExecutive] = useState<string | null>(null);
//   const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
//   const [departmentData, setDepartmentData] = useState<any[]>([]);

//   useEffect(() => {
//     // Fetch executives data from API or mock
//     const mockExecutives: ExecutiveStats[] = [
//       {
//         name: '이지원',
//         position: '이사',
//         completionRate: 78,
//         teamSize: 12,
//         departments: ['sales', 'marketing']
//       },
//       {
//         name: '김민수',
//         position: '부장',
//         completionRate: 82,
//         teamSize: 8,
//         departments: ['development', 'design']
//       },
//       {
//         name: '박서연',
//         position: '이사',
//         completionRate: 65,
//         teamSize: 15,
//         departments: ['manufacturing', 'quality', 'finance']
//       },
//       {
//         name: '최준호',
//         position: '부사장',
//         completionRate: 92,
//         teamSize: 24,
//         departments: ['management', 'administration']
//       }
//     ];
    
//     setExecutives(mockExecutives);
    
//     // If we have executives, select the first one by default
//     if (mockExecutives.length > 0 && !selectedExecutive) {
//       setSelectedExecutive(mockExecutives[0].name);
//     }
//   }, []);

//   useEffect(() => {
//     if (!selectedExecutive) return;
    
//     // Find the selected executive
//     const executive = executives.find(exec => exec.name === selectedExecutive);
//     if (!executive) return;
    
//     // Generate team members for the selected executive
//     const generateTeamMembers = () => {
//       const members: TeamMember[] = [];
      
//       // Create team members for each department
//       executive.departments.forEach(dept => {
//         // Number of team members in this department
//         const memberCount = Math.ceil(executive.teamSize / executive.departments.length);
        
//         for (let i = 0; i < memberCount; i++) {
//           const tasksTotal = Math.floor(Math.random() * 20) + 5;
//           const tasksCompleted = Math.floor(Math.random() * tasksTotal);
          
//           members.push({
//             id: `${dept}-${i}`,
//             name: getRandomName(),
//             position: getRandomPosition(dept),
//             department: dept,
//             tasksCompleted,
//             tasksTotal,
//             email: `${getRandomName().toLowerCase().replace(' ', '.')}@company.com`
//           });
//         }
//       });
      
//       return members;
//     };
    
//     // Generate department statistics
//     const generateDepartmentData = (members: TeamMember[]) => {
//       const deptStats: Record<string, { department: string, completed: number, total: number }> = {};
      
//       members.forEach(member => {
//         if (!deptStats[member.department]) {
//           deptStats[member.department] = {
//             department: member.department,
//             completed: 0,
//             total: 0
//           };
//         }
        
//         deptStats[member.department].completed += member.tasksCompleted;
//         deptStats[member.department].total += member.tasksTotal;
//       });
      
//       return Object.values(deptStats);
//     };
    
//     const members = generateTeamMembers();
//     setTeamMembers(members);
//     setDepartmentData(generateDepartmentData(members));
//   }, [selectedExecutive, executives]);

//   // Helper functions
//   const getRandomName = () => {
//     const firstNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
//     const middleNames = ['민', '서', '지', '현', '영', '준', '유', '태', '재', '도'];
//     const lastNames = ['수', '연', '원', '석', '우', '희', '진', '호', '빈', '아'];
    
//     return `${firstNames[Math.floor(Math.random() * firstNames.length)]}${middleNames[Math.floor(Math.random() * middleNames.length)]}${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
//   };
  
//   const getRandomPosition = (department: string) => {
//     if (department === 'development') {
//       const positions = ['개발자', '시니어 개발자', '프론트엔드 개발자', '백엔드 개발자', '풀스택 개발자'];
//       return positions[Math.floor(Math.random() * positions.length)];
//     } else if (department === 'sales') {
//       const positions = ['영업 담당자', '영업 관리자', '영업 사원', '영업 전문가'];
//       return positions[Math.floor(Math.random() * positions.length)];
//     } else if (department === 'manufacturing' || department === 'quality' || department === 'finance' || department === 'management' || department === 'administration') {
//       const positions = ['관리자', '사원', '전문가', '책임자', '팀장'];
//       return `${department} ${positions[Math.floor(Math.random() * positions.length)]}`;
//     } else {
//       const positions = ['사원', '전문가', '책임자', '팀장'];
//       return `${department} ${positions[Math.floor(Math.random() * positions.length)]}`;
//     }
//   };

//   return (
//     <div className="container mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-6">임원별 팀 구성 및 업무 현황</h1>
      
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//         {executives.map((executive) => (
//           <Card 
//             key={executive.name}
//             className={`cursor-pointer transition-all ${selectedExecutive === executive.name ? 'ring-2 ring-primary' : ''}`}
//             onClick={() => setSelectedExecutive(executive.name)}
//           >
//             <CardContent className="p-4 flex items-center">
//               <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
//                 <User className="h-5 w-5 text-primary" />
//               </div>
//               <div>
//                 <h3 className="font-medium">{executive.name}</h3>
//                 <p className="text-sm text-muted-foreground">{executive.position} • 팀원 {executive.teamSize}명</p>
//               </div>
//               <div className="ml-auto">
//                 <div className="text-right text-lg font-semibold">{executive.completionRate}%</div>
//                 <div className="text-xs text-muted-foreground">완료율</div>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
      
//       {selectedExecutive && (
//         <>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//             {/* Completion Rate Chart */}
//             <Card>
//               <CardContent className="p-4">
//                 <h3 className="font-semibold mb-4">부서별 업무 현황</h3>
//                 <div className="h-[300px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <PieChart>
//                       <Pie
//                         data={departmentData}
//                         cx="50%"
//                         cy="50%"
//                         outerRadius={80}
//                         fill="#8884d8"
//                         dataKey="total"
//                         label={({ department }) => department}
//                       >
//                         {departmentData.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={departmentColors[entry.department] || '#777'} />
//                         ))}
//                       </Pie>
//                       <Tooltip />
//                       <Legend />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </div>
//               </CardContent>
//             </Card>
            
//             {/* Department Progress Chart */}
//             <Card>
//               <CardContent className="p-4">
//                 <h3 className="font-semibold mb-4">부서별 진행률</h3>
//                 <div className="h-[300px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart
//                       data={departmentData.map(d => ({
//                         ...d,
//                         completionRate: Math.round((d.completed / d.total) * 100)
//                       }))}
//                       margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//                     >
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis dataKey="department" />
//                       <YAxis />
//                       <Tooltip />
//                       <Legend />
//                       <Bar dataKey="completionRate" name="완료율 (%)" fill="#3b82f6" />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
          
//           <Card>
//             <CardContent className="p-4">
//               <h3 className="font-semibold mb-4">팀원 목록</h3>
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr className="border-b">
//                       <th className="text-left pb-2">이름</th>
//                       <th className="text-left pb-2">직책</th>
//                       <th className="text-left pb-2">부서</th>
//                       <th className="text-left pb-2">이메일</th>
//                       <th className="text-right pb-2">업무 진행률</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {teamMembers.map((member) => (
//                       <tr key={member.id} className="border-b">
//                         <td className="py-3">{member.name}</td>
//                         <td>{member.position}</td>
//                         <td>{member.department}</td>
//                         <td>{member.email}</td>
//                         <td className="text-right">
//                           <div className="inline-flex items-center">
//                             <span className="mr-2">{Math.round((member.tasksCompleted / member.tasksTotal) * 100)}%</span>
//                             <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
//                               <div 
//                                 className="h-full bg-primary" 
//                                 style={{ width: `${Math.round((member.tasksCompleted / member.tasksTotal) * 100)}%` }}
//                               />
//                             </div>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>
//         </>
//       )}
//     </div>
//   );
// }
