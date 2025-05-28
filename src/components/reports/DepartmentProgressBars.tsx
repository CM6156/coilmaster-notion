
import React from "react";
import { cn } from "@/lib/utils";
import { Department } from "@/types";

interface DepartmentProgressBarsProps {
  tasksByDepartmentData: {
    name: string;
    value: number;
    department: string;
  }[];
  totalTasks: number;
}

// Enhanced department colors for progress bars
const progressBarColors: Record<string, string> = {
  "sales": "bg-blue-500",             
  "development": "bg-emerald-500",       
  "manufacturing": "bg-amber-500",     
  "quality": "bg-violet-500",           
  "finance": "bg-indigo-500",           
  "administration": "bg-purple-500",    
  "management": "bg-pink-500",        
  "engineering": "bg-teal-500",       
  "rnd": "bg-violet-500",               
  "production": "bg-orange-500",        
  "qa": "bg-pink-500",                
};

export function DepartmentProgressBars({ tasksByDepartmentData, totalTasks }: DepartmentProgressBarsProps) {
  return (
    <div className="space-y-4">
      {tasksByDepartmentData.map((item) => (
        <div key={item.department} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className={cn("w-3 h-3 rounded-full mr-2", 
                  progressBarColors[item.department] || "bg-gray-400")} 
              />
              <span className="text-gray-900 dark:text-gray-100">{item.name}</span>
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">{item.value}개</span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full", 
                progressBarColors[item.department] || "bg-gray-400")} 
              style={{ 
                width: `${(item.value / totalTasks) * 100}%` 
              }} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}
