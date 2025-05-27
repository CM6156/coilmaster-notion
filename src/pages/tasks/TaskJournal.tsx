import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { JournalEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateId } from "@/utils/journalUtils";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Calendar, 
  Save, 
  X, 
  Sparkles, 
  Clock,
  User,
  Building2,
  PenTool,
  Hash,
  ArrowLeft,
  BookOpen,
  Target
} from "lucide-react";

// Replace this with a custom hook or local state management
const useJournal = () => {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  
  const createJournal = (journal: JournalEntry) => {
    setJournals(prev => [...prev, journal]);
    return journal;
  };
  
  const updateJournal = (journal: JournalEntry) => {
    setJournals(prev => prev.map(j => j.id === journal.id ? journal : j));
    return journal;
  };
  
  const deleteJournal = (id: string) => {
    setJournals(prev => prev.filter(j => j.id !== id));
  };
  
  return { journals, createJournal, updateJournal, deleteJournal };
};

const TaskJournal = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { tasks } = useAppContext();
  const { journals, createJournal } = useJournal();
  const { toast } = useToast();
  const { translations } = useLanguage();
  const t = translations;

  const [journal, setJournal] = useState<Partial<JournalEntry>>({
    title: "",
    content: "",
    date: format(new Date(), "yyyy-MM-dd"),
    department: undefined,
  });

  // Find the task with the given ID
  const task = tasks.find(t => t.id === taskId);

  // If task is not found, redirect to the task list page
  if (!task) {
    navigate("/tasks");
    return null;
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!journal.title || !journal.content) {
      toast({
        variant: "destructive",
        title: t?.global?.error || "오류",
        description: t?.journal?.titleContentRequired || "제목과 내용을 입력해주세요."
      });
      return;
    }

    const newJournal: JournalEntry = {
      id: generateId(),
      title: journal.title || "",
      content: journal.content || "",
      userId: "current-user-id", // Replace with actual user ID
      taskId: task.id,
      date: journal.date || format(new Date(), "yyyy-MM-dd"),
      department: task.department,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    createJournal(newJournal);
    
    toast({
      title: t?.journal?.journalCreated || "업무 일지 작성 완료",
      description: t?.journal?.journalCreatedDesc || "업무 일지가 성공적으로 작성되었습니다."
    });
    
    // Navigate back to the task detail page
    navigate(`/tasks/${taskId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🔥';
      case 'high': return '⚡';
      case 'medium': return '💫';
      case 'low': return '🌱';
      default: return '📌';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/tasks/${taskId}`)}
            className="mb-4 hover:bg-white/50 dark:hover:bg-slate-800/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t?.global?.back || "뒤로가기"}
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                {t?.journal?.create || "업무 일지 작성"}
              </h1>
              <p className="text-muted-foreground">
                {task.title} {t?.journal?.taskJournalDesc || "업무에 대한 일지를 작성합니다."}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t?.journal?.currentDate || "오늘 날짜"}</p>
              <p className="text-lg font-semibold">{format(new Date(), "yyyy년 MM월 dd일")}</p>
            </div>
          </div>
        </div>

        {/* 업무 정보 카드 */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
          <div className={cn("h-2", getStatusColor(task.status))} />
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  {task.title}
                </h3>
                <p className="text-muted-foreground mb-4">{task.description}</p>
              </div>
              <Badge variant="outline" className="ml-4">
                {getPriorityIcon(task.priority)} {task.priority}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">담당자:</span>
                <span className="font-medium">{task.assignedTo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">부서:</span>
                <span className="font-medium">{task.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">마감일:</span>
                <span className="font-medium">{task.dueDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">진행률:</span>
                <span className="font-medium">{task.progress}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 일지 작성 폼 */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              {t?.journal?.writeJournal || "일지 작성"}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {t?.journal?.writeJournalDesc || "오늘의 업무 진행 상황을 자세히 기록해주세요"}
            </p>
          </div>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {t?.journal?.yourTitle || "제목"}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="title"
                    value={journal.title || ""}
                    onChange={(e) => setJournal({ ...journal, title: e.target.value })}
                    placeholder={t?.journal?.titlePlaceholder || "업무 일지 제목을 입력하세요"}
                    className="pr-10 border-0 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
                  />
                  <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {t?.journal?.date || "날짜"}
                </label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    value={journal.date || ""}
                    onChange={(e) => setJournal({ ...journal, date: e.target.value })}
                    className="pr-10 border-0 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  {t?.journal?.content || "내용"}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Textarea
                    id="content"
                    value={journal.content || ""}
                    onChange={(e) => setJournal({ ...journal, content: e.target.value })}
                    placeholder={t?.journal?.contentPlaceholder || "업무 일지 내용을 입력하세요"}
                    className="min-h-[300px] resize-none border-0 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                    {journal.content?.length || 0} 자
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/tasks/${taskId}`)}
                  className="hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t?.journal?.cancel || "취소"}
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t?.journal?.save || "저장"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskJournal;
