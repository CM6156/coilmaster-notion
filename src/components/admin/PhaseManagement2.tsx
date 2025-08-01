import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAppContext } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Phase } from "@/types";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Palette,
  Loader2
} from "lucide-react";

// 업무 단계 타입 정의
interface TaskPhase {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PhaseManagement2 = () => {
  const { translations } = useLanguage();
  const { 
    phases, 
    createPhase, 
    updatePhase, 
    deletePhase
  } = useAppContext();
  
  // 상태 관리
  const [tab, setTab] = useState<'project' | 'task'>('project');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [phaseToDelete, setPhaseToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingPhase, setEditingPhase] = useState<Phase | TaskPhase | null>(null);
  const [loading, setLoading] = useState(false);
  const [taskPhases, setTaskPhases] = useState<TaskPhase[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    order: 1
  });

  const colors = [
    { value: '#ef4444', label: 'Red', name: '빨강' },
    { value: '#f59e0b', label: 'Orange', name: '주황' },
    { value: '#eab308', label: 'Yellow', name: '노랑' },
    { value: '#10b981', label: 'Green', name: '초록' },
    { value: '#06b6d4', label: 'Cyan', name: '청록' },
    { value: '#3b82f6', label: 'Blue', name: '파랑' },
    { value: '#8b5cf6', label: 'Purple', name: '보라' },
    { value: '#ec4899', label: 'Pink', name: '분홍' },
    { value: '#6b7280', label: 'Gray', name: '회색' },
  ];

  // 업무 단계 관련 함수들을 컴포넌트 내에서 구현
  const createTaskPhase = async (data: Omit<TaskPhase, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase
      .from('task_phases')
      .insert([{
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    await loadTaskPhases();
  };

  const updateTaskPhase = async (id: string, data: Partial<TaskPhase>) => {
    const { error } = await supabase
      .from('task_phases')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    await loadTaskPhases();
  };

  const deleteTaskPhase = async (id: string) => {
    const { error } = await supabase
      .from('task_phases')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    await loadTaskPhases();
  };

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

  // 컴포넌트 마운트 시 업무 단계 로드
  useEffect(() => {
    loadTaskPhases();
  }, []);

  // 프로젝트 단계 필터링 (type이 'project'이거나 없는 것들)
  const projectPhases = phases.filter(p => !p.type || p.type === 'project').sort((a, b) => a.order - b.order);

  // 현재 탭에 따른 데이터
  const currentPhases = tab === 'project' ? projectPhases : taskPhases;

  // 폼 리셋 함수
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      order: 1
    });
    setEditingPhase(null);
  }, []);

  // 모달 열기
  const handleOpenDialog = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  // 모달 닫기
  const handleCloseDialog = useCallback(() => {
    if (!loading) {
      setIsDialogOpen(false);
      setTimeout(() => {
        resetForm();
      }, 200);
    }
  }, [loading, resetForm]);

  // 입력 값 변경
  const handleInputChange = useCallback((field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 제출 처리
  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      toast({
        title: "오류",
        description: "단계명을 입력하세요",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      if (editingPhase) {
        if (tab === 'project') {
          await updatePhase(editingPhase.id, {
            name: formData.name,
            description: formData.description,
            color: formData.color,
            order: formData.order,
          });
        } else {
          await updateTaskPhase(editingPhase.id, {
            name: formData.name,
            description: formData.description,
            color: formData.color,
            order_index: formData.order,
          });
        }
        toast({
          title: "성공",
          description: "단계가 성공적으로 수정되었습니다"
        });
      } else {
        if (tab === 'project') {
          const maxOrder = projectPhases.length > 0 ? Math.max(...projectPhases.map(p => p.order)) : 0;
          await createPhase({
            name: formData.name,
            description: formData.description,
            color: formData.color,
            order: maxOrder + 1,
            type: 'project'
          });
        } else {
          const maxOrder = taskPhases.length > 0 ? Math.max(...taskPhases.map(p => p.order_index)) : 0;
          await createTaskPhase({
            name: formData.name,
            description: formData.description,
            color: formData.color,
            order_index: maxOrder + 1,
            is_active: true
          });
        }
        toast({
          title: "성공",
          description: "단계가 성공적으로 추가되었습니다"
        });
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving phase:', error);
      toast({
        title: "오류",
        description: "단계 저장 중 오류가 발생했습니다",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [formData, editingPhase, projectPhases, taskPhases, createPhase, updatePhase, createTaskPhase, updateTaskPhase, handleCloseDialog, tab]);

  // 수정 처리
  const handleEdit = useCallback((phase: Phase | TaskPhase) => {
    setEditingPhase(phase);
    setFormData({
      name: phase.name,
      description: phase.description || '',
      color: phase.color || '#3b82f6',
      order: 'order' in phase ? phase.order : (phase as TaskPhase).order_index
    });
    setIsDialogOpen(true);
  }, []);

  // 삭제 처리
  const handleDelete = useCallback(async (id: string, name: string) => {
    setPhaseToDelete({ id, name });
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!phaseToDelete) return;
    
    try {
      setLoading(true);
      if (tab === 'project') {
        await deletePhase(phaseToDelete.id);
      } else {
        await deleteTaskPhase(phaseToDelete.id);
      }
      toast({
        title: "성공",
        description: "단계가 성공적으로 삭제되었습니다"
      });
    } catch (error) {
      console.error('Error deleting phase:', error);
      toast({
        title: "오류",
        description: "단계 삭제 중 오류가 발생했습니다",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
      setPhaseToDelete(null);
    }
  }, [phaseToDelete, deletePhase, deleteTaskPhase, tab]);

  const PhaseCard = ({ phase }: { phase: Phase | TaskPhase }) => {
    const order = 'order' in phase ? phase.order : (phase as TaskPhase).order_index;
    
    return (
      <Card className="border-l-4 transition-all hover:shadow-md" style={{ borderLeftColor: phase.color }}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: phase.color }}
              />
              <h3 className="font-semibold">{phase.name}</h3>
              <Badge variant="outline" className="text-xs">
                #{order}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(phase)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(phase.id, phase.name)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {phase.description && (
            <p className="text-sm text-muted-foreground">{phase.description}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Palette className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">단계 관리</h2>
        </div>
      </div>

      {/* 상단 큰 탭 구조 */}
      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => setTab('project')}
          className={`p-4 rounded-lg border-2 transition-all ${
            tab === 'project'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted bg-muted/50 hover:bg-muted'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background/20">
              <Palette className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">프로젝트 단계</h3>
              <p className="text-sm opacity-80">프로젝트에서 사용할 단계들을 관리합니다</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {projectPhases.length}
            </Badge>
          </div>
        </button>

        <button
          onClick={() => setTab('task')}
          className={`p-4 rounded-lg border-2 transition-all ${
            tab === 'task'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted bg-muted/50 hover:bg-muted'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background/20">
              <Palette className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">업무 단계</h3>
              <p className="text-sm opacity-80">업무 관리 및 업무 일지에서 사용할 단계들을 관리합니다</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {taskPhases.length}
            </Badge>
          </div>
        </button>
      </div>

      {/* 선택된 탭의 내용 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{tab === 'project' ? '프로젝트 단계' : '업무 단계'}</CardTitle>
              <CardDescription>
                {tab === 'project' 
                  ? '프로젝트에서 사용할 단계들을 관리합니다' 
                  : '업무 관리 및 업무 일지에서 사용할 단계들을 관리합니다'
                }
              </CardDescription>
            </div>
            <Button onClick={handleOpenDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              새 단계 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentPhases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">
                등록된 {tab === 'project' ? '프로젝트' : '업무'} 단계가 없습니다
              </p>
              <p className="text-sm">첫 번째 단계를 추가해보세요.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentPhases.map((phase) => (
                <PhaseCard key={phase.id} phase={phase} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 모달 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPhase 
                ? `${tab === 'project' ? '프로젝트' : '업무'} 단계 수정`
                : `새 ${tab === 'project' ? '프로젝트' : '업무'} 단계 추가`
              }
            </DialogTitle>
            <DialogDescription>
              {editingPhase 
                ? "단계 정보를 수정합니다"
                : `새로운 ${tab === 'project' ? '프로젝트' : '업무'} 단계를 추가합니다`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">단계명</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="단계명을 입력하세요"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="단계 설명을 입력하세요"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label>색상</Label>
              <Select 
                value={formData.color} 
                onValueChange={(value) => handleInputChange('color', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: formData.color }}
                      />
                      <span>{colors.find(c => c.value === formData.color)?.name}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: color.value }}
                        />
                        <span>{color.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="order">순서</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
                min="1"
                disabled={loading}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseDialog}
              disabled={loading}
            >
              취소
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading || !formData.name.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPhase ? "저장" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 모달 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>단계 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${phaseToDelete?.name}" 단계를 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PhaseManagement2;