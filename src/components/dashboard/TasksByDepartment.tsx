import { useAppContext } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { DepartmentPieChart } from "./DepartmentPieChart";
import { DepartmentProgressBars } from "./DepartmentProgressBars";
import { DepartmentCode } from "@/types";
import { getDepartmentKoreanName } from "@/utils/departmentUtils";

const TasksByDepartment = () => {
  const { tasks, departments } = useAppContext();
  const { translations } = useLanguage();
  const t = translations.dashboard;
  
  // Check if tasks is not an array or is undefined, and provide a fallback
  const taskList = Array.isArray(tasks) ? tasks : [];
  const departmentList = Array.isArray(departments) ? departments : [];
  
  console.log("TasksByDepartment - 전체 업무 목록:", taskList);
  console.log("TasksByDepartment - 부서 목록:", departmentList);
  
  // 부서 ID로 부서명 찾기 함수
  const getDepartmentNameById = (departmentId: string): string => {
    if (!departmentId) return '미분류';
    
    // departments 배열에서 ID로 부서 찾기
    const department = departmentList.find(dept => dept.id === departmentId);
    if (department) {
      // 부서명이 있으면 그대로 반환, 코드만 있으면 한국어로 변환
      return department.name || getDepartmentKoreanName(department.code) || '미분류';
    }
    
    // UUID 형태이면 기본값 반환, 문자열 코드면 변환 시도
    if (departmentId.includes('-')) {
      return '미분류';
    }
    
    return getDepartmentKoreanName(departmentId as DepartmentCode) || departmentId;
  };
  
  // Create a map of department to task count with enhanced department mapping
  const departmentCounts = taskList.reduce((acc, task) => {
    // 다양한 형태의 부서 정보 처리
    let deptKey: string;
    let deptName: string;
    
    if (typeof task.department === 'string') {
      deptKey = task.department;
      deptName = getDepartmentNameById(task.department);
    } else if (task.department && typeof task.department === 'object') {
      // 부서가 객체인 경우 (예: {id, code, name})
      const dept = task.department as any;
      deptKey = dept.id || dept.code || 'unknown';
      deptName = dept.name || getDepartmentNameById(deptKey);
    } else {
      deptKey = 'unknown';
      deptName = '미분류';
    }
    
    console.log(`업무 "${task.title}" - 부서 ID: ${deptKey} → 부서명: ${deptName}`);
    
    if (!acc[deptKey]) {
      acc[deptKey] = {
        count: 0,
        name: deptName,
        department: deptKey
      };
    }
    acc[deptKey].count++;
    return acc;
  }, {} as Record<string, { count: number; name: string; department: string }>);
  
  console.log("부서별 집계 결과:", departmentCounts);
  
  // Convert the map to an array for the chart
  const data = Object.values(departmentCounts)
    .filter(dept => dept.count > 0) // 업무가 있는 부서만 포함
    .map(dept => ({
      name: dept.name,
      value: dept.count,
      department: dept.department,
    }));
  
  // Sort by count descending
  data.sort((a, b) => b.value - a.value);
  
  console.log("차트 데이터:", data);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {t?.tasksByDepartment || '부서별 업무 현황'}
        </h2>
        <div className="text-sm text-gray-500">
          총 {taskList.length}개 업무
        </div>
      </div>
      
      {data.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DepartmentPieChart tasksByDepartmentData={data} />
          <DepartmentProgressBars 
            tasksByDepartmentData={data} 
            totalTasks={taskList.length} 
          />
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">부서별 업무 데이터가 없습니다</p>
          <p className="text-sm">업무를 생성하면 여기에 표시됩니다</p>
        </div>
      )}
    </div>
  );
};

export default TasksByDepartment;
