import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BookOpen,
  Calendar,
  User,
  Users,
  Paperclip,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  FileText,
  X
} from "lucide-react";
import { format } from "date-fns";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { JournalEditDialog } from "./JournalEditDialog";

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

interface JournalDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journal: WorkJournal | null;
  onJournalUpdated?: () => void;
}

export const JournalDetailDialog: React.FC<JournalDetailDialogProps> = ({
  open,
  onOpenChange,
  journal,
  onJournalUpdated
}) => {
  const { projects, tasks, users, deleteWorkJournal } = useAppContext();
  const { userProfile } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  if (!journal) return null;

  const project = projects.find(p => p.id === journal.project_id);
  const task = tasks.find(t => t.id === journal.task_id);
  const author = users.find(u => u.id === journal.author_id);
  
  const projectName = project?.name || '알 수 없는 프로젝트';
  const taskName = task?.title || '알 수 없는 업무';
  const authorName = author?.name || journal.author_name || '알 수 없는 사용자';

  // 현재 사용자가 작성자인지 확인
  const isAuthor = userProfile?.id === journal.author_id;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not-started": return "text-gray-600 bg-gray-100 dark:bg-gray-800";
      case "in-progress": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "delayed": return "text-red-600 bg-red-100 dark:bg-red-900/30";
      case "completed": return "text-green-600 bg-green-100 dark:bg-green-900/30";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-800";
    }
  };

  const handleDelete = async () => {
    if (!journal) return;
    
    setIsDeleting(true);
    try {
      await deleteWorkJournal(journal.id);
      toast.success("업무 일지가 삭제되었습니다");
      onOpenChange(false);
      onJournalUpdated?.();
    } catch (error) {
      console.error("업무 일지 삭제 실패:", error);
      toast.error("업무 일지 삭제에 실패했습니다");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const StatusIcon = getStatusIcon(journal.status);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <DialogTitle className="text-2xl">업무 일지 상세정보</DialogTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {projectName}
                  </Badge>
                  <Badge className={`flex items-center gap-1 ${getStatusColor(journal.status)}`}>
                    <StatusIcon className="h-3 w-3" />
                    {getStatusText(journal.status)}
                  </Badge>
                </div>
              </div>
              
              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* 업무 정보 */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    업무 정보
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">업무명</label>
                      <p className="text-lg font-medium mt-1">{taskName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">프로젝트</label>
                      <p className="mt-1">{projectName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 일지 내용 */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    일지 내용
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                    <div 
                      className="text-slate-700 dark:text-slate-300 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: journal.content }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 메타 정보 */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    작성 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">작성자</label>
                        <p className="font-medium">{authorName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Calendar className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">작성일시</label>
                        <p className="font-medium">{format(new Date(journal.created_at), "yyyy-MM-dd HH:mm")}</p>
                      </div>
                    </div>

                    {journal.updated_at && journal.updated_at !== journal.created_at && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                          <Clock className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">수정일시</label>
                          <p className="font-medium">{format(new Date(journal.updated_at), "yyyy-MM-dd HH:mm")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 첨부파일 */}
              {journal.files && journal.files.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Paperclip className="h-5 w-5 text-primary" />
                      첨부파일 ({journal.files.length}개)
                    </h3>
                    <div className="space-y-2">
                      {journal.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{file.name || `파일 ${index + 1}`}</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 협업자 */}
              {journal.collaborators && journal.collaborators.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      협업자 ({journal.collaborators.length}명)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {journal.collaborators.map((collaboratorId, index) => {
                        const collaborator = users.find(u => u.id === collaboratorId);
                        return (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {collaborator?.name || `협업자 ${index + 1}`}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>업무 일지 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 업무 일지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 수정 다이얼로그 */}
      <JournalEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        journal={journal}
        onJournalUpdated={onJournalUpdated}
      />
    </>
  );
};
