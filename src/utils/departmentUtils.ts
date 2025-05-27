import { DepartmentCode } from "@/types";

// Korean department names map
export const getDepartmentKoreanName = (department: DepartmentCode | string): string => {
  const departmentNames: Record<string, string> = {
    [DepartmentCode.SALES]: "영업부",
    [DepartmentCode.DEVELOPMENT]: "개발부",
    [DepartmentCode.MANUFACTURING]: "제조부",
    [DepartmentCode.QUALITY]: "품질부",
    [DepartmentCode.FINANCE]: "재무부",
    [DepartmentCode.ADMINISTRATION]: "관리부",
    [DepartmentCode.MANAGEMENT]: "경영부",
    [DepartmentCode.ENGINEERING]: "엔지니어링부",
    [DepartmentCode.RND]: "연구개발부",
    [DepartmentCode.PRODUCTION]: "생산부",
    [DepartmentCode.QA]: "품질관리부",
  };

  return departmentNames[department] || department;
};

// Department colors for styling
export const departmentColors: Record<string, string> = {
  [DepartmentCode.SALES]: "bg-blue-500",
  [DepartmentCode.DEVELOPMENT]: "bg-purple-500",
  [DepartmentCode.MANUFACTURING]: "bg-orange-500",
  [DepartmentCode.QUALITY]: "bg-green-500",
  [DepartmentCode.FINANCE]: "bg-pink-500",
  [DepartmentCode.ADMINISTRATION]: "bg-gray-500",
  [DepartmentCode.MANAGEMENT]: "bg-indigo-500",
  [DepartmentCode.ENGINEERING]: "bg-yellow-500",
  [DepartmentCode.RND]: "bg-cyan-500",
  [DepartmentCode.PRODUCTION]: "bg-amber-500",
  [DepartmentCode.QA]: "bg-lime-500",
};

// Department text colors for styling
export const departmentTextColors: Record<string, string> = {
  [DepartmentCode.SALES]: "text-blue-700",
  [DepartmentCode.DEVELOPMENT]: "text-purple-700",
  [DepartmentCode.MANUFACTURING]: "text-orange-700",
  [DepartmentCode.QUALITY]: "text-green-700",
  [DepartmentCode.FINANCE]: "text-pink-700",
  [DepartmentCode.ADMINISTRATION]: "text-gray-700",
  [DepartmentCode.MANAGEMENT]: "text-indigo-700",
  [DepartmentCode.ENGINEERING]: "text-yellow-700",
  [DepartmentCode.RND]: "text-cyan-700",
  [DepartmentCode.PRODUCTION]: "text-amber-700",
  [DepartmentCode.QA]: "text-lime-700",
};

// Function to get a status color
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'in-progress': return 'bg-blue-500';
    case 'delayed': return 'bg-red-500';
    case 'on-hold': return 'bg-amber-500';
    case 'not-started': return 'bg-gray-300';
    default: return 'bg-gray-300';
  }
};
