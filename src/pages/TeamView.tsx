// import React, { useState, useEffect } from 'react';
// import { useAppContext } from '@/context/AppContext';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { useNavigate } from 'react-router-dom';
// import { User, DepartmentCode } from '@/types';
// import { useLanguage } from '@/context/LanguageContext';
// import { getDepartmentKoreanName } from '@/utils/departmentUtils';

// const TeamView: React.FC = () => {
//   const { users, tasks } = useAppContext();
//   const navigate = useNavigate();
//   const { translations, language } = useLanguage();
//   const t = translations;

//   const [departmentData, setDepartmentData] = useState<Record<DepartmentCode, {
//     users?: User[];
//     totalTasks?: number;
//     completionRate?: number;
//     progressRate?: number;
//   }>>({
//     [DepartmentCode.SALES]: {},
//     [DepartmentCode.DEVELOPMENT]: {},
//     [DepartmentCode.MANUFACTURING]: {},
//     [DepartmentCode.QUALITY]: {},
//     [DepartmentCode.FINANCE]: {},
//     [DepartmentCode.ADMINISTRATION]: {},
//     [DepartmentCode.MANAGEMENT]: {},
//     [DepartmentCode.ENGINEERING]: {},
//     [DepartmentCode.RND]: {},
//     [DepartmentCode.PRODUCTION]: {},
//     [DepartmentCode.QA]: {}
//   });

//   useEffect(() => {
//     // Process data on component mount
//     processDepartmentData();
//   }, [users, tasks]);

//   const processDepartmentData = () => {
//     // Create initial data structure with empty arrays for each department
//     const deptUsers: Record<DepartmentCode, User[]> = {
//       [DepartmentCode.SALES]: [],
//       [DepartmentCode.DEVELOPMENT]: [],
//       [DepartmentCode.MANUFACTURING]: [],
//       [DepartmentCode.QUALITY]: [],
//       [DepartmentCode.FINANCE]: [],
//       [DepartmentCode.ADMINISTRATION]: [],
//       [DepartmentCode.MANAGEMENT]: [],
//       [DepartmentCode.ENGINEERING]: [],
//       [DepartmentCode.RND]: [],
//       [DepartmentCode.PRODUCTION]: [],
//       [DepartmentCode.QA]: []
//     };

//     // Group users by department
//     users.forEach(user => {
//       if (user.department && user.department in deptUsers) {
//         deptUsers[user.department as DepartmentCode].push(user);
//       }
//     });

//     // Group tasks by department
//     const deptTasks: Record<DepartmentCode, any[]> = {
//       [DepartmentCode.SALES]: [],
//       [DepartmentCode.DEVELOPMENT]: [],
//       [DepartmentCode.MANUFACTURING]: [],
//       [DepartmentCode.QUALITY]: [],
//       [DepartmentCode.FINANCE]: [],
//       [DepartmentCode.ADMINISTRATION]: [],
//       [DepartmentCode.MANAGEMENT]: [],
//       [DepartmentCode.ENGINEERING]: [],
//       [DepartmentCode.RND]: [],
//       [DepartmentCode.PRODUCTION]: [],
//       [DepartmentCode.QA]: []
//     };

//     tasks.forEach(task => {
//       if (task.department in deptTasks) {
//         deptTasks[task.department].push(task);
//       }
//     });

//     // Process data for each department
//     const processedDeptData: Record<DepartmentCode, {
//       users: User[];
//       totalTasks: number;
//       completionRate: number;
//       progressRate: number;
//     }> = {
//       [DepartmentCode.SALES]: { users: [], totalTasks: 0, completionRate: 0, progressRate: 0 },
//       [DepartmentCode.DEVELOPMENT]: { users: [], totalTasks: 0, completionRate: 0, progressRate: 0 },
//       [DepartmentCode.MANUFACTURING]: { users: [], totalTasks: 0, completionRate: 0, progressRate: 0 },
//       [DepartmentCode.QUALITY]: { users: [], totalTasks: 0, completionRate: 0, progressRate: 0 },
//       [DepartmentCode.FINANCE]: { users: [], totalTasks: 0, completionRate: 0, progressRate: 0 },
//       [DepartmentCode.ADMINISTRATION]: { users: [], totalTasks: 0, completionRate: 0, progressRate: 0 },
//       [DepartmentCode.MANAGEMENT]: { users: [], totalTasks: 0, completionRate: 0, progressRate: 0 },
//       [DepartmentCode.ENGINEERING]: { users: [], totalTasks: 0, completionRate: 0, progressRate: 0 },
//       [DepartmentCode.RND]: { users: [], totalTasks: 0, completionRate: 0, progressRate: 0 },
//       [DepartmentCode.PRODUCTION]: { users: [], totalTasks: 0, completionRate: 0, progressRate: 0 },
//       [DepartmentCode.QA]: { users: [], totalTasks: 0, completionRate: 0, progressRate: 0 }
//     };

//     for (const department in deptUsers) {
//       const dept = department as DepartmentCode;
//       const usersInDept = deptUsers[dept];
//       const tasksInDept = deptTasks[dept];

//       const totalTasks = tasksInDept.length;
//       const completedTasks = tasksInDept.filter(task => task.status === 'completed').length;
//       const progressSum = tasksInDept.reduce((sum, task) => sum + task.progress, 0);

//       const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
//       const progressRate = totalTasks > 0 ? progressSum / totalTasks : 0;

//       processedDeptData[dept] = {
//         users: usersInDept,
//         totalTasks: totalTasks,
//         completionRate: completionRate,
//         progressRate: progressRate,
//       };
//     }

//     setDepartmentData(processedDeptData);
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

//   const renderDepartmentCard = (department: DepartmentCode) => {
//     const deptData = departmentData[department];
//     const displayName = getDepartmentKoreanName(department);

//     if (!deptData) {
//       return (
//         <Card key={department}>
//           <CardHeader className="py-2">
//             <CardTitle>{displayName}</CardTitle>
//           </CardHeader>
//           <CardContent className="py-2">{t?.reports?.noData || '데이터가 없습니다'}</CardContent>
//         </Card>
//       );
//     }

//     return (
//       <Card key={department}>
//         <CardHeader className="py-2">
//           <CardTitle>{displayName}</CardTitle>
//         </CardHeader>
//         <CardContent className="py-2">
//           <p>{t?.team?.staffCount || '전체 인원'}: {deptData.users ? deptData.users.length : 0}</p>
//           <div className="mt-2 space-y-2">
//             <div>
//               <div className="flex justify-between text-sm mb-1">
//                 <span>{t?.team?.completionRate || '완료율'}</span>
//                 <span>{deptData.completionRate ? deptData.completionRate.toFixed(2) : 0}%</span>
//               </div>
//               <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
//                 <div className="h-full bg-green-500 rounded-full" style={{ width: `${deptData.completionRate || 0}%` }} />
//               </div>
//             </div>
//             <div>
//               <div className="flex justify-between text-sm mb-1">
//                 <span>{t?.team?.progressRate || '진행률'}</span>
//                 <span>{deptData.progressRate ? deptData.progressRate.toFixed(2) : 0}%</span>
//               </div>
//               <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
//                 <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${deptData.progressRate || 0}%` }} />
//               </div>
//             </div>
//           </div>
//           <Button onClick={() => navigate(`/team/department?dept=${department}`)} className="mt-2 text-sm">
//             {t?.team?.viewDetails || '상세 정보 보기'}
//           </Button>
//         </CardContent>
//       </Card>
//     );
//   };

//   return (
//     <div>
//       <div className="mb-3">
//         <h1 className="text-2xl font-bold">{t?.team?.title || '팀 현황'}</h1>
//         <p className="text-slate-600">{t?.team?.subTitle || '부서별 팀 현황'}</p>
//       </div>
//       <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
//         {renderDepartmentCard(DepartmentCode.SALES)}
//         {renderDepartmentCard(DepartmentCode.DEVELOPMENT)}
//         {renderDepartmentCard(DepartmentCode.MANUFACTURING)}
//         {renderDepartmentCard(DepartmentCode.QUALITY)}
//         {renderDepartmentCard(DepartmentCode.FINANCE)}
//         {renderDepartmentCard(DepartmentCode.ADMINISTRATION)}
//         {renderDepartmentCard(DepartmentCode.MANAGEMENT)}
//         {renderDepartmentCard(DepartmentCode.ENGINEERING)}
//         {renderDepartmentCard(DepartmentCode.RND)}
//         {renderDepartmentCard(DepartmentCode.PRODUCTION)}
//         {renderDepartmentCard(DepartmentCode.QA)}
//       </div>
//     </div>
//   );
// };

// export default TeamView;
