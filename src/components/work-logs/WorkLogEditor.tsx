import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { WorkLog, CreateWorkLogInput, UpdateWorkLogInput } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { Calendar, Clock, FileText, Plus, Save, X, Tag, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface WorkLogEditorProps {
  workLog?: WorkLog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (workLog: WorkLog) => void;
}

const WorkLogEditor: React.FC<WorkLogEditorProps> = ({
  workLog,
  open,
  onOpenChange,
  onSave
}) => {
  const { currentUser } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateWorkLogInput>({
    user_id: currentUser?.id || '',
    title: '',
    content: '',
    log_date: format(new Date(), 'yyyy-MM-dd'),
    status: '진행중',
    priority: '보통',
    tags: []
  });
  const [newTag, setNewTag] = useState('');

  // 편집 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (workLog) {
      setFormData({
        user_id: workLog.user_id,
        title: workLog.title,
        content: workLog.content || '',
        log_date: workLog.log_date,
        status: workLog.status,
        priority: workLog.priority,
        tags: workLog.tags || []
      });
    } else {
      // 새 작성 모드일 때 초기화
      setFormData({
        user_id: currentUser?.id || '',
        title: '',
        content: '',
        log_date: format(new Date(), 'yyyy-MM-dd'),
        status: '진행중',
        priority: '보통',
        tags: []
      });
    }
  }, [workLog, currentUser, open]);

  const handleInputChange = (field: keyof CreateWorkLogInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "입력 오류",
        description: "제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser?.id) {
      toast({
        title: "인증 오류",
        description: "로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (workLog) {
        // 업데이트
        const updateData: UpdateWorkLogInput = {
          id: workLog.id,
          ...formData
        };

        const { data, error } = await supabase
          .from('work_logs')
          .update({
            title: updateData.title,
            content: updateData.content,
            log_date: updateData.log_date,
            status: updateData.status,
            priority: updateData.priority,
            tags: updateData.tags
          })
          .eq('id', workLog.id)
          .select('*, user:users(id, name, email, department)')
          .single();

        if (error) throw error;

        toast({
          title: "업무일지 수정 완료",
          description: "업무일지가 성공적으로 수정되었습니다.",
        });

        onSave?.(data);
      } else {
        // 새로 생성
        const { data, error } = await supabase
          .from('work_logs')
          .insert([formData])
          .select('*, user:users(id, name, email, department)')
          .single();

        if (error) throw error;

        toast({
          title: "업무일지 작성 완료",
          description: "업무일지가 성공적으로 저장되었습니다.",
        });

        onSave?.(data);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('업무일지 저장 오류:', error);
      toast({
        title: "저장 실패",
        description: "업무일지 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {workLog ? '업무일지 수정' : '새 업무일지 작성'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">제목 *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="업무일지 제목을 입력하세요"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">날짜</label>
                  <Input
                    type="date"
                    value={formData.log_date}
                    onChange={(e) => handleInputChange('log_date', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">상태</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="진행중">진행중</SelectItem>
                      <SelectItem value="완료">완료</SelectItem>
                      <SelectItem value="보류">보류</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">우선순위</label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="높음">높음</SelectItem>
                      <SelectItem value="보통">보통</SelectItem>
                      <SelectItem value="낮음">낮음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 내용 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">업무 내용</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="오늘 수행한 업무 내용을 상세히 기록해주세요..."
                className="min-h-[200px] resize-none"
              />
            </CardContent>
          </Card>

          {/* 태그 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-4 h-4" />
                태그
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="태그 입력"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1"
                />
                <Button onClick={handleAddTag} variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-500"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 미리보기 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">미리보기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{formData.title || '제목 없음'}</h3>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(formData.status)}>
                    {formData.status}
                  </Badge>
                  <Badge className={getPriorityColor(formData.priority)}>
                    {formData.priority}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(formData.log_date), 'yyyy년 MM월 dd일', { locale: ko })}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {format(new Date(), 'HH:mm')}
                </div>
              </div>

              {formData.content && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm">{formData.content}</p>
                </div>
              )}

              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.title.trim()}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {workLog ? '수정' : '저장'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkLogEditor; 