import React, { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import JournalCreateDialog from "@/components/tasks/journal/JournalCreateDialog";
import { JournalDetailDialog } from "@/components/tasks/journal/JournalDetailDialog";
import { JournalEditDialog } from "@/components/tasks/journal/JournalEditDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Search, 
  Calendar, 
  User, 
  FileText, 
  Filter,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Paperclip,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Sparkles,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 업무 일지 타입 정의
interface WorkJournal {
  id: string;
  projectId: string;
  projectName: string;
  taskId: string;
  taskName: string;
  content: string;
  status: "not-started" | "in-progress" | "delayed" | "completed";
  files: File[];
  collaborators: string[];
  authorId: string;
  authorName: string;
  createdAt: string;
}

type JournalFormData = {
  project_id: string;
  task_id: string;
  content: string;
  status: "not-started" | "in-progress" | "delayed" | "completed";
  files: File[];
  collaborators: string[];
  author_id: string;
  author_name: string;
};

const TaskJournalList = () => {
  const { users, projects, tasks, currentUser, workJournals, createWorkJournal } = useAppContext();
  const { translations } = useLanguage();
  const t = translations.tasks;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // 업무 일지 생성
  const handleCreateJournal = async (data: JournalFormData) => {
    try {
      await createWorkJournal(data);
    } catch (error) {
      console.error("업무 일지 생성 실패:", error);
    }
  };

  // 상세보기 핸들러
  const handleViewDetail = (journal: any) => {
    setSelectedJournal(journal);
    setIsDetailDialogOpen(true);
  };

  // 수정 핸들러
  const handleEdit = (journal: any) => {
    setSelectedJournal(journal);
    setIsEditDialogOpen(true);
  };

  // 업무 일지 업데이트 콜백
  const handleJournalUpdated = () => {
    setRefreshKey(prev => prev + 1);
    // 선택된 일지 정보도 업데이트
    if (selectedJournal) {
      const updatedJournal = workJournals.find(j => j.id === selectedJournal.id);
      if (updatedJournal) {
        setSelectedJournal(updatedJournal);
      } else {
        // 일지가 삭제된 경우
        setSelectedJournal(null);
        setIsDetailDialogOpen(false);
      }
    }
  };

  // 검색 필터링 (프로젝트명과 업무명 매핑 추가)
  const filteredJournals = workJournals.filter(journal => {
    const project = projects.find(p => p.id === journal.project_id);
    const task = tasks.find(t => t.id === journal.task_id);
    const projectName = project?.name || '';
    const taskName = task?.title || '';
    
    const matchesSearch = projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           journal.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
           journal.author_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || journal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      case "not-started": return "bg-gray-500";
      case "in-progress": return "bg-blue-500";
      case "delayed": return "bg-red-500";
      case "completed": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "not-started": return "secondary";
      case "in-progress": return "default";
      case "delayed": return "destructive";
      case "completed": return "default";
      default: return "secondary";
    }
  };

  const stats = [
    {
      title: "전체 일지",
      count: workJournals.length,
      icon: BookOpen,
      color: "bg-gradient-to-br from-blue-500 to-purple-500",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "진행중",
      count: workJournals.filter(j => j.status === "in-progress").length,
      icon: Loader2,
      color: "bg-gradient-to-br from-yellow-500 to-orange-500",
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
    },
    {
      title: "완료",
      count: workJournals.filter(j => j.status === "completed").length,
      icon: CheckCircle2,
      color: "bg-gradient-to-br from-green-500 to-emerald-500",
      iconColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "지연",
      count: workJournals.filter(j => j.status === "delayed").length,
      icon: AlertCircle,
      color: "bg-gradient-to-br from-red-500 to-pink-500",
      iconColor: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                {t?.taskJournalList || "업무 일지 목록"}
              </h1>
              <p className="text-muted-foreground">
                {t?.taskJournalDescription || "등록된 업무에 대한 일지를 작성하고 관리하세요"}
              </p>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)} 
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              {t?.createJournal || "업무 일지 작성"}
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className={cn("h-1", stat.color)} />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.count}</p>
                  </div>
                  <div className={cn("p-3 rounded-full", stat.bgColor, "group-hover:scale-110 transition-transform")}>
                    <stat.icon className={cn("h-6 w-6", stat.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t?.searchPlaceholder || "프로젝트, 업무, 내용, 작성자 검색..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-0 shadow-md"
            />
            <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-2">
              {["all", "in-progress", "completed", "delayed", "not-started"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    statusFilter === status && "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0"
                  )}
                >
                  {status === "all" ? "전체" : getStatusText(status)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 일지 목록 */}
        <div className="space-y-4">
          {filteredJournals.length > 0 ? (
            filteredJournals.map((journal) => {
              const project = projects.find(p => p.id === journal.project_id);
              const task = tasks.find(t => t.id === journal.task_id);
              const projectName = project?.name || '';
              const taskName = task?.title || '';
              const StatusIcon = getStatusIcon(journal.status);
              
              return (
                <Card key={journal.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className={cn("h-1", getStatusColor(journal.status))} />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {projectName}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(journal.status)} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {getStatusText(journal.status)}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {taskName}
                        </CardTitle>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetail(journal)}>
                            <Eye className="h-4 w-4 mr-2" />
                            상세보기
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(journal)}>
                            <Edit className="h-4 w-4 mr-2" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* 내용 */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap line-clamp-3 text-slate-700 dark:text-slate-300">
                          {journal.content}
                        </p>
                      </div>
                      
                      {/* 메타 정보 */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                            <User className="h-3 w-3 text-blue-600" />
                          </div>
                          <span>{journal.author_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                            <Calendar className="h-3 w-3 text-purple-600" />
                          </div>
                          <span>{format(new Date(journal.created_at), "yyyy-MM-dd HH:mm")}</span>
                        </div>
                        
                        {journal.files && journal.files.length > 0 && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30">
                              <Paperclip className="h-3 w-3 text-green-600" />
                            </div>
                            <span>파일 {journal.files.length}개</span>
                          </div>
                        )}
                        
                        {journal.collaborators && journal.collaborators.length > 0 && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/30">
                              <Users className="h-3 w-3 text-orange-600" />
                            </div>
                            <span>협업자 {journal.collaborators.length}명</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  
                  {/* 호버 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </Card>
              );
            })
          ) : (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-16 text-center">
                <div className="relative">
                  <FileText className="h-20 w-20 mx-auto text-muted-foreground/20 mb-6" />
                  <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-indigo-500 to-purple-500 pointer-events-none" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm ? "검색 결과가 없습니다" : "등록된 업무 일지가 없습니다"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm 
                    ? "다른 검색어로 다시 시도해보세요"
                    : "첫 번째 업무 일지를 작성해보세요"
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    size="lg"
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    {t?.createJournal || "업무 일지 작성하기"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 업무 일지 작성 모달 */}
        <JournalCreateDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreate={handleCreateJournal}
        />
        
        {/* 업무 일지 상세정보 모달 */}
        <JournalDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          journal={selectedJournal}
          onJournalUpdated={handleJournalUpdated}
        />
        
        {/* 업무 일지 수정 모달 */}
        <JournalEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          journal={selectedJournal}
          onJournalUpdated={handleJournalUpdated}
        />
      </div>
    </div>
  );
};

export default TaskJournalList;
