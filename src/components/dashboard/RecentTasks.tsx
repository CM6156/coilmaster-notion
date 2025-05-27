import { useAppContext } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { Task } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { TaskCard } from "./tasks/TaskCard";
import { EmptyTasksMessage } from "./tasks/EmptyTasksMessage";

export function RecentTasks() {
  const { tasks, users, managers } = useAppContext();
  const { translations } = useLanguage();
  const t = translations.dashboard;
  const navigate = useNavigate();

  console.log('RecentTasks 데이터 확인:', {
    tasksCount: tasks.length,
    usersCount: users.length,
    managersCount: managers.length
  });

  // Sort tasks by most recently created first
  const sortedTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((task) => !task.parentTaskId) // Filter out subtasks for the main task list
    .slice(0, 5);

  // Get all subtasks
  const subtasks = tasks.filter((task) => task.parentTaskId);

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t?.recentTasks || "최근 등록된 업무"}
        </CardTitle>
        <CardDescription>
          {t?.todaysTasks || "최근 생성된 업무"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {sortedTasks.length > 0 ? (
          <div className="divide-y">
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                users={users}
                onClick={() => handleTaskClick(task.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyTasksMessage />
        )}
      </CardContent>
    </Card>
  );
}

export default RecentTasks;
