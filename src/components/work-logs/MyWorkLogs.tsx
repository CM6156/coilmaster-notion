import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { WorkLog } from '@/types';
import { useAppContext } from '@/context/AppContext';
import WorkLogEditor from './WorkLogEditor';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2,
  Eye,
  Tag,
  AlertCircle,
  CheckCircle,
  Pause
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const MyWorkLogs: React.FC = () => {
  const { currentUser } = useAppContext();
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | undefined>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 업무일지 목록 로드
  const loadWorkLogs = async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      let query = supabase
        .from('work_logs')
        .select('*, user:users(id, name, email, department)')
        .eq('user_id', currentUser.id)
        .order('log_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setWorkLogs(data || []);
    } catch (error) {
      console.error('업무일지 로드 오류:', error);
      toast({
        title: "로드 실패",
        description: "업무일지를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkLogs();
  }, [currentUser]);

  // 필터링된 업무일지
  const filteredWorkLogs = workLogs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || log.priority === priorityFilter;
    
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

    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  const handleCreateNew = () => {
    setSelectedWorkLog(undefined);
    setEditorOpen(true);
  };

  const handleEdit = (workLog: WorkLog) => {
    setSelectedWorkLog(workLog);
    setEditorOpen(true);
  };

  const handleDelete = async (workLog: WorkLog) => {
    if (!confirm('이 업무일지를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('work_logs')
        .delete()
        .eq('id', workLog.id);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: "업무일지가 삭제되었습니다.",
      });

      loadWorkLogs();
    } catch (error) {
      console.error('업무일지 삭제 오류:', error);
      toast({
        title: "삭제 실패",
        description: "업무일지 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    loadWorkLogs();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '완료': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case '진행중': return <Clock className="w-4 h-4 text-blue-600" />;
      case '보류': return <Pause className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료': return 'bg-green-100 text-green-800';
      case '진행중': return 'bg-blue-100 text-blue-800';
      case '보류': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '높음': return 'bg-red-100 text-red-800';
      case '보통': return 'bg-blue-100 text-blue-800';
      case '낮음': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStats = () => {
    const total = workLogs.length;
    const completed = workLogs.filter(log => log.status === '완료').length;
    const inProgress = workLogs.filter(log => log.status === '진행중').length;
    const onHold = workLogs.filter(log => log.status === '보류').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, onHold, completionRate };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>업무일지를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내 업무일지</h1>
          <p className="text-gray-600">개인 업무 기록을 관리하세요</p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          새 업무일지 작성
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">전체</p>
                <p className="text-xl font-bold">{stats.total}</p>
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
                <p className="text-xl font-bold">{stats.completed}</p>
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
                <p className="text-xl font-bold">{stats.inProgress}</p>
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
                <p className="text-xl font-bold">{stats.onHold}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-xs text-white font-bold">%</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">완료율</p>
                <p className="text-xl font-bold">{stats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="제목, 내용, 태그로 검색..."
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
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all'
                ? '검색 조건에 맞는 업무일지가 없습니다.'
                : '첫 번째 업무일지를 작성해보세요.'}
            </p>
            <Button onClick={handleCreateNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              새 업무일지 작성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkLogs.map((workLog) => (
            <Card key={workLog.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{workLog.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(workLog.status)}>
                        {getStatusIcon(workLog.status)}
                        <span className="ml-1">{workLog.status}</span>
                      </Badge>
                      <Badge className={getPriorityColor(workLog.priority)}>
                        {workLog.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(workLog.log_date), 'yyyy년 MM월 dd일', { locale: ko })}
                </div>

                {workLog.content && (
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {workLog.content}
                  </p>
                )}

                {workLog.tags && workLog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {workLog.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {workLog.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{workLog.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(workLog)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(workLog)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 업무일지 에디터 */}
      <WorkLogEditor
        workLog={selectedWorkLog}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleSave}
      />
    </div>
  );
};

export default MyWorkLogs; 