import { Department, Task } from "@/types";
import { getDepartmentKoreanName } from "@/utils/departmentUtils";

export function getProjectProgressData(projects: any[]) {
  return projects.map(project => ({
    name: project.name,
    progress: project.progress,
  }));
}

export function getTasksByDepartmentData(tasks: Task[]) {
  const departmentCounts: Record<string, number> = {
    sales: 0,
    development: 0,
    manufacturing: 0,
    quality: 0,
    finance: 0,
    administration: 0,
    management: 0,
    engineering: 0,
    rnd: 0,
    production: 0,
    qa: 0,
  };
  
  tasks.forEach(task => {
    if (departmentCounts.hasOwnProperty(task.department)) {
      departmentCounts[task.department]++;
    }
  });
  
  return Object.entries(departmentCounts)
    .filter(([_, count]) => count > 0) // Only include departments with tasks
    .map(([department, count]) => ({
      name: getDepartmentKoreanName(department as Department),
      value: count,
      department,
    }));
}

export function getTasksByStatusData(tasks: Task[]) {
  const statusCounts = {
    "대기중": 0,
    "진행중": 0,
    "완료": 0, 
    "지연": 0
  };
  
  tasks.forEach(task => {
    if (task.status === "not-started") statusCounts["대기중"]++;
    else if (task.status === "in-progress") statusCounts["진행중"]++;
    else if (task.status === "completed") statusCounts["완료"]++;
    else if (task.status === "delayed") statusCounts["지연"]++;
  });
  
  return Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count
  }));
}
