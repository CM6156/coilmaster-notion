import React, { useState, useRef } from 'react';
import { Task } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppContext } from '@/context/AppContext';
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Upload, 
  Link, 
  X, 
  Save,
  CheckCircle2,
  FileIcon,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface TaskCompletionDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCompleted?: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
}

export const TaskCompletionDialog = ({ task, open, onOpenChange, onTaskCompleted }: TaskCompletionDialogProps) => {
  const { updateTask, getTaskStatuses } = useAppContext();
  const { toast } = useToast();
  
  const [completionContent, setCompletionContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const taskStatuses = getTaskStatuses();

  if (!task) return null;

  // 완료 상태 찾기
  const getCompletedStatus = () => {
    return taskStatuses.find(s => 
      s.name.toLowerCase().includes('done') || 
      s.name.toLowerCase().includes('complete') ||
      s.name === 'Done' ||
      s.name === 'Completed'
    );
  };

  // 파일 업로드 처리
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const fileId = `file-${Date.now()}-${Math.random()}`;
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file) // 실제로는 서버에 업로드 후 URL을 받아와야 함
      };
      
      setUploadedFiles(prev => [...prev, uploadedFile]);
    });

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 파일 삭제
  const handleFileRemove = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // 링크 추가
  const handleAddLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      toast({
        title: "입력 오류",
        description: "링크 제목과 URL을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // URL 유효성 검사
    try {
      new URL(newLinkUrl);
    } catch {
      toast({
        title: "URL 오류", 
        description: "올바른 URL 형식이 아닙니다.",
        variant: "destructive",
      });
      return;
    }

    const linkId = `link-${Date.now()}-${Math.random()}`;
    const newLink: LinkItem = {
      id: linkId,
      title: newLinkTitle.trim(),
      url: newLinkUrl.trim()
    };

    setLinks(prev => [...prev, newLink]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  // 링크 삭제
  const handleLinkRemove = (linkId: string) => {
    setLinks(prev => prev.filter(l => l.id !== linkId));
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 업무 완료 처리
  const handleCompleteTask = async () => {
    if (!completionContent.trim()) {
      toast({
        title: "내용 입력 필요",
        description: "완료된 업무 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const completedStatus = getCompletedStatus();
    if (!completedStatus) {
      toast({
        title: "상태 오류",
        description: "완료 상태를 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 업무 상태를 완료로 변경하고 완료 내용 추가
      const updatedTask = {
        ...task,
        status: completedStatus.name,
        progress: 100,
        completionContent: completionContent.trim(),
        completionFiles: uploadedFiles,
        completionLinks: links,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await updateTask(task.id, updatedTask);

      toast({
        title: "업무 완료",
        description: "업무가 성공적으로 완료되었습니다.",
      });

      // 상태 초기화
      setCompletionContent('');
      setUploadedFiles([]);
      setLinks([]);
      
      onTaskCompleted?.();
      onOpenChange(false);
    } catch (error) {
      console.error('업무 완료 처리 실패:', error);
      toast({
        title: "완료 실패",
        description: "업무 완료 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 다이얼로그 닫기 시 상태 초기화
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setCompletionContent('');
      setUploadedFiles([]);
      setLinks([]);
      setNewLinkTitle('');
      setNewLinkUrl('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            업무 완료 작성하기
          </DialogTitle>
          <DialogDescription>
            완료된 업무의 상세 내용과 결과물을 작성해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 업무 정보 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                업무 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div>
                <span className="font-medium text-sm">제목:</span>
                <p className="text-sm text-muted-foreground mt-1">{task.title}</p>
              </div>
              <div>
                <span className="font-medium text-sm">설명:</span>
                <p className="text-sm text-muted-foreground mt-1">{task.description || '설명 없음'}</p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* 완료 내용 작성 */}
          <div className="space-y-3">
            <Label htmlFor="completion-content" className="text-base font-medium">
              완료된 업무 내용 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="completion-content"
              placeholder="수행한 업무의 상세 내용, 결과, 특이사항 등을 작성해주세요..."
              value={completionContent}
              onChange={(e) => setCompletionContent(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          <Separator />

          {/* 파일 업로드 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">첨부 파일</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                파일 첨부
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept="*/*"
            />

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileRemove(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* 링크 추가 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">관련 링크</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <Input
                  placeholder="링크 제목"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  placeholder="https://..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                />
              </div>
              <div className="md:col-span-1">
                <Button 
                  variant="outline" 
                  onClick={handleAddLink}
                  className="w-full"
                >
                  <Link className="h-4 w-4 mr-2" />
                  링크 추가
                </Button>
              </div>
            </div>

            {links.length > 0 && (
              <div className="space-y-2">
                {links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">{link.title}</p>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {link.url}
                        </a>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLinkRemove(link.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleDialogClose(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button 
            onClick={handleCompleteTask}
            disabled={isLoading || !completionContent.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                완료 처리
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 