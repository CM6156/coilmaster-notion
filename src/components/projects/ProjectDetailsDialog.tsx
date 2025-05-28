import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Project, Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import { useAppContext } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Loader2, 
  User, 
  Briefcase, 
  Building2, 
  BarChart,
  FolderTree,
  Plus,
  Edit,
  Save,
  X,
  Target,
  CalendarDays,
  Users,
  AlertCircle,
  FileText,
  Download,
  Eye,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Trash2,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { SubtaskCreateDialog } from "@/components/tasks/SubtaskCreateDialog";
import { getDepartmentKoreanName } from '@/utils/departmentUtils';
import { useToast } from "@/hooks/use-toast";
import PDFViewer from "@/components/common/PDFViewer";
import { supabase } from "@/lib/supabase";

interface ProjectDetailsDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 프로젝트 타입 확장
interface ProjectWithParent extends Project {
  parentProjectId?: string;
}

// 임시 파일 데이터 (실제로는 프로젝트에서 가져와야 함)
interface ProjectFile {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'document';
  url: string;
  size: number;
  uploadedAt: string;
}

const ProjectDetailsDialog = ({
  project,
  open,
  onOpenChange,
}: ProjectDetailsDialogProps) => {
  const { translations } = useLanguage();
  const { projects, users, tasks, departments, updateProject, clients, employees, managers, phases, calculateProjectProgress, deleteProject, currentUser } = useAppContext();
  const { toast } = useToast();
  const [isSubtaskDialogOpen, setIsSubtaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Project>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<ProjectFile | null>(null);
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  
  const t = translations.projects;
  const globalT = translations.global;

  // 권한 확인
  const userRole = currentUser?.role || 'user';
  const canDelete = userRole === 'admin' || userRole === 'manager';
  
  // 실제 프로젝트 파일들을 데이터베이스에서 가져오기
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  
  // 업무 단계 상태 추가
  const [taskPhases, setTaskPhases] = useState<any[]>([]);
  
  // 업무 단계 로드
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

  // 업무 단계 정보 가져오기
  const getTaskPhaseInfo = (phaseId?: string) => {
    console.log('🔍 getTaskPhaseInfo 호출:', {
      phaseId,
      taskPhasesLength: taskPhases.length,
      taskPhases: taskPhases.map(p => ({ id: p.id, name: p.name }))
    });
    
    if (!phaseId) {
      console.log('⚠️ phaseId가 없음 - 기본값 반환');
      return { name: '단계 미지정', color: '#6b7280' };
    }
    
    const phase = taskPhases.find(p => p.id === phaseId);
    console.log('🎯 단계 찾기 결과:', { phaseId, foundPhase: phase });
    
    return phase ? { name: phase.name, color: phase.color || '#3b82f6' } : { name: '단계 미지정', color: '#6b7280' };
  };
  
  // 프로젝트 파일 로드
  useEffect(() => {
    if (project?.id && open) {
      loadProjectFiles();
      loadTaskPhases();
    }
  }, [project?.id, open]);

  const loadProjectFiles = async () => {
    if (!project) return;
    
    console.log('파일 로드 시작 - 프로젝트 ID:', project.id);
    setIsLoadingFiles(true);
    
    try {
      // Storage 버킷 확인 - 더 자세한 디버깅
      console.log('🔍 Storage 버킷 조회 시작...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      console.log('📦 Storage 버킷 조회 결과:', {
        buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })),
        error: bucketsError,
        bucketsCount: buckets?.length || 0
      });
      
      if (bucketsError) {
        console.error('❌ Storage 버킷 조회 오류:', bucketsError);
        toast({
          title: "Storage 접근 오류",
          description: `Storage 버킷을 조회할 수 없습니다: ${bucketsError.message}`,
          variant: "destructive",
        });
        return;
      }
      
      const projectFilesBucket = buckets?.find(b => b.id === 'project-files');
      console.log('🎯 project-files 버킷 찾기 결과:', projectFilesBucket);
      
      if (!projectFilesBucket) {
        console.warn('⚠️ project-files 버킷이 없습니다.');
        console.log('📋 현재 사용 가능한 버킷들:', buckets?.map(b => b.id).join(', ') || '없음');
        toast({
          title: "Storage 버킷 필요",
          description: "파일 업로드를 위해 Supabase 대시보드에서 'project-files' 버킷을 생성해주세요.",
          variant: "destructive",
        });
        // 버킷이 없어도 기존 파일 로드는 계속 진행
      } else {
        console.log('✅ project-files 버킷 확인됨');
      }
      
      // 1. 먼저 project_attachments에서 file_id들을 가져오기
      const { data: attachments, error: attachmentError } = await supabase
        .from('project_attachments')
        .select('id, file_id, description, created_at')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      console.log('첨부파일 목록:', { attachments, attachmentError });

      if (attachmentError) {
        console.error('첨부파일 로드 오류:', attachmentError);
        setProjectFiles([]);
        return;
      }

      if (!attachments || attachments.length === 0) {
        console.log('첨부파일이 없습니다.');
        setProjectFiles([]);
        return;
      }

      // 2. file_id들로 files 테이블에서 파일 정보 가져오기
      const fileIds = attachments.map(att => att.file_id);
      console.log('검색할 파일 ID들:', fileIds);
      
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('*')
        .in('id', fileIds);

      console.log('파일 정보:', { files, filesError });

      if (filesError) {
        console.error('파일 정보 로드 오류:', filesError);
        setProjectFiles([]);
        return;
      }

      // 3. 데이터 결합 및 변환
      const projectFiles: ProjectFile[] = attachments
        .map(att => {
          const file = files?.find(f => f.id === att.file_id);
          if (!file) {
            console.warn('파일을 찾을 수 없음:', att.file_id);
            return null;
          }
          
          console.log('파일 변환:', { attachment: att, file });
          
          // Supabase Storage 공개 URL 생성
          let fileUrl = file.file_path;
          if (file.file_path && !file.file_path.startsWith('http')) {
            try {
              const { data: { publicUrl } } = supabase.storage
                .from('project-files')
                .getPublicUrl(file.file_path);
              fileUrl = publicUrl;
              console.log('생성된 공개 URL:', publicUrl);
            } catch (urlError) {
              console.error('URL 생성 오류:', urlError);
              // 다른 버킷 이름들도 시도해보기
              const bucketNames = ['project-files', 'files', 'documents'];
              for (const bucketName of bucketNames) {
                try {
                  const { data: { publicUrl } } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(file.file_path);
                  fileUrl = publicUrl;
                  console.log(`${bucketName} 버킷에서 URL 생성 성공:`, publicUrl);
                  break;
                } catch (e) {
                  console.log(`${bucketName} 버킷 시도 실패:`, e);
                }
              }
            }
          }
          
          const convertedFile = {
            id: file.id,
            name: file.original_filename || file.filename,
            type: file.content_type?.includes('pdf') ? 'pdf' as const : 
                  file.content_type?.includes('image') ? 'image' as const : 'document' as const,
            url: fileUrl || '',
            size: file.file_size || 0,
            uploadedAt: file.created_at || att.created_at
          };
          
          console.log('변환된 파일:', convertedFile);
          return convertedFile;
        })
        .filter(Boolean) as ProjectFile[];

      console.log('최종 파일 목록:', projectFiles);
      setProjectFiles(projectFiles);
    } catch (error) {
      console.error('파일 로드 중 오류:', error);
      setProjectFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };
  
  // Format date properly
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
  
  // project를 ProjectWithParent로 처리
  const projectWithParent = project as ProjectWithParent | null;
  
  // Get subprojects
  const subprojects = projectWithParent ? 
    projects.filter(p => (p as ProjectWithParent).parentProjectId === projectWithParent.id) : [];
  
  // Get parent project (if this is a subproject)
  const parentProject = projectWithParent?.parentProjectId 
    ? projects.find(p => p.id === projectWithParent.parentProjectId) as ProjectWithParent
    : null;

  // Get related tasks for this project
  const projectTasks = projectWithParent 
    ? tasks.filter(t => t.projectId === projectWithParent.id && !t.parentTaskId) 
    : [];

  // 실제 진행률 계산
  const actualProgress = project ? calculateProjectProgress(project.id) : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active': return <Loader2 className="h-4 w-4 text-blue-500" />;
      case 'delayed': return <Clock className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return '계획';
      case 'completed': return t?.statusCompleted || '완료';
      case 'active': 
      case 'in-progress': return t?.statusActive || '진행중';
      case 'delayed': return t?.statusDelayed || '지연';
      case 'on-hold': return t?.statusOnHold || '보류';
      default: return status;
    }
  };

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'planning': return t?.phasePlanning || '기획';
      case 'development': return t?.phaseDevelopment || '개발';
      case 'manufacturing': return t?.phaseManufacturing || '제조';
      case 'quality': return t?.phaseQuality || '품질';
      case 'production': return t?.phaseProduction || '양산';
      case 'sales': return t?.phaseSales || '영업';
      default: return phase;
    }
  };

  const getProjectTypeText = (type: string) => {
    const projectTypes: Record<string, string> = {
      "1-1": "1-1. 경쟁사 샘플 입수",
      "1-2": "1-2. 경쟁사 샘플 분석",
      "2-1": "2-1. 원자재 소싱 견적",
      "3-1": "3-1. 설비 소싱 견적",
      "3-2": "3-2. 설비 제작 완료",
      "4-1": "4-1. E-Service 내용 구성",
      "4-2": "4-2. E-Service 영상 제작",
      "5-1": "5-1. LINE 그리기",
      "6-1": "6-1. 원가 산출",
      "7-1": "7-1. PP",
      "7-2": "7-2. 품질 문제점 확인",
      "8-1": "8-1. 최종 개선",
      "9-1": "9-1. Order getting"
    };
    
    return projectTypes[type] || type;
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-gray-500';
      case 'completed': return 'bg-green-500';
      case 'active': 
      case 'in-progress': return 'bg-blue-500';
      case 'delayed': return 'bg-red-500';
      case 'on-hold': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Get the manager name
  const getManagerName = (managerId: string | undefined) => {
    if (!managerId) return "-";
    
    // 사용자, 직원, 매니저에서 모두 찾기
    const user = users.find(user => user.id === managerId);
    if (user) return user.name;
    
    const employee = employees.find(emp => emp.id === managerId);
    if (employee) return employee.name;
    
    const manager = managers.find(mgr => mgr.id === managerId);
    if (manager) return manager.name;
    
    return "-";
  };
  
  // Get all assignable people (users + employees + managers)
  const getAssignableUsers = () => {
    const allUsers = [
      ...users.map(user => ({ 
        id: user.id, 
        name: user.name, 
        email: user.email || '', 
        type: 'user' 
      })),
      ...employees.map(emp => ({ 
        id: emp.id, 
        name: emp.name, 
        email: '', 
        type: 'employee' 
      })),
      ...managers.map(mgr => ({ 
        id: mgr.id, 
        name: mgr.name, 
        email: mgr.email || '', 
        type: 'manager' 
      }))
    ];
    
    // 중복 제거 (id 기준)
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );
    
    return uniqueUsers;
  };
  
  // Get the client name
  const getClientName = (clientId: string | undefined) => {
    if (!clientId) return "고객사 미지정";
    const client = clients.find(client => client.id === clientId);
    return client?.name || "고객사 미지정";
  };
  
  // 담당 부서 이름 가져오기 함수
  const getDepartmentName = (departmentId: string | undefined) => {
    if (!departmentId) return "부서 미지정";
    
    // 먼저 departments 배열에서 찾기
    const department = departments.find(dept => dept.id === departmentId);
    if (department) {
      return department.name;
    }
    
    // UUID가 아닌 경우 코드로 간주하고 한국어명 가져오기
    return getDepartmentKoreanName(departmentId);
  };
  
  // Helper to calculate days remaining
  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)}일 지남`;
    if (diffDays === 0) return '오늘 마감';
    return `${diffDays}일 남음`;
  };

  // Handle click on add subtask button
  const handleAddSubtask = (task: Task) => {
    setSelectedTask(task);
    setIsSubtaskDialogOpen(true);
  };

  // Get task number from title (e.g., "1. Task name" => "1")
  const getTaskNumber = (title: string) => {
    const match = title.match(/^(\d+)\./);
    return match ? match[1] : "";
  };

  // 업무의 Stage 번호를 가져오는 함수
  const getTaskStageNumber = (task: Task): string => {
    const phase = taskPhases.find(p => p.id === task.taskPhase);
    const stageNumber = phase?.order_index || 0;
    return String(stageNumber).padStart(2, '0');
  };

  // 편집 모드 시작
  const handleEditStart = () => {
    if (!project) return;
    setEditData({
      name: project.name,
      description: project.description,
      clientId: project.clientId,
      department: project.department,
      manager: project.manager,
      managerId: project.managerId,
      currentPhase: project.currentPhase,
      status: project.status,
      requestDate: project.requestDate,
      targetSOPDate: project.targetSOPDate,
      projectType: project.projectType,
      annualQuantity: project.annualQuantity,
      averageAmount: project.averageAmount,
      annualAmount: project.annualAmount,
      competitor: project.competitor
    });
    setIsEditing(true);
  };

  // 편집 취소
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  // 편집 저장
  const handleEditSave = async () => {
    if (!project || !editData) return;
    
    setIsSaving(true);
    try {
      await updateProject(project.id, editData);
      toast({
        title: "프로젝트 업데이트 완료",
        description: "프로젝트 정보가 성공적으로 업데이트되었습니다.",
      });
      setIsEditing(false);
      setEditData({});
    } catch (error) {
      console.error("프로젝트 업데이트 오류:", error);
      toast({
        title: "업데이트 실패",
        description: "프로젝트 정보 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePDFClick = (file: ProjectFile) => {
    setSelectedPDF(file);
    setIsPDFViewerOpen(true);
  };

  const handleDelete = async () => {
    if (!project) return;
    
    try {
      setIsDeleting(true);
      await deleteProject(project.id);
      
      toast({
        title: "프로젝트 삭제 완료",
        description: `"${project.name}" 프로젝트가 성공적으로 삭제되었습니다. 업무 개수: ${projectTasks.length}개`,
        variant: "default",
      });
      
      // 다이얼로그 닫기
      onOpenChange(false);
      
    } catch (error) {
      console.error('프로젝트 삭제 오류:', error);
      toast({
        title: "삭제 실패",
        description: "프로젝트 삭제 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!project) return null;

  // 영어 상태를 한국어로 변환하는 매핑 (Tasks.tsx와 동일)
  const statusMapping: { [key: string]: string } = {
    'not-started': '할 일',
    'to-do': '할 일',
    'todo': '할 일',
    'in-progress': '진행중',
    'progress': '진행중',
    'doing': '진행중',
    'reviewing': '검토중',
    'review': '검토중',
    'pending': '검토중',
    'completed': '완료',
    'done': '완료',
    'finished': '완료',
    'delayed': '지연',
    'blocked': '지연',
    'on-hold': '보류',
    'paused': '보류'
  };

  // 업무 데이터의 상태를 한국어로 변환
  const normalizedProjectTasks = projectTasks.map(task => ({
    ...task,
    status: statusMapping[task.status.toLowerCase()] || task.status
  }));

  // 하위업무 상태별 계산 (정규화된 상태로)
  const getSubtaskStats = () => {
    const total = normalizedProjectTasks.length;
    const completed = normalizedProjectTasks.filter(t => t.status === '완료').length;
    const inProgress = normalizedProjectTasks.filter(t => t.status === '진행중').length;
    const reviewing = normalizedProjectTasks.filter(t => t.status === '검토중').length;
    const delayed = normalizedProjectTasks.filter(t => t.status === '지연').length;
    const onHold = normalizedProjectTasks.filter(t => t.status === '보류').length;
    const notStarted = normalizedProjectTasks.filter(t => t.status === '할 일').length;
    
    console.log('=== 프로젝트 하위업무 상태별 통계 ===');
    console.log('전체:', total);
    console.log('완료:', completed);
    console.log('진행중:', inProgress);
    console.log('검토중:', reviewing);
    console.log('지연:', delayed);
    console.log('보류:', onHold);
    console.log('할 일:', notStarted);
    console.log('업무 상태들:', normalizedProjectTasks.map(t => ({ title: t.title, status: t.status })));
    console.log('==============================');
    
    return { 
      total, 
      completed, 
      inProgress: inProgress + reviewing, // 진행중에 검토중도 포함
      notStarted: notStarted + delayed + onHold // 시작전에 지연, 보류도 포함
    };
  };

  const subtaskStats = getSubtaskStats();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden bg-white dark:bg-gray-900">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                {project.name}
              </DialogTitle>
              
              <div className="flex items-center gap-4">
                {canDelete && (
                  <>
                    {!showDeleteConfirm ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-3 bg-red-50 dark:bg-red-900/20 px-5 py-4 rounded-lg border border-red-200 dark:border-red-800 shadow-lg min-w-[280px]">
                        <div className="text-center">
                          <span className="text-sm text-red-700 dark:text-red-300 font-medium block">정말 삭제하시겠습니까?</span>
                          {projectTasks.length > 0 && (
                            <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">
                              ⚠️ 관련 업무 {projectTasks.length}개도 함께 삭제됩니다.
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="h-8 px-4 min-w-[60px]"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "삭제"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="h-8 px-4 min-w-[60px]"
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* 닫기 버튼을 오른쪽 끝에 배치 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-gray-500 hover:text-gray-700 ml-4"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[calc(95vh-150px)] space-y-6">
            {/* 상단: 이미지 및 PDF 파일 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 프로젝트 이미지 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                  프로젝트 이미지
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  {project.image ? (
                    <img 
                      src={project.image} 
                      alt={project.name}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>이미지가 없습니다</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PDF 파일 목록 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-red-600" />
                    관련 문서 ({projectFiles.length}개)
                    {isLoadingFiles && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                  </h3>
                  
                  {/* 새로고침 버튼만 유지 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadProjectFiles}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    새로고침
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {isLoadingFiles ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                      <p>파일을 불러오는 중...</p>
                    </div>
                  ) : projectFiles.length > 0 ? (
                    projectFiles.map((file) => (
                      <div 
                        key={file.id}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handlePDFClick(file)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                              <FileText className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePDFClick(file);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(file.url, '_blank');
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>업로드된 문서가 없습니다</p>
                      <p className="text-sm mt-1">프로젝트 생성 시 파일을 업로드해보세요</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                기본 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-1">
                    단계
                  </label>
                  <div className="p-3 bg-white dark:bg-gray-700 rounded-lg">
                    {(() => {
                      const phase = phases.find(p => p.id === project.phase);
                      return phase ? phase.name : '단계 미지정';
                    })()}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-1">
                    담당자
                  </label>
                  <div className="p-3 bg-white dark:bg-gray-700 rounded-lg">
                    {project.manager || getManagerName(project.managerId) || "담당자 미지정"}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-1">
                    상태
                  </label>
                  <div className="p-3 bg-white dark:bg-gray-700 rounded-lg">
                    <Badge variant="outline" className={cn(
                      "font-medium",
                      project.status === 'completed' && "bg-green-100 text-green-800 border-green-300",
                      project.status === 'active' && "bg-blue-100 text-blue-800 border-blue-300",
                      project.status === 'delayed' && "bg-red-100 text-red-800 border-red-300",
                      project.status === 'on-hold' && "bg-yellow-100 text-yellow-800 border-yellow-300"
                    )}>
                      {getStatusText(project.status)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-1">
                    진행률 (하위업무 기준)
                  </label>
                  <div className="p-3 bg-white dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            actualProgress < 30 ? "bg-red-500" :
                            actualProgress < 70 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ width: `${actualProgress}%` }}
                        />
                      </div>
                      <span className="font-bold text-sm">{actualProgress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 날짜, 담당자 및 상태 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 날짜 정보 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  날짜 정보
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">시작일:</span>
                    <span className="font-medium">{formatDate(project.startDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">마감일:</span>
                    <span className="font-medium">{formatDate(project.dueDate)}</span>
                  </div>
                  {project.requestDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">요청일:</span>
                      <span className="font-medium">{formatDate(project.requestDate)}</span>
                    </div>
                  )}
                  {project.targetSOPDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">목표 양산일:</span>
                      <span className="font-medium">{formatDate(project.targetSOPDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 담당자 및 상태 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-purple-600" />
                  프로젝트 요약
                </h3>
                <div className="space-y-4">
                  {project.dueDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">남은 기간:</span>
                      <span className="font-medium">
                        {(() => {
                          const today = new Date();
                          const dueDate = new Date(project.dueDate);
                          const diffTime = dueDate.getTime() - today.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (diffDays < 0) {
                            return <span className="text-red-600 font-bold">{Math.abs(diffDays)}일 지연</span>;
                          } else if (diffDays === 0) {
                            return <span className="text-orange-600 font-bold">오늘 마감</span>;
                          } else {
                            return <span className="text-blue-600 font-bold">{diffDays}일 남음</span>;
                          }
                        })()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">하위 업무:</span>
                    <span className="font-medium">{subtaskStats.total}개</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">완료된 업무:</span>
                    <span className="font-medium text-green-600">{subtaskStats.completed}개</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 하위 업무 목록 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  하위 업무 ({subtaskStats.total}개)
                </h3>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  onClick={() => navigate(`/tasks?projectId=${project.id}&action=create`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  업무 추가
                </Button>
              </div>

              {/* 업무 현황 요약 */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <PauseCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">시작전</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{subtaskStats.notStarted}</div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <PlayCircle className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">진행중</span>
                  </div>
                  <div className="text-xl font-bold text-blue-600">{subtaskStats.inProgress}</div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">완료</span>
                  </div>
                  <div className="text-xl font-bold text-green-600">{subtaskStats.completed}</div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">전체</span>
                  </div>
                  <div className="text-xl font-bold text-purple-600">{subtaskStats.total}</div>
                </div>
              </div>

              {/* 업무 목록 */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {normalizedProjectTasks
                  .sort((a, b) => {
                    // 업무 단계의 order_index로 정렬
                    const phaseA = taskPhases.find(p => p.id === a.taskPhase);
                    const phaseB = taskPhases.find(p => p.id === b.taskPhase);
                    
                    const orderA = phaseA?.order_index || 999;
                    const orderB = phaseB?.order_index || 999;
                    
                    if (orderA !== orderB) {
                      return orderA - orderB;
                    }
                    
                    // 같은 단계라면 생성일순으로 정렬
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  })
                  .map((task, index) => {
                    const phaseInfo = getTaskPhaseInfo(task.taskPhase);
                    
                    return (
                      <div 
                        key={task.id}
                        className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {/* Stage 번호 */}
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {getTaskStageNumber(task)}.
                              </span>
                              
                              <div className={cn(
                                "w-3 h-3 rounded-full",
                                task.status === '완료' ? "bg-green-500" :
                                task.status === '진행중' ? "bg-blue-500" :
                                task.status === '검토중' ? "bg-purple-500" :
                                task.status === '지연' ? "bg-red-500" :
                                task.status === '보류' ? "bg-yellow-500" : "bg-gray-400"
                              )}></div>
                              
                              {/* 업무 단계 배지 */}
                              <Badge 
                                variant="outline" 
                                className="text-sm font-medium"
                                style={{ 
                                  backgroundColor: `${phaseInfo.color}20`,
                                  borderColor: phaseInfo.color,
                                  color: phaseInfo.color
                                }}
                              >
                                📋 {phaseInfo.name}
                              </Badge>
                            </div>
                          
                          {/* 업무 제목 */}
                          <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                            {getTaskStageNumber(task)} {task.title}
                          </h4>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            {task.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>마감: {formatDate(task.dueDate)}</span>
                            </div>
                            {task.assignedTo && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>담당자: {task.assignedTo}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {task.progress}%
                            </div>
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-300",
                                  task.progress < 30 ? "bg-red-500" :
                                  task.progress < 70 ? "bg-yellow-500" : "bg-green-500"
                                )}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                          
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              task.status === '완료' && "bg-green-100 text-green-800 border-green-300",
                              task.status === '진행중' && "bg-blue-100 text-blue-800 border-blue-300",
                              task.status === '검토중' && "bg-purple-100 text-purple-800 border-purple-300",
                              task.status === '지연' && "bg-red-100 text-red-800 border-red-300",
                              task.status === '보류' && "bg-yellow-100 text-yellow-800 border-yellow-300"
                            )}
                          >
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {normalizedProjectTasks.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-2">등록된 업무가 없습니다</p>
                    <p className="text-sm">첫 번째 업무를 추가해보세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF 미리보기 모달 */}
      {selectedPDF && (
        <PDFViewer
          open={isPDFViewerOpen}
          onOpenChange={setIsPDFViewerOpen}
          pdfUrl={selectedPDF.url}
          fileName={selectedPDF.name}
        />
      )}
    </>
  );
};

export default ProjectDetailsDialog;
