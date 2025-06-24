import { useAppContext } from "@/context/AppContext";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Search,
  ChevronDown,
  ChevronUp,
  User,
  AlertCircle,
  CheckCircle,
  Paperclip,
  Link as LinkIcon,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Eye,
  Database,
  Check,
  X,
  Edit3
} from "lucide-react";
import { Task } from "@/types";
import { supabase } from "@/lib/supabase";
import { format, isValid, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Tasks = () => {
  const { 
    tasks, 
    users, 
    managers, 
    departments, 
    employees,
    projects,
    getProjectStatuses,
    updateTask
  } = useAppContext();
  
  const { translations } = useLanguage();
  const { toast } = useToast();
  
  // State - 읽기 전용이므로 편집 관련 상태 제거
  const [taskPhases, setTaskPhases] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<'stage' | 'title' | 'assignedTo' | 'dueDate' | 'status'>('stage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [taskAttachments, setTaskAttachments] = useState<{ [taskId: string]: any[] }>({});
  
  // 편집 관련 상태 추가
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null);
  const [editingValues, setEditingValues] = useState<{ [key: string]: any }>({});

  // 관리자 패널에서 설정한 프로젝트 상태 목록 가져오기
  const projectStatuses = getProjectStatuses();

  // 상태 색상 가져오기 함수
  const getStatusColor = (statusName: string) => {
    const status = projectStatuses.find(s => s.name === statusName);
    return status?.color || '#6b7280'; // 기본 회색
  };

  // 담당자 옵션 생성
  const assigneeOptions = [
    ...users.map(user => ({
      id: user.id,
      name: user.name,
      type: 'user'
    })),
    ...employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      type: 'employee'
    })),
    ...managers.map(mgr => ({
      id: mgr.id,
      name: mgr.name,
      type: 'manager'
    }))
  ].sort((a, b) => a.name.localeCompare(b.name));

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

  // 업무별 첨부 파일 로드
  const loadTaskAttachments = async () => {
    try {
      const taskIds = tasks.map(task => task.id);
      if (taskIds.length === 0) return;

      const { data, error } = await supabase
        .from('task_attachments')
        .select(`
          *,
          files:file_id (
            id,
            original_filename,
            filename,
            content_type,
            file_size,
            file_path
          )
        `)
        .in('task_id', taskIds);

      if (error) throw error;

      // 업무별로 첨부 파일 그룹화
      const attachmentsByTask: { [taskId: string]: any[] } = {};
      (data || []).forEach(attachment => {
        if (!attachmentsByTask[attachment.task_id]) {
          attachmentsByTask[attachment.task_id] = [];
        }
        attachmentsByTask[attachment.task_id].push(attachment);
      });

      setTaskAttachments(attachmentsByTask);
    } catch (error) {
      console.error('업무 첨부 파일 로드 오류:', error);
    }
  };

  useEffect(() => {
    loadTaskPhases();
    loadTaskAttachments();
  }, [tasks.length]);

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
      return { name: translations.tasks?.stageUnassigned || '단계 미지정', color: '#6b7280' };
    }
    
    const phase = taskPhases.find(p => p.id === phaseId);
    return phase ? { name: phase.name, color: phase.color || '#3b82f6' } : { name: translations.tasks?.stageUnassigned || '단계 미지정', color: '#6b7280' };
  };

  const getTaskStageNumber = (task: Task): string => {
    const phase = taskPhases.find(p => p.id === task.taskPhase);
    const stageNumber = phase?.order_index || 0;
    return String(stageNumber).padStart(2, '0');
  };

  const getAssigneeName = (assignedTo: string | undefined) => {
    if (!assignedTo) return translations.tasks?.unassigned || "미지정";
    
    const user = users.find(user => user.id === assignedTo);
    if (user) return user.name;
    
    const employee = employees.find(emp => emp.id === assignedTo);
    if (employee) return employee.name;
    
    const manager = managers.find(mgr => mgr.id === assignedTo);
    if (manager) return manager.name;
    
    return translations.tasks?.unassigned || "미지정";
  };

  const getDepartmentName = (departmentId: string | undefined) => {
    if (!departmentId) {
      return "-";
    }
    
    const department = departments.find(dept => dept.id === departmentId);
    if (department) {
      return department.name;
    }
    
    const deptByCode = departments.find(dept => dept.code === departmentId);
    if (deptByCode) {
      return deptByCode.name;
    }
    
    const deptByName = departments.find(dept => dept.name === departmentId);
    if (deptByName) {
      return deptByName.name;
    }
    
    const departmentNameMap: { [key: string]: string } = {
      'development': '개발',
      'marketing': '마케팅',
      'sales': '영업',
      'hr': '인사',
      'finance': '재무',
      'operations': '운영',
      'quality': '품질관리',
      'research': '연구개발',
      'design': '디자인',
      'management': '경영',
      'production': '생산',
      'support': '지원'
    };
    
    return departmentNameMap[departmentId] || departmentId;
  };

  const getProjectName = (projectId: string | undefined) => {
    if (!projectId) {
      return "-";
    }
    
    const project = projects.find(proj => proj.id === projectId);
    return project?.name || projectId;
  };

  // 필터링 및 정렬
  const filteredTasks = tasks.filter(task => {
    // 더미 데이터 제외 (ID가 'dummy-'로 시작하는 것들)
    if (task.id.startsWith('dummy-')) {
      return false;
    }
    
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProject = projectFilter === "all" || task.projectId === projectFilter;
    const matchesAssignee = assigneeFilter === "all" || task.assignedTo === assigneeFilter;
    
    return matchesSearch && matchesProject && matchesAssignee;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'stage':
        const stageA = getTaskStageNumber(a);
        const stageB = getTaskStageNumber(b);
        comparison = stageA.localeCompare(stageB);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'assignedTo':
        const assigneeA = getAssigneeName(a.assignedTo);
        const assigneeB = getAssigneeName(b.assignedTo);
        comparison = assigneeA.localeCompare(assigneeB);
        break;
      case 'dueDate':
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        comparison = dateA - dateB;
        break;
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const TaskAttachmentPreview = ({ taskId }: { taskId: string }) => {
    const attachments = taskAttachments[taskId] || [];
    
    if (attachments.length === 0) {
      return <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>;
    }

    return (
      <div className="flex items-center gap-1">
        {attachments.slice(0, 3).map((attachment, index) => {
          const file = attachment.files;
          if (!file) return null;

          const getFileIcon = (contentType: string) => {
            if (contentType?.startsWith('image/')) return <ImageIcon className="h-3 w-3" />;
            if (contentType?.includes('pdf')) return <FileText className="h-3 w-3" />;
            return <Paperclip className="h-3 w-3" />;
          };

    return (
            <div key={index} className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              {getFileIcon(file.content_type)}
            </div>
          );
        })}
        {attachments.length > 3 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">+{attachments.length - 3}</span>
        )}
      </div>
    );
  };

  // 편집 관련 함수들
  const handleCellClick = (taskId: string, field: string, currentValue: any) => {
    setEditingCell({ taskId, field });
    setEditingValues({ ...editingValues, [`${taskId}_${field}`]: currentValue });
  };

  const handleCellSave = async (taskId: string, field: string) => {
    const key = `${taskId}_${field}`;
    const newValue = editingValues[key];
    
    // 더미 데이터 체크
    if (taskId.startsWith('dummy-')) {
      toast({
        title: "수정 불가",
        description: "테스트 데이터는 수정할 수 없습니다.",
        variant: "destructive",
      });
      handleCellCancel();
      return;
    }
    
    // 필드별로 유효성 검사
    if (field === 'title' && (!newValue || newValue.trim() === '')) {
      toast({
        title: "입력 오류",
        description: "업무명을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (field === 'dueDate' && (!newValue || newValue === '')) {
      toast({
        title: "입력 오류",
        description: "마감일을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 업데이트할 데이터 준비
      let updateData: Partial<Task> = {};
      
      // 필드별로 적절한 데이터 타입으로 변환
      switch (field) {
        case 'title':
          updateData.title = newValue.trim();
          break;
        case 'assignedTo':
          updateData.assignedTo = newValue === '' ? null : newValue;
          break;
        case 'department':
          updateData.department = newValue === '' ? null : newValue;
          break;
        case 'dueDate':
          updateData.dueDate = newValue;
          break;
        case 'status':
          updateData.status = newValue;
          break;
        case 'projectId':
          updateData.projectId = newValue;
          break;
        default:
          updateData[field] = newValue;
      }

      console.log(`업무 ${taskId}의 ${field}를 ${newValue}로 업데이트`, updateData);

      // AppContext의 updateTask 함수 호출
      await updateTask(taskId, updateData);
      
      // 성공 메시지
      const fieldNames: { [key: string]: string } = {
        title: '업무명',
        assignedTo: '담당자',
        department: '부서',
        dueDate: '마감일',
        status: '상태',
        projectId: '프로젝트'
      };
      
      toast({
        title: "업무 업데이트 완료",
        description: `${fieldNames[field] || field}가 성공적으로 변경되었습니다.`,
        variant: "default",
      });

      // 편집 상태 종료
      setEditingCell(null);
      setEditingValues({});

    } catch (error: any) {
      console.error('업무 업데이트 오류:', error);
      
      let errorMessage = "업무 업데이트 중 오류가 발생했습니다.";
      if (error?.message?.includes('dummy') || error?.code === 'PGRST116') {
        errorMessage = "이 업무는 데이터베이스에 존재하지 않습니다.";
      }
      
      toast({
        title: "업데이트 실패",
        description: errorMessage,
        variant: "destructive",
      });
      
      // 에러 발생 시에도 편집 상태 종료
      handleCellCancel();
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValues({});
  };

  return (
    <div className="p-6 w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-600/10 dark:to-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 dark:from-cyan-600/10 dark:to-blue-600/10 rounded-full blur-3xl" />
          </div>

      <div className="relative z-10">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600">
              <Database className="h-6 w-6 text-white" />
                  </div>
                  <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{translations.tasks?.taskDatabase || "업무 데이터베이스"}</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{translations.tasks?.taskDatabaseSubtitle || "모든 프로젝트의 업무 데이터를 조회할 수 있습니다"}</p>
                  </div>
                </div>
        
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
            <Edit3 className="h-4 w-4" />
            <span>업무 정보 수정 가능</span>
          </div>
                </div>

        {/* 필터 및 검색 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6 shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder={translations.tasks?.searchTasks || "업무 검색..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 focus:border-blue-400 focus:ring-blue-400/20"
              />
                  </div>
          
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-48 bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder={translations.projects?.filter || "프로젝트 필터"} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                <SelectItem value="all" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700">{translations.projects?.all || "모든 프로젝트"}</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700">
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-48 bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder={translations.projects?.assigneeFilter || "담당자 필터"} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                <SelectItem value="all" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700">{translations.projects?.allAssignees || "모든 담당자"}</SelectItem>
                {assigneeOptions.map(person => (
                  <SelectItem key={person.id} value={person.id} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700">
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
                  </div>
          </div>

        {/* 업무 목록 테이블 - 프로젝트 상세정보와 동일한 구조 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                    onClick={() => handleSort('stage')}
                  >
                    <div className="flex items-center gap-1">
                      {translations.tasks?.stage || "Stage"}
                      {sortBy === 'stage' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-1">
                      {translations.tasks?.taskName || "Task Name"}
                      {sortBy === 'title' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                    onClick={() => handleSort('assignedTo')}
                  >
                    <div className="flex items-center gap-1">
                      {translations.tasks?.assignee || "담당"}
                      {sortBy === 'assignedTo' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {translations.global?.department || "부서"}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center gap-1">
                      {translations.global?.deadline || "Due Date"}
                      {sortBy === 'dueDate' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
            </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      {translations.global?.status || "상태"}
                      {sortBy === 'status' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                  </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {translations.projects?.overdue || "OverDue"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    자료 Link
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {translations.global?.projects || "프로젝트"}
                  </th>
                      </tr>
                    </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {sortedTasks.map((task, index) => {
                  const phaseInfo = getTaskPhaseInfo(task.taskPhase);
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== '완료 100%' && task.progress !== 100;
                        
                        return (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      {/* Stage */}
                      <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {getTaskStageNumber(task)}.
                                </span>
                          <Badge 
                            variant="outline" 
                            className="text-xs font-semibold"
                                  style={{ 
                                    backgroundColor: `${phaseInfo.color}40`,
                              borderColor: phaseInfo.color,
                                    color: phaseInfo.color,
                                    fontWeight: 600
                                  }}
                                >
                                  {phaseInfo.name}
                          </Badge>
                              </div>
                            </td>
                      
                      {/* Task Name */}
                      <td className="px-4 py-3">
                        <div 
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 rounded px-2 py-1 transition-colors group"
                          onClick={() => handleCellClick(task.id, 'title', task.title)}
                        >
                          {editingCell?.taskId === task.id && editingCell?.field === 'title' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                key={`${task.id}_title`}
                                value={editingValues[`${task.id}_title`] || ''}
                                onChange={(e) => setEditingValues({...editingValues, [`${task.id}_title`]: e.target.value})}
                                className="w-48 h-8 bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600"
                                autoFocus
                              />
                              <Button size="sm" className="h-6 w-6 p-0" onClick={() => handleCellSave(task.id, 'title')}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCellCancel}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs">
                                {task.title}
                              </span>
                              <Edit3 className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-50" />
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* 담당 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div 
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 rounded px-2 py-1 transition-colors group"
                          onClick={() => handleCellClick(task.id, 'assignedTo', task.assignedTo)}
                        >
                          {editingCell?.taskId === task.id && editingCell?.field === 'assignedTo' ? (
                            <div className="flex items-center gap-2">
                              <Select 
                                key={`${task.id}_assignedTo`}
                                value={editingValues[`${task.id}_assignedTo`] || undefined} 
                                onValueChange={(value) => setEditingValues({...editingValues, [`${task.id}_assignedTo`]: value})}
                              >
                                <SelectTrigger className="w-48 h-8 bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                                  <SelectItem value="">담당자 없음</SelectItem>
                                  {assigneeOptions.map(person => (
                                    <SelectItem 
                                      key={person.id} 
                                      value={person.id}
                                      className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700"
                                    >
                                      {person.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" className="h-6 w-6 p-0" onClick={() => handleCellSave(task.id, 'assignedTo')}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCellCancel}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-6 w-6 bg-gray-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
                                <User className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                              </div>
                              <div className="ml-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {getAssigneeName(task.assignedTo)}
                                </div>
                              </div>
                              <Edit3 className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-50" />
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* 부서 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div 
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 rounded px-2 py-1 transition-colors group"
                          onClick={() => handleCellClick(task.id, 'department', task.department)}
                        >
                          {editingCell?.taskId === task.id && editingCell?.field === 'department' ? (
                            <div className="flex items-center gap-2">
                              <Select 
                                key={`${task.id}_department`}
                                value={editingValues[`${task.id}_department`] || undefined} 
                                onValueChange={(value) => setEditingValues({...editingValues, [`${task.id}_department`]: value})}
                              >
                                <SelectTrigger className="w-48 h-8 bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                                  <SelectItem value="">부서 없음</SelectItem>
                                  {departments.map(dept => (
                                    <SelectItem 
                                      key={dept.id} 
                                      value={dept.code}
                                      className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700"
                                    >
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" className="h-6 w-6 p-0" onClick={() => handleCellSave(task.id, 'department')}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCellCancel}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {getDepartmentName(task.department)}
                              </span>
                              <Edit3 className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-50" />
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Due Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div 
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 rounded px-2 py-1 transition-colors group"
                          onClick={() => handleCellClick(task.id, 'dueDate', task.dueDate)}
                        >
                          {editingCell?.taskId === task.id && editingCell?.field === 'dueDate' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="date"
                                key={`${task.id}_dueDate`}
                                value={editingValues[`${task.id}_dueDate`] || ''}
                                onChange={(e) => setEditingValues({...editingValues, [`${task.id}_dueDate`]: e.target.value})}
                                className="w-48 h-8 bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600"
                                autoFocus
                              />
                              <Button size="sm" className="h-6 w-6 p-0" onClick={() => handleCellSave(task.id, 'dueDate')}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCellCancel}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {formatDate(task.dueDate)}
                              </span>
                              <Edit3 className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-50" />
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* 상태 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div 
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 rounded px-2 py-1 transition-colors group"
                          onClick={() => handleCellClick(task.id, 'status', task.status)}
                        >
                          {editingCell?.taskId === task.id && editingCell?.field === 'status' ? (
                            <div className="flex items-center gap-2">
                              <Select 
                                key={`${task.id}_status`}
                                value={editingValues[`${task.id}_status`] || undefined} 
                                onValueChange={(value) => setEditingValues({...editingValues, [`${task.id}_status`]: value})}
                              >
                                <SelectTrigger className="w-48 h-8 bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                                  {projectStatuses.map(status => (
                                    <SelectItem 
                                      key={status.id} 
                                      value={status.name}
                                      className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: status.color }}
                                        ></div>
                                        {status.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" className="h-6 w-6 p-0" onClick={() => handleCellSave(task.id, 'status')}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCellCancel}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getStatusColor(task.status) }}
                              ></div>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{task.status}</span>
                              <Edit3 className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-50" />
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* OverDue */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {task.status === '완료 100%' || task.progress === 100 ? (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">{translations.tasks?.completed || "완료"}</span>
                          </div>
                        ) : isOverdue ? (
                          <div className="flex items-center text-red-600 dark:text-red-400">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">
                              {Math.ceil((new Date().getTime() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24))}{translations.tasks?.daysDelayed || "일 지연"}
                            </span>
                                </div>
                        ) : (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">{translations.tasks?.normal || "정상"}</span>
                              </div>
                        )}
                            </td>
                      
                      {/* 자료 Link */}
                      <td className="px-4 py-3">
                        <TaskAttachmentPreview taskId={task.id} />
                      </td>
                      
                      {/* 프로젝트 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div 
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 rounded px-2 py-1 transition-colors group"
                          onClick={() => handleCellClick(task.id, 'projectId', task.projectId)}
                        >
                          {editingCell?.taskId === task.id && editingCell?.field === 'projectId' ? (
                            <div className="flex items-center gap-2">
                              <Select 
                                key={`${task.id}_projectId`}
                                value={editingValues[`${task.id}_projectId`] || undefined} 
                                onValueChange={(value) => setEditingValues({...editingValues, [`${task.id}_projectId`]: value})}
                              >
                                <SelectTrigger className="w-48 h-8 bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                                  {projects.map(project => (
                                    <SelectItem 
                                      key={project.id} 
                                      value={project.id}
                                      className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700"
                                    >
                                      {project.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" className="h-6 w-6 p-0" onClick={() => handleCellSave(task.id, 'projectId')}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCellCancel}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {getProjectName(task.projectId)}
                              </span>
                              <Edit3 className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-50" />
                            </div>
                          )}
                        </div>
                      </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                    </div>

          {sortedTasks.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
                {searchQuery || projectFilter !== "all" || assigneeFilter !== "all" 
                  ? "검색 결과가 없습니다" 
                  : "등록된 업무가 없습니다"}
              </p>
              <p className="text-sm">
                {searchQuery || projectFilter !== "all" || assigneeFilter !== "all"
                  ? "다른 검색어나 필터를 시도해보세요."
                  : "프로젝트 상세 페이지에서 업무를 생성해주세요."}
              </p>
            </div>
          )}
                            </div>
                            
        {/* 데이터베이스 정보 */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">{translations.tasks?.databaseInfo || "데이터베이스 정보"}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                이 페이지는 각 프로젝트 상세정보에서 등록된 하위업무들을 모아서 보여주는 데이터베이스입니다. 
                업무명, 담당자, 부서, 마감일, 상태, 프로젝트 칸을 클릭하여 직접 수정할 수 있습니다.
              </p>
                            </div>
                          </div>
                        </div>
                    </div>
    </div>
  );
};

export default Tasks;