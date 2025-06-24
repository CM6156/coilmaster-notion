import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Project, Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import { useAppContext } from "@/context/AppContext";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Loader2, 
  User, 
  Briefcase, 
  Building2, 
  BarChart,
  Plus,
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
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  X,
  Edit3,
  Edit,
  Link as LinkIcon,
  Paperclip,
  MessageCircle,
  Send,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import PDFViewer from "@/components/common/PDFViewer";
import { supabase } from "@/lib/supabase";
import { ProjectEditDialog } from "@/components/projects/ProjectEditDialog";
import { TaskAttachmentDialog } from "@/components/tasks/TaskAttachmentDialog";
import { TaskProgressSidebar } from "@/components/tasks/TaskProgressSidebar";
import { InlineCommentBox } from "@/components/tasks/InlineCommentBox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// 임시 파일 데이터 (실제로는 프로젝트에서 가져와야 함)
interface ProjectFile {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'document';
  url: string;
  size: number;
  uploadedAt: string;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { translations } = useLanguage();
  const { 
    projects, 
    tasks, 
    users, 
    managers, 
    employees, 
    departments, 
    updateTask, 
    deleteTask, 
    addTask, 
    currentUser, 
    updateProject, 
    phases, 
    calculateProjectProgress, 
    getProjectStatuses,
    deleteProject, // deleteProject 추가
    createNotification // createNotification 추가
  } = useAppContext();
  const { toast } = useToast();
  
  // 모든 useState와 useRef를 최상단으로 이동
  const [selectedPDF, setSelectedPDF] = useState<ProjectFile | null>(null);
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDateInfo, setShowDateInfo] = useState(false);
  const [showProjectSummary, setShowProjectSummary] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<'stage' | 'title' | 'assignedTo' | 'dueDate' | 'status'>('stage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [taskPhases, setTaskPhases] = useState<any[]>([]);
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null);
  const [editingValues, setEditingValues] = useState<{ [key: string]: any }>({});
  const [isAddingNewTask, setIsAddingNewTask] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    assignedTo: '',
    department: '',
    dueDate: '',
    status: '',
    taskPhase: ''
  });
  
  // 프로젝트 수정 관련 상태 추가
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  
  // 업무 첨부 파일 관리 상태 추가
  const [selectedTaskForAttachment, setSelectedTaskForAttachment] = useState<Task | null>(null);
  const [isTaskAttachmentDialogOpen, setIsTaskAttachmentDialogOpen] = useState(false);
  const [taskAttachments, setTaskAttachments] = useState<{ [taskId: string]: any[] }>({});
  
  // 업무 삭제 확인 상태 추가
  const [isTaskDeleteDialogOpen, setIsTaskDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  
  // 파일 업로드 상태 추가
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // 댓글 기능 관련 상태 추가
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<Task | null>(null);
  const [isProgressSidebarOpen, setIsProgressSidebarOpen] = useState(false);
  const [commentClickCounts, setCommentClickCounts] = useState<{ [taskId: string]: number }>({});
  
  // 텔레그램 발송 관련 상태 추가
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  
  const editingRef = useRef<HTMLDivElement | null>(null);
  
  const t = translations.projects;
  const globalT = translations.global;

  // 프로젝트 찾기
  const project = projects.find(p => p.id === id);

  // 권한 확인
  const userRole = currentUser?.role || 'user';
  const canDelete = userRole === 'admin' || userRole === 'manager';
  
  // 관리자 패널에서 설정한 프로젝트 상태 목록 가져오기
  const projectStatuses = getProjectStatuses();
  const statusOptions = projectStatuses.map(status => status.name);

  // 디버깅: 상태 데이터 확인
  console.log('=== 프로젝트 상태 디버깅 ===');
  console.log('프로젝트 상태들:', projectStatuses);
  console.log('상태 옵션들:', statusOptions);
  console.log('상태 개수:', projectStatuses.length);

  // 강제 데이터 새로고침 함수
  const forceRefreshData = async () => {
    try {
      console.log('🔄 강제 데이터 새로고침 시작...');
      
      // Supabase에서 직접 tasks 데이터 조회
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tasksError) {
        console.error('❌ Tasks 조회 오류:', tasksError);
        toast({
          title: "데이터 새로고침 실패",
          description: "업무 데이터를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Tasks 데이터 조회 성공:', tasksData?.length || 0, '개');
      console.log('📋 조회된 Tasks 데이터:', tasksData);
      
      // 현재 프로젝트의 업무만 필터링
      const projectTasks = tasksData?.filter(task => task.project_id === id) || [];
      console.log('📋 현재 프로젝트 업무:', projectTasks.length, '개');
      
      if (projectTasks.length > 0) {
        toast({
          title: "데이터 새로고침 완료",
          description: `${projectTasks.length}개의 업무를 찾았습니다. 페이지를 새로고침합니다.`,
        });
        
        // 페이지 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "업무 없음",
          description: "이 프로젝트에 연결된 업무가 없습니다.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('💥 강제 새로고침 오류:', error);
      toast({
        title: "새로고침 오류",
        description: "데이터 새로고침 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 기본 상태 설정 (첫 번째 활성화된 상태 또는 '시작전')
  const defaultStatus = useMemo(() => {
    if (projectStatuses.length > 0) {
      const firstActiveStatus = projectStatuses.find(status => status.is_active);
      return firstActiveStatus ? firstActiveStatus.name : projectStatuses[0].name;
    }
    return '시작전'; // 폴백
  }, [projectStatuses]);

  // newTaskData 초기화 시 기본 상태 설정
  useEffect(() => {
    if (defaultStatus && newTaskData.status === '') {
      setNewTaskData(prev => ({ ...prev, status: defaultStatus }));
    }
  }, [defaultStatus, newTaskData.status]);

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

  // 부서 옵션 생성
  const departmentOptions = departments.map(dept => ({
    id: dept.id,
    name: dept.name,
    code: dept.code
  }));

  // 업무 단계 로드 함수
  const loadTaskPhases = async () => {
    try {
      console.log('🔄 업무 단계 로드 시작...');
      const { data, error } = await supabase
        .from('task_phases')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        console.error('❌ 업무 단계 로드 오류:', error);
        throw error;
      }

      console.log('📋 로드된 업무 단계:', data?.length || 0, '개');
      console.log('📋 업무 단계 데이터:', data);
      
      setTaskPhases(data || []);
      
      if (!data || data.length === 0) {
        console.warn('⚠️ 업무 단계 데이터가 없습니다. task_phases 테이블을 확인하세요.');
      }
    } catch (error) {
      console.error('❌ 업무 단계 로드 오류:', error);
      setTaskPhases([]);
    }
  };

  // 프로젝트 파일 로드 함수
  const loadProjectFiles = async () => {
    if (!project) return;
    
    console.log('🔄 파일 로드 시작 - 프로젝트 ID:', project.id);
    setIsLoadingFiles(true);
    
    try {
      // 1. Storage 버킷 확인
      console.log('📦 Storage 버킷 조회 중...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Storage 버킷 조회 오류:', bucketsError);
        // 버킷 오류가 있어도 파일 로드는 계속 진행
      } else {
        console.log('📋 사용 가능한 버킷들:', buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })));
        
        const projectFilesBucket = buckets?.find(b => b.id === 'project-files');
        if (!projectFilesBucket) {
          console.warn('⚠️ project-files 버킷이 없습니다. 사용 가능한 버킷:', buckets?.map(b => b.id).join(', ') || '없음');
          // 버킷이 없어도 파일 로드는 계속 진행
        } else {
          console.log('✅ project-files 버킷 확인됨');
        }
      }
      
      // 2. project_attachments에서 직접 파일 정보 조회 (간소화된 방식)
      console.log('🔗 프로젝트 첨부파일 조회 중...');
      
      const { data: attachments, error: attachmentError } = await supabase
        .from('project_attachments')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      console.log('📎 첨부파일 조회 결과:', { 
        attachmentsCount: attachments?.length || 0, 
        error: attachmentError,
        attachments: attachments
      });

      if (attachmentError) {
        console.error('❌ 첨부파일 조회 실패:', attachmentError);
        toast({
          title: "파일 로드 실패",
          description: `파일 목록을 불러올 수 없습니다: ${attachmentError.message}`,
          variant: "destructive",
        });
        setProjectFiles([]);
        return;
      }

      if (!attachments || attachments.length === 0) {
        console.log('📝 첨부파일이 없습니다.');
        setProjectFiles([]);
        return;
      }

      // 3. ProjectFile 형식으로 변환
      const mappedFiles: ProjectFile[] = attachments.map(attachment => {
        // Storage URL 생성 (file_url이 있으면 사용, 없으면 file_path로 생성)
        let fileUrl = attachment.file_url;
        if (!fileUrl && attachment.file_path) {
          const { data: urlData } = supabase.storage
            .from('project-files')
            .getPublicUrl(attachment.file_path);
          fileUrl = urlData.publicUrl;
        }

        return {
          id: attachment.id,
          name: attachment.file_name || '알 수 없는 파일',
          type: getFileType(attachment.file_name || ''),
          url: fileUrl || '#',
          size: attachment.file_size || 0,
          uploadedAt: attachment.created_at || new Date().toISOString()
        };
      });

      console.log('✅ 파일 로드 성공:', mappedFiles.length, '개 파일');
      setProjectFiles(mappedFiles);
      
    } catch (error) {
      console.error('💥 파일 로드 중 오류:', error);
      toast({
        title: "파일 로드 실패",
        description: "파일 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      setProjectFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // 파일 타입 결정 헬퍼 함수
  const getFileType = (fileName: string): 'pdf' | 'image' | 'document' => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else {
      return 'document';
    }
  };

  // 프로젝트 파일 로드 useEffect
  useEffect(() => {
    if (project?.id) {
      loadProjectFiles();
      loadTaskPhases();
    }
  }, [project?.id]);

  // 외부 클릭 감지 및 ESC 키 감지 useEffect  
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Select 드롭다운 관련 요소들을 제외
      if (target && (
        target.nodeType === Node.ELEMENT_NODE &&
        (
          (target as Element).closest('[data-radix-select-content]') ||
          (target as Element).closest('[data-radix-select-trigger]') ||
          (target as Element).closest('[data-radix-select-viewport]') ||
          (target as Element).closest('[data-radix-popper-content-wrapper]') ||
          (target as Element).hasAttribute('data-radix-select-trigger') ||
          (target as Element).hasAttribute('data-radix-select-content')
        )
      )) {
        return; // Select 관련 요소는 무시
      }

      if (editingRef.current && !editingRef.current.contains(target)) {
        // 편집 상태만 취소 (새로운 업무 추가 모드는 유지)
        setEditingCell(null);
        setEditingValues({});
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // ESC 키로 새로운 업무 추가 모드 취소
        if (isAddingNewTask) {
          setIsAddingNewTask(false);
          setNewTaskData({
            title: '',
            assignedTo: '',
            department: '',
            dueDate: '',
            status: '',
            taskPhase: ''
          });
        }
        
        // 편집 모드도 취소
        setEditingCell(null);
        setEditingValues({});
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAddingNewTask]);

  // 업무 단계 정보 가져오기 함수
  const getTaskPhaseInfo = (phaseId?: string) => {
    if (!phaseId) {
      return { name: '단계 미지정', color: '#6b7280' };
    }
    
    const phase = taskPhases.find(p => p.id === phaseId);
    return phase ? { name: phase.name, color: phase.color || '#3b82f6' } : { name: '단계 미지정', color: '#6b7280' };
  };

  // 프로젝트 단계 정보 가져오기 함수 추가
  const getProjectPhaseInfo = (phaseId?: string) => {
    if (!phaseId) {
      return { name: '단계 미지정', color: '#6b7280' };
    }
    
    const phase = phases.find(p => p.id === phaseId);
    return phase ? { name: phase.name, color: phase.color || '#3b82f6' } : { name: '단계 미지정', color: '#6b7280' };
  };

  // 프로모션 단계 텍스트 가져오기 함수 추가
  const getPromotionStageText = (project: any) => {
    // 1. promotionStage 필드 우선 확인 (새로운 프로모션 단계 시스템)
    if (project.promotionStage) {
      const stageColors: { [key: string]: string } = {
        'Promotion': '#ef4444',
        'Sample': '#f59e0b',
        '1차검증': '#eab308',
        '설계검증': '#10b981',
        'Set검증': '#06b6d4',
        '승인': '#3b82f6',
        '수주': '#8b5cf6',
        'Drop': '#6b7280'
      };
      
      return { 
        name: project.promotionStage, 
        color: stageColors[project.promotionStage] || '#3b82f6' 
      };
    }
    
    // 2. currentPhase가 있으면 phases에서 찾기
    if (project.currentPhase) {
      const phaseInfo = getProjectPhaseInfo(project.currentPhase);
      if (phaseInfo.name !== '단계 미지정') {
        return phaseInfo;
      }
    }
    
    // 3. phase 필드 확인
    if (project.phase) {
      return { name: project.phase, color: '#3b82f6' };
    }
    
    // 4. promotionStatus 확인
    if (project.promotionStatus) {
      return { name: project.promotionStatus, color: '#8b5cf6' };
    }
    
    // 5. type이나 projectType 확인
    if (project.type || project.projectType) {
      return { name: project.type || project.projectType, color: '#f59e0b' };
    }
    
    // 기본값
    return { name: '단계 미지정', color: '#6b7280' };
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

  // Get related tasks for this project
  const projectTasks = project 
    ? tasks.filter(t => t.projectId === project.id && !t.parentTaskId) 
    : [];

  // 기본 프로모션명 리스트와 색상 매핑
  const defaultPromotionNames = [
    { name: '영업정보', color: '#ff6b6b' },
    { name: '견적서 및 접수', color: '#4ecdc4' },
    { name: '견적서 분석', color: '#45b7d1' },
    { name: '원자재 소싱전략', color: '#96ceb4' },
    { name: 'SPL 접수', color: '#ffeaa7' },
    { name: '원재 소싱전략', color: '#dda0dd' },
    { name: '원재 결정', color: '#98d8c8' },
    { name: 'E-Service Content', color: '#a8e6cf' },
    { name: 'E-Service 완성', color: '#88d8b0' },
    { name: 'LINE 그래디', color: '#c7ceea' },
    { name: '결과 산출', color: '#b4a7d6' },
    { name: 'PP', color: '#d4a4eb' },
    { name: '품질 Review', color: '#f093fb' },
    { name: '최종 개선', color: '#f5576c' },
    { name: '수주', color: '#4facfe' }
  ];

      // 실제 업무와 임시 업무를 함께 표시
    const displayTasks = useMemo(() => {
      // 실제 업무들
      const realTasks = [...projectTasks];
      
      // 실제 업무에서 사용된 프로모션명들 찾기 (Stage 컬럼 기준)
      const usedPromotionNames = new Set();
      
      // 실제 업무들을 순회하며 해당 업무의 단계명을 확인
      realTasks.forEach(task => {
        if (task.taskPhase) {
          const phase = taskPhases.find(p => p.id === task.taskPhase);
          if (phase && defaultPromotionNames.some(promo => promo.name === phase.name)) {
            usedPromotionNames.add(phase.name);
          }
        }
      });
      
      console.log('사용된 프로모션명들:', Array.from(usedPromotionNames));
      console.log('전체 프로모션명들:', defaultPromotionNames.map(p => p.name));
      
      // 아직 사용되지 않은 프로모션명들에 대해 임시 업무 생성
      const unusedPromotions = defaultPromotionNames.filter(
        promotion => !usedPromotionNames.has(promotion.name)
      );
      
      const tempTasks = unusedPromotions.map((promotion, index) => ({
        id: `temp-${defaultPromotionNames.indexOf(promotion)}`, // 원래 인덱스 사용
        title: '', // 업무명은 빈칸 (입력 가능)
        description: '',
        status: '시작전',
        priority: 'medium',
        progress: 0,
        startDate: '',
        dueDate: '',
        projectId: project?.id || '',
        assignedTo: '',
        department: '',
        taskPhase: undefined, // 임시 업무는 단계 없음
        parentTaskId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isTemporary: true, // 임시 업무 표시용
        stageName: promotion.name, // Stage에 표시할 프로모션명
        stageColor: promotion.color // 색상 정보 추가
      } as Task & { isTemporary: boolean; stageName: string; stageColor: string }));
      
      console.log('실제 업무 수:', realTasks.length);
      console.log('임시 업무 수:', tempTasks.length);
      console.log('전체 표시 업무 수:', realTasks.length + tempTasks.length);
      
      // 실제 업무 + 임시 업무 결합
      return [...realTasks, ...tempTasks];
    }, [projectTasks, project?.id]);

  // 실제 진행률 계산
  const actualProgress = project ? calculateProjectProgress(project.id) : 0;

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

  // Get the manager name
  const getManagerName = (managerId: string | undefined) => {
    // 1. managerId로 찾기 (우선순위)
    if (managerId) {
      // 사용자, 직원, 매니저에서 모두 찾기
      const user = users.find(user => user.id === managerId);
      if (user) return user.name;
      
      const employee = employees.find(emp => emp.id === managerId);
      if (employee) return employee.name;
      
      const manager = managers.find(mgr => mgr.id === managerId);
      if (manager) return manager.name;
    }
    
    // 2. managerId로 찾지 못하면 project.manager(pic_name) 확인
    const managerName = project?.manager;
    if (managerName && typeof managerName === 'string' && managerName.trim() !== '') {
      return managerName;
    }
    
    return "담당자 미지정";
  };

  // 담당자 이름 가져오기 함수 추가
  const getAssigneeName = (assignedTo: string | undefined) => {
    if (!assignedTo) return "미지정";
    
    // 사용자, 직원, 매니저에서 모두 찾기
    const user = users.find(user => user.id === assignedTo);
    if (user) return user.name;
    
    const employee = employees.find(emp => emp.id === assignedTo);
    if (employee) return employee.name;
    
    const manager = managers.find(mgr => mgr.id === assignedTo);
    if (manager) return manager.name;
    
    return "미지정";
  };

  // 부서 이름 가져오기 함수 개선
  const getDepartmentName = (departmentId: string | undefined) => {
    if (!departmentId) {
      return "부서 미지정";
    }
    
    // 1. ID로 부서 찾기 (UUID 형태)
    const department = departments.find(dept => dept.id === departmentId);
    if (department) {
      return department.name;
    }
    
    // 2. 이름으로 찾기 (이미 부서명일 수 있음)
    const deptByName = departments.find(dept => dept.name === departmentId);
    if (deptByName) {
      return deptByName.name;
    }
    
    // 3. 코드로 찾기
    const deptByCode = departments.find(dept => dept.code === departmentId);
    if (deptByCode) {
      return deptByCode.name;
    }
    
    // 4. 부서 코드를 한국어 이름으로 변환 (폴백)
    const departmentNameMap: { [key: string]: string } = {
      'sales': '영업부',
      'development': '개발부',
      'manufacturing': '제조부',
      'quality': '품질부',
      'finance': '재무부',
      'administration': '관리부',
      'management': '경영부',
      'engineering': '기술부',
      'rnd': '연구개발부',
      'production': '생산부',
      'qa': '품질보증부'
    };
    
    const koreanName = departmentNameMap[departmentId.toLowerCase()];
    if (koreanName) {
      return koreanName;
    }
    
    // 5. 찾지 못하면 원본 반환
    return departmentId || "부서 미지정";
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
      
      // 프로젝트 목록으로 이동
      navigate('/projects');
      
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

  // 업무의 Stage 번호를 가져오는 함수
  const getTaskStageNumber = (task: Task): string => {
    console.log(`🔍 업무 단계 번호 조회 - 업무: "${task.title}", taskPhase: "${task.taskPhase}"`);
    
    // 임시 업무인지 확인
    if (task.id.startsWith('temp-')) {
      // temp-0 → 1, temp-1 → 2, temp-2 → 3, ...
      const tempIndex = parseInt(task.id.replace('temp-', ''));
      const stageNumber = tempIndex + 1;
      const result = String(stageNumber).padStart(2, '0');
      console.log(`📊 임시 업무 단계 번호: "${result}" (temp-${tempIndex} → ${stageNumber})`);
      return result;
    }
    
    // 실제 업무의 경우
    if (!task.taskPhase) {
      console.log(`⚠️ 업무 "${task.title}"에 taskPhase가 없습니다.`);
      return '00';
    }
    
    console.log(`📋 사용 가능한 단계들:`, taskPhases.map(p => ({ id: p.id, name: p.name, order_index: p.order_index })));
    
    const phase = taskPhases.find(p => p.id === task.taskPhase);
    console.log(`🎯 매칭된 단계:`, phase ? { id: phase.id, name: phase.name, order_index: phase.order_index } : '없음');
    
    if (!phase) {
      console.log(`❌ taskPhase "${task.taskPhase}"에 해당하는 단계를 찾을 수 없습니다.`);
      return '00';
    }
    
    const stageNumber = phase.order_index || 0;
    const result = String(stageNumber).padStart(2, '0');
    
    console.log(`📊 최종 단계 번호: "${result}" (order_index: ${phase.order_index})`);
    return result;
  };

  // 영어 상태를 한국어로 변환하는 매핑
  const statusMapping: { [key: string]: string } = {
    'not-started': '시작전',
    'to-do': '시작전',
    'todo': '시작전',
    'in-progress': '진행중 40%',
    'progress': '진행중 40%',
    'doing': '진행중 40%',
    'reviewing': '진행중 60%',
    'review': '진행중 60%',
    'pending': '진행중 60%',
    'completed': '완료 100%',
    'done': '완료 100%',
    'finished': '완료 100%',
    'delayed': '진행중 20%',
    'blocked': '진행중 20%',
    'on-hold': '진행중 20%',
    'paused': '진행중 20%'
  };

  // 업무 데이터의 상태를 한국어로 변환 (실제 업무만)
  const normalizedProjectTasks = projectTasks.map(task => ({
    ...task,
    status: statusMapping[task.status.toLowerCase()] || task.status
  }));

  // 하위업무 상태별 계산 (displayTasks 사용)
  const subtaskStats = useMemo(() => {
    // 실제 업무만 계산 (임시 업무 제외)
    const realTasks = displayTasks.filter(task => !(task as any).isTemporary);
    const total = realTasks.length;
    
    console.log(`=== 프로젝트 상세 페이지 "${project?.name}" 업무 현황 계산 ===`);
    console.log(`전체 업무 수: ${total} (임시 업무 제외)`);
    console.log(`표시 업무 수: ${displayTasks.length} (임시 업무 포함)`);
    
    if (total === 0) {
      console.log('실제 업무가 없어서 모든 값을 0으로 반환');
      return { total: displayTasks.length, completed: 0, inProgress: 0, notStarted: displayTasks.length };
    }
    
    // 상태와 진행률을 모두 고려한 분류 (개선된 로직)
    const statusCounts = realTasks.reduce<{ completed: number; inProgress: number; notStarted: number }>((acc, task) => {
      const progress = task.progress || 0;
      const status = task.status;
      
      console.log(`업무 "${task.title}": ${status} (${progress}%)`);
      
      // 1. 완료 조건: 진행률 100% 또는 완료 100% 상태
      if (progress === 100 || status === '완료 100%' || status === '완료') {
        acc.completed++;
        console.log(`→ 완료로 분류 (진행률: ${progress}%, 상태: ${status})`);
      }
      // 2. 진행중 조건: 진행중 20%, 40%, 60%, 80% 상태
      else if (
        status === '진행중 20%' || status === '진행중 40%' || 
        status === '진행중 60%' || status === '진행중 80%' ||
        status === '진행중' ||
        (progress > 0 && progress < 100)
      ) {
        acc.inProgress++;
        console.log(`→ 진행중으로 분류 (진행률: ${progress}%, 상태: ${status})`);
      }
      // 3. 시작전 조건: 시작전 상태 또는 진행률 0%
      else if (status === '시작전' || progress === 0) {
        acc.notStarted++;
        console.log(`→ 시작전으로 분류 (진행률: ${progress}%, 상태: ${status})`);
      }
      // 4. 기타 상태
      else {
        acc.notStarted++;
        console.log(`→ 기타 상태로 시작전으로 분류 (진행률: ${progress}%, 상태: ${status})`);
      }
      
      return acc;
    }, { completed: 0, inProgress: 0, notStarted: 0 });
    
    console.log('최종 통계:', statusCounts);
    console.log('===============================');
    
    return { 
      total: displayTasks.length, // 표시되는 전체 업무 수 (임시 업무 포함)
      completed: statusCounts.completed, 
      inProgress: statusCounts.inProgress, 
      notStarted: total === 0 ? displayTasks.length : statusCounts.notStarted // 실제 업무가 없으면 모든 임시 업무를 시작전으로 표시
    };
  }, [displayTasks]);

  const getSubtaskStats = () => subtaskStats;

  // 필터링된 업무 목록
  const filteredTasks = displayTasks.filter(task => {
    // 임시 업무는 필터링하지 않음
    if ((task as any).isTemporary) return true;
    
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 상태 필터링: statusFilter가 상태 ID인 경우 해당 상태의 이름으로 변환
    let statusToMatch = statusFilter;
    if (statusFilter !== "all") {
      const selectedStatus = projectStatuses.find(status => status.id === statusFilter);
      statusToMatch = selectedStatus ? selectedStatus.name : statusFilter;
    }
    
    const matchesStatus = statusFilter === "all" || task.status === statusToMatch;
    const matchesAssignee = assigneeFilter === "all" || task.assignedTo === assigneeFilter;
    
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  // 정렬된 업무 목록
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // 기본적으로 단계 순서대로 정렬 (stage 정렬이 기본)
    const getStageOrder = (task: Task) => {
      if ((task as any).isTemporary) {
        // 임시 업무는 temp-0 → 1, temp-1 → 2 순서
        const tempIndex = parseInt(task.id.replace('temp-', ''));
        return tempIndex + 1;
      } else {
        // 실제 업무는 단계의 order_index 사용
        const phase = taskPhases.find(p => p.id === task.taskPhase);
        return phase?.order_index || 999;
      }
    };
    
    // 단계 순서가 우선 (stage 정렬일 때)
    if (sortBy === 'stage' || sortBy === 'title') {
      const orderA = getStageOrder(a);
      const orderB = getStageOrder(b);
      
      if (orderA !== orderB) {
        return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
      }
      
      // 같은 단계 내에서는 실제 업무가 임시 업무보다 우선
      if ((a as any).isTemporary && !(b as any).isTemporary) return 1;
      if (!(a as any).isTemporary && (b as any).isTemporary) return -1;
    }
    
    let comparison = 0;
    
    switch (sortBy) {
      case 'stage':
        // 이미 위에서 처리됨
        comparison = 0;
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'assignedTo':
        const nameA = getAssigneeName(a.assignedTo);
        const nameB = getAssigneeName(b.assignedTo);
        comparison = nameA.localeCompare(nameB);
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

  // 편집 관련 함수들
  const handleCellClick = (taskId: string, field: string, currentValue: any) => {
    // 임시 업무의 Stage는 편집 불가
    const task = displayTasks.find(t => t.id === taskId);
    if ((task as any)?.isTemporary && field === 'taskPhase') {
      toast({
        title: "편집 불가",
        description: "기본 프로모션 단계는 편집할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    
    setEditingCell({ taskId, field });
    setEditingValues({ ...editingValues, [`${taskId}_${field}`]: currentValue });
  };

  const handleCellSave = async (taskId: string, field: string) => {
    const key = `${taskId}_${field}`;
    const newValue = editingValues[key];
    
    if (!newValue || newValue === '') {
      toast({
        title: "입력 오류",
        description: "값을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 임시 업무인지 확인
      const isTemporaryTask = taskId.startsWith('temp-');
      
      if (isTemporaryTask) {
        // 임시 업무의 경우 새로운 실제 업무 생성
        const tempTask = displayTasks.find(t => t.id === taskId);
        if (!tempTask || !project) return;

        // 임시 업무의 stageName을 title로 사용
        const tempTaskWithStage = tempTask as any;
        const taskTitle = field === 'title' ? newValue : (tempTaskWithStage.stageName || tempTask.title || '업무명');
        
        // 임시 업무의 프로모션명에 맞는 단계 찾기
        const promotionName = tempTaskWithStage.stageName;
        console.log('🔍 단계 매칭 시작:', {
          promotionName,
          availablePhases: taskPhases.map(p => ({ id: p.id, name: p.name, order_index: p.order_index }))
        });
        
        // 정확한 이름 매칭 우선 시도
        let matchingPhase = taskPhases.find(phase => phase.name === promotionName);
        
        // 정확한 매칭이 없으면 부분 매칭 시도
        if (!matchingPhase) {
          matchingPhase = taskPhases.find(phase => 
            phase.name.includes(promotionName) ||
            promotionName.includes(phase.name)
          );
        }
        
        // 여전히 매칭되는 단계가 없으면 자동으로 생성
        if (!matchingPhase && promotionName) {
          try {
            console.log(`🔧 프로모션명 "${promotionName}"에 맞는 단계가 없어서 자동 생성 시도`);
            
            // 기존 단계 중 가장 높은 order_index 찾기
            const maxOrderIndex = Math.max(...taskPhases.map(p => p.order_index || 0), 0);
            
            // 프로모션명과 동일한 이름의 단계 생성
            const { data: newPhase, error } = await supabase
              .from('task_phases')
              .insert({
                name: promotionName,
                description: `${promotionName} 단계`,
                color: tempTaskWithStage.stageColor || '#3b82f6',
                order_index: maxOrderIndex + 1,
                is_active: true
              })
              .select()
              .single();
            
            if (error) {
              console.error('❌ 단계 생성 오류:', error);
              // 오류가 발생해도 계속 진행 (단계 없이 업무 생성)
            } else {
              console.log('✅ 새로운 단계 생성 성공:', newPhase);
              matchingPhase = newPhase;
              
              // taskPhases 배열에도 추가 (즉시 반영)
              setTaskPhases(prev => [...prev, newPhase]);
              
              toast({
                title: "새로운 단계 생성",
                description: `"${promotionName}" 단계가 자동으로 생성되었습니다.`,
                variant: "default",
              });
            }
          } catch (error) {
            console.error('❌ 단계 자동 생성 실패:', error);
          }
        }
        
        console.log('📊 최종 단계 매칭 결과:', {
          promotionName,
          matchingPhase: matchingPhase ? { 
            id: matchingPhase.id, 
            name: matchingPhase.name, 
            order_index: matchingPhase.order_index 
          } : null
        });
        
        const newTaskData: Omit<Task, 'id'> = {
          title: taskTitle,
          description: tempTask.description || taskTitle, // 설명이 없으면 제목 사용
          status: field === 'status' ? newValue : (tempTask.status || '시작전'),
          priority: tempTask.priority || 'medium',
          progress: tempTask.progress || 0,
          startDate: field === 'startDate' ? newValue : (tempTask.startDate || new Date().toISOString().split('T')[0]),
          dueDate: field === 'dueDate' ? newValue : (tempTask.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
          projectId: project.id,
          assignedTo: field === 'assignedTo' ? newValue : (tempTask.assignedTo || undefined),
          department: field === 'department' ? newValue : (tempTask.department || undefined),
          taskPhase: matchingPhase ? matchingPhase.id : undefined, // 매칭된 단계 설정
          parentTaskId: tempTask.parentTaskId || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // 상태가 변경되는 경우 진행률도 함께 설정
        if (field === 'status') {
          if (newValue === '시작전') {
            newTaskData.progress = 0;
          } else if (newValue === '진행중 20%') {
            newTaskData.progress = 20;
          } else if (newValue === '진행중 40%') {
            newTaskData.progress = 40;
          } else if (newValue === '진행중 60%') {
            newTaskData.progress = 60;
          } else if (newValue === '진행중 80%') {
            newTaskData.progress = 80;
          } else if (newValue === '완료 100%') {
            newTaskData.progress = 100;
          }
        }

        console.log('임시 업무를 실제 업무로 생성:', newTaskData);
        console.log('필드별 값 확인:', {
          field,
          newValue,
          tempTask: tempTaskWithStage,
          project: { id: project.id, name: project.name }
        });

        // 새로운 업무 생성
        const newTaskId = await addTask(newTaskData);
        console.log('새로운 업무 생성 성공, ID:', newTaskId);
        
        toast({
          title: "업무 생성 완료",
          description: `"${taskTitle}" 업무가 성공적으로 생성되었습니다.`,
          variant: "default",
        });
        
        // 약간의 지연 후 자동으로 데이터 새로고침 (임시 업무 제거 및 실제 업무 표시를 위해)
        setTimeout(() => {
          // displayTasks가 자동으로 재계산되도록 강제 업데이트
          console.log('🔄 임시 업무 → 실제 업무 변환 완료, 화면 업데이트 중...');
        }, 500);

      } else {
        // 기존 업무 업데이트
        const updateData: Partial<Task> = {
          [field]: newValue
        };

        // 상태가 변경되는 경우 진행률도 함께 설정
        if (field === 'status') {
          if (newValue === '시작전') {
            updateData.progress = 0;
          } else if (newValue === '진행중 20%') {
            updateData.progress = 20;
          } else if (newValue === '진행중 40%') {
            updateData.progress = 40;
          } else if (newValue === '진행중 60%') {
            updateData.progress = 60;
          } else if (newValue === '진행중 80%') {
            updateData.progress = 80;
          } else if (newValue === '완료 100%') {
            updateData.progress = 100;
          }
          console.log(`상태 변경: ${newValue}, 진행률: ${updateData.progress}%`);
        }

        console.log(`업무 ${taskId}의 ${field}를 ${newValue}로 업데이트`, updateData);

        // AppContext의 updateTask 함수 호출
        await updateTask(taskId, updateData);
        
        toast({
          title: "업무 업데이트 완료",
          description: "업무가 성공적으로 업데이트되었습니다.",
          variant: "default",
        });
      }

      // 편집 상태 종료
      setEditingCell(null);
      setEditingValues({});

    } catch (error) {
      console.error('업무 처리 오류:', error);
      console.error('오류 상세 정보:', {
        taskId,
        field,
        newValue: editingValues[`${taskId}_${field}`],
        isTemporary: taskId.startsWith('temp-'),
        error: error
      });
      
      let errorMessage = "업무 처리 중 오류가 발생했습니다.";
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `오류: ${error.message}`;
      }
      
      toast({
        title: "처리 실패",
        description: errorMessage + " 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValues({});
  };

  const handleAddNewTask = async () => {
    if (!project) return;
    
    // 필수 필드 검증
    if (!newTaskData.title.trim()) {
      toast({
        title: "입력 오류",
        description: "업무명을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 새로운 업무 데이터 준비
      const taskData: Omit<Task, 'id'> = {
        title: newTaskData.title.trim(),
        description: newTaskData.title.trim(), // 설명이 없으면 제목을 사용
        projectId: project.id,
        assignedTo: newTaskData.assignedTo || undefined,
        startDate: new Date().toISOString().split('T')[0], // 오늘 날짜로 시작
        dueDate: newTaskData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 기본 7일 후
        priority: 'medium', // 기본 우선순위
        department: newTaskData.department || 'management',
        status: newTaskData.status || '시작전',
        taskPhase: newTaskData.taskPhase || '',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentTaskId: undefined // 하위 업무가 아닌 메인 업무
      };

      console.log('새로운 업무 생성 데이터:', taskData);

      // AppContext의 addTask 함수 호출
      const newTaskId = await addTask(taskData);
      
      toast({
        title: "업무 생성 완료",
        description: `"${taskData.title}" 업무가 성공적으로 생성되었습니다.`,
        variant: "default",
      });
      
      // 상태 초기화
      setIsAddingNewTask(false);
      setNewTaskData({
        title: '',
        assignedTo: '',
        department: '',
        dueDate: '',
        status: '',
        taskPhase: ''
      });

      // 업무 목록은 실시간 구독으로 자동 업데이트됩니다
      console.log('새로운 업무 ID:', newTaskId);
      
    } catch (error) {
      console.error('업무 생성 오류:', error);
      toast({
        title: "생성 실패",
        description: "업무 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleNewTaskCancel = () => {
    setIsAddingNewTask(false);
    setNewTaskData({
      title: '',
      assignedTo: '',
      department: '',
      dueDate: '',
      status: '',
      taskPhase: ''
    });
  };

  // 업무 삭제 함수 추가
  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    setTaskToDelete({ id: taskId, title: taskTitle });
    setIsTaskDeleteDialogOpen(true);
  };

  // 업무 삭제 확인 함수
  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      // 임시 업무인지 확인
      const isTemporaryTask = taskToDelete.id.startsWith('temp-');
      
      if (isTemporaryTask) {
        // 임시 업무는 실제로 삭제할 것이 없으므로 단순히 성공 메시지만 표시
        toast({
          title: "업무 삭제 완료",
          description: `"${taskToDelete.title}" 항목이 제거되었습니다.`,
          variant: "default",
        });
      } else {
        // 실제 업무 삭제
        await deleteTask(taskToDelete.id);
        
        toast({
          title: "업무 삭제 완료",
          description: `"${taskToDelete.title}" 업무가 성공적으로 삭제되었습니다.`,
          variant: "default",
        });
      }

    } catch (error) {
      console.error('업무 삭제 오류:', error);
      toast({
        title: "삭제 실패",
        description: "업무 삭제 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsTaskDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  // 프로젝트 수정 핸들러
  const handleEditProject = () => {
    setIsEditingProject(true);
  };

  // 프로젝트 수정 완료 핸들러
  const handleProjectUpdateComplete = () => {
    setIsEditingProject(false);
    // 프로젝트 목록 새로고침을 위해 페이지 리로드 또는 상태 업데이트
    window.location.reload();
  };

  // 업무별 첨부 파일 로드
  const loadTaskAttachments = async () => {
    try {
      // 임시 업무 제외하고 실제 업무 ID만 가져오기
      const taskIds = sortedTasks
        .filter(task => !task.id.startsWith('temp-'))
        .map(task => task.id);
      if (taskIds.length === 0) return;

      // task_files와 task_links를 각각 로드
      const [filesResponse, linksResponse] = await Promise.all([
        supabase
          .from('task_files')
          .select('*')
          .in('task_id', taskIds),
        supabase
          .from('task_links')
          .select('*')
          .in('task_id', taskIds)
      ]);

      if (filesResponse.error) {
        console.error('task_files 로드 오류:', filesResponse.error);
        throw filesResponse.error;
      }
      
      if (linksResponse.error) {
        console.error('task_links 로드 오류:', linksResponse.error);
        throw linksResponse.error;
      }

      // 업무별로 첨부 파일 그룹화
      const attachmentsByTask: { [taskId: string]: any[] } = {};
      
      // 파일 첨부 처리
      (filesResponse.data || []).forEach(file => {
        if (!attachmentsByTask[file.task_id]) {
          attachmentsByTask[file.task_id] = [];
        }
        attachmentsByTask[file.task_id].push({
          ...file,
          attachment_type: 'file'
        });
      });

      // 링크 첨부 처리
      (linksResponse.data || []).forEach(link => {
        if (!attachmentsByTask[link.task_id]) {
          attachmentsByTask[link.task_id] = [];
        }
        attachmentsByTask[link.task_id].push({
          ...link,
          attachment_type: 'link',
          link_url: link.url,
          link_title: link.title,
          link_description: link.description
        });
      });

      setTaskAttachments(attachmentsByTask);
    } catch (error) {
      console.error('업무 첨부 파일 로드 오류:', error);
    }
  };

  // 업무 목록이 변경될 때마다 첨부 파일 로드
  useEffect(() => {
    if (sortedTasks.length > 0) {
      loadTaskAttachments();
    }
  }, [sortedTasks.length]);

  // 업무 첨부 파일 관리 다이얼로그 열기
  const handleTaskAttachmentClick = (task: Task) => {
    setSelectedTaskForAttachment(task);
    setIsTaskAttachmentDialogOpen(true);
  };

  // 업무 첨부 파일 업데이트 완료 핸들러
  const handleTaskAttachmentUpdate = () => {
    loadTaskAttachments();
  };

  // 첨부 파일 미리보기 컴포넌트
  const TaskAttachmentPreview = ({ taskId }: { taskId: string }) => {
    const attachments = taskAttachments[taskId] || [];
    const fileAttachments = attachments.filter(att => att.attachment_type === 'file');
    const linkAttachments = attachments.filter(att => att.attachment_type === 'link');
    
    if (attachments.length === 0) {
      return (
        <div className="flex items-center justify-center text-gray-400">
          <span className="text-xs">-</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {/* 파일 첨부 표시 */}
        {fileAttachments.length > 0 && (
          <div className="flex items-center gap-1">
            <Paperclip className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-blue-600 font-medium">{fileAttachments.length}</span>
          </div>
        )}
        
        {/* 링크 첨부 표시 */}
        {linkAttachments.length > 0 && (
          <div className="flex items-center gap-1">
            <LinkIcon className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-600 font-medium">{linkAttachments.length}</span>
          </div>
        )}
        
        {/* 첨부 파일 미리보기 (최대 3개) */}
        <div className="flex gap-1">
          {attachments.slice(0, 3).map((attachment, index) => {
            if (attachment.attachment_type === 'file') {
              const isImage = attachment.file_type?.startsWith('image/');
              const isPdf = attachment.file_type?.includes('pdf');
              
              return (
                <div
                  key={attachment.id}
                  className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 cursor-pointer"
                  title={attachment.file_name}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(attachment.file_url, '_blank');
                  }}
                >
                  {isImage ? (
                    <ImageIcon className="h-3 w-3 text-blue-500" />
                  ) : isPdf ? (
                    <FileText className="h-3 w-3 text-red-500" />
                  ) : (
                    <FileText className="h-3 w-3 text-gray-500" />
                  )}
                </div>
              );
            } else if (attachment.attachment_type === 'link') {
              return (
                <div
                  key={attachment.id}
                  className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 cursor-pointer"
                  title={attachment.link_title}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(attachment.link_url, '_blank');
                  }}
                >
                  <ExternalLink className="h-3 w-3 text-green-500" />
                </div>
              );
            }
            return null;
          })}
          
          {/* 더 많은 첨부 파일이 있는 경우 표시 */}
          {attachments.length > 3 && (
            <div className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center bg-gray-100 text-xs text-gray-600">
              +{attachments.length - 3}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 파일 업로드 핸들러
  const handleFileUpload = async (files: FileList) => {
    console.log('🚀 handleFileUpload 함수 시작');
    console.log('📋 받은 files 객체:', files);
    console.log('📋 files 타입:', typeof files);
    console.log('📋 files.length:', files?.length);
    console.log('📋 project 존재:', !!project);
    console.log('📋 project ID:', project?.id);

    if (!project) {
      console.error('❌ 프로젝트가 없습니다');
      return;
    }

    if (!files) {
      console.error('❌ files 객체가 null/undefined입니다');
      return;
    }

    if (files.length === 0) {
      console.error('❌ 파일이 선택되지 않았습니다 (files.length = 0)');
      return;
    }

    // ⭐ 핵심 수정: FileList를 즉시 Array로 변환하여 안전하게 보관
    const fileArray = Array.from(files);
    console.log('🔄 FileList를 Array로 변환 완료:', {
      originalLength: files.length,
      convertedLength: fileArray.length,
      fileNames: fileArray.map(f => f.name)
    });

    console.log('📤 파일 업로드 시작:', { 
      projectId: project.id, 
      fileCount: fileArray.length,
      fileNames: fileArray.map(f => f.name),
      fileSizes: fileArray.map(f => f.size)
    });

    setIsUploading(true);
    try {
      // 현재 사용자 확인
      console.log('🔍 사용자 인증 시작...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      console.log('📋 인증 결과:', { user: !!user, userError });
      if (user) {
        console.log('👤 사용자 정보:', { id: user.id, email: user.email });
      }
      
      if (userError) {
        console.error('❌ 사용자 인증 API 오류:', userError);
        toast({
          title: "인증 API 오류",
          description: `인증 확인 중 오류가 발생했습니다: ${userError.message}`,
          variant: "destructive",
        });
        return;
      }

      if (!user) {
        console.error('❌ 사용자가 로그인되지 않음');
        toast({
          title: "로그인 필요",
          description: "파일 업로드를 위해 로그인이 필요합니다.",
          variant: "destructive",
        });
        return;
      }
      console.log('✅ 사용자 인증 확인:', user.id);

      let successCount = 0;
      const totalFiles = fileArray.length; // 배열 사용

      console.log('🔄 파일 처리 루프 시작');
      console.log('📊 totalFiles:', totalFiles);
      console.log('📊 fileArray 상세:', fileArray);

      for (let i = 0; i < fileArray.length; i++) { // 배열 사용
        const file = fileArray[i]; // 배열 사용
        console.log(`🚀 === 파일 ${i + 1}/${totalFiles} 처리 시작 ===`);
        console.log(`📁 파일 정보:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
        
        // 파일 크기 제한 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`⚠️ 파일 크기 초과: ${file.name} (${file.size} bytes)`);
          toast({
            title: "파일 크기 초과",
            description: `${file.name}은(는) 10MB를 초과합니다.`,
            variant: "destructive",
          });
          continue;
        }

        console.log('✅ 파일 크기 검사 통과');

        // 파일명 생성 (타임스탬프 + 원본 파일명)
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        console.log(`🏷️ 생성된 파일명: ${fileName}`);
        
        // 1. Supabase Storage에 업로드
        console.log(`☁️ Storage 업로드 시작...`);
        console.log(`📁 파일 정보:`, {
          name: fileName,
          originalName: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(fileName, file, {
            contentType: file.type || 'application/octet-stream',
            upsert: true,  // 같은 이름 파일이 있으면 덮어쓰기
            duplex: 'half'
          });

        if (uploadError) {
          console.error('❌ Storage 업로드 오류 상세:', {
            error: uploadError,
            message: uploadError.message
          });
          
          // 더 상세한 에러 메시지 제공
          let errorMessage = `${file.name} 업로드 실패`;
          if (uploadError.message?.includes('duplicate')) {
            errorMessage += ': 같은 이름의 파일이 이미 존재합니다';
          } else if (uploadError.message?.includes('size')) {
            errorMessage += ': 파일 크기가 너무 큽니다';
          } else if (uploadError.message?.includes('type')) {
            errorMessage += ': 허용되지 않는 파일 형식입니다';
          } else {
            errorMessage += `: ${uploadError.message}`;
          }
          
          toast({
            title: "업로드 실패",
            description: errorMessage,
            variant: "destructive",
          });
          continue;
        }
        
        console.log('✅ Storage 업로드 성공:', uploadData);

        // 2. Storage URL 생성
        const { data: urlData } = supabase.storage
          .from('project-files')
          .getPublicUrl(fileName);
        
        const fileUrl = urlData.publicUrl;
        console.log('🔗 파일 URL 생성:', fileUrl);

        // 3. project_attachments 테이블에 직접 저장 (간소화된 방식)
        console.log('💾 project_attachments 테이블에 저장 중...');
        
        // 저장할 데이터 준비 (필수 필드만)
        const attachmentData = {
          project_id: project.id,
          file_name: file.name,
          file_url: fileUrl,
          file_size: file.size,
          file_path: uploadData.path,
          content_type: file.type,
          description: `업로드된 파일: ${file.name}`,
        };
        
        console.log('📋 저장할 데이터:', attachmentData);
        
        // project_attachments에 직접 저장 (간소화된 방식)
        const { data: attachmentResult, error: attachmentError } = await supabase
          .from('project_attachments')
          .insert(attachmentData)
          .select()
          .single();

        if (attachmentError) {
          console.error('❌ project_attachments 저장 오류 상세:', {
            error: attachmentError,
            message: attachmentError.message,
            details: attachmentError.details,
            hint: attachmentError.hint,
            code: attachmentError.code
          });
          
          // 간소화된 버전으로 재시도 (필수 필드만)
          console.log('🔄 간소화된 버전으로 재시도...');
          const simpleData = {
            project_id: project.id,
            file_name: file.name,
            file_url: fileUrl
          };
          
          console.log('📋 간소화된 데이터:', simpleData);
          
          const { error: simpleError } = await supabase
            .from('project_attachments')
            .insert(simpleData);

          if (simpleError) {
            console.error('❌ 간소화된 저장도 실패:', simpleError);
            toast({
              title: "저장 실패",
              description: `${file.name} 저장 중 오류: ${simpleError.message}`,
              variant: "destructive",
            });
            continue;
          } else {
            console.log('✅ 간소화된 저장 성공');
            successCount++;
          }
        } else {
          console.log('✅ project_attachments 저장 성공:', attachmentResult);
          successCount++;
        }
      }

      // 4. 파일 목록 새로고침
      console.log('🔄 파일 목록 새로고침 중...');
      await loadProjectFiles();
      
      // 성공 메시지
      if (successCount > 0) {
        toast({
          title: "업로드 완료",
          description: `${successCount}개의 파일이 성공적으로 업로드되었습니다.`,
        });
        console.log(`✅ 업로드 완료: ${successCount}/${totalFiles} 파일 성공`);
      } else {
        toast({
          title: "업로드 실패",
          description: "모든 파일 업로드가 실패했습니다.",
          variant: "destructive",
        });
        console.log('❌ 모든 파일 업로드 실패');
      }

    } catch (error) {
      console.error('💥 파일 업로드 중 예외 발생:', error);
      console.error('💥 에러 타입:', typeof error);
      console.error('💥 에러 메시지:', (error as any)?.message);
      console.error('💥 에러 스택:', (error as any)?.stack);
      console.error('💥 에러 전체:', error);
      
      toast({
        title: "업로드 실패",
        description: `파일 업로드 중 예기치 않은 오류가 발생했습니다: ${(error as any)?.message || '알 수 없는 오류'}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      console.log('🏁 파일 업로드 프로세스 종료');
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    console.log('🖱️ 드래그 오버 이벤트');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    console.log('🖱️ 드래그 리브 이벤트');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    console.log('📥 드롭 이벤트 발생');
    console.log('📋 dataTransfer:', e.dataTransfer);
    console.log('📋 dataTransfer.files:', e.dataTransfer.files);
    console.log('📋 dataTransfer.files.length:', e.dataTransfer.files.length);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      console.log('✅ 드롭된 파일들:', Array.from(files).map(f => ({ name: f.name, size: f.size })));
      handleFileUpload(files);
    } else {
      console.error('❌ 드롭된 파일이 없습니다');
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 파일 선택 이벤트 발생');
    console.log('📋 input element:', e.target);
    console.log('📋 e.target.files:', e.target.files);
    console.log('📋 e.target.files?.length:', e.target.files?.length);
    
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('✅ 선택된 파일들:', Array.from(files).map(f => ({ name: f.name, size: f.size })));
      handleFileUpload(files);
    } else {
      console.error('❌ 선택된 파일이 없습니다');
    }
    // input 값 초기화
    e.target.value = '';
  };

  // 파일 삭제 핸들러
  const handleFileDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`"${fileName}" 파일을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      console.log('🗑️ 파일 삭제 시작:', { fileId, fileName });

      // project_attachments에서 파일 정보 조회
      const { data: attachment, error: fetchError } = await supabase
        .from('project_attachments')
        .select('*')

        .eq('id', fileId)
        .single();

      if (fetchError || !attachment) {
        console.error('❌ 파일 정보 조회 실패:', fetchError);
        toast({
          title: "삭제 실패",
          description: "파일 정보를 찾을 수 없습니다.",
          variant: "destructive",
        });
        return;
      }

      // Storage에서 파일 삭제 (file_path가 있는 경우)
      if (attachment.file_path) {
        console.log('☁️ Storage에서 파일 삭제 중...', attachment.file_path);
        const { error: storageError } = await supabase.storage
          .from('project-files')
          .remove([attachment.file_path]);

        if (storageError) {
          console.warn('⚠️ Storage 파일 삭제 실패:', storageError);
          // Storage 삭제 실패해도 DB 레코드는 삭제 진행
        } else {
          console.log('✅ Storage 파일 삭제 성공');
        }
      }

      // project_attachments에서 레코드 삭제
      console.log('💾 DB에서 파일 레코드 삭제 중...');
      const { error: deleteError } = await supabase
        .from('project_attachments')
        .delete()
        .eq('id', fileId);

      if (deleteError) {
        console.error('❌ DB 레코드 삭제 실패:', deleteError);
        toast({
          title: "삭제 실패",
          description: `파일 삭제 중 오류가 발생했습니다: ${deleteError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ 파일 삭제 완료');
      toast({
        title: "삭제 완료",
        description: `"${fileName}" 파일이 삭제되었습니다.`,
      });

      // 파일 목록 새로고침
      await loadProjectFiles();

    } catch (error) {
      console.error('💥 파일 삭제 중 오류:', error);
      toast({
        title: "삭제 실패",
        description: "파일 삭제 중 예기치 않은 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 댓글 관련 핸들러들
  const handleCommentClick = (task: Task) => {
    const currentCount = commentClickCounts[task.id] || 0;
    const newCount = currentCount + 1;
    
    setCommentClickCounts(prev => ({
      ...prev,
      [task.id]: newCount
    }));

    if (expandedRowId === task.id) {
      if (newCount >= 2) {
        // 2회 클릭: 슬라이드 오버 열기
        setSelectedTaskForProgress(task);
        setIsProgressSidebarOpen(true);
        setExpandedRowId(null); // 인라인 댓글 박스 닫기
        // 클릭 카운트 리셋
        setTimeout(() => {
          setCommentClickCounts(prev => ({
            ...prev,
            [task.id]: 0
          }));
        }, 100);
      }
    } else {
      // 1회 클릭: 인라인 댓글 박스 열기
      setExpandedRowId(task.id);
      // 2초 후 클릭 카운트 리셋
      setTimeout(() => {
        setCommentClickCounts(prev => ({
          ...prev,
          [task.id]: 0
        }));
      }, 2000);
    }
  };

  const handleInlineCommentSubmit = async (comment: string, files: File[]) => {
    if (!currentUser) {
      toast({
        title: "오류",
        description: "로그인이 필요합니다.",
        variant: "destructive"
      });
      return;
    }

    try {
      // 현재 업무 정보 가져오기
      const currentTask = tasks.find(t => t.id === expandedRowId);
      
      // 데이터베이스에 댓글 저장
      const { data: commentData, error: commentError } = await supabase
        .from('task_comments')
        .insert([{
          task_id: expandedRowId, // 현재 열려있는 행의 task_id 사용
          author_id: currentUser.id,
          author_name: currentUser.name,
          content: comment
        }])
        .select('id')
        .single();

      if (commentError) {
        console.error('인라인 댓글 저장 오류:', commentError);
        throw commentError;
      }

      // 파일이 있다면 처리 (추후 구현)
      if (files.length > 0) {
        console.log('첨부파일 처리 예정:', files);
        // TODO: 파일 업로드 및 댓글 첨부파일 연결 로직 구현
      }

      // 알림 생성
      await createNotification(
        'comment',
        `${currentUser.name}님이 "${currentTask?.title || '업무'}" 업무에 댓글을 추가했습니다: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`,
        currentUser.id
      );

      toast({
        title: "성공",
        description: "댓글이 등록되었습니다.",
      });

      // 댓글 박스 닫기
      setExpandedRowId(null);

    } catch (error) {
      console.error('인라인 댓글 제출 오류:', error);
      toast({
        title: "오류",
        description: "댓글 등록에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTask(taskId, updates);
      toast({
        title: "성공",
        description: "업무가 업데이트되었습니다.",
      });
    } catch (error) {
      console.error('업무 업데이트 오류:', error);
      toast({
        title: "오류",
        description: "업무 업데이트에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // 텔레그램 메시지 생성 함수
  const generateTelegramMessage = () => {
    if (!project) return '';

    const today = new Date().toLocaleDateString('ko-KR');
    const stageInfo = getPromotionStageText(project);
    
    // 업무 상태별 분류
    const completedTasks = sortedTasks.filter(task => task.status === '완료 100%' || task.progress === 100);
    const inProgressTasks = sortedTasks.filter(task => 
      task.status !== '완료 100%' && 
      task.progress !== 100 && 
      task.status !== '시작전' && 
      task.status !== '시작전 0%'
    );
    const notStartedTasks = sortedTasks.filter(task => 
      task.status === '시작전' || 
      task.status === '시작전 0%' || 
      task.progress === 0
    );
    const overdueTasks = sortedTasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < new Date() && 
      task.status !== '완료 100%' && 
      task.progress !== 100
    );

    let message = `📊 **${project.name} 프로젝트 현황 보고**\n`;
    message += `📅 보고일: ${today}\n`;
    message += `🎯 프로모션 단계: ${stageInfo.name}\n`;
    message += `📈 전체 진행률: ${actualProgress}%\n`;
    message += `👤 담당자: ${getManagerName(project.managerId)}\n`;
    message += `🏢 부서: ${getDepartmentName(project.department)}\n\n`;

    // 전체 업무 요약
    message += `📋 **업무 현황 요약**\n`;
    message += `• 전체 업무: ${sortedTasks.length}개\n`;
    message += `• ✅ 완료: ${completedTasks.length}개\n`;
    message += `• 🔄 진행중: ${inProgressTasks.length}개\n`;
    message += `• ⏸️ 시작전: ${notStartedTasks.length}개\n`;
    if (overdueTasks.length > 0) {
      message += `• ⚠️ 지연: ${overdueTasks.length}개\n`;
    }
    message += `\n`;

    // 지연 업무가 있는 경우 상세 표시
    if (overdueTasks.length > 0) {
      message += `🚨 **지연 업무 상세**\n`;
      overdueTasks.forEach((task, index) => {
        const daysOverdue = Math.ceil((new Date().getTime() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24));
        const phaseInfo = getTaskPhaseInfo(task.taskPhase);
        message += `${index + 1}. ${task.title}\n`;
        message += `   • 담당: ${getAssigneeName(task.assignedTo)}\n`;
        message += `   • 단계: ${phaseInfo.name}\n`;
        message += `   • 지연: ${daysOverdue}일\n`;
        message += `   • 상태: ${task.status}\n\n`;
      });
    }

    // 진행중인 업무 상세
    if (inProgressTasks.length > 0) {
      message += `🔄 **진행중인 업무**\n`;
      inProgressTasks.slice(0, 5).forEach((task, index) => { // 최대 5개만 표시
        const phaseInfo = getTaskPhaseInfo(task.taskPhase);
        message += `${index + 1}. ${task.title}\n`;
        message += `   • 담당: ${getAssigneeName(task.assignedTo)}\n`;
        message += `   • 단계: ${phaseInfo.name}\n`;
        message += `   • 상태: ${task.status}\n`;
        message += `   • 마감: ${formatDate(task.dueDate)}\n\n`;
      });
      
      if (inProgressTasks.length > 5) {
        message += `   ... 외 ${inProgressTasks.length - 5}개 업무\n\n`;
      }
    }

    // 최근 완료된 업무 (최대 3개)
    if (completedTasks.length > 0) {
      message += `✅ **최근 완료 업무**\n`;
      completedTasks.slice(0, 3).forEach((task, index) => {
        message += `${index + 1}. ${task.title} (${getAssigneeName(task.assignedTo)})\n`;
      });
      
      if (completedTasks.length > 3) {
        message += `   ... 외 ${completedTasks.length - 3}개 완료\n`;
      }
      message += `\n`;
    }

    message += `📊 **프로젝트 정보**\n`;
    message += `• 시작일: ${formatDate(project.startDate)}\n`;
    message += `• 마감일: ${formatDate(project.dueDate)}\n`;
    
    // 프로젝트 설명이 있으면 추가
    if (project.description) {
      message += `• 설명: ${project.description}\n`;
    }

    message += `\n---\n`;
    message += `🤖 자동 생성된 보고서입니다.`;

    return message;
  };

  // 텔레그램 발송 함수
  const sendToTelegram = async () => {
    if (!project) return;

    setIsSendingTelegram(true);
    try {
      const message = generateTelegramMessage();
      
      // 외부 알림 관리에서 텔레그램 발송 API 호출
      const response = await fetch('/api/telegram/send-project-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          projectName: project.name,
          message: message,
          // 자동 매칭을 위한 담당자 정보
          managerName: getManagerName(project.managerId),
          managerEmail: (project as any).managerEmail || '',
        }),
      });

      if (!response.ok) {
        throw new Error('텔레그램 발송 실패');
      }

      const result = await response.json();
      
      toast({
        title: "텔레그램 발송 완료",
        description: `프로젝트 현황이 텔레그램으로 발송되었습니다.`,
        variant: "default",
      });

      console.log('텔레그램 발송 결과:', result);

    } catch (error) {
      console.error('텔레그램 발송 오류:', error);
      toast({
        title: "발송 실패",
        description: "텔레그램 발송 중 오류가 발생했습니다. 외부 알림 관리에서 설정을 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSendingTelegram(false);
    }
  };

  // 프로젝트 데이터 디버깅
  useEffect(() => {
    if (project) {
      console.log('=== 프로젝트 데이터 디버깅 ===');
      console.log('프로젝트 전체 데이터:', project);
      console.log('프로젝트 department 필드:', project.department);
      console.log('프로젝트 department_id 필드:', (project as any).department_id);
      console.log('프로젝트 manager 필드:', project.manager);
      console.log('프로젝트 managerId 필드:', project.managerId);
      console.log('==============================');
    }
  }, [project]);

  return (
    <div className="p-6 w-full">
      {!project ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">프로젝트를 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-4">요청한 프로젝트가 존재하지 않거나 삭제되었습니다.</p>
            <Button onClick={() => navigate('/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              프로젝트 목록으로 돌아가기
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/projects')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                프로젝트 목록
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {canDelete && (
                <>
                  {/* 수정 버튼 추가 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditProject}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    수정
                  </Button>

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
                    <div className="flex flex-col gap-3 bg-red-50 px-5 py-4 rounded-lg border border-red-200 shadow-lg min-w-[280px]">
                      <div className="text-center">
                        <span className="text-sm text-red-700 font-medium block">정말 삭제하시겠습니까?</span>
                        {projectTasks.length > 0 && (
                          <span className="text-xs text-red-600 mt-1 block">
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
            </div>
          </div>

          <div className="space-y-6">
            {/* 프로젝트 이미지와 첨부 파일 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 왼쪽: 프로젝트 이미지 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">프로젝트 이미지</h3>
                  
                  {project.image ? (
                    <div className="w-full">
                      <img 
                        src={project.image} 
                        alt={`${project.name} 이미지`}
                        className="w-full h-64 object-contain rounded-lg shadow-md bg-gray-50 border border-gray-200"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm text-gray-500">프로젝트 이미지가 없습니다</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 오른쪽: 파일 업로드 및 관리 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">파일 관리</h3>
                  
                  {/* 파일 업로드 영역 */}
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer relative",
                      isDragOver 
                        ? "border-blue-500 bg-blue-100" 
                        : "border-blue-300 bg-blue-50 hover:bg-blue-100",
                      isUploading && "pointer-events-none opacity-50"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload-input')?.click()}
                  >
                    <input
                      id="file-upload-input"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="*/*"
                    />
                    <div className="text-center">
                      <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        {isUploading ? (
                          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                        ) : (
                          <Plus className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <h4 className="text-lg font-medium text-blue-900 mb-2">
                        {isUploading ? "업로드 중..." : "파일 업로드"}
                      </h4>
                      <p className="text-sm text-blue-700 mb-4">
                        {isDragOver 
                          ? "파일을 여기에 놓으세요" 
                          : "드래그하여 업로드 해주세요"
                        }
                      </p>
                      <p className="text-xs text-blue-600">
                        또는 클릭하여 파일 선택 (최대 10MB)
                      </p>
                    </div>
                  </div>

                  {/* 첨부 파일 리스트 */}
                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-900">첨부 파일 리스트</h4>
                    
                    {isLoadingFiles ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-sm text-gray-500">파일을 불러오는 중...</span>
                      </div>
                    ) : projectFiles.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {projectFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {file.type === 'pdf' ? (
                                <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                              ) : file.type === 'image' ? (
                                <ImageIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                              ) : (
                                <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p 
                                  className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
                                  onClick={() => window.open(file.url, '_blank')}
                                  title="클릭하여 새창에서 열기"
                                >
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {file.type === 'pdf' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handlePDFClick(file)}
                                  title="미리보기"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => window.open(file.url, '_blank')}
                                title="다운로드"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleFileDelete(file.id, file.name)}
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500 border border-gray-200 rounded-lg">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">첨부된 파일이 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 프로젝트 기본 정보 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">프로젝트 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">프로모션 단계</label>
                    <div className="mt-1">
                      {(() => {
                        const stageInfo = getPromotionStageText(project);
                        return (
                          <Badge 
                            variant="outline" 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${stageInfo.color}40`,
                              borderColor: stageInfo.color,
                              color: stageInfo.color,
                              fontWeight: 600
                            }}
                          >
                            {stageInfo.name}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">시작일</label>
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(project.startDate)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">마감일</label>
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(project.dueDate)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">부서</label>
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                      {getDepartmentName(project.department)}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">진행률</label>
                  <div className="mt-1 space-y-2">
                    {/* 메인 진행률 바 */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${actualProgress}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold text-gray-900 min-w-[3rem]">{actualProgress}%</span>
                    </div>
                    
                    {/* 하위 업무 기반 진행률 설명 */}
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>하위 업무 {projectTasks.length}개를 기반으로 계산된 총 진행률</span>
                    </div>
                    
                    {/* 진행률 세부 정보 */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">완료: {getSubtaskStats().completed}개</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-600">진행중: {getSubtaskStats().inProgress}개</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-gray-600">시작전: {getSubtaskStats().notStarted}개</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">담당자</label>
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {getManagerName(project.managerId)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">부서</label>
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                      {getDepartmentName(project.department)}
                    </div>
                  </div>
                </div>

                {project.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">설명</label>
                    <div 
                      className="mt-1 text-sm text-gray-900 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 필터 및 검색 */}
            <div ref={editingRef} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  하위 업무 ({getSubtaskStats().total}개)
                </h3>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={forceRefreshData}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    데이터 새로고침
                  </Button>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <span className="text-gray-600">시작전: {getSubtaskStats().notStarted}개</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                      <span className="text-gray-600">진행중: {getSubtaskStats().inProgress}개</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <span className="text-gray-600">완료: {getSubtaskStats().completed}개</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 필터 컨트롤 */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="relative flex-1 min-w-64">
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
                    {projectStatuses.map(status => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getStatusColor(status.name) }}
                          ></div>
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="담당자 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 담당자</SelectItem>
                    {assigneeOptions.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 업무 목록 */}
              {sortedTasks.length > 0 || isAddingNewTask ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto min-w-[1200px]">
                    <table className="w-full table-fixed min-w-[1200px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-48"
                            onClick={() => handleSort('stage')}
                          >
                            <div className="flex items-center gap-1">
                              Stage
                              {sortBy === 'stage' && (
                                sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-64"
                            onClick={() => handleSort('title')}
                          >
                            <div className="flex items-center gap-1">
                              Task Name
                              {sortBy === 'title' && (
                                sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-32"
                            onClick={() => handleSort('assignedTo')}
                          >
                            <div className="flex items-center gap-1">
                              담당
                              {sortBy === 'assignedTo' && (
                                sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                              )}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                            부서
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-32"
                            onClick={() => handleSort('dueDate')}
                          >
                            <div className="flex items-center gap-1">
                              Due Date
                              {sortBy === 'dueDate' && (
                                sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-28"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center gap-1">
                              상태
                              {sortBy === 'status' && (
                                sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                              )}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                            OverDue
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                            자료 Link
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                            액션
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedTasks.flatMap((task, index) => {
                          const phaseInfo = getTaskPhaseInfo(task.taskPhase);
                          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== '완료 100%' && task.progress !== 100;
                          
                          const rows = [
                              <tr key={task.id} className={`group hover:bg-gray-50`}>
                              {/* Stage */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {getTaskStageNumber(task)}.
                                  </span>
                                  <button
                                    onClick={() => handleCommentClick(task)}
                                    className="p-1 hover:bg-blue-100 rounded transition-colors"
                                    title="댓글 (1회 클릭: 간단 댓글, 2회 클릭: 상세 보기)"
                                  >
                                    <MessageCircle className="w-4 h-4 text-blue-600 hover:text-blue-700" />
                                  </button>
                                  <div 
                                    className={`rounded px-2 py-1 transition-colors ${(task as any).isTemporary ? '' : 'cursor-pointer hover:bg-gray-100'}`}
                                    onClick={() => !(task as any).isTemporary && handleCellClick(task.id, 'taskPhase', task.taskPhase)}
                                  >
                                    {editingCell?.taskId === task.id && editingCell?.field === 'taskPhase' ? (
                                      <div className="flex items-center gap-2">
                                        <Select 
                                          key={`${task.id}_taskPhase`}
                                          value={editingValues[`${task.id}_taskPhase`] || undefined} 
                                          onValueChange={(value) => setEditingValues({...editingValues, [`${task.id}_taskPhase`]: value})}
                                        >
                                          <SelectTrigger className="w-32 h-8">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {taskPhases.map(phase => (
                                              <SelectItem key={phase.id} value={phase.id}>
                                                {phase.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Button size="sm" className="h-6 w-6 p-0" onClick={() => handleCellSave(task.id, 'taskPhase')}>
                                          <Check className="h-3 w-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCellCancel}>
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs font-semibold"
                                        style={{ 
                                          backgroundColor: (task as any).isTemporary ? `${(task as any).stageColor}40` : `${phaseInfo.color}40`,
                                          borderColor: (task as any).isTemporary ? (task as any).stageColor : phaseInfo.color,
                                          color: (task as any).isTemporary ? (task as any).stageColor : phaseInfo.color,
                                          fontWeight: 600
                                        }}
                                      >
                                        {(task as any).isTemporary ? (task as any).stageName : phaseInfo.name}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </td>
                              
                              {/* Task Name */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div 
                                  className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                                  onClick={() => handleCellClick(task.id, 'title', task.title)}
                                >
                                  {editingCell?.taskId === task.id && editingCell?.field === 'title' ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        key={`${task.id}_title`}
                                        value={editingValues[`${task.id}_title`] || ''}
                                        onChange={(e) => setEditingValues({...editingValues, [`${task.id}_title`]: e.target.value})}
                                        className="h-8"
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
                                    (task as any).isTemporary && !task.title ? (
                                      <Input
                                        placeholder="업무명을 입력하세요"
                                        className="h-8 text-sm"
                                        onBlur={(e) => {
                                          if (e.target.value) {
                                            setEditingValues({...editingValues, [`${task.id}_title`]: e.target.value});
                                            handleCellSave(task.id, 'title');
                                          }
                                        }}
                                        onChange={(e) => setEditingValues({...editingValues, [`${task.id}_title`]: e.target.value})}
                                        value={editingValues[`${task.id}_title`] || ''}
                                      />
                                    ) : (
                                      <div className="text-sm font-medium text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                                        {task.title || '업무명을 입력하세요'}
                                        <Edit3 className="h-3 w-3 ml-2 inline opacity-0 group-hover:opacity-50" />
                                      </div>
                                    )
                                  )}
                                </div>
                              </td>
                              
                              {/* 담당 */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div 
                                  className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                                  onClick={() => handleCellClick(task.id, 'assignedTo', task.assignedTo)}
                                >
                                  {editingCell?.taskId === task.id && editingCell?.field === 'assignedTo' ? (
                                    <div className="flex items-center gap-2">
                                      <Select 
                                        key={`${task.id}_assignedTo`}
                                        value={editingValues[`${task.id}_assignedTo`] || undefined} 
                                        onValueChange={(value) => setEditingValues({...editingValues, [`${task.id}_assignedTo`]: value})}
                                      >
                                        <SelectTrigger className="w-32 h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {assigneeOptions.map(person => (
                                            <SelectItem key={person.id} value={person.id}>
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
                                    (task as any).isTemporary && !task.assignedTo ? (
                                      <Select 
                                        value={task.assignedTo || undefined} 
                                        onValueChange={(value) => {
                                          setEditingValues({...editingValues, [`${task.id}_assignedTo`]: value});
                                          handleCellSave(task.id, 'assignedTo');
                                        }}
                                      >
                                        <SelectTrigger className="w-32 h-8">
                                          <SelectValue placeholder="담당자 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {assigneeOptions.map(person => (
                                            <SelectItem key={person.id} value={person.id}>
                                              {person.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center">
                                          <User className="h-3 w-3 text-gray-600" />
                                        </div>
                                        <div className="ml-2">
                                          <div className="text-sm font-medium text-gray-900">
                                            {getAssigneeName(task.assignedTo)}
                                          </div>
                                        </div>
                                        <Edit3 className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-50" />
                                      </div>
                                    )
                                  )}
                                </div>
                              </td>
                              
                              {/* 부서 */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div 
                                  className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                                  onClick={() => handleCellClick(task.id, 'department', task.department)}
                                >
                                  {editingCell?.taskId === task.id && editingCell?.field === 'department' ? (
                                    <div className="flex items-center gap-2">
                                      <Select 
                                        key={`${task.id}_department`}
                                        value={editingValues[`${task.id}_department`] || undefined} 
                                        onValueChange={(value) => setEditingValues({...editingValues, [`${task.id}_department`]: value})}
                                      >
                                        <SelectTrigger className="w-32 h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {departmentOptions.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>
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
                                    (task as any).isTemporary && !task.department ? (
                                      <Select 
                                        value={task.department || undefined} 
                                        onValueChange={(value) => {
                                          setEditingValues({...editingValues, [`${task.id}_department`]: value});
                                          handleCellSave(task.id, 'department');
                                        }}
                                      >
                                        <SelectTrigger className="w-32 h-8">
                                          <SelectValue placeholder="부서 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {departmentOptions.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                              {dept.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <span className="text-sm text-gray-900">
                                        {getDepartmentName(task.department)}
                                        <Edit3 className="h-3 w-3 ml-2 inline opacity-0 group-hover:opacity-50" />
                                      </span>
                                    )
                                  )}
                                </div>
                              </td>
                              
                              {/* Due Date */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div 
                                  className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                                  onClick={() => handleCellClick(task.id, 'dueDate', task.dueDate)}
                                >
                                  {editingCell?.taskId === task.id && editingCell?.field === 'dueDate' ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        key={`${task.id}_dueDate`}
                                        type="date"
                                        value={editingValues[`${task.id}_dueDate`] || ''}
                                        onChange={(e) => setEditingValues({...editingValues, [`${task.id}_dueDate`]: e.target.value})}
                                        className="h-8 w-36"
                                      />
                                      <Button size="sm" className="h-6 w-6 p-0" onClick={() => handleCellSave(task.id, 'dueDate')}>
                                        <Check className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCellCancel}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    (task as any).isTemporary && !task.dueDate ? (
                                      <Input
                                        type="date"
                                        value={task.dueDate || ''}
                                        onChange={(e) => {
                                          setEditingValues({...editingValues, [`${task.id}_dueDate`]: e.target.value});
                                          handleCellSave(task.id, 'dueDate');
                                        }}
                                        className="h-8 w-36"
                                        placeholder="날짜 선택"
                                      />
                                    ) : (
                                      <span className="text-sm text-gray-900">
                                        {formatDate(task.dueDate)}
                                        <Edit3 className="h-3 w-3 ml-2 inline opacity-0 group-hover:opacity-50" />
                                      </span>
                                    )
                                  )}
                                </div>
                              </td>
                              
                              {/* 상태 */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div 
                                  className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                                  onClick={() => handleCellClick(task.id, 'status', task.status)}
                                >
                                  {editingCell?.taskId === task.id && editingCell?.field === 'status' ? (
                                    <div className="flex items-center gap-2">
                                      <Select 
                                        key={`${task.id}_status`}
                                        value={editingValues[`${task.id}_status`] || undefined} 
                                        onValueChange={(value) => setEditingValues({...editingValues, [`${task.id}_status`]: value})}
                                      >
                                        <SelectTrigger className="w-24 h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {statusOptions.map(status => (
                                            <SelectItem key={status} value={status}>
                                              <div className="flex items-center gap-2">
                                                <div 
                                                  className="w-2 h-2 rounded-full"
                                                  style={{ backgroundColor: getStatusColor(status) }}
                                                ></div>
                                                {status}
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
                                      <span className="text-sm text-gray-900">{task.status}</span>
                                      <Edit3 className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-50" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              
                              {/* OverDue */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                {task.status === '완료 100%' || task.progress === 100 ? (
                                  <div className="flex items-center text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    <span className="text-xs font-medium">완료</span>
                                  </div>
                                ) : isOverdue ? (
                                  <div className="flex items-center text-red-600">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    <span className="text-xs font-medium">
                                      {Math.ceil((new Date().getTime() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24))}일 지연
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    <span className="text-xs">정상</span>
                                  </div>
                                )}
                              </td>
                              
                              {/* 자료 Link */}
                              <td className="px-4 py-3">
                                <div 
                                  className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                                  onClick={() => handleTaskAttachmentClick(task)}
                                  title="클릭하여 자료 관리"
                                >
                                  <TaskAttachmentPreview taskId={task.id} />
                                </div>
                              </td>
                              
                              {/* 액션 버튼들 */}
                              <td className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteTask(task.id, task.title)}
                                  title="업무 삭제"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                            
                          ];

                          // 인라인 댓글 박스가 있다면 추가
                          if (expandedRowId === task.id) {
                            rows.push(
                              <tr key={`${task.id}-comment`}>
                                <td colSpan={9} className="p-0">
                                  <InlineCommentBox
                                    taskId={task.id}
                                    onClose={() => setExpandedRowId(null)}
                                    onCommentSubmit={handleInlineCommentSubmit}
                                  />
                                </td>
                              </tr>
                            );
                          }

                          return rows;
                        })}
                        
                        {/* 새로운 행 추가 영역 */}
                        {isAddingNewTask && (
                          <tr className="bg-blue-50 border-2 border-blue-200">
                            {/* Stage */}
                            <td className="px-4 py-3">
                              <Select 
                                key="new-task-phase"
                                value={newTaskData.taskPhase || undefined} 
                                onValueChange={(value) => setNewTaskData(prev => ({...prev, taskPhase: value}))}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue placeholder="단계 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {taskPhases.map(phase => (
                                    <SelectItem key={phase.id} value={phase.id}>
                                      {phase.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            
                            {/* Task Name */}
                            <td className="px-4 py-3">
                              <Input
                                key="new-task-title"
                                placeholder="업무명 입력"
                                value={newTaskData.title}
                                onChange={(e) => setNewTaskData(prev => ({...prev, title: e.target.value}))}
                                className="h-8"
                              />
                            </td>
                            
                            {/* 담당 */}
                            <td className="px-4 py-3">
                              <Select 
                                key="new-task-assignee"
                                value={newTaskData.assignedTo || undefined} 
                                onValueChange={(value) => setNewTaskData(prev => ({...prev, assignedTo: value}))}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue placeholder="담당자 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {assigneeOptions.map(person => (
                                    <SelectItem key={person.id} value={person.id}>
                                      {person.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            
                            {/* 부서 */}
                            <td className="px-4 py-3">
                              <Select 
                                key="new-task-department"
                                value={newTaskData.department || undefined} 
                                onValueChange={(value) => setNewTaskData(prev => ({...prev, department: value}))}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue placeholder="부서 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departmentOptions.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            
                            {/* Due Date */}
                            <td className="px-4 py-3">
                              <Input
                                key="new-task-due-date"
                                type="date"
                                value={newTaskData.dueDate}
                                onChange={(e) => setNewTaskData(prev => ({...prev, dueDate: e.target.value}))}
                                className="h-8 w-36"
                              />
                            </td>
                            
                            {/* 상태 */}
                            <td className="px-4 py-3">
                              <Select 
                                key="new-task-status"
                                value={newTaskData.status} 
                                onValueChange={(value) => setNewTaskData(prev => ({...prev, status: value}))}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map(status => (
                                    <SelectItem key={status} value={status}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: getStatusColor(status) }}
                                        ></div>
                                        {status}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            
                            {/* OverDue */}
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-400">-</span>
                            </td>
                            
                            {/* 자료 Link */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center text-gray-400">
                                <span className="text-xs">-</span>
                              </div>
                            </td>
                            
                            {/* 액션 버튼들 */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Button size="sm" className="h-8" onClick={handleAddNewTask}>
                                  <Check className="h-4 w-4 mr-1" />
                                  저장
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={handleNewTaskCancel}>
                                  <X className="h-4 w-4 mr-1" />
                                  취소
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* 새로운 행 추가 버튼 */}
                  {!isAddingNewTask && (
                    <div className="border-t border-gray-200 p-4">
                      <Button 
                        variant="ghost" 
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => setIsAddingNewTask(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        새로운 업무 추가
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-2">등록된 업무가 없습니다</p>
                  <p className="text-sm mb-4">새로운 업무를 추가해보세요.</p>
                  <Button onClick={() => setIsAddingNewTask(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    첫 번째 업무 추가
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 업무 첨부 파일 관리 다이얼로그 */}
      {selectedTaskForAttachment && (
        <TaskAttachmentDialog
          task={selectedTaskForAttachment}
          isOpen={isTaskAttachmentDialogOpen}
          onClose={() => {
            setIsTaskAttachmentDialogOpen(false);
            setSelectedTaskForAttachment(null);
          }}
          onUpdate={handleTaskAttachmentUpdate}
        />
      )}

      {/* 프로젝트 수정 다이얼로그 */}
      {project && (
        <ProjectEditDialog
          project={project}
          isOpen={isEditingProject}
          onClose={() => setIsEditingProject(false)}
          onUpdate={handleProjectUpdateComplete}
        />
      )}

      {/* PDF 미리보기 모달 */}
      {selectedPDF && (
        <PDFViewer
          open={isPDFViewerOpen}
          onOpenChange={setIsPDFViewerOpen}
          pdfUrl={selectedPDF.url}
          fileName={selectedPDF.name}
        />
      )}

      {/* 업무 삭제 확인 모달 */}
      <AlertDialog open={isTaskDeleteDialogOpen} onOpenChange={setIsTaskDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">
              업무 삭제 확인
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-2">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">"{taskToDelete?.title}"</span> 업무를 정말 삭제하시겠습니까?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  이 작업은 되돌릴 수 없습니다
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-4">
            <AlertDialogCancel className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">
              취소
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTask}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* TaskProgressSidebar */}
      {selectedTaskForProgress && (
        <TaskProgressSidebar
          task={selectedTaskForProgress}
          isOpen={isProgressSidebarOpen}
          onClose={() => {
            setIsProgressSidebarOpen(false);
            setSelectedTaskForProgress(null);
          }}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
};

export default ProjectDetail; 