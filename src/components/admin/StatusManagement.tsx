'use client';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/context/LanguageContext";
import { useAppContext } from "@/context/AppContext";
import type { Status, CreateStatusInput } from "@/context/AppContext";
import StatusDialog from "@/components/admin/dialogs/StatusDialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Move, 
  Loader2, 
  Palette,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  ListTodo,
  Zap,
  Briefcase,
  Flag
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// 아이콘 매핑
const iconMap = {
  // Project
  planning: Clock,
  inProgress: AlertCircle,
  completed: CheckCircle2,
  onHold: Move,
  // Task
  todo: ListTodo,
  doing: AlertCircle,
  reviewing: Target,
  done: CheckCircle2,
  // Priority
  low: Flag,
  normal: Briefcase,
  high: Zap,
  urgent: AlertCircle
};

const StatusManagement = React.memo(() => {
  const { translations } = useLanguage();
  const { 
    statuses, 
    createStatus, 
    updateStatus, 
    deleteStatus,
    getProjectStatuses,
    getTaskStatuses,
    getPriorityStatuses 
  } = useAppContext();
  
  // 상태 관리
  const [activeTab, setActiveTab] = useState<'project' | 'task' | 'priority' | 'promotion'>('project');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    is_active: true
  });

  // 색상 옵션을 메모이제이션
  const colors = useMemo(() => [
    { value: '#ef4444', label: 'Red', name: '빨강' },
    { value: '#f59e0b', label: 'Orange', name: '주황' },
    { value: '#eab308', label: 'Yellow', name: '노랑' },
    { value: '#10b981', label: 'Green', name: '초록' },
    { value: '#06b6d4', label: 'Cyan', name: '청록' },
    { value: '#3b82f6', label: 'Blue', name: '파랑' },
    { value: '#8b5cf6', label: 'Purple', name: '보라' },
    { value: '#ec4899', label: 'Pink', name: '분홍' },
    { value: '#6b7280', label: 'Gray', name: '회색' },
  ], []);

  // 필터링된 상태 목록을 메모이제이션
  const getFilteredStatuses = useCallback((type: 'project' | 'task' | 'priority' | 'promotion') => {
    switch(type) {
      case 'project':
        return getProjectStatuses();
      case 'task':
        return getTaskStatuses();
      case 'priority':
        return getPriorityStatuses();
      case 'promotion':
        return statuses.filter(status => status.status_type === 'promotion' && status.is_active).sort((a, b) => a.order_index - b.order_index);
      default:
        return [];
    }
  }, [getProjectStatuses, getTaskStatuses, getPriorityStatuses, statuses]);

  // 안정적인 폼 리셋
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      is_active: true
    });
    setEditingStatus(null);
  }, []);

  // 안정적인 모달 열기/닫기
  const handleOpenDialog = useCallback((type?: 'project' | 'task' | 'priority' | 'promotion', editStatus?: Status) => {
    if (type) {
      setActiveTab(type);
    }
    
    if (editStatus) {
      setEditingStatus(editStatus);
      setFormData({
        name: editStatus.name,
        description: editStatus.description,
        color: editStatus.color,
        is_active: editStatus.is_active
      });
    } else {
      resetForm();
    }
    
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleCloseDialog = useCallback(() => {
    if (!loading) {
      setIsDialogOpen(false);
      // 모달이 완전히 닫힌 후에 폼 리셋
      setTimeout(() => {
        resetForm();
      }, 300);
    }
  }, [loading, resetForm]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!formData.name.trim()) {
      toast.error(translations.global?.enterStatusName || "상태명을 입력하세요");
      return;
    }

    try {
      setLoading(true);
      
      console.log('=== 상태 저장 프로세스 시작 ===');
      console.log('편집 모드:', editingStatus ? '수정' : '새로 추가');
      console.log('현재 탭:', activeTab);
      console.log('폼 데이터:', formData);
      
      if (editingStatus) {
        // 수정
        console.log('상태 수정 시작:', editingStatus.id);
        await updateStatus(editingStatus.id, {
          name: formData.name,
          description: formData.description,
          color: formData.color,
          is_active: formData.is_active,
        });
        console.log('✅ 상태 수정 완료');
        toast.success(translations.global?.statusUpdatedSuccess || "상태가 성공적으로 수정되었습니다");
      } else {
        // 추가
        const filteredStatuses = getFilteredStatuses(activeTab);
        const maxOrder = filteredStatuses.length > 0 ? Math.max(...filteredStatuses.map(s => s.order_index)) : 0;
        const statusTypeId = activeTab === 'project' ? '1' : activeTab === 'task' ? '2' : activeTab === 'priority' ? '3' : '4';

        const newStatusData = {
          name: formData.name,
          description: formData.description,
          color: formData.color,
          order_index: maxOrder + 1,
          is_active: formData.is_active,
          status_type_id: statusTypeId,
          status_type: activeTab,
        };

        console.log('새 상태 생성 시작');
        console.log('생성할 상태 데이터:', newStatusData);
        console.log('기존 상태 개수:', filteredStatuses.length);
        console.log('새 순서 번호:', maxOrder + 1);

        await createStatus(newStatusData);
        
        console.log('✅ 상태 생성 완료');
        toast.success(translations.global?.statusAddedSuccess || "상태가 성공적으로 추가되었습니다");
      }

      // 성공 시 모달 닫기
      console.log('모달 닫기 처리 중...');
      handleCloseDialog();
      
    } catch (error) {
      console.error('❌ 상태 저장 중 오류 발생:', error);
      console.error('오류 상세:', error instanceof Error ? error.message : error);
      toast.error(translations.global?.error || "상태 저장 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
      console.log('=== 상태 저장 프로세스 종료 ===');
    }
  }, [formData, editingStatus, activeTab, translations.global, updateStatus, createStatus, getFilteredStatuses, handleCloseDialog]);

  const handleEdit = useCallback((status: Status) => {
    handleOpenDialog(activeTab, status);
  }, [activeTab, handleOpenDialog]);

  const handleDelete = useCallback(async (id: string) => {
    setStatusToDelete(id);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!statusToDelete) return;
    
    try {
      setLoading(true);
      await deleteStatus(statusToDelete);
      toast.success(translations.global?.statusDeletedSuccess || "상태가 성공적으로 삭제되었습니다");
    } catch (error) {
      console.error('Error deleting status:', error);
      toast.error(translations.global?.error || "상태 삭제 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
      setStatusToDelete(null);
    }
  }, [statusToDelete, deleteStatus, translations.global]);

  // 폼 데이터 변경 핸들러들을 메모이제이션하고 안정화
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => prev.name === value ? prev : { ...prev, name: value });
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => prev.description === value ? prev : { ...prev, description: value });
  }, []);

  const handleColorChange = useCallback((value: string) => {
    setFormData(prev => prev.color === value ? prev : { ...prev, color: value });
  }, []);

  const handleActiveChange = useCallback((checked: boolean) => {
    setFormData(prev => prev.is_active === checked ? prev : { ...prev, is_active: checked });
  }, []);

  // StatusCard 컴포넌트 메모이제이션
  const StatusCard = React.memo(({ status }: { status: Status }) => {
    const Icon = AlertCircle;
    
    // 번역된 이름과 설명 가져오기
    const translatedName = useMemo(() => {
      return status.translationKey && translations.global?.[status.translationKey] 
        ? translations.global[status.translationKey] 
        : status.name;
    }, [status.translationKey, status.name, translations.global]);
    
    const translatedDescription = useMemo(() => {
      return status.descriptionKey && translations.global?.[status.descriptionKey]
        ? translations.global[status.descriptionKey]
        : status.description;
    }, [status.descriptionKey, status.description, translations.global]);
    
    return (
      <Card className={cn(
        "relative overflow-hidden transition-all duration-200 hover:shadow-lg",
        !status.is_active && "opacity-60"
      )}>
        <div 
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: status.color }}
        />
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="p-2 rounded-lg"
                  style={{ 
                    backgroundColor: `${status.color}20`,
                    color: status.color 
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">{translatedName}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {translatedDescription}
              </p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={status.is_active ? "default" : "secondary"}
                  className="text-xs"
                >
                  {status.is_active 
                    ? translations.global?.statusActive || "활성"
                    : translations.global?.statusInactive || "비활성"
                  }
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {translations.global?.statusOrder || "순서"}: {status.order_index}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(status)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(status.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  });

  // StatusGrid 컴포넌트 메모이제이션
  const StatusGrid = React.memo(({ type }: { type: 'project' | 'task' | 'priority' | 'promotion' }) => {
    const filteredStatuses = getFilteredStatuses(type);

    if (loading) {
      return (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">{translations.global?.loading || "로딩 중..."}</span>
        </div>
      );
    }

    if (filteredStatuses.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {translations.global?.noDataAvailable || "데이터가 없습니다"}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStatuses.map((status) => (
          <StatusCard key={status.id} status={status} />
        ))}
      </div>
    );
  });

  const tabIcons = {
    project: Briefcase,
    task: ListTodo,
    priority: Flag,
    promotion: Target
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Palette className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{translations.global?.statusManagement || "상태 관리"}</h2>
          <p className="text-muted-foreground">
            {translations.global?.manageProjectStatuses || "프로젝트, 업무, 우선순위, 프로모션 단계를 관리합니다"}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'project' | 'task' | 'priority' | 'promotion')}>
        <TabsList className="grid w-full grid-cols-4 h-14">
          {['project', 'task', 'priority', 'promotion'].map((tab) => {
            const Icon = tabIcons[tab as keyof typeof tabIcons];
            const count = getFilteredStatuses(tab as 'project' | 'task' | 'priority' | 'promotion').length;
            
            return (
              <TabsTrigger 
                key={tab}
                value={tab} 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                <span>
                  {tab === 'project' && (translations.global?.projectStatusManagement || "프로젝트 상태")}
                  {tab === 'task' && (translations.global?.taskStatusManagement || "업무 상태")}
                  {tab === 'priority' && (translations.global?.priorityManagement || "우선순위")}
                  {tab === 'promotion' && "프로모션 단계"}
                </span>
                <Badge
                  variant="secondary" 
                  className="ml-1 h-5 px-1.5 text-xs"
                >
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {['project', 'task', 'priority', 'promotion'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4 mt-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {type === 'project' && (translations.global?.projectStatus || "프로젝트 상태")}
                      {type === 'task' && (translations.global?.taskStatus || "업무 상태")}
                      {type === 'priority' && (translations.global?.priorityLevel || "우선순위 레벨")}
                      {type === 'promotion' && "프로모션 단계"}
                    </CardTitle>
                    <CardDescription>
                      {type === 'project' && (translations.global?.manageProjectStatuses || "프로젝트 상태를 관리합니다")}
                      {type === 'task' && (translations.global?.manageTaskStatuses || "업무 상태를 관리합니다")}
                      {type === 'priority' && (translations.global?.managePriorities || "우선순위를 관리합니다")}
                      {type === 'promotion' && "프로모션 단계를 관리합니다"}
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => handleOpenDialog(type as 'project' | 'task' | 'priority' | 'promotion')}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {translations.global?.addNewStatus || "새 상태 추가"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <StatusGrid type={type as 'project' | 'task' | 'priority' | 'promotion'} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <StatusDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        loading={loading}
        editingStatus={editingStatus}
        formData={formData}
        onNameChange={handleNameChange}
        onDescriptionChange={handleDescriptionChange}
        onColorChange={handleColorChange}
        onActiveChange={handleActiveChange}
        onSubmit={handleSubmit}
        onClose={handleCloseDialog}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.global?.confirmDeleteStatus || "상태 삭제 확인"}</AlertDialogTitle>
            <AlertDialogDescription>정말로 이 상태를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.global?.cancel || "취소"}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {translations.global?.delete || "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}); 

StatusManagement.displayName = 'StatusManagement';

export default StatusManagement;