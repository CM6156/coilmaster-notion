import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { WorkLog, WorkLogStats } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  X,
  User,
  Building2,
  Tag,
  AlertCircle,
  CheckCircle,
  Pause,
  ChevronRight,
  Users,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const AllWorkLogs: React.FC = () => {
  const { currentUser, departments } = useAppContext();
  const { language } = useLanguage();
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [stats, setStats] = useState<WorkLogStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null);
  const [showSlidePanel, setShowSlidePanel] = useState(false);

  // 번역 헬퍼 함수
  const getText = (ko: string, en: string, zh: string, th: string) => {
    switch (language) {
      case "en": return en;
      case "zh": return zh;
      case "th": return th;
      case "ko":
      default: return ko;
    }
  };

  // 전체 업무일지 목록 로드
  const loadAllWorkLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('work_logs')
        .select('*, user:users(id, name, email, department)')
        .order('log_date', { ascending: false });

      if (error) throw error;

      setWorkLogs(data || []);
    } catch (error) {
      console.error('전체 업무일지 로드 오류:', error);
      toast({
        title: getText("로드 실패", "Load Failed", "加载失败", "โหลดล้มเหลว"),
        description: getText(
          "업무일지를 불러오는 중 오류가 발생했습니다.",
          "An error occurred while loading work logs.",
          "加载工作日志时发生错误。",
          "เกิดข้อผิดพลาดขณะโหลดบันทึกการทำงาน"
        ),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 통계 데이터 로드
  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('work_logs_stats')
        .select('*')
        .order('total_logs', { ascending: false });

      if (error) throw error;

      setStats(data || []);
    } catch (error) {
      console.error('통계 로드 오류:', error);
    }
  };

  useEffect(() => {
    loadAllWorkLogs();
    loadStats();
  }, []);

  // 필터링된 업무일지
  const filteredWorkLogs = workLogs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || log.priority === priorityFilter;
    const matchesUser = userFilter === 'all' || log.user_id === userFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const logDate = new Date(log.log_date);
      const today = new Date();
      const diffTime = today.getTime() - logDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case 'today':
          matchesDate = diffDays <= 1;
          break;
        case 'week':
          matchesDate = diffDays <= 7;
          break;
        case 'month':
          matchesDate = diffDays <= 30;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesUser && matchesDate;
  });

  // 고유 사용자 목록
  const uniqueUsers = Array.from(
    new Map(workLogs.map(log => [log.user_id, log.user])).values()
  ).filter(user => user);

  const handleViewDetails = (workLog: WorkLog) => {
    setSelectedWorkLog(workLog);
    setShowSlidePanel(true);
  };

  const handleCloseSlidePanel = () => {
    setShowSlidePanel(false);
    setSelectedWorkLog(null);
  };

  const getStatusIcon = (status: string) => {
    const completedText = getText('완료', 'completed', 'completed', 'completed');
    const inProgressText = getText('진행중', 'in-progress', 'in-progress', 'in-progress');
    const onHoldText = getText('보류', 'on-hold', 'on-hold', 'on-hold');
    
    switch (status) {
      case completedText:
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case inProgressText:
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case onHoldText:
      case 'on-hold': return <Pause className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    const completedText = getText('완료', 'completed', 'completed', 'completed');
    const inProgressText = getText('진행중', 'in-progress', 'in-progress', 'in-progress');
    const onHoldText = getText('보류', 'on-hold', 'on-hold', 'on-hold');
    
    switch (status) {
      case completedText:
      case 'completed': return 'bg-green-100 text-green-800';
      case inProgressText:
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case onHoldText:
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    const highText = getText('높음', 'high', 'high', 'high');
    const normalText = getText('보통', 'normal', 'normal', 'normal');
    const lowText = getText('낮음', 'low', 'low', 'low');
    
    switch (priority) {
      case highText:
      case 'high': return 'bg-red-100 text-red-800';
      case normalText:
      case 'normal': return 'bg-blue-100 text-blue-800';
      case lowText:
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentName = (departmentId: string | undefined) => {
    if (!departmentId) return getText('부서 미지정', 'Unassigned Department', '未指定部门', 'แผนกที่ไม่ได้กำหนด');
    const dept = departments.find(d => d.id === departmentId || d.code === departmentId);
    return dept?.name || departmentId;
  };

  const getOverallStats = () => {
    const total = workLogs.length;
    const completed = workLogs.filter(log => log.status === '완료').length;
    const inProgress = workLogs.filter(log => log.status === '진행중').length;
    const onHold = workLogs.filter(log => log.status === '보류').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const activeUsers = uniqueUsers.length;

    return { total, completed, inProgress, onHold, completionRate, activeUsers };
  };

  const overallStats = getOverallStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>{getText(
            "업무일지를 불러오는 중...",
            "Loading work logs...",
            "正在加载工作日志...",
            "กำลังโหลดบันทึกการทำงาน..."
          )}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 메인 콘텐츠 */}
      <div className={`flex-1 transition-all duration-300 ${showSlidePanel ? 'mr-[50%]' : ''}`}>
        <div className="p-6 space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">전체 업무일지</h1>
              <p className="text-gray-600">팀원들의 업무 기록을 확인하세요</p>
            </div>
          </div>

          {/* 전체 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">전체 일지</p>
                    <p className="text-xl font-bold">{overallStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">완료</p>
                    <p className="text-xl font-bold">{overallStats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">진행중</p>
                    <p className="text-xl font-bold">{overallStats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Pause className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">보류</p>
                    <p className="text-xl font-bold">{overallStats.onHold}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">활성 사용자</p>
                    <p className="text-xl font-bold">{overallStats.activeUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">완료율</p>
                    <p className="text-xl font-bold">{overallStats.completionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 필터 및 검색 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="제목, 내용, 작성자, 태그로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 상태</SelectItem>
                      <SelectItem value="진행중">진행중</SelectItem>
                      <SelectItem value="완료">완료</SelectItem>
                      <SelectItem value="보류">보류</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="우선순위" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 우선순위</SelectItem>
                      <SelectItem value="높음">높음</SelectItem>
                      <SelectItem value="보통">보통</SelectItem>
                      <SelectItem value="낮음">낮음</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="작성자" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 작성자</SelectItem>
                      {uniqueUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="기간" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 기간</SelectItem>
                      <SelectItem value="today">오늘</SelectItem>
                      <SelectItem value="week">이번 주</SelectItem>
                      <SelectItem value="month">이번 달</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 업무일지 목록 */}
          {filteredWorkLogs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">업무일지가 없습니다</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || userFilter !== 'all' || dateFilter !== 'all'
                    ? '검색 조건에 맞는 업무일지가 없습니다.'
                    : '아직 작성된 업무일지가 없습니다.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredWorkLogs.map((workLog) => (
                <Card 
                  key={workLog.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewDetails(workLog)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{workLog.title}</h3>
                              <Badge className={getStatusColor(workLog.status)}>
                                {getStatusIcon(workLog.status)}
                                <span className="ml-1">{workLog.status}</span>
                              </Badge>
                              <Badge className={getPriorityColor(workLog.priority)}>
                                {workLog.priority}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {workLog.user?.name || '알 수 없음'}
                              </div>
                              <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                {getDepartmentName(workLog.user?.department)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(workLog.log_date), 'yyyy년 MM월 dd일', { locale: ko })}
                              </div>
                            </div>

                            {workLog.content && (
                              <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                                {workLog.content}
                              </p>
                            )}

                            {workLog.tags && workLog.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {workLog.tags.slice(0, 5).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                                {workLog.tags.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{workLog.tags.length - 5}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 슬라이드 패널 */}
      {showSlidePanel && selectedWorkLog && (
        <div className="fixed right-0 top-0 w-1/2 h-full bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="p-6">
            {/* 패널 헤더 */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <h2 className="text-xl font-bold">업무일지 상세</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseSlidePanel}
                className="hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* 업무일지 상세 내용 */}
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-2xl font-bold mb-4">{selectedWorkLog.title}</h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={getStatusColor(selectedWorkLog.status)}>
                    {getStatusIcon(selectedWorkLog.status)}
                    <span className="ml-1">{selectedWorkLog.status}</span>
                  </Badge>
                  <Badge className={getPriorityColor(selectedWorkLog.priority)}>
                    {selectedWorkLog.priority}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">작성자:</span>
                    <span>{selectedWorkLog.user?.name || '알 수 없음'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">부서:</span>
                    <span>{getDepartmentName(selectedWorkLog.user?.department)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">작성일:</span>
                    <span>{format(new Date(selectedWorkLog.log_date), 'yyyy년 MM월 dd일', { locale: ko })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">등록시간:</span>
                    <span>{format(new Date(selectedWorkLog.created_at), 'HH:mm', { locale: ko })}</span>
                  </div>
                </div>
              </div>

              {/* 업무 내용 */}
              {selectedWorkLog.content && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">업무 내용</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedWorkLog.content}
                    </p>
                  </div>
                </div>
              )}

              {/* 태그 */}
              {selectedWorkLog.tags && selectedWorkLog.tags.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">태그</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkLog.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 메타 정보 */}
              <div className="pt-4 border-t">
                <h4 className="text-lg font-semibold mb-3">메타 정보</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>생성일: {format(new Date(selectedWorkLog.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}</p>
                  <p>수정일: {format(new Date(selectedWorkLog.updated_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}</p>
                  <p>ID: {selectedWorkLog.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 오버레이 */}
      {showSlidePanel && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={handleCloseSlidePanel}
        />
      )}
    </div>
  );
};

export default AllWorkLogs; 