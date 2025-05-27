
import { Task } from '@/types';

// Function to get status color for project details
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'active':
    case 'in-progress':  
      return 'bg-blue-500';
    case 'delayed':
      return 'bg-red-500';
    case 'on-hold':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

// Helper functions for department names
export const getDepartmentKoreanName = (department: string) => {
  const departmentMap: Record<string, string> = {
    'sales': '영업',
    'development': '개발',
    'manufacturing': '제조',
    'quality': '품질',
    'finance': '재무',
    'administration': '관리',
    'management': '경영',
    'rnd': '연구개발',
    'engineering': '엔지니어링',
    'production': '생산',
    'qa': '품질관리'
  };
  
  return departmentMap[department] || department;
};
