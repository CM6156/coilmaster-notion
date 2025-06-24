'use client';

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "../hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { ko } from "date-fns/locale";
import { supabase } from "../lib/supabase";
import { SimpleRichEditor } from "../components/ui/simple-rich-editor";
import { ImagePreview } from "../components/ui/image-preview";
import {
  ArrowLeft,
  Building2,
  UserCog,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Edit,
  Save,
  FileText,
  Clock,
  Check,
  ImageIcon,
  X,
  Upload,
  Eye,
  Link,
  Copy
} from "lucide-react";

const ManagerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    managers, 
    departments, 
    positions, 
    corporations, 
    currentUser,
    updateManager,
    workJournals,
    loadWorkJournals
  } = useAppContext();

  const [manager, setManager] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("journals");
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 업무일지 관련 상태
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [journal, setJournal] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    tasks: [
      {
        id: '1',
        title: '',
        content: ''
      }
    ],
    status: 'in-progress'
  });
  
  // 업무일지 상세보기 패널 상태
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [isJournalDetailOpen, setIsJournalDetailOpen] = useState(false);
  
  // 링크 생성 관련 상태
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  
  // 이미지 관련 상태 추가
  const [journalImages, setJournalImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // ReactQuill 관련 상태 제거됨
  
  // 프로필 편집 관련 상태
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState({
    name: '',
    email: '',
    department_id: '',
    position_id: '',
    corporation_id: '',
    profile_image: ''
  });
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  
  // 권한 확인 - 현재 사용자가 해당 담당자인지 확인
  const isOwnProfile = currentUser?.id === id || currentUser?.email === manager?.email;
  
  // ReactQuill 관련 코드 제거됨

  const [journals, setJournals] = useState<any[]>([
    {
      id: '1',
      date: '2023-06-05',
      title: '고객사 미팅 준비 및 진행',
      content: '오전: 프레젠테이션 자료 준비\n오후: ABC 고객사 미팅 진행\n미팅 결과: 긍정적 반응, 추가 견적 요청 있음',
      status: 'completed',
      createdAt: '2023-06-05T09:00:00.000Z'
    },
    {
      id: '2',
      date: '2023-06-04',
      title: '신규 프로젝트 기획',
      content: '프로젝트 범위 정의\n일정 계획 수립\n리소스 할당 계획',
      status: 'in-progress',
      createdAt: '2023-06-04T09:15:00.000Z'
    }
  ]);

  // 현재 사용자가 관리자 또는 본인인지 확인
  const canEdit = currentUser && (
    currentUser.role === 'admin' || 
    currentUser.role === 'manager' || 
    currentUser.id === id
  );

  // ReactQuill 관련 useEffect 제거됨

  // 담당자 데이터 가져오기
  useEffect(() => {
    if (id) {
      const foundManager = managers.find(m => m.id === id);
      setManager(foundManager || null);
      setIsLoading(false);
    }
  }, [id, managers]);

  // 업무일지 데이터 로드
  useEffect(() => {
    loadWorkJournals();
  }, []);

  // ReactQuill 관련 useEffect 제거됨

  // 해당 담당자의 업무일지만 필터링 (useMemo 사용)
  const managerJournals = useMemo(() => {
    if (!workJournals || !Array.isArray(workJournals)) {
      console.log('workJournals가 없거나 배열이 아닙니다:', workJournals);
      return [];
    }
    return workJournals.filter(journal => 
      journal.user_id === id || journal.user_id === manager?.id
    );
  }, [workJournals, id, manager?.id]);

  // 선택된 날짜가 변경되면 해당 날짜의 일지 로드
  useEffect(() => {
    const journalForDate = managerJournals.find(j => j.created_at?.split('T')[0] === selectedDate);
    if (journalForDate) {
      // 기존 데이터를 새로운 구조로 변환
      const tasks = [];
      try {
        // content가 JSON 형태인지 확인
        const parsedContent = JSON.parse(journalForDate.content || '[]');
        if (Array.isArray(parsedContent)) {
          tasks.push(...parsedContent);
        } else {
          // 기존 단일 텍스트 형태라면 첫 번째 업무로 변환
          tasks.push({
            id: '1',
            title: '업무일지',
            content: journalForDate.content || ''
          });
        }
      } catch {
        // JSON 파싱 실패 시 기존 텍스트를 첫 번째 업무로 변환
        tasks.push({
          id: '1',
          title: '업무일지',
          content: journalForDate.content || ''
        });
      }
      
      setJournal({
        date: selectedDate,
        tasks: tasks.length > 0 ? tasks : [{
          id: '1',
          title: '',
          content: ''
        }],
        status: journalForDate.status || 'in-progress'
      });
      setJournalImages([]);
    } else {
      // 새로운 일지 생성
      setJournal({
        date: selectedDate,
        tasks: [{
          id: '1',
          title: '',
          content: ''
        }],
        status: 'in-progress'
      });
      setJournalImages([]);
    }
  }, [selectedDate, managerJournals]);

  // 부서명 가져오기 함수
  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return '미지정';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || '미지정';
  };

  // 법인명 가져오기 함수
  const getCorporationName = (corporationId?: string) => {
    if (!corporationId) return '미지정';
    const corporation = corporations.find(c => c.id === corporationId);
    return corporation?.name || '미지정';
  };

  // 직책명 가져오기 함수
  const getPositionName = (positionId?: string) => {
    if (!positionId) return '미지정';
    const position = positions.find(p => p.id === positionId);
    return position?.name || '미지정';
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return dateString;
      return format(date, 'yyyy년 MM월 dd일', { locale: ko });
    } catch (error) {
      return dateString;
    }
  };

  // 이니셜 생성 함수
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // 이미지 업로드 함수
  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      setIsUploadingImage(true);
      
      // 안전한 파일명 생성
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `profile-images/profile_${timestamp}_${randomId}.${fileExtension}`;
      
      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);
      
      if (error) {
        console.error('이미지 업로드 오류:', error);
        toast({
          title: "이미지 업로드 실패",
          description: "이미지를 업로드하는 중 오류가 발생했습니다.",
          variant: "destructive"
        });
        return null;
      }
      
      // 업로드된 파일의 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('이미지 업로드 처리 중 오류:', error);
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };



  // 프로필 편집 모달 열기
  const openProfileEdit = () => {
    if (manager) {
      setEditingProfile({
        name: manager.name || '',
        email: manager.email || '',
        department_id: manager.department_id || '',
        position_id: manager.position_id || '',
        corporation_id: manager.corporation_id || '',
        profile_image: manager.profile_image || ''
      });
      setIsProfileEditOpen(true);
    }
  };

  // 프로필 사진 업로드
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setIsUploadingProfile(true);
      
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "파일 크기 초과",
          description: "이미지 크기는 5MB 이하여야 합니다.",
          variant: "destructive"
        });
        setIsUploadingProfile(false);
        return;
      }
      
      const imageUrl = await uploadImageToSupabase(file);
      if (imageUrl) {
        setEditingProfile(prev => ({ ...prev, profile_image: imageUrl }));
        toast({
          title: "프로필 사진 업로드 완료",
          description: "저장 버튼을 눌러 변경사항을 적용하세요.",
        });
      }
      setIsUploadingProfile(false);
    }
    e.target.value = '';
  };

  // 프로필 정보 저장
  const handleSaveProfile = async () => {
    try {
      if (!manager?.id) return;
      
      await updateManager(manager.id, editingProfile);
      
      // Supabase에서 최신 데이터 다시 조회
      const { data: updatedManager, error } = await supabase
        .from('managers')
        .select(`
          *,
          departments:department_id(name),
          positions:position_id(name),
          corporations:corporation_id(name)
        `)
        .eq('id', manager.id)
        .single();

      if (error) {
        console.error('업데이트된 프로필 조회 오류:', error);
        // 오류 시에도 로컬 상태는 업데이트
        setManager(prev => ({
          ...prev,
          ...editingProfile
        }));
      } else {
        // Supabase에서 가져온 최신 데이터로 상태 업데이트
        setManager(updatedManager);
      }
      
      setIsProfileEditOpen(false);
      
      toast({
        title: "프로필 업데이트 완료",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
      });
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      toast({
        title: "프로필 업데이트 실패",
        description: "프로필 정보를 업데이트하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // 업무 항목 추가
  const addTask = () => {
    const newTask = {
      id: Date.now().toString(),
      title: '',
      content: ''
    };
    setJournal(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  // 업무 항목 삭제
  const removeTask = (taskId: string) => {
    if (journal.tasks.length <= 1) {
      toast({
        title: "삭제 불가",
        description: "최소 하나의 업무 항목은 필요합니다.",
        variant: "destructive",
      });
      return;
    }
    setJournal(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }));
  };

  // 업무 항목 업데이트
  const updateTask = (taskId: string, field: 'title' | 'content', value: string) => {
    setJournal(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    }));
  };

  // 일지 저장 함수
  const handleSaveJournal = async () => {
    // 최소 하나의 업무에 내용이 있는지 확인
    const hasContent = journal.tasks.some(task => 
      task.title.trim() || task.content.trim()
    );

    if (!hasContent) {
      toast({
        title: "입력 오류",
        description: "최소 하나의 업무 제목 또는 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 현재 날짜의 기존 일지가 있는지 확인
      const existingJournal = managerJournals.find(j => 
        j.created_at?.split('T')[0] === journal.date
      );

      // 업무 목록을 JSON 문자열로 변환
      const contentJson = JSON.stringify(journal.tasks);

      if (existingJournal) {
        // 기존 일지 업데이트
        console.log('🔄 업무일지 업데이트 데이터:', {
          id: existingJournal.id,
          content: contentJson,
          status: journal.status,
          date: journal.date
        });

        const { data, error } = await supabase
          .from('work_journals')
          .update({
            content: contentJson,
            status: journal.status,
            date: journal.date
          })
          .eq('id', existingJournal.id)
          .select();

        console.log('📝 업무일지 업데이트 결과:', { data, error });

        if (error) throw error;

        toast({
          title: "업무일지 수정 완료",
          description: `${formatDate(journal.date)}의 업무일지가 성공적으로 수정되었습니다.`,
          variant: "default",
        });
      } else {
        // 새 일지 생성
        console.log('🔍 업무일지 생성 데이터:', {
          user_id: manager?.id || id,
          content: contentJson,
          status: journal.status,
          date: journal.date,
          manager: manager,
          currentUser: currentUser
        });

        const { data, error } = await supabase
          .from('work_journals')
          .insert({
            user_id: manager?.id || id,
            content: contentJson,
            status: journal.status,
            date: journal.date
          })
          .select();

        console.log('📝 업무일지 생성 결과:', { data, error });

        if (error) throw error;

        toast({
          title: "업무일지 저장 완료",
          description: `${formatDate(journal.date)}의 업무일지가 성공적으로 저장되었습니다.`,
          variant: "default",
        });
      }

      // 데이터 새로고침
      await loadWorkJournals();
      
    } catch (error) {
      console.error('업무일지 저장 오류:', error);
      toast({
        title: "저장 실패",
        description: "업무일지 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 일지 상태 변경 함수
  const handleStatusChange = (status: string) => {
    setJournal({
      ...journal,
      status
    });
  };

  // 업무일지 상세보기 열기
  const openJournalDetail = (journal: any) => {
    setSelectedJournal(journal);
    setIsJournalDetailOpen(true);
  };

  // 업무일지 링크 생성
  const generateJournalLink = async (journalId: string) => {
    setIsGeneratingLink(true);
    
    try {
      // 공유 가능한 링크 생성 (실제로는 API를 통해 생성)
      const baseUrl = window.location.origin;
      const shareableLink = `${baseUrl}/shared-journal/${journalId}`;
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(shareableLink);
      
      toast({
        title: "링크 생성 완료",
        description: "업무일지 공유 링크가 클립보드에 복사되었습니다.",
        variant: "default",
      });
      
    } catch (error) {
      console.error('링크 생성 오류:', error);
      toast({
        title: "링크 생성 실패",
        description: "링크 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!manager) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">담당자를 찾을 수 없습니다</h1>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/managers')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          담당자 목록으로
        </Button>
        <div className="h-6 w-px bg-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900">담당자 상세 정보</h1>
      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          {/* 상단 헤더 */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              담당자 목록으로 돌아가기
            </Button>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-32 w-32 rounded-xl border-4 border-white shadow-xl">
                <AvatarImage src={manager.profile_image} alt={manager.name} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getInitials(manager.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold">{manager.name}</h1>
                    <p className="text-lg text-muted-foreground">{manager.email}</p>
                  </div>

                  {/* 프로필 편집 버튼 - 본인만 볼 수 있음 */}
                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openProfileEdit}
                      className="bg-white"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      프로필 편집
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">부서</p>
                      <p className="font-medium">{getDepartmentName(manager.department_id)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">직책</p>
                      <p className="font-medium">{getPositionName(manager.position_id)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">법인</p>
                      <p className="font-medium">{getCorporationName(manager.corporation_id)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 탭 컨텐츠 */}
          <Tabs defaultValue="journals" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="journals">업무일지</TabsTrigger>
            </TabsList>

            <TabsContent value="journals" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{manager.name} 담당자 업무일지</CardTitle>
                  <CardDescription>
                    일일 업무 내용과 진행 상황을 날짜별로 확인할 수 있습니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 업무일지 작성/수정 섹션 - 본인만 볼 수 있음 */}
                  {isOwnProfile && (
                    <div className="mb-8 p-6 border rounded-lg bg-slate-50">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">{formatDate(selectedDate)} 업무일지</h3>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            journal.status === 'completed' ? 'default' : 
                            journal.status === 'in-progress' ? 'secondary' :
                            journal.status === 'delayed' ? 'destructive' : 'outline'
                          }>
                            {journal.status === 'completed' ? '완료' : 
                             journal.status === 'in-progress' ? '진행중' :
                             journal.status === 'delayed' ? '지연' : '시작 전'}
                          </Badge>
                          
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-1.5 border rounded-md text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* 업무 항목들 */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">업무 항목</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addTask}
                              className="flex items-center gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              업무 추가
                            </Button>
                          </div>

                          {journal.tasks.map((task, index) => (
                            <Card key={task.id} className="border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <h4 className="font-medium text-gray-900">
                                    업무 {index + 1}
                                  </h4>
                                  {journal.tasks.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTask(task.id)}
                                      className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium mb-1">
                                      업무 제목 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={task.title}
                                      onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="업무 제목을 입력하세요"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium mb-1">
                                      업무 내용 <span className="text-red-500">*</span>
                                    </label>
                                    <SimpleRichEditor
                                      value={task.content}
                                      onChange={(content) => updateTask(task.id, 'content', content)}
                                      placeholder="업무 내용을 상세히 기록하세요

📝 업무 상황, 진행 사항, 성과 등을 자세히 작성해주세요.

• 수행한 업무 • 진행 상황 • 성과 및 결과 • 특이사항 • 내일 계획"
                                      height={250}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* 추가 이미지 첨부 섹션 */}
                        {journalImages.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium mb-2">첨부된 이미지</label>
                            <ImagePreview 
                              images={journalImages}
                              editable={true}
                              onRemove={(index) => {
                                const newImages = [...journalImages];
                                newImages.splice(index, 1);
                                setJournalImages(newImages);
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium">진행 상태</label>
                              <Select value={journal.status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue placeholder="상태 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not-started">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                      시작 전
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="in-progress">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3 w-3 text-blue-500" />
                                      진행중
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="completed">
                                    <div className="flex items-center gap-2">
                                      <Check className="h-3 w-3 text-green-500" />
                                      완료
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="delayed">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      지연
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <Button onClick={handleSaveJournal}>
                            <Save className="h-4 w-4 mr-2" />
                            저장하기
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 업무일지 목록 - 날짜별로 정렬 */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold">업무일지 목록</h3>
                      <div className="text-sm text-muted-foreground">
                        총 {managerJournals.length}개의 업무일지
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {managerJournals.length > 0 ? (
                        managerJournals
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .map(entry => (
                            <Card 
                              key={entry.id} 
                              className="hover:shadow-md transition-shadow"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-semibold text-lg">업무일지</h4>
                                      <Badge variant={
                                        entry.status === 'completed' ? 'default' : 
                                        entry.status === 'in-progress' ? 'secondary' :
                                        entry.status === 'delayed' ? 'destructive' : 'outline'
                                      }>
                                        {entry.status === 'completed' ? '완료' : 
                                         entry.status === 'in-progress' ? '진행중' :
                                         entry.status === 'delayed' ? '지연' : '시작 전'}
                                      </Badge>
                                      {/* 이미지가 포함된 일지 표시 */}
                                      {(entry as any).images && (entry as any).images.length > 0 && (
                                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                          <ImageIcon className="h-3 w-3" />
                                          <span>{(entry as any).images.length}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-3">
                                      {/* 링크 생성 버튼 */}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          generateJournalLink(entry.id);
                                        }}
                                        disabled={isGeneratingLink}
                                        className="flex items-center gap-1 h-8 px-2"
                                      >
                                        {isGeneratingLink ? (
                                          <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-current"></div>
                                        ) : (
                                          <Link className="h-3 w-3" />
                                        )}
                                        <span className="text-xs">링크</span>
                                      </Button>
                                      
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium text-blue-600">
                                        {formatDate(entry.created_at)}
                                      </span>
                                    </div>
                                    
                                    <div className="text-gray-600 overflow-hidden">
                                      <div className="line-clamp-3">
                                        {entry.content ? (
                                          <div 
                                            className="prose prose-sm"
                                            dangerouslySetInnerHTML={{ 
                                              __html: entry.content.length > 150 
                                                ? `${entry.content.substring(0, 150)}...`
                                                : entry.content
                                            }} 
                                          />
                                        ) : (
                                          "내용 없음"
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="ml-4 flex flex-col items-end gap-2">
                                    <div className="text-xs text-muted-foreground">
                                      {format(parseISO(entry.created_at), 'HH:mm')}
                                    </div>
                                    
                                    {/* 상세보기 버튼 */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openJournalDetail(entry);
                                      }}
                                      className="flex items-center gap-1 h-8 px-2"
                                    >
                                      <Eye className="h-3 w-3" />
                                      <span className="text-xs">상세보기</span>
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                      ) : (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg mb-2">
                              기록된 업무일지가 없습니다.
                            </p>
                            <p className="text-sm text-muted-foreground">
                              위의 날짜 선택기를 사용하여 새로운 업무일지를 작성해보세요.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 프로필 편집 모달 */}
      <Dialog open={isProfileEditOpen} onOpenChange={setIsProfileEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>프로필 편집</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 프로필 사진 섹션 */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={editingProfile.profile_image} alt="프로필 사진" />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(editingProfile.name)}
                  </AvatarFallback>
                </Avatar>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                  id="profile-image-upload"
                />
                <label
                  htmlFor="profile-image-upload"
                  className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  {isUploadingProfile ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </label>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                프로필 사진을 변경하려면 카메라 아이콘을 클릭하세요
              </p>
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">이름</label>
                <input
                  type="text"
                  value={editingProfile.name}
                  onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="이름을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">이메일</label>
                <input
                  type="email"
                  value={editingProfile.email}
                  onChange={(e) => setEditingProfile({...editingProfile, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="이메일을 입력하세요"
                />
              </div>
            </div>

            {/* 조직 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">법인</label>
                <select
                  value={editingProfile.corporation_id}
                  onChange={(e) => setEditingProfile({...editingProfile, corporation_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">법인을 선택하세요</option>
                  {corporations.map(corp => (
                    <option key={corp.id} value={corp.id}>{corp.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">부서</label>
                <select
                  value={editingProfile.department_id}
                  onChange={(e) => setEditingProfile({...editingProfile, department_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">부서를 선택하세요</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">직책</label>
                <select
                  value={editingProfile.position_id}
                  onChange={(e) => setEditingProfile({...editingProfile, position_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">직책을 선택하세요</option>
                  {positions.map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsProfileEditOpen(false)}
            >
              취소
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={isUploadingProfile}
            >
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 업무일지 상세보기 슬라이드 패널 */}
      <Sheet open={isJournalDetailOpen} onOpenChange={setIsJournalDetailOpen}>
        <SheetContent side="right" className="w-[600px] sm:w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              업무일지 상세보기
            </SheetTitle>
          </SheetHeader>
          
          {selectedJournal && (
            <div className="mt-6 space-y-6">
              {/* 업무일지 기본 정보 */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold">업무일지</h3>
                                  <Badge variant={
                  selectedJournal.status === 'completed' ? 'default' : 
                  selectedJournal.status === 'in-progress' ? 'secondary' :
                  selectedJournal.status === 'delayed' ? 'destructive' : 'outline'
                }>
                  {selectedJournal.status === 'completed' ? '완료' : 
                   selectedJournal.status === 'in-progress' ? '진행중' :
                   selectedJournal.status === 'delayed' ? '지연' : '시작 전'}
                </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(selectedJournal.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{format(parseISO(selectedJournal.created_at), 'HH:mm')}</span>
                  </div>
                </div>
              </div>

              {/* 담당자 정보 */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={manager?.profile_image} alt={manager?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(manager?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{manager?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {getDepartmentName(manager?.department_id)} · {getPositionName(manager?.position_id)}
                  </div>
                </div>
              </div>

              {/* 업무일지 내용 */}
              <div>
                <h4 className="font-medium mb-3">업무 내용</h4>
                <div className="p-4 border rounded-lg bg-white space-y-4">
                  {selectedJournal.content ? (
                    (() => {
                      try {
                        // JSON 형태인지 확인하고 파싱
                        const parsedContent = JSON.parse(selectedJournal.content);
                        if (Array.isArray(parsedContent)) {
                          // 다중 업무 항목인 경우
                          return parsedContent.map((task: any, index: number) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                              <h5 className="font-semibold text-lg mb-2">
                                {task.title || `업무 ${index + 1}`}
                              </h5>
                              <div 
                                className="text-gray-700 whitespace-pre-wrap prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: task.content || '' }}
                              />
                            </div>
                          ));
                        } else {
                          // 단일 객체인 경우
                          return (
                            <div className="border-l-4 border-blue-500 pl-4 py-2">
                              <h5 className="font-semibold text-lg mb-2">
                                {parsedContent.title || '업무일지'}
                              </h5>
                              <div 
                                className="text-gray-700 whitespace-pre-wrap prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: parsedContent.content || '' }}
                              />
                            </div>
                          );
                        }
                      } catch (error) {
                        // JSON 파싱 실패 시 일반 텍스트로 처리
                        return (
                          <div className="border-l-4 border-blue-500 pl-4 py-2">
                            <h5 className="font-semibold text-lg mb-2">업무일지</h5>
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                              {selectedJournal.content}
                            </pre>
                          </div>
                        );
                      }
                    })()
                  ) : (
                    <p className="text-muted-foreground">내용이 없습니다.</p>
                  )}
                </div>
              </div>

              {/* 이미지가 있는 경우 표시 */}
              {(selectedJournal as any).images && (selectedJournal as any).images.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">첨부 이미지</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(selectedJournal as any).images.map((image: string, index: number) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <img 
                          src={image} 
                          alt={`첨부 이미지 ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 액션 버튼들 */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => generateJournalLink(selectedJournal.id)}
                  disabled={isGeneratingLink}
                  className="flex items-center gap-2"
                >
                  {isGeneratingLink ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t border-b border-current"></div>
                  ) : (
                    <Link className="h-4 w-4" />
                  )}
                  공유 링크 생성
                </Button>
                
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDate(selectedJournal.created_at.split('T')[0]);
                      setIsJournalDetailOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    편집하기
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
  };

export default ManagerDetail; 