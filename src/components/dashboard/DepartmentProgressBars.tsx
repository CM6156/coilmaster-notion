import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DepartmentCode } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface DepartmentProgressBarsProps {
  tasksByDepartmentData: {
    name: string;
    value: number;
    department: string;
  }[];
  totalTasks: number;
}

// Enhanced department colors for progress bars with more vibrant colors
const progressBarColors = {
  [DepartmentCode.SALES]: "bg-blue-600",
  [DepartmentCode.DEVELOPMENT]: "bg-emerald-600",
  [DepartmentCode.MANUFACTURING]: "bg-amber-600",
  [DepartmentCode.QUALITY]: "bg-violet-600",
  [DepartmentCode.FINANCE]: "bg-indigo-600",
  [DepartmentCode.ADMINISTRATION]: "bg-purple-600",
  [DepartmentCode.MANAGEMENT]: "bg-pink-600",
  [DepartmentCode.ENGINEERING]: "bg-teal-600",
  [DepartmentCode.RND]: "bg-violet-600",
  [DepartmentCode.PRODUCTION]: "bg-orange-600",
  [DepartmentCode.QA]: "bg-red-600",
};

// 부서명으로도 색상 매핑 (한국어 부서명 지원)
const departmentNameProgressColors: Record<string, string> = {
  '영업': 'bg-blue-600',
  '개발': 'bg-emerald-600',
  '제조': 'bg-amber-600',
  '품질': 'bg-violet-600',
  '재무': 'bg-indigo-600',
  '구매/경리': 'bg-indigo-600',
  '경리': 'bg-indigo-600',
  '관리': 'bg-purple-600',
  '경영': 'bg-pink-600',
  '엔지니어링': 'bg-teal-600',
  '연구개발': 'bg-violet-600',
  '생산': 'bg-orange-600',
  '품질관리': 'bg-red-600',
  'QA': 'bg-red-600',
  'sales': 'bg-blue-600',
  'development': 'bg-emerald-600',
  'manufacturing': 'bg-amber-600',
  'quality': 'bg-violet-600',
  'finance': 'bg-indigo-600',
  'administration': 'bg-purple-600',
  'management': 'bg-pink-600',
  'engineering': 'bg-teal-600',
  'rnd': 'bg-violet-600',
  'production': 'bg-orange-600',
  'qa': 'bg-red-600'
};

// 기본 색상 팔레트 (fallback)
const fallbackProgressColors = [
  'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-violet-600', 'bg-indigo-600',
  'bg-purple-600', 'bg-pink-600', 'bg-teal-600', 'bg-orange-600', 'bg-red-600'
];

// 색상을 가져오는 함수
const getProgressColorForDepartment = (entry: any, index: number): string => {
  // 1. DepartmentCode로 매핑 시도
  if (progressBarColors[entry.department as DepartmentCode]) {
    return progressBarColors[entry.department as DepartmentCode];
  }
  
  // 2. 부서명(한국어/영어)으로 매핑 시도
  if (departmentNameProgressColors[entry.department] || departmentNameProgressColors[entry.name]) {
    return departmentNameProgressColors[entry.department] || departmentNameProgressColors[entry.name];
  }
  
  // 3. 기본 색상 팔레트 사용
  return fallbackProgressColors[index % fallbackProgressColors.length];
};

export const DepartmentProgressBars: React.FC<DepartmentProgressBarsProps> = ({ 
  tasksByDepartmentData,
  totalTasks 
}) => {
  const { translations } = useLanguage();
  const t = translations.dashboard;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{t?.tasksByDepartment || '부서별 업무 진행률'}</CardTitle>
      </CardHeader>
      <CardContent>
        {tasksByDepartmentData.length > 0 ? (
          <div className="space-y-4">
            {tasksByDepartmentData.map((dept, index) => {
              const percentage = ((dept.value / totalTasks) * 100);
              const colorClass = getProgressColorForDepartment(dept, index);
              
              return (
                <div key={dept.department} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                      <span className="font-medium">{dept.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{dept.value}개</span>
                      <span className="font-semibold text-gray-900">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full ${colorClass} rounded-full transition-all duration-500 ease-out shadow-sm`}
                      style={{ 
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, currentColor 0%, currentColor 70%, rgba(255,255,255,0.2) 100%)`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            {t?.noTasks || '표시할 업무가 없습니다'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 