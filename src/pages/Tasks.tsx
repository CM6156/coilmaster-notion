import { useAppContext } from "@/context/AppContext";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useParams, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Settings,
  Check,
  X,
  Paperclip,
  Link,
  Upload,
  File,
  ExternalLink,
  Image,
  FileText,
  Trash2
} from "lucide-react";
import { Task } from "@/types";
import { supabase } from "@/lib/supabase";
import { format, isValid, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import React from "react";

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
  const { id: projectId } = useParams<{ id: string }>();
  const location = useLocation();
  
  // State
  const [taskPhases, setTaskPhases] = useState<any[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [isAddingNewTask, setIsAddingNewTask] = useState(false);
  const [newTaskData, setNewTaskData] = useState<Partial<Task>>({});
  const [taskFiles, setTaskFiles] = useState<Record<string, { files: any[], links: string[] }>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [fileDialogOpen, setFileDialogOpen] = useState<string | null>(null);
  const [newLink, setNewLink] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Get current project info from URL or context
  const getCurrentProject = () => {
    // Try to get project from URL params first
    if (projectId) {
      return projects.find(p => p.id === projectId);
    }
    
    // Try to get project from location state
    if (location.state?.projectId) {
      return projects.find(p => p.id === location.state.projectId);
    }
    
    // If no specific project, return null (showing all tasks)
    return null;
  };

  const currentProject = getCurrentProject();

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

  // Load task files and links
  const loadTaskFilesAndLinks = async () => {
    try {
      const { data: filesData, error: filesError } = await supabase
        .from('task_files')
        .select('*');

      const { data: linksData, error: linksError } = await supabase
        .from('task_links')
        .select('*');

      if (filesError) throw filesError;
      if (linksError) throw linksError;

      // Group files and links by task_id
      const taskFilesMap: Record<string, { files: any[], links: any[] }> = {};
      
      filesData?.forEach(file => {
        if (!taskFilesMap[file.task_id]) {
          taskFilesMap[file.task_id] = { files: [], links: [] };
        }
        taskFilesMap[file.task_id].files.push({
          id: file.id,
          name: file.file_name,
          size: file.file_size,
          type: file.file_type,
          url: file.file_url,
          isImage: file.is_image
        });
      });

      linksData?.forEach(link => {
        if (!taskFilesMap[link.task_id]) {
          taskFilesMap[link.task_id] = { files: [], links: [] };
        }
        taskFilesMap[link.task_id].links.push(link.url);
      });

      setTaskFiles(taskFilesMap);
    } catch (error) {
      console.error('파일 및 링크 로드 오류:', error);
    }
  };

  useEffect(() => {
    loadTaskPhases();
    loadTaskFilesAndLinks();
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
    
    const matchesStatus = !statusFilter || statusFilter === "all" || task.status === statusFilter;
    const matchesAssignee = !assigneeFilter || assigneeFilter === "all" || task.assignedTo === assigneeFilter;
    
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
    if (isAddingNewTask) {
      // If already adding a task, save the current one first
      await handleSaveNewTask();
    }
    
    // Get the next stage number
    const getNextStageNumber = () => {
      if (parentTaskId) {
        // For child tasks, use the same stage as parent
        const parentTask = tasks.find(t => t.id === parentTaskId);
        return parentTask?.taskPhase || taskPhases[0]?.id;
      } else {
        // For root tasks, find the highest stage number and increment
        const maxStageOrder = Math.max(
          ...tasks
            .filter(t => !t.parentTaskId)
            .map(t => {
              const phase = taskPhases.find(p => p.id === t.taskPhase);
              return phase?.order_index || 0;
            }),
          0
        );
        
        // Find the phase with the next order index
        const nextPhase = taskPhases.find(p => p.order_index === maxStageOrder + 1);
        return nextPhase?.id || taskPhases[0]?.id;
      }
    };

    // Generate temporary ID for new task
    const tempId = `temp-${Date.now()}`;

    // Initialize new task data with defaults including current project
    const defaultTaskData: Partial<Task> = {
      id: tempId,
      title: parentTaskId ? "새 하위 업무" : "새 업무",
      description: "",
      status: "할 일",
      priority: "보통",
      progress: 0,
      projectId: currentProject?.id || "",
      assignedTo: currentUser?.id || "",
      department: currentUser?.department || "",
      parentTaskId: parentTaskId,
      taskPhase: getNextStageNumber(),
      dueDate: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNewTaskData(defaultTaskData);
    setIsAddingNewTask(true);
  };

  // Handle saving new task
  const handleSaveNewTask = async () => {
    if (!newTaskData.title || newTaskData.title.trim() === "" || newTaskData.title === "새 업무" || newTaskData.title === "새 하위 업무") {
      setIsAddingNewTask(false);
      setNewTaskData({});
      return;
    }

    try {
      await addTask(newTaskData as Task);
      setIsAddingNewTask(false);
      setNewTaskData({});
    } catch (error) {
      console.error('업무 추가 오류:', error);
    }
  };

  // Handle canceling new task
  const handleCancelNewTask = () => {
    setIsAddingNewTask(false);
    setNewTaskData({});
  };

  // Handle new task field update
  const handleNewTaskUpdate = (field: string, value: any) => {
    setNewTaskData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle multiple file upload
  const handleMultipleFileUpload = async (taskId: string, files: FileList) => {
    const uploadingSet = new Set(uploadingFiles);
    uploadingSet.add(taskId);
    setUploadingFiles(uploadingSet);

    try {
      for (const file of Array.from(files)) {
        // Create a temporary URL for immediate display
        const tempUrl = URL.createObjectURL(file);
        
        // Save file info to database
        const { data, error } = await supabase
          .from('task_files')
          .insert({
            task_id: taskId,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            file_url: tempUrl, // In production, upload to storage first
            is_image: file.type.startsWith('image/'),
            uploaded_by: currentUser?.id
          })
          .select()
          .single();

        if (error) throw error;

        // Update local state
        const fileData = {
          id: data.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: tempUrl,
          isImage: file.type.startsWith('image/')
        };

        setTaskFiles(prev => ({
          ...prev,
          [taskId]: {
            files: [...(prev[taskId]?.files || []), fileData],
            links: prev[taskId]?.links || []
          }
        }));
      }
    } catch (error) {
      console.error('파일 업로드 오류:', error);
    } finally {
      const uploadingSet = new Set(uploadingFiles);
      uploadingSet.delete(taskId);
      setUploadingFiles(uploadingSet);
    }
  };

  // Handle file removal
  const handleRemoveFile = async (taskId: string, fileId: string) => {
    try {
      const { error } = await supabase
        .from('task_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      setTaskFiles(prev => ({
        ...prev,
        [taskId]: {
          files: prev[taskId]?.files.filter(f => f.id !== fileId) || [],
          links: prev[taskId]?.links || []
        }
      }));
    } catch (error) {
      console.error('파일 삭제 오류:', error);
    }
  };

  // Handle link addition
  const handleAddLink = async (taskId: string, link: string) => {
    if (!link.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('task_links')
        .insert({
          task_id: taskId,
          url: link.trim(),
          created_by: currentUser?.id
        })
        .select()
        .single();

      if (error) throw error;

      setTaskFiles(prev => ({
        ...prev,
        [taskId]: {
          files: prev[taskId]?.files || [],
          links: [...(prev[taskId]?.links || []), link.trim()]
        }
      }));
    } catch (error) {
      console.error('링크 추가 오류:', error);
    }
  };

  // Handle link removal
  const handleRemoveLink = async (taskId: string, linkIndex: number) => {
    try {
      const links = taskFiles[taskId]?.links || [];
      const linkToRemove = links[linkIndex];
      
      const { error } = await supabase
        .from('task_links')
        .delete()
        .eq('task_id', taskId)
        .eq('url', linkToRemove);

      if (error) throw error;

      setTaskFiles(prev => ({
        ...prev,
        [taskId]: {
          files: prev[taskId]?.files || [],
          links: prev[taskId]?.links.filter((_, index) => index !== linkIndex) || []
        }
      }));
    } catch (error) {
      console.error('링크 삭제 오류:', error);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    setDeletingTaskId(taskId);
    try {
      // Delete associated files and links first
      await supabase.from('task_files').delete().eq('task_id', taskId);
      await supabase.from('task_links').delete().eq('task_id', taskId);
      
      // Delete child tasks first (if any)
      const childTasks = tasks.filter(t => t.parentTaskId === taskId);
      for (const childTask of childTasks) {
        await handleDeleteTask(childTask.id);
      }
      
      // Delete the task from database
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // Update local state by removing the task from context
      // This will trigger a re-render
      window.location.reload(); // Simple refresh for now
      
    } catch (error) {
      console.error('업무 삭제 오류:', error);
      alert('업무 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingTaskId(null);
      setDeleteDialogOpen(null);
    }
  };

  // Confirm delete dialog
  const confirmDelete = (taskId: string) => {
    setDeleteDialogOpen(taskId);
  };

  // Get file icon based on type
  const getFileIcon = (file: any) => {
    if (file.isImage) return <Image className="h-4 w-4 text-blue-500" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render editable cell
  const renderEditableCell = (task: Task, field: string, value: any, type: 'text' | 'select' | 'date' = 'text', options?: any[]) => {
    const isEditing = editingCell?.taskId === task.id && editingCell?.field === field;

    if (isEditing) {
      if (type === 'select') {
        // For select fields, use the actual ID value, not the display name
        const actualValue = field === 'assignedTo' ? task.assignedTo : 
                           field === 'department' ? task.department :
                           field === 'projectId' ? task.projectId : value;
        
        return (
          <Select
            value={actualValue || ''}
            onValueChange={(newValue) => handleCellUpdate(task.id, field, newValue)}
            onOpenChange={(open) => !open && setEditingCell(null)}
          >
            <SelectTrigger className="h-8 border-0 shadow-none focus:ring-2 focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options?.filter(option => option.value !== '').map((option) => (
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
            value={(task[field as keyof Task] as string) || ''}
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
            value={(task[field as keyof Task] as string) || ''}
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
        {type === 'select' && field !== 'status' && (
          <span className="text-sm">{value}</span>
        )}
        {type === 'date' && formatDate(value)}
        {type === 'text' && (
          <span className="text-sm">{value || '-'}</span>
        )}
      </div>
    );
  };

  // Render file and link cell
  const renderFileAndLinkCell = (taskId: string) => {
    const taskData = taskFiles[taskId] || { files: [], links: [] };
    const totalItems = taskData.files.length + taskData.links.length;

    return (
      <div className="flex items-center gap-2">
        {totalItems > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded px-2 py-1">
                <Paperclip className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600">{totalItems}</span>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>첨부된 파일 및 링크</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Files */}
                {taskData.files.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">파일 ({taskData.files.length})</h4>
                    <div className="space-y-2">
                      {taskData.files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            {getFileIcon(file)}
                            <div>
                              <div className="text-sm font-medium">{file.name}</div>
                              <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveFile(taskId, file.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links */}
                {taskData.links.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">링크 ({taskData.links.length})</h4>
                    <div className="space-y-2">
                      {taskData.links.map((link, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <Link className="h-4 w-4 text-blue-500" />
                            <div className="text-sm truncate max-w-48">{link}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => window.open(link, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveLink(taskId, index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        <Dialog open={fileDialogOpen === taskId} onOpenChange={(open) => setFileDialogOpen(open ? taskId : null)}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>파일 및 링크 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* File upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">파일 업로드</label>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        handleMultipleFileUpload(taskId, files);
                        setFileDialogOpen(null);
                      }
                    }}
                    multiple
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">파일을 선택하거나 드래그하세요</p>
                    <p className="text-xs text-gray-400 mt-1">여러 파일 선택 가능</p>
                  </div>
                </label>
              </div>

              {/* Link addition */}
              <div>
                <label className="text-sm font-medium mb-2 block">링크 추가</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="링크 URL을 입력하세요..."
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLink.trim()) {
                        handleAddLink(taskId, newLink);
                        setNewLink("");
                        setFileDialogOpen(null);
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      if (newLink.trim()) {
                        handleAddLink(taskId, newLink);
                        setNewLink("");
                        setFileDialogOpen(null);
                      }
                    }}
                    disabled={!newLink.trim()}
                  >
                    추가
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">업무 관리</h1>
          <p className="text-gray-600 mt-1">
            {currentProject 
              ? `${currentProject.name} 프로젝트의 업무 목록` 
              : "전체 업무 목록 및 진행 상황"
            }
          </p>
          {currentProject && (
            <div className="mt-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                📁 {currentProject.name}
              </Badge>
            </div>
          )}
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
            <SelectItem value="all">모든 상태</SelectItem>
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
            <SelectItem value="all">모든 담당자</SelectItem>
            {[...users, ...employees, ...managers].filter(person => person.id && person.name).map((person) => (
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  담당
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  부서
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  파일 & 링크
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  프로젝트
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRootTasks.map((task) => {
                const phaseInfo = getTaskPhaseInfo(task.taskPhase);
                const hasChildren = childTasksMap[task.id]?.length > 0;
                const isExpanded = expandedTasks.has(task.id);
                
                return (
                  <React.Fragment key={task.id}>
                    {/* Parent Task Row */}
                    <tr className="hover:bg-gray-50">
                      {/* Expand/Collapse + Add Child Button */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
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
                      <td className="px-3 py-2 whitespace-nowrap">
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
                      <td className="px-3 py-2">
                        {renderEditableCell(task, 'title', task.title, 'text')}
                      </td>
                      
                      {/* 담당 */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {renderEditableCell(task, 'assignedTo', getAssigneeName(task.assignedTo), 'select', 
                          [...users, ...employees, ...managers].filter(person => person.id && person.name).map(person => ({
                            value: person.id,
                            label: person.name
                          }))
                        )}
                      </td>
                      
                      {/* 부서 */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {renderEditableCell(task, 'department', getDepartmentName(task.department), 'select',
                          departments.filter(dept => dept.id && dept.name).map(dept => ({
                            value: dept.id,
                            label: dept.name
                          }))
                        )}
                      </td>
                      
                      {/* Due Date */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {renderEditableCell(task, 'dueDate', task.dueDate, 'date')}
                      </td>
                      
                      {/* 상태 */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {renderEditableCell(task, 'status', task.status, 'select', [
                          { value: '할 일', label: '할 일' },
                          { value: '진행중', label: '진행중' },
                          { value: '검토중', label: '검토중' },
                          { value: '완료', label: '완료' },
                          { value: '지연', label: '지연' },
                          { value: '보류', label: '보류' }
                        ])}
                      </td>
                      
                      {/* 파일 & 링크 */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {renderFileAndLinkCell(task.id)}
                      </td>
                      
                      {/* 프로젝트 */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {renderEditableCell(task, 'projectId', getProjectName(task.projectId), 'select',
                          projects.filter(project => project.id && project.name).map(project => ({
                            value: project.id,
                            label: project.name
                          }))
                        )}
                      </td>
                      
                      {/* Action */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(task.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Child Tasks */}
                    {hasChildren && isExpanded && childTasksMap[task.id].map((childTask) => {
                      const childPhaseInfo = getTaskPhaseInfo(childTask.taskPhase);
                      
                      return (
                        <tr key={childTask.id} className="hover:bg-gray-50 bg-blue-25">
                          {/* Empty cell for indentation */}
                          <td className="px-3 py-2 whitespace-nowrap">
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
                          <td className="px-3 py-2 whitespace-nowrap">
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
                          <td className="px-3 py-2">
                            {renderEditableCell(childTask, 'title', childTask.title, 'text')}
                          </td>
                          
                          <td className="px-3 py-2 whitespace-nowrap">
                            {renderEditableCell(childTask, 'assignedTo', getAssigneeName(childTask.assignedTo), 'select', 
                              [...users, ...employees, ...managers].filter(person => person.id && person.name).map(person => ({
                                value: person.id,
                                label: person.name
                              }))
                            )}
                          </td>
                          
                          <td className="px-3 py-2 whitespace-nowrap">
                            {renderEditableCell(childTask, 'department', getDepartmentName(childTask.department), 'select',
                              departments.filter(dept => dept.id && dept.name).map(dept => ({
                                value: dept.id,
                                label: dept.name
                              }))
                            )}
                          </td>
                          
                          <td className="px-3 py-2 whitespace-nowrap">
                            {renderEditableCell(childTask, 'dueDate', childTask.dueDate, 'date')}
                          </td>
                          
                          <td className="px-3 py-2 whitespace-nowrap">
                            {renderEditableCell(childTask, 'status', childTask.status, 'select', [
                              { value: '할 일', label: '할 일' },
                              { value: '진행중', label: '진행중' },
                              { value: '검토중', label: '검토중' },
                              { value: '완료', label: '완료' },
                              { value: '지연', label: '지연' },
                              { value: '보류', label: '보류' }
                            ])}
                          </td>
                          
                          <td className="px-3 py-2 whitespace-nowrap">
                            {renderFileAndLinkCell(childTask.id)}
                          </td>
                          
                          <td className="px-3 py-2 whitespace-nowrap">
                            {renderEditableCell(childTask, 'projectId', getProjectName(childTask.projectId), 'select',
                              projects.filter(project => project.id && project.name).map(project => ({
                                value: project.id,
                                label: project.name
                              }))
                            )}
                          </td>
                          
                          {/* Action */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(childTask.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              
              {/* Empty state */}
              {sortedRootTasks.length === 0 && !isAddingNewTask && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                    <div className="text-lg font-medium mb-2">등록된 업무가 없습니다</div>
                    <p className="text-sm">새 업무를 추가해보세요.</p>
                  </td>
                </tr>
              )}
              
              {/* New task creation row - Notion style */}
              {isAddingNewTask && (
                <tr className="bg-blue-50 border-l-4 border-blue-500">
                  {/* Save/Cancel buttons */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveNewTask}
                        className="h-6 w-6 p-0 text-green-600 hover:bg-green-50"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelNewTask}
                        className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  
                  {/* Stage */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {(() => {
                          const phase = taskPhases.find(p => p.id === newTaskData.taskPhase);
                          const stageNumber = phase?.order_index || 0;
                          return String(stageNumber).padStart(2, '0');
                        })()}.
                      </span>
                      <Select
                        value={newTaskData.taskPhase || ''}
                        onValueChange={(value) => handleNewTaskUpdate('taskPhase', value)}
                      >
                        <SelectTrigger className="h-8 border-0 shadow-none focus:ring-2 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taskPhases.map((phase) => (
                            <SelectItem key={phase.id} value={phase.id}>
                              {phase.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  
                  {/* Task Name */}
                  <td className="px-3 py-2">
                    <Input
                      value={newTaskData.title || ''}
                      onChange={(e) => handleNewTaskUpdate('title', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNewTask();
                        if (e.key === 'Escape') handleCancelNewTask();
                      }}
                      className="h-8 border-0 shadow-none focus:ring-2 focus:ring-blue-500"
                      placeholder="업무 제목을 입력하세요..."
                      autoFocus
                    />
                  </td>
                  
                  {/* 담당 */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Select
                      value={newTaskData.assignedTo || ''}
                      onValueChange={(value) => handleNewTaskUpdate('assignedTo', value)}
                    >
                      <SelectTrigger className="h-8 border-0 shadow-none focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="담당자 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...users, ...employees, ...managers].filter(person => person.id && person.name).map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  
                  {/* 부서 */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Select
                      value={newTaskData.department || ''}
                      onValueChange={(value) => handleNewTaskUpdate('department', value)}
                    >
                      <SelectTrigger className="h-8 border-0 shadow-none focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="부서 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.filter(dept => dept.id && dept.name).map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  
                  {/* Due Date */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Input
                      type="date"
                      value={newTaskData.dueDate || ''}
                      onChange={(e) => handleNewTaskUpdate('dueDate', e.target.value)}
                      className="h-8 border-0 shadow-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  
                  {/* 상태 */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Select
                      value={newTaskData.status || '할 일'}
                      onValueChange={(value) => handleNewTaskUpdate('status', value)}
                    >
                      <SelectTrigger className="h-8 border-0 shadow-none focus:ring-2 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="할 일">할 일</SelectItem>
                        <SelectItem value="진행중">진행중</SelectItem>
                        <SelectItem value="검토중">검토중</SelectItem>
                        <SelectItem value="완료">완료</SelectItem>
                        <SelectItem value="지연">지연</SelectItem>
                        <SelectItem value="보류">보류</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  
                  {/* 파일 & 링크 */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {/* File upload button */}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                              handleMultipleFileUpload(newTaskData.id, files);
                              setFileDialogOpen(null);
                            }
                          }}
                          multiple
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                          asChild
                        >
                          <span>
                            <Upload className="h-3 w-3" />
                          </span>
                        </Button>
                      </label>

                      {/* Add link button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                        onClick={() => {
                          const link = prompt('링크 URL을 입력하세요:');
                          if (link && newTaskData.id) handleAddLink(newTaskData.id, link);
                        }}
                      >
                        <Link className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  
                  {/* 프로젝트 */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Select
                      value={newTaskData.projectId || ''}
                      onValueChange={(value) => handleNewTaskUpdate('projectId', value)}
                    >
                      <SelectTrigger className="h-8 border-0 shadow-none focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder={currentProject ? currentProject.name : "프로젝트 선택"} />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.filter(project => project.id && project.name).map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen !== null} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">업무 삭제 확인</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">이 업무를 정말 삭제하시겠습니까?</p>
                <p className="text-sm text-gray-500 mt-1">
                  삭제된 업무는 복구할 수 없으며, 하위 업무와 첨부파일도 함께 삭제됩니다.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(null)}
                disabled={deletingTaskId !== null}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteDialogOpen && handleDeleteTask(deleteDialogOpen)}
                disabled={deletingTaskId !== null}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletingTaskId ? "삭제 중..." : "삭제"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks; 