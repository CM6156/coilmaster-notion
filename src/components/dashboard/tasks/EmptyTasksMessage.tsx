
import { useLanguage } from "@/context/LanguageContext";

export function EmptyTasksMessage() {
  const { translations } = useLanguage();
  
  return (
    <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
      <p className="text-gray-500 mb-1">
        {translations.dashboard?.noTasks || "아직 업무가 없습니다."}
      </p>
      <p className="text-xs text-gray-400">
        {translations.tasks?.createFirst || "새 업무를 추가해보세요."}
      </p>
    </div>
  );
}
