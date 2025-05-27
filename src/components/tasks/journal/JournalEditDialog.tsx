import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Save,
  X,
  Briefcase,
  FileText
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";

interface WorkJournal {
  id: string;
  project_id: string;
  task_id: string;
  content: string;
  status: "not-started" | "in-progress" | "delayed" | "completed";
  files?: any[];
  collaborators?: string[];
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at?: string;
}

interface JournalEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journal: WorkJournal | null;
  onJournalUpdated?: () => void;
}

export const JournalEditDialog: React.FC<JournalEditDialogProps> = ({
  open,
  onOpenChange,
  journal,
  onJournalUpdated
}) => {
  const { projects, tasks, updateWorkJournal } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<{
    content: string;
    status: "not-started" | "in-progress" | "delayed" | "completed";
  }>({
    content: "",
    status: "not-started",
  });

  // 폼 데이터 초기화
  useEffect(() => {
    if (journal) {
      setFormData({
        content: journal.content,
        status: journal.status,
      });
    }
  }, [journal]);

  if (!journal) return null;

  const project = projects.find(p => p.id === journal.project_id);
  const task = tasks.find(t => t.id === journal.task_id);
  
  const projectName = project?.name || '알 수 없는 프로젝트';
  const taskName = task?.title || '알 수 없는 업무';

  const getStatusText = (status: string) => {
    switch (status) {
      case "not-started": return "시작전";
      case "in-progress": return "진행중";
      case "delayed": return "지연";
      case "completed": return "완료";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "not-started": return Clock;
      case "in-progress": return Loader2;
      case "delayed": return AlertCircle;
      case "completed": return CheckCircle2;
      default: return Clock;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toast.error("일지 내용을 입력해주세요");
      return;
    }

    setIsLoading(true);
    try {
      await updateWorkJournal(journal.id, {
        content: formData.content.trim(),
        status: formData.status,
      });
      
      toast.success("업무 일지가 수정되었습니다");
      onOpenChange(false);
      onJournalUpdated?.();
    } catch (error) {
      console.error("업무 일지 수정 실패:", error);
      toast.error("업무 일지 수정에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // 폼 데이터 초기화
    if (journal) {
      setFormData({
        content: journal.content,
        status: journal.status,
      });
    }
    onOpenChange(false);
  };

  const StatusIcon = getStatusIcon(formData.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-2xl">업무 일지 수정</DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 업무 정보 (읽기 전용) */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  업무 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">프로젝트</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-sm">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {projectName}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">업무명</Label>
                    <p className="text-lg font-medium mt-1">{taskName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 상태 선택 */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                상태 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      {getStatusText(formData.status)}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: "not-started", label: "시작전", icon: Clock },
                    { value: "in-progress", label: "진행중", icon: Loader2 },
                    { value: "delayed", label: "지연", icon: AlertCircle },
                    { value: "completed", label: "완료", icon: CheckCircle2 },
                  ].map((status) => {
                    const Icon = status.icon;
                    return (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {status.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* 일지 내용 */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium">
                일지 내용 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                placeholder="오늘 수행한 업무 내용을 상세히 작성해주세요..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-[200px] resize-none"
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length}/1000자
              </p>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            취소
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !formData.content.trim()}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                수정 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                수정 완료
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 