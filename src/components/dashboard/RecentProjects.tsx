import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from '@/context/LanguageContext';
import { Project, Task, User, DepartmentCode } from '@/types';
import { format } from 'date-fns';
import {
  CalendarIcon,
  UserIcon,
  BuildingIcon,
  ClockIcon,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Ban,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ListFilter,
  Briefcase,
  Grid3x3,
  Cog,
  Folder,
  LayoutDashboard,
  FolderOpen,
  LogOut,
  Edit,
  Save,
  X,
  DollarSign,
  Package,
  Award,
  Building2,
  Loader2,
} from 'lucide-react';
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface RecentProjectsProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
}

const RecentProjects = ({ projects, tasks, users }: RecentProjectsProps) => {
  const { translations } = useLanguage();
  const { departments, corporations, clients, updateProject, currentUser, calculateProjectProgress, managers } = useAppContext();
  const t = translations.projects;
  const taskT = translations.tasks;
  const globalT = translations.global;
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Project>>({});

  // 수량/금액 정보 열람 권한 확인
  const canViewFinancialInfo = () => {
    if (!currentUser) return false;
    
    // 현재 사용자의 부서 정보 가져오기
    const userDepartment = currentUser.department;
    if (!userDepartment) return false;
    
    // 경영, 영업, 구매 부서만 수량/금액 정보 열람 가능
    const allowedDepartments = [
      DepartmentCode.MANAGEMENT,
      DepartmentCode.SALES,
      DepartmentCode.FINANCE,
    ];
    
    return allowedDepartments.includes(userDepartment);
  };

  // 현재 사용자 부서명 가져오기
  const getCurrentUserDepartment = () => {
    if (!currentUser || !currentUser.department) return '부서 미지정';
    
    // DepartmentCode를 한국어로 변환
    switch (currentUser.department) {
      case DepartmentCode.MANAGEMENT:
        return '경영';
      case DepartmentCode.SALES:
        return '영업';
      case DepartmentCode.FINANCE:
        return '구매/경리';
      case DepartmentCode.DEVELOPMENT:
        return '개발';
      case DepartmentCode.MANUFACTURING:
        return '제조';
      case DepartmentCode.QUALITY:
        return '품질';
      case DepartmentCode.ADMINISTRATION:
        return '관리';
      case DepartmentCode.ENGINEERING:
        return '엔지니어링';
      case DepartmentCode.RND:
        return '연구개발';
      case DepartmentCode.PRODUCTION:
        return '생산';
      case DepartmentCode.QA:
        return 'QA';
      default:
        return '부서 미지정';
    }
  };

  // 프로젝트의 실제 진행률 가져오기 (하위 업무 기반)
  const getActualProgress = (project: Project) => {
    return calculateProjectProgress(project.id);
  };

  // 프로젝트 유형 풀네임 가져오기
  const getProjectTypeFullName = (projectType: string | undefined) => {
    if (!projectType) return "미지정";
    
    // 프로젝트 유형 코드에 따른 풀네임 매핑
    const projectTypeMap: { [key: string]: string } = {
      "8.1": "8.1 최종 개선",
      "8.2": "8.2 성능 최적화", 
      "8.3": "8.3 보안 강화",
      "9.0": "9.0 신규 기능 개발",
      "9.1": "9.1 사용자 경험 개선",
      "9.2": "9.2 시스템 통합",
      "10.0": "10.0 메이저 업그레이드",
      "maintenance": "유지보수",
      "development": "신규 개발",
      "enhancement": "기능 개선",
      "migration": "시스템 마이그레이션",
      "research": "연구 개발",
      "poc": "POC 검증",
      "pilot": "파일럿 프로젝트"
    };
    
    // 정확한 매칭이 있으면 반환
    if (projectTypeMap[projectType]) {
      return projectTypeMap[projectType];
    }
    
    // 부분 매칭 시도 (예: "8.1.1" -> "8.1 최종 개선")
    for (const [code, fullName] of Object.entries(projectTypeMap)) {
      if (projectType.startsWith(code)) {
        return `${projectType} ${fullName.split(' ').slice(1).join(' ')}`;
      }
    }
    
    // 매칭되지 않으면 원본 반환
    return projectType;
  };

  // 프로젝트의 하위 업무 가져오기
  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  // 최근 등록된 프로젝트 정렬 (최신순)
  const recentProjects = [...projects].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5); // 최근 5개만 표시

  // 프로젝트 담당자 이름 가져오기
  const getManagerName = (project: Project) => {
    // 먼저 project.manager에서 담당자 이름을 가져옴 (PIC)
    if (project.manager && typeof project.manager === 'string' && project.manager.trim()) {
      return project.manager.trim();
    }
    
    // project.manager가 없으면 managerId로 users에서 찾기
    if (project.managerId) {
      const user = users.find(user => user.id === project.managerId);
      if (user?.name && typeof user.name === 'string' && user.name.trim()) {
        return user.name.trim();
      }
      
      // users에서 못 찾으면 managers에서 찾기
      const manager = managers?.find(m => m.id === project.managerId);
      if (manager?.name && typeof manager.name === 'string' && manager.name.trim()) {
        return manager.name.trim();
      }
    }
    
    return '미지정';
  };

  // 상태 표시 컴포넌트
  const StatusIndicator = ({ status, children }: { status: string, children: React.ReactNode }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return 'bg-green-100 text-green-700';
        case 'in-progress': return 'bg-blue-100 text-blue-700';
        case 'delayed': return 'bg-red-100 text-red-700';
        case 'on-hold': return 'bg-amber-100 text-amber-700';
        default: return 'bg-gray-100 text-gray-700';
      }
    };

    return (
      <div className={cn(
        "inline-flex items-center px-2 py-1 rounded-md text-sm font-medium",
        getStatusColor(status)
      )}>
        {children}
      </div>
    );
  };

  // 상태 뱃지 가져오기
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <StatusIndicator status={status}>
            <CheckCircle2 className="w-3 h-3 mr-1" />
            <span>완료</span>
          </StatusIndicator>
        );
      case 'in-progress':
        return (
          <StatusIndicator status={status}>
            <Clock3 className="w-3 h-3 mr-1" />
            <span>진행중</span>
          </StatusIndicator>
        );
      case 'delayed':
        return (
          <StatusIndicator status={status}>
            <AlertCircle className="w-3 h-3 mr-1" />
            <span>지연</span>
          </StatusIndicator>
        );
      case 'on-hold':
        return (
          <StatusIndicator status={status}>
            <Ban className="w-3 h-3 mr-1" />
            <span>보류</span>
          </StatusIndicator>
        );
      default:
        return (
          <StatusIndicator status={status}>
            <span>{globalT?.unset || "미정"}</span>
          </StatusIndicator>
        );
    }
  };

  const handleProjectClick = (project: Project) => {
    console.log("Selected project data:", project); // 디버깅용
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  // 날짜 포맷팅 함수 추가
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return globalT?.unset || '날짜 미정';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return globalT?.unset || '날짜 미정';
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      return dateString;
    }
  };

  // 편집 모드 시작
  const startEditing = () => {
    if (selectedProject) {
      setEditData({
        name: selectedProject.name,
        description: selectedProject.description,
        status: selectedProject.status,
        progress: selectedProject.progress,
        clientId: selectedProject.clientId,
        manager: selectedProject.manager,
        department: selectedProject.department,
        projectType: selectedProject.projectType,
        promotionStatus: selectedProject.promotionStatus,
        competitor: selectedProject.competitor,
        issueCorporation: selectedProject.issueCorporation,
        annualQuantity: selectedProject.annualQuantity,
        averageAmount: selectedProject.averageAmount,
        annualAmount: selectedProject.annualAmount,
      });
      setIsEditing(true);
    }
  };

  // 편집 취소
  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
  };

  // 변경사항 저장
  const saveChanges = async () => {
    if (selectedProject && updateProject) {
      try {
        await updateProject(selectedProject.id, editData);
        setIsEditing(false);
        setEditData({});
        toast({
          title: "수정 완료",
          description: "프로젝트 정보가 성공적으로 업데이트되었습니다.",
        });
        // 선택된 프로젝트 정보 업데이트
        setSelectedProject({ ...selectedProject, ...editData });
      } catch (error) {
        console.error("Error updating project:", error);
        toast({
          title: "수정 실패",
          description: "프로젝트 정보 업데이트 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  // 프로젝트 담당자 권한 확인
  const canChangeProjectStatus = (project: Project) => {
    if (!currentUser) return false;
    
    // 현재 사용자가 프로젝트 담당자인지 확인
    if (project.manager === currentUser.name) return true;
    if (project.managerId === currentUser.id) return true;
    
    return false;
  };

  // 프로젝트 상태 변경
  const handleStatusChange = async (status: 'planned' | 'in_progress' | 'completed') => {
    if (!selectedProject || !canChangeProjectStatus(selectedProject)) return;
    
    let progress = 0;
    let promotionStatus: "planned" | "hold" | "in_progress" | "drop" | "development" | "mass_production" | "stopped";
    
    switch (status) {
      case 'planned':
        progress = 0;
        promotionStatus = 'planned';
        break;
      case 'in_progress':
        progress = 50;
        promotionStatus = 'in_progress';
        break;
      case 'completed':
        progress = 100;
        promotionStatus = 'mass_production'; // 완료 시 양산 상태로
        break;
    }
    
    try {
      await updateProject(selectedProject.id, {
        progress,
        promotionStatus,
        status: status === 'completed' ? 'completed' : 'active',
        completed: status === 'completed'
      });
      
      // 선택된 프로젝트 정보 업데이트
      setSelectedProject({
        ...selectedProject,
        progress,
        promotionStatus,
        status: status === 'completed' ? 'completed' : 'active',
        completed: status === 'completed'
      });
      
      toast({
        title: "상태 변경 완료",
        description: `프로젝트 상태가 ${status === 'planned' ? '예정' : status === 'in_progress' ? '진행' : '완료'}으로 변경되었습니다.`,
      });
    } catch (error) {
      console.error("Error updating project status:", error);
      toast({
        title: "상태 변경 실패",
        description: "프로젝트 상태 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t?.recentProjects || "최근 등록된 프로젝트"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t?.name || "프로젝트명"}</TableHead>
                <TableHead>{t?.assignee || "담당자"}</TableHead>
                <TableHead>{t?.startDate || "시작일"}</TableHead>
                <TableHead>{t?.dueDate || "마감일"}</TableHead>
                <TableHead>{t?.status || "상태"}</TableHead>
                <TableHead>{t?.progress || "진행률"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentProjects.map((project) => (
                <TableRow 
                  key={project.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => {
                    handleProjectClick(project);
                  }}
                >
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {getManagerName(project)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      {formatDate(project.startDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {formatDate(project.dueDate)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell>
                    <div className="w-full flex items-center gap-2">
                      <Progress value={getActualProgress(project)} className="flex-1" />
                      <span className="text-sm text-gray-500">{getActualProgress(project)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
        {selectedProject && (
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold">
                  {isEditing ? (
                    <Input
                      value={editData.name || selectedProject.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="text-xl font-semibold"
                    />
                  ) : (
                    selectedProject.name
                  )}
                </DialogTitle>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startEditing}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      수정
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                        className="flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        취소
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveChanges}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        저장
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>
            
            <Tabs defaultValue="info" className="w-full">
              <TabsList>
                <TabsTrigger value="info">프로젝트 정보</TabsTrigger>
                <TabsTrigger value="tasks">하위 업무</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-6">
                {/* 상태 변경 버튼들 - 담당자만 표시 */}
                {canChangeProjectStatus(selectedProject) && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-medium text-blue-900 mb-3">프로젝트 상태 변경</h3>
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        variant={selectedProject.promotionStatus === 'planned' ? "default" : "outline"}
                        onClick={() => handleStatusChange('planned')}
                        className="flex items-center gap-2"
                      >
                        <Clock3 className="w-4 h-4" />
                        예정 (0%)
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedProject.promotionStatus === 'in_progress' ? "default" : "outline"}
                        onClick={() => handleStatusChange('in_progress')}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="w-4 h-4" />
                        진행 (50%)
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedProject.promotionStatus === 'mass_production' || selectedProject.completed ? "default" : "outline"}
                        onClick={() => handleStatusChange('completed')}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        완료 (100%)
                      </Button>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      담당자로 지정되어 프로젝트 상태를 변경할 수 있습니다.
                    </p>
                  </div>
                )}

                {/* 기본 정보 */}
                <div className={cn(
                  "grid gap-6",
                  canViewFinancialInfo() 
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                    : "grid-cols-1 md:grid-cols-2"
                )}>
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <BuildingIcon className="w-5 h-5" />
                      기본 정보
                    </h3>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">고객사</p>
                      {isEditing ? (
                        <Select
                          value={editData.clientId || selectedProject.clientId || ""}
                          onValueChange={(value) => setEditData({ ...editData, clientId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="고객사 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">고객사 미지정</SelectItem>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="flex items-center gap-2">
                          <BuildingIcon className="w-4 h-4" />
                          {selectedProject.clientName || "고객사 미지정"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">담당자 (PIC)</p>
                      {isEditing ? (
                        <Input
                          value={editData.manager || selectedProject.manager || ""}
                          onChange={(e) => setEditData({ ...editData, manager: e.target.value })}
                          placeholder="담당자 입력"
                        />
                      ) : (
                        <p className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          {getManagerName(selectedProject)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">담당 부서</p>
                      {isEditing ? (
                        <Select
                          value={editData.department || selectedProject.department || ""}
                          onValueChange={(value) => setEditData({ ...editData, department: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="부서 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {(() => {
                            // 부서 찾기
                            const foundDept = departments.find(d => d.id === selectedProject.department);
                            if (foundDept) {
                              return foundDept.name;
                            }
                            
                            // 부서를 찾지 못한 경우 부서 코드로 매핑 시도
                            const departmentCodeMap: { [key: string]: string } = {
                              'management': '경영',
                              'sales': '영업',
                              'finance': '구매/경리',
                              'development': '개발',
                              'manufacturing': '제조',
                              'quality': '품질',
                              'administration': '관리',
                              'engineering': '엔지니어링',
                              'rnd': '연구개발',
                              'production': '생산',
                              'qa': 'QA'
                            };
                            
                            if (selectedProject.department && departmentCodeMap[selectedProject.department]) {
                              return departmentCodeMap[selectedProject.department];
                            }
                            
                            // 마지막으로 원본 값 또는 미지정 반환
                            return selectedProject.department || "부서 미지정";
                          })()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5" />
                      일정 정보
                    </h3>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">요청일</p>
                      <p className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {formatDate(selectedProject.requestDate)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">{t?.dueDate || "마감일"}</p>
                      <p className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        {formatDate(selectedProject.dueDate)}
                      </p>
                    </div>
                  </div>

                  {/* 수량/금액 정보 - 권한이 있는 부서만 표시 */}
                  {canViewFinancialInfo() ? (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        수량/금액 정보
                      </h3>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">년간 수량</p>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editData.annualQuantity || selectedProject.annualQuantity || 0}
                            onChange={(e) => setEditData({ ...editData, annualQuantity: Number(e.target.value) })}
                          />
                        ) : (
                          <p className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            {selectedProject.annualQuantity?.toLocaleString() || 0}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">단가</p>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editData.averageAmount || selectedProject.averageAmount || 0}
                            onChange={(e) => setEditData({ ...editData, averageAmount: Number(e.target.value) })}
                          />
                        ) : (
                          <p className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            {selectedProject.averageAmount?.toLocaleString() || 0}원
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">년간 금액</p>
                        <p className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          {((editData.annualQuantity || selectedProject.annualQuantity || 0) * 
                            (editData.averageAmount || selectedProject.averageAmount || 0)).toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        수량/금액 정보
                      </h3>
                      <div className="p-4 bg-gray-100 rounded-lg text-center">
                        <p className="text-sm text-gray-500 mb-2">
                          수량/금액 정보는 경영, 영업, 구매 부서만 열람 가능합니다.
                        </p>
                        <p className="text-xs text-gray-400">
                          현재 부서: {getCurrentUserDepartment()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 상태 및 진행 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      진행 상태
                    </h3>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">현재 상태</p>
                      {isEditing ? (
                        <Select
                          value={editData.promotionStatus || selectedProject.promotionStatus || ""}
                          onValueChange={(value) => setEditData({ ...editData, promotionStatus: value as "planned" | "hold" | "in_progress" | "drop" | "development" | "mass_production" | "stopped" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="상태 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">예정</SelectItem>
                            <SelectItem value="hold">보류</SelectItem>
                            <SelectItem value="in_progress">진행중</SelectItem>
                            <SelectItem value="drop">DROP</SelectItem>
                            <SelectItem value="development">개발</SelectItem>
                            <SelectItem value="mass_production">양산</SelectItem>
                            <SelectItem value="stopped">중단</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getStatusBadge(selectedProject.status || selectedProject.promotionStatus || "planned")
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">진행률</p>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editData.progress || selectedProject.progress || 0}
                            onChange={(e) => setEditData({ ...editData, progress: Number(e.target.value) })}
                            className="w-20"
                          />
                          <span>%</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Progress value={getActualProgress(selectedProject)} className="w-full" />
                          <p className="text-right text-sm text-gray-500">{getActualProgress(selectedProject)}%</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">추가 정보</h3>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">프로젝트 구분</p>
                      {isEditing ? (
                        <Input
                          value={editData.projectType || selectedProject.projectType || ""}
                          onChange={(e) => setEditData({ ...editData, projectType: e.target.value })}
                          placeholder="프로젝트 구분 입력"
                        />
                      ) : (
                        <p className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {getProjectTypeFullName(selectedProject.projectType)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">경쟁사</p>
                      {isEditing ? (
                        <Input
                          value={editData.competitor || selectedProject.competitor || ""}
                          onChange={(e) => setEditData({ ...editData, competitor: e.target.value })}
                          placeholder="경쟁사 입력"
                        />
                      ) : (
                        <p>{selectedProject.competitor || "미지정"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Issue 법인</p>
                      {isEditing ? (
                        <Select
                          value={editData.issueCorporation || selectedProject.issueCorporation || ""}
                          onValueChange={(value) => setEditData({ ...editData, issueCorporation: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="법인 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">법인 미지정</SelectItem>
                            {corporations.map(corp => (
                              <SelectItem key={corp.id} value={corp.id}>
                                {corp.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p>{corporations.find(c => c.id === selectedProject.issueCorporation)?.name || "미지정"}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 설명 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    프로젝트 설명
                  </h3>
                  {isEditing ? (
                    <Textarea
                      value={editData.description || selectedProject.description || ""}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={4}
                      placeholder="프로젝트 설명을 입력하세요..."
                      className="min-h-[100px]"
                    />
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <div 
                        className="text-gray-700 whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedProject.description || "설명이 없습니다." }}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="tasks" className="space-y-6">
                {/* 하위 업무 탭 내용 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">하위 업무 목록</h3>
                  {getProjectTasks(selectedProject.id).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t?.name || "업무명"}</TableHead>
                          <TableHead>{t?.assignee || "담당자"}</TableHead>
                          <TableHead>{t?.projectType || "프로젝트 유형"}</TableHead>
                          <TableHead>{globalT?.status || "상태"}</TableHead>
                          <TableHead>{t?.dueDate || "마감일"}</TableHead>
                          <TableHead>{t?.progress || "진행률"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getProjectTasks(selectedProject.id).map((task) => (
                          <TableRow key={task.id}>
                            <TableCell className="font-medium">{task.title}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                {(() => {
                                  // 먼저 users에서 찾기
                                  const user = users.find(u => u.id === task.assignedTo);
                                  if (user?.name) {
                                    return user.name;
                                  }
                                  
                                  // managers에서 찾기
                                  const manager = managers?.find(m => m.id === task.assignedTo);
                                  if (manager?.name) {
                                    return manager.name;
                                  }
                                  
                                  // 둘 다 없으면 미지정
                                  return '미지정';
                                })()}
                              </div>
                            </TableCell>
                            <TableCell>{getProjectTypeFullName(selectedProject.projectType)}</TableCell>
                            <TableCell>{getStatusBadge(task.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4" />
                                {formatDate(task.dueDate)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={task.progress} className="w-20" />
                                <span className="text-sm text-gray-500">{task.progress}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>등록된 하위 업무가 없습니다.</p>
                      <p className="text-sm mt-2">업무 관리 페이지에서 이 프로젝트의 업무를 등록해보세요.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

export default RecentProjects;