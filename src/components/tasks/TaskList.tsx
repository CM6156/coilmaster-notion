
import { Task } from "@/types";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
}

const TaskList = ({ tasks }: TaskListProps) => {
  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
      
      {tasks.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p>검색 조건에 맞는 업무가 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default TaskList;
