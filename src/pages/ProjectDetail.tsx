import { useState, useEffect } from "react";
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
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import PDFViewer from "@/components/common/PDFViewer";
import { supabase } from "@/lib/supabase";

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
  const { projects, users, tasks, departments, updateProject, clients, employees, managers, phases, calculateProjectProgress, deleteProject, currentUser } = useAppContext();
  const { toast } = useToast();
  const [selectedPDF, setSelectedPDF] = useState<ProjectFile | null>(null);
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDateInfo, setShowDateInfo] = useState(false);
  const [showProjectSummary, setShowProjectSummary] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  
  const t = translations.projects;
  const globalT = translations.global;

  // 프로젝트 찾기
  const project = projects.find(p => p.id === id);

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
    if (!phaseId) {
      return { name: '단계 미지정', color: '#6b7280' };
    }
    
    const phase = taskPhases.find(p => p.id === phaseId);
    return phase ? { name: phase.name, color: phase.color || '#3b82f6' } : { name: '단계 미지정', color: '#6b7280' };
  };
  
  // 프로젝트 파일 로드
  useEffect(() => {
    if (project?.id) {
      loadProjectFiles();
      loadTaskPhases();
    }
  }, [project?.id]);

  const loadProjectFiles = async () => {
    if (!project) return;
    
    setIsLoadingFiles(true);
    
    try {
      // 1. 먼저 project_attachments에서 file_id들을 가져오기
      const { data: attachments, error: attachmentError } = await supabase
        .from('project_attachments')
        .select('id, file_id, description, created_at')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (attachmentError) {
        console.error('첨부파일 로드 오류:', attachmentError);
        setProjectFiles([]);
        return;
      }

      if (!attachments || attachments.length === 0) {
        setProjectFiles([]);
        return;
      }

      // 2. file_id들로 files 테이블에서 파일 정보 가져오기
      const fileIds = attachments.map(att => att.file_id);
      
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('*')
        .in('id', fileIds);

      if (filesError) {
        console.error('파일 정보 로드 오류:', filesError);
        setProjectFiles([]);
        return;
      }

      // 3. 데이터 결합 및 변환
      const projectFiles: ProjectFile[] = attachments
        .map(att => {
          const file = files?.find(f => f.id === att.file_id);
          if (!file) return null;
          
          // Supabase Storage 공개 URL 생성
          let fileUrl = file.file_path;
          if (file.file_path && !file.file_path.startsWith('http')) {
            try {
              const { data: { publicUrl } } = supabase.storage
                .from('project-files')
                .getPublicUrl(file.file_path);
              fileUrl = publicUrl;
            } catch (urlError) {
              console.error('URL 생성 오류:', urlError);
            }
          }
          
          return {
            id: file.id,
            name: file.original_filename || file.filename,
            type: file.content_type?.includes('pdf') ? 'pdf' as const : 
                  file.content_type?.includes('image') ? 'image' as const : 'document' as const,
            url: fileUrl || '',
            size: file.file_size || 0,
            uploadedAt: file.created_at || att.created_at
          };
        })
        .filter(Boolean) as ProjectFile[];

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

  // Get related tasks for this project
  const projectTasks = project 
    ? tasks.filter(t => t.projectId === project.id && !t.parentTaskId) 
    : [];

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
    
    return assignedTo; // UUID 그대로 반환하지 않고 "미지정"으로 처리
  };

  // 부서 이름 가져오기 함수 추가
  const getDepartmentName = (departmentId: string | undefined) => {
    if (!departmentId) return "-";
    
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.name : "-";
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
    const phase = taskPhases.find(p => p.id === task.taskPhase);
    const stageNumber = phase?.order_index || 0;
    return String(stageNumber).padStart(2, '0');
  };

  if (!project) {
    return (
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
    );
  }

  // 영어 상태를 한국어로 변환하는 매핑
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

  // 하위업무 상태별 계산
  const getSubtaskStats = () => {
    const total = normalizedProjectTasks.length;
    const completed = normalizedProjectTasks.filter(t => t.status === '완료').length;
    const inProgress = normalizedProjectTasks.filter(t => t.status === '진행중').length;
    const reviewing = normalizedProjectTasks.filter(t => t.status === '검토중').length;
    const delayed = normalizedProjectTasks.filter(t => t.status === '지연').length;
    const onHold = normalizedProjectTasks.filter(t => t.status === '보류').length;
    const notStarted = normalizedProjectTasks.filter(t => t.status === '할 일').length;
    
    return { 
      total, 
      completed, 
      inProgress: inProgress + reviewing, // 진행중에 검토중도 포함
      notStarted: notStarted + delayed + onHold // 시작전에 지연, 보류도 포함
    };
  };

  const subtaskStats = getSubtaskStats();

  return (
    <div className="p-6 w-full">
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
        {/* 상단: 이미지 및 PDF 파일 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 프로젝트 이미지 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              프로젝트 이미지
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
              {project.image ? (
                <img 
                  src={project.image} 
                  alt={project.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center text-gray-500">
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
                <div className="text-center py-8 text-gray-500">
                  <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p>파일을 불러오는 중...</p>
                </div>
              ) : projectFiles.length > 0 ? (
                projectFiles.map((file) => (
                  <div 
                    key={file.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handlePDFClick(file)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
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
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>업로드된 문서가 없습니다</p>
                  <p className="text-sm mt-1">프로젝트 생성 시 파일을 업로드해보세요</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 기본 정보 - 간략하게 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            기본 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                단계
              </label>
              <div className="p-3 bg-white rounded-lg">
                {(() => {
                  const phase = phases.find(p => p.id === project.phase);
                  return phase ? phase.name : '단계 미지정';
                })()}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                담당자
              </label>
              <div className="p-3 bg-white rounded-lg">
                {project.manager || getManagerName(project.managerId) || "담당자 미지정"}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                상태
              </label>
              <div className="p-3 bg-white rounded-lg">
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
              <label className="text-sm font-medium text-gray-600 block mb-1">
                진행률 (하위업무 기준)
              </label>
              <div className="p-3 bg-white rounded-lg">
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
          
          {/* 속성 토글 */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowProperties(!showProperties)}
            >
              <h4 className="text-md font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                속성
              </h4>
              <Button variant="ghost" size="sm">
                {showProperties ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {showProperties && (
              <div className="mt-4 space-y-6">
                {/* 날짜 정보 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-green-600" />
                    날짜 정보
                  </h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">시작일:</span>
                      <span className="text-sm font-medium">{formatDate(project.startDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">마감일:</span>
                      <span className="text-sm font-medium">{formatDate(project.dueDate)}</span>
                    </div>
                    {project.requestDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">요청일:</span>
                        <span className="text-sm font-medium">{formatDate(project.requestDate)}</span>
                      </div>
                    )}
                    {project.targetSOPDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">목표 양산일:</span>
                        <span className="text-sm font-medium">{formatDate(project.targetSOPDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 프로젝트 요약 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <BarChart className="h-4 w-4 text-purple-600" />
                    프로젝트 요약
                  </h5>
                  <div className="space-y-3">
                    {project.dueDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">남은 기간:</span>
                        <span className="text-sm font-medium">
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
                      <span className="text-sm font-medium text-gray-600">하위 업무:</span>
                      <span className="text-sm font-medium">{subtaskStats.total}개</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">완료된 업무:</span>
                      <span className="text-sm font-medium text-green-600">{subtaskStats.completed}개</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하위 업무 목록 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              하위 업무 ({subtaskStats.total}개)
            </h3>
          </div>

          {/* 업무 현황 요약 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <PauseCircle className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">시작전</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{subtaskStats.notStarted}</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <PlayCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">진행중</span>
              </div>
              <div className="text-xl font-bold text-blue-600">{subtaskStats.inProgress}</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-600">완료</span>
              </div>
              <div className="text-xl font-bold text-green-600">{subtaskStats.completed}</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-600">전체</span>
              </div>
              <div className="text-xl font-bold text-purple-600">{subtaskStats.total}</div>
            </div>
          </div>

          {/* 업무 목록 */}
          {normalizedProjectTasks.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
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
                        OverDue
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        자료 Link
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        비고
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
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
                        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== '완료';
                        
                        return (
                          <tr key={task.id} className="hover:bg-gray-50">
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
                              <div className="text-sm font-medium text-gray-900 max-w-xs">
                                {task.title}
                              </div>
                              {task.description && (
                                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {task.description}
                                </div>
                              )}
                            </td>
                            
                            {/* 담당 */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center">
                                  <User className="h-3 w-3 text-gray-600" />
                                </div>
                                <div className="ml-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {getAssigneeName(task.assignedTo)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            {/* 부서 */}
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {getDepartmentName(task.department)}
                            </td>
                            
                            {/* Due Date */}
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(task.dueDate)}
                            </td>
                            
                            {/* 상태 */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  task.status === '완료' ? "bg-green-500" :
                                  task.status === '진행중' ? "bg-blue-500" :
                                  task.status === '검토중' ? "bg-purple-500" :
                                  task.status === '지연' ? "bg-red-500" :
                                  task.status === '보류' ? "bg-yellow-500" : "bg-gray-400"
                                )}></div>
                                <span className="text-sm text-gray-900">{task.status}</span>
                                <span className="text-xs text-gray-500">{task.progress}%</span>
                              </div>
                            </td>
                            
                            {/* OverDue */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {isOverdue ? (
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
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs text-gray-400">-</span>
                            </td>
                            
                            {/* 비고 */}
                            <td className="px-4 py-3">
                              <div className="text-xs text-gray-500 max-w-xs">
                                -
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">등록된 업무가 없습니다</p>
              <p className="text-sm">업무 관리에서 업무를 등록해주세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* PDF 미리보기 모달 */}
      {selectedPDF && (
        <PDFViewer
          open={isPDFViewerOpen}
          onOpenChange={setIsPDFViewerOpen}
          pdfUrl={selectedPDF.url}
          fileName={selectedPDF.name}
        />
      )}
    </div>
  );
};

export default ProjectDetail; 