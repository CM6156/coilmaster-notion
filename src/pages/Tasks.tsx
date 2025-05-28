import { useAppContext } from "@/context/AppContext";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Plus,
  User,
  Calendar,
  Flag,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Download,
  Settings
} from "lucide-react";
import { Task } from "@/types";
import { supabase } from "@/lib/supabase";
import { format, isValid, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

const Tasks = () => {
  const { 
    tasks, 
    users, 
    managers, 
    departments, 
    employees,
    projects,
    addTask,
    updateTask,
    currentUser 
  } = useAppContext();
  
  const { translations } = useLanguage();
  
  // State
  const [taskPhases, setTaskPhases] = useState<any[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newTaskData, setNewTaskData] = useState<Partial<Task>>({});

  // Load task phases
  const loadTaskPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('task_phases')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setTaskPhases(data || []);
    } catch (error) {
      console.error('업무 단계 로드 오류:', error);
    }
  };

  useEffect(() => {
    loadTaskPhases();
  }, []);

  // Helper functions
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return dateString;
      return format(date, 'yyyy-MM-dd', { locale: ko });
    } catch (error) {
      return dateString;
    }
  };

  const getTaskPhaseInfo = (phaseId?: string) => {
    if (!phaseId) {
      return { name: '단계 미지정', color: '#6b7280', order_index: 999 };
    }
    const phase = taskPhases.find(p => p.id === phaseId);
    return phase ? { name: phase.name, color: phase.color || '#3b82f6', order_index: phase.order_index || 999 } : { name: '단계 미지정', color: '#6b7280', order_index: 999 };
  };

  const getTaskStageNumber = (task: Task): string => {
    const phase = taskPhases.find(p => p.id === task.taskPhase);
    const stageNumber = phase?.order_index || 0;
    return String(stageNumber).padStart(2, '0');
  };

  const getAssigneeName = (assignedTo: string | undefined) => {
    if (!assignedTo) return "미지정";
    
    const user = users.find(user => user.id === assignedTo);
    if (user) return user.name;
    
    const employee = employees.find(emp => emp.id === assignedTo);
    if (employee) return employee.name;
    
    const manager = managers.find(mgr => mgr.id === assignedTo);
    if (manager) return manager.name;
    
    return assignedTo;
  };

  const getDepartmentName = (departmentId: string | undefined) => {
    if (!departmentId) return "-";
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.name : "-";
  };

  const getProjectName = (projectId: string | undefined) => {
    if (!projectId) return "-";
    const project = projects.find(proj => proj.id === projectId);
    return project ? project.name : "-";
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesAssignee = !assigneeFilter || task.assignedTo === assigneeFilter;
    
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  // Group tasks by parent/child relationship
  const rootTasks = filteredTasks.filter(task => !task.parentTaskId);
  const childTasksMap = filteredTasks.reduce((acc, task) => {
    if (task.parentTaskId) {
      if (!acc[task.parentTaskId]) acc[task.parentTaskId] = [];
      acc[task.parentTaskId].push(task);
    }
    return acc;
  }, {} as Record<string, Task[]>);

  // Sort tasks by stage
  const sortedRootTasks = rootTasks.sort((a, b) => {
    const phaseA = getTaskPhaseInfo(a.taskPhase);
    const phaseB = getTaskPhaseInfo(b.taskPhase);
    return phaseA.order_index - phaseB.order_index;
  });

  // Handle cell editing
  const handleCellClick = (taskId: string, field: string) => {
    setEditingCell({ taskId, field });
  };

  const handleCellUpdate = async (taskId: string, field: string, value: any) => {
    try {
      await updateTask(taskId, { [field]: value });
      setEditingCell(null);
    } catch (error) {
      console.error('업무 업데이트 오류:', error);
    }
  };

  // Handle task expansion
  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Handle adding new task
  const handleAddTask = async (parentTaskId?: string) => {
    const newTask: Partial<Task> = {
      title: "새 업무",
      description: "",
      status: "할 일",
      priority: "보통",
      progress: 0,
      projectId: "",
      assignedTo: currentUser?.id || "",
      parentTaskId: parentTaskId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await addTask(newTask as Task);
    } catch (error) {
      console.error('업무 추가 오류:', error);
    }
  };

  // Render editable cell
  const renderEditableCell = (task: Task, field: string, value: any, type: 'text' | 'select' | 'date' = 'text', options?: any[]) => {
    const isEditing = editingCell?.taskId === task.id && editingCell?.field === field;

    if (isEditing) {
      if (type === 'select') {
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleCellUpdate(task.id, field, newValue)}
            onOpenChange={(open) => !open && setEditingCell(null)}
          >
            <SelectTrigger className="h-8 border-0 shadow-none focus:ring-2 focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      } else if (type === 'date') {
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleCellUpdate(task.id, field, e.target.value)}
            onBlur={() => setEditingCell(null)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
            className="h-8 border-0 shadow-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        );
      } else {
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleCellUpdate(task.id, field, e.target.value)}
            onBlur={() => setEditingCell(null)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
            className="h-8 border-0 shadow-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        );
      }
    }

    return (
      <div
        className="min-h-[32px] px-2 py-1 cursor-pointer hover:bg-gray-50 rounded flex items-center"
        onClick={() => handleCellClick(task.id, field)}
      >
        {type === 'select' && field === 'status' && (
          <Badge variant="outline" className={cn(
            "text-xs",
            value === '완료' && "bg-green-100 text-green-800 border-green-300",
            value === '진행중' && "bg-blue-100 text-blue-800 border-blue-300",
            value === '검토중' && "bg-purple-100 text-purple-800 border-purple-300",
            value === '지연' && "bg-red-100 text-red-800 border-red-300",
            value === '보류' && "bg-yellow-100 text-yellow-800 border-yellow-300",
            value === '할 일' && "bg-gray-100 text-gray-800 border-gray-300"
          )}>
            {value}
          </Badge>
        )}
        {type === 'select' && field === 'priority' && (
          <Badge variant="outline" className={cn(
            "text-xs",
            value === '긴급' && "bg-red-100 text-red-800 border-red-300",
            value === '높음' && "bg-orange-100 text-orange-800 border-orange-300",
            value === '보통' && "bg-blue-100 text-blue-800 border-blue-300",
            value === '낮음' && "bg-gray-100 text-gray-800 border-gray-300"
          )}>
            <Flag className="h-3 w-3 mr-1" />
            {value}
          </Badge>
        )}
        {type === 'date' && formatDate(value)}
        {type === 'text' && (value || '-')}
      </div>
    );
  };

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">업무 관리</h1>
          <p className="text-gray-600 mt-1">전체 업무 목록 및 진행 상황</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleAddTask()}
          >
            <Plus className="h-4 w-4 mr-2" />
            새 업무
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="업무 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">모든 상태</SelectItem>
            <SelectItem value="할 일">할 일</SelectItem>
            <SelectItem value="진행중">진행중</SelectItem>
            <SelectItem value="검토중">검토중</SelectItem>
            <SelectItem value="완료">완료</SelectItem>
            <SelectItem value="지연">지연</SelectItem>
            <SelectItem value="보류">보류</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="담당자 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">모든 담당자</SelectItem>
            {[...users, ...employees, ...managers].map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  담당
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  부서
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  우선순위
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  프로젝트
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRootTasks.map((task) => {
                const phaseInfo = getTaskPhaseInfo(task.taskPhase);
                const hasChildren = childTasksMap[task.id]?.length > 0;
                const isExpanded = expandedTasks.has(task.id);
                
                return (
                  <>
                    {/* Parent Task Row */}
                    <tr key={task.id} className="hover:bg-gray-50">
                      {/* Expand/Collapse + Add Child Button */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {hasChildren && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTaskExpansion(task.id)}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddTask(task.id)}
                            className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      
                      {/* Stage */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {getTaskStageNumber(task)}.
                          </span>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: `${phaseInfo.color}20`,
                              borderColor: phaseInfo.color,
                              color: phaseInfo.color
                            }}
                          >
                            {phaseInfo.name}
                          </Badge>
                        </div>
                      </td>
                      
                      {/* Task Name */}
                      <td className="px-4 py-3">
                        {renderEditableCell(task, 'title', task.title, 'text')}
                      </td>
                      
                      {/* 담당 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderEditableCell(task, 'assignedTo', getAssigneeName(task.assignedTo), 'select', 
                          [...users, ...employees, ...managers].map(person => ({
                            value: person.id,
                            label: person.name
                          }))
                        )}
                      </td>
                      
                      {/* 부서 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderEditableCell(task, 'department', getDepartmentName(task.department), 'select',
                          departments.map(dept => ({
                            value: dept.id,
                            label: dept.name
                          }))
                        )}
                      </td>
                      
                      {/* Due Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderEditableCell(task, 'dueDate', task.dueDate, 'date')}
                      </td>
                      
                      {/* 상태 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderEditableCell(task, 'status', task.status, 'select', [
                          { value: '할 일', label: '할 일' },
                          { value: '진행중', label: '진행중' },
                          { value: '검토중', label: '검토중' },
                          { value: '완료', label: '완료' },
                          { value: '지연', label: '지연' },
                          { value: '보류', label: '보류' }
                        ])}
                      </td>
                      
                      {/* 우선순위 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderEditableCell(task, 'priority', task.priority, 'select', [
                          { value: '낮음', label: '낮음' },
                          { value: '보통', label: '보통' },
                          { value: '높음', label: '높음' },
                          { value: '긴급', label: '긴급' }
                        ])}
                      </td>
                      
                      {/* 프로젝트 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderEditableCell(task, 'projectId', getProjectName(task.projectId), 'select',
                          projects.map(project => ({
                            value: project.id,
                            label: project.name
                          }))
                        )}
                      </td>
                    </tr>
                    
                    {/* Child Tasks */}
                    {hasChildren && isExpanded && childTasksMap[task.id].map((childTask) => {
                      const childPhaseInfo = getTaskPhaseInfo(childTask.taskPhase);
                      
                      return (
                        <tr key={childTask.id} className="hover:bg-gray-50 bg-gray-25">
                          {/* Empty cell for indentation */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="ml-6">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddTask(task.id)}
                                className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          
                          {/* Stage */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2 ml-6">
                              <span className="text-sm font-medium text-gray-900">
                                {getTaskStageNumber(childTask)}.
                              </span>
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: `${childPhaseInfo.color}20`,
                                  borderColor: childPhaseInfo.color,
                                  color: childPhaseInfo.color
                                }}
                              >
                                {childPhaseInfo.name}
                              </Badge>
                            </div>
                          </td>
                          
                          {/* Other cells for child task - same structure as parent */}
                          <td className="px-4 py-3">
                            {renderEditableCell(childTask, 'title', childTask.title, 'text')}
                          </td>
                          
                          <td className="px-4 py-3 whitespace-nowrap">
                            {renderEditableCell(childTask, 'assignedTo', getAssigneeName(childTask.assignedTo), 'select', 
                              [...users, ...employees, ...managers].map(person => ({
                                value: person.id,
                                label: person.name
                              }))
                            )}
                          </td>
                          
                          <td className="px-4 py-3 whitespace-nowrap">
                            {renderEditableCell(childTask, 'department', getDepartmentName(childTask.department), 'select',
                              departments.map(dept => ({
                                value: dept.id,
                                label: dept.name
                              }))
                            )}
                          </td>
                          
                          <td className="px-4 py-3 whitespace-nowrap">
                            {renderEditableCell(childTask, 'dueDate', childTask.dueDate, 'date')}
                          </td>
                          
                          <td className="px-4 py-3 whitespace-nowrap">
                            {renderEditableCell(childTask, 'status', childTask.status, 'select', [
                              { value: '할 일', label: '할 일' },
                              { value: '진행중', label: '진행중' },
                              { value: '검토중', label: '검토중' },
                              { value: '완료', label: '완료' },
                              { value: '지연', label: '지연' },
                              { value: '보류', label: '보류' }
                            ])}
                          </td>
                          
                          <td className="px-4 py-3 whitespace-nowrap">
                            {renderEditableCell(childTask, 'priority', childTask.priority, 'select', [
                              { value: '낮음', label: '낮음' },
                              { value: '보통', label: '보통' },
                              { value: '높음', label: '높음' },
                              { value: '긴급', label: '긴급' }
                            ])}
                          </td>
                          
                          <td className="px-4 py-3 whitespace-nowrap">
                            {renderEditableCell(childTask, 'projectId', getProjectName(childTask.projectId), 'select',
                              projects.map(project => ({
                                value: project.id,
                                label: project.name
                              }))
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}
              
              {/* Empty state */}
              {sortedRootTasks.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <div className="text-lg font-medium mb-2">등록된 업무가 없습니다</div>
                    <p className="text-sm">새 업무를 추가해보세요.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tasks; 