import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { DepartmentCode } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface DepartmentChartProps {
  tasksByDepartmentData: {
    name: string;
    value: number;
    department: string;
  }[];
}

// Enhanced custom department colors for the chart with more vibrant colors
const chartDepartmentColors = {
  [DepartmentCode.SALES]: "#2563eb",             // blue-600 - 더 진한 파란색
  [DepartmentCode.DEVELOPMENT]: "#059669",       // emerald-600 - 더 진한 초록색
  [DepartmentCode.MANUFACTURING]: "#d97706",     // amber-600 - 더 진한 주황색
  [DepartmentCode.QUALITY]: "#7c3aed",           // violet-600 - 더 진한 보라색
  [DepartmentCode.FINANCE]: "#4f46e5",           // indigo-600 - 더 진한 인디고
  [DepartmentCode.ADMINISTRATION]: "#9333ea",    // purple-600 - 더 진한 퍼플
  [DepartmentCode.MANAGEMENT]: "#db2777",        // pink-600 - 더 진한 핑크
  [DepartmentCode.ENGINEERING]: "#0d9488",       // teal-600 - 더 진한 틸
  [DepartmentCode.RND]: "#7c3aed",               // violet-600 - 연구개발
  [DepartmentCode.PRODUCTION]: "#ea580c",        // orange-600 - 더 진한 오렌지
  [DepartmentCode.QA]: "#dc2626",                // red-600 - 빨간색
};

// 부서명으로도 색상 매핑 (한국어 부서명 지원)
const departmentNameColors: Record<string, string> = {
  '영업': '#2563eb',
  '개발': '#059669', 
  '제조': '#d97706',
  '품질': '#7c3aed',
  '재무': '#4f46e5',
  '구매/경리': '#4f46e5',
  '경리': '#4f46e5',
  '관리': '#9333ea',
  '경영': '#db2777',
  '엔지니어링': '#0d9488',
  '연구개발': '#7c3aed',
  '생산': '#ea580c',
  '품질관리': '#dc2626',
  'QA': '#dc2626',
  'sales': '#2563eb',
  'development': '#059669',
  'manufacturing': '#d97706',
  'quality': '#7c3aed',
  'finance': '#4f46e5',
  'administration': '#9333ea',
  'management': '#db2777',
  'engineering': '#0d9488',
  'rnd': '#7c3aed',
  'production': '#ea580c',
  'qa': '#dc2626'
};

// 기본 색상 팔레트 (fallback)
const fallbackColors = [
  '#2563eb', '#059669', '#d97706', '#7c3aed', '#4f46e5', 
  '#9333ea', '#db2777', '#0d9488', '#ea580c', '#dc2626'
];

// 색상을 가져오는 함수
const getColorForDepartment = (entry: any, index: number): string => {
  // 1. DepartmentCode로 매핑 시도
  if (chartDepartmentColors[entry.department as DepartmentCode]) {
    return chartDepartmentColors[entry.department as DepartmentCode];
  }
  
  // 2. 부서명(한국어/영어)으로 매핑 시도
  if (departmentNameColors[entry.department] || departmentNameColors[entry.name]) {
    return departmentNameColors[entry.department] || departmentNameColors[entry.name];
  }
  
  // 3. 기본 색상 팔레트 사용
  return fallbackColors[index % fallbackColors.length];
};

export const DepartmentPieChart: React.FC<DepartmentChartProps> = ({ tasksByDepartmentData }) => {
  const { translations } = useLanguage();
  const t = translations.dashboard;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{t?.tasksByDepartment || '부서별 업무'}</CardTitle>
      </CardHeader>
      <CardContent>
        {tasksByDepartmentData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tasksByDepartmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={85}
                  innerRadius={0}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => 
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {tasksByDepartmentData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getColorForDepartment(entry, index)}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value}개`, name]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
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