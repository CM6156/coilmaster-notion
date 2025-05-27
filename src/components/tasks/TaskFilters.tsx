import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";
import { useAppContext } from "@/context/AppContext";

interface TaskFiltersProps {
  searchQuery: string;
  departmentFilter: string | null;
  statusFilter: string | null;
  setSearchQuery: (query: string) => void;
  setDepartmentFilter: (department: string | null) => void;
  setStatusFilter: (status: string | null) => void;
}

const TaskFilters = ({
  searchQuery,
  departmentFilter,
  statusFilter,
  setSearchQuery,
  setDepartmentFilter,
  setStatusFilter,
}: TaskFiltersProps) => {
  const { translations } = useLanguage();
  const { getTaskStatuses } = useAppContext();
  const t = translations.tasks;
  const globalT = translations.global;
  
  // 동적 상태 목록 가져오기
  const taskStatuses = getTaskStatuses();
  
  return (
    <Card className="mb-6">
      <div className="p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder={t?.searchPlaceholder || "업무명 또는 내용 검색..."}
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select 
            value={departmentFilter || 'all'} 
            onValueChange={(value) => setDepartmentFilter(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t?.allDepartments || "부서 전체"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t?.allDepartments || "부서 전체"}</SelectItem>
              <SelectItem value="sales">{globalT?.sales || "영업"}</SelectItem>
              <SelectItem value="development">{globalT?.development || "개발"}</SelectItem>
              <SelectItem value="manufacturing">{globalT?.manufacturing || "제조"}</SelectItem>
              <SelectItem value="quality">{globalT?.quality || "품질"}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={statusFilter || 'all'} 
            onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t?.allStatus || "상태 전체"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t?.allStatus || "상태 전체"}</SelectItem>
              {taskStatuses.map((status) => {
                // 번역된 상태명 가져오기
                const translatedName = status.translationKey && globalT?.[status.translationKey]
                  ? globalT[status.translationKey]
                  : status.name;
                
                return (
                  <SelectItem key={status.id} value={status.name}>
                    {translatedName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};

export default TaskFilters;
