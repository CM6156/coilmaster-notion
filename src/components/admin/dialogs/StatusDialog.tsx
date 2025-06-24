import React, { useCallback, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import type { Status } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";

interface StatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  editingStatus: Status | null;
  formData: {
    name: string;
    description: string;
    color: string;
    is_active: boolean;
  };
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onColorChange: (value: string) => void;
  onActiveChange: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const COLOR_OPTIONS = [
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

const StatusDialog = React.memo<StatusDialogProps>(({
  open,
  onOpenChange,
  loading,
  editingStatus,
  formData,
  onNameChange,
  onDescriptionChange,
  onColorChange,
  onActiveChange,
  onSubmit,
  onClose
}) => {
  // Dialog 상태 변경 핸들러
  const handleDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen && !loading) {
      onOpenChange(false);
    }
  }, [loading, onOpenChange]);

  // 폼 제출 핸들러
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSubmit(e);
  }, [onSubmit]);

  // 현재 선택된 색상 정보
  const selectedColor = useMemo(() => {
    return COLOR_OPTIONS.find(c => c.value === formData.color);
  }, [formData.color]);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent 
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => {
          if (loading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {editingStatus ? "상태 수정" : "새 상태 추가"}
          </DialogTitle>
          <DialogDescription>
            {editingStatus 
              ? "기존 상태의 정보를 수정합니다. 상태명과 색상을 변경할 수 있습니다."
              : "새로운 상태를 생성합니다. 상태명은 필수 입력 항목이며, 색상과 설명을 설정할 수 있습니다."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status-name">상태명</Label>
            <Input
              id="status-name"
              type="text"
              value={formData.name}
              onChange={onNameChange}
              placeholder="상태명을 입력하세요"
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status-description">상태 설명</Label>
            <Input
              id="status-description"
              type="text"
              value={formData.description}
              onChange={onDescriptionChange}
              placeholder="상태 설명을 입력하세요"
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status-color">상태 색상</Label>
            <Select 
              value={formData.color} 
              onValueChange={onColorChange}
              disabled={loading}
            >
              <SelectTrigger id="status-color">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: formData.color }}
                    />
                    <span>{selectedColor?.label}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COLOR_OPTIONS.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: color.value }}
                      />
                      <span>{color.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="status-active">활성</Label>
            <Switch
              id="status-active"
              checked={formData.is_active}
              onCheckedChange={onActiveChange}
              disabled={loading}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              취소
            </Button>
            <Button 
              type="submit"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingStatus ? "저장 중..." : "생성 중..."}
                </>
              ) : (
                editingStatus ? "저장" : "추가"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

StatusDialog.displayName = 'StatusDialog';

export default StatusDialog; 