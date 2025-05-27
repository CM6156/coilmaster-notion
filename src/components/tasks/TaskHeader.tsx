import { useState } from "react";
import { Button } from "@/components/ui/button";
import TaskCreateDialog from "./TaskCreateDialog";
import { useLanguage } from "@/context/LanguageContext";

const TaskHeader = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { translations } = useLanguage();
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">{translations.tasks?.title || "업무 관리"}</h1>
        <p className="text-slate-600">{translations.tasks?.subtitle || "전체 업무 목록 및 진행 상황"}</p>
      </div>
      <Button onClick={() => setIsCreateDialogOpen(true)}>+ {translations.tasks?.new || "새 업무"}</Button>
      
      {/* Task Create Dialog */}
      <TaskCreateDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen} 
      />
    </div>
  );
};

export default TaskHeader;
