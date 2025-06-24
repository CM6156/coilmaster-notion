import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Edit3, 
  FileText, 
  CheckCircle, 
  Target, 
  MessageSquare, 
  ArrowRight,
  BookOpen,
  Lightbulb,
  User,
  Badge as BadgeIcon
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import { Separator } from '@/components/ui/separator';

interface JournalEntry {
  id: string;
  date: string;
  plans: string;
  completed: string;
  notes: string;
  nextDayPlans: string;
  createdAt?: string;
  updatedAt?: string;
}

interface JournalDetailPanelProps {
  journal: JournalEntry;
  onEdit?: () => void;
}

const JournalDetailPanel: React.FC<JournalDetailPanelProps> = ({
  journal,
  onEdit
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'yyyy년 M월 d일 (eee)', { locale: ko });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd HH:mm', { locale: ko });
    } catch {
      return dateString;
    }
  };

  const getContentSummary = (content: string, maxLength: number = 100) => {
    if (!content) return '';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const hasContent = journal.plans || journal.completed || journal.notes || journal.nextDayPlans;

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <BookOpen className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatDate(journal.date)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            업무 일지 상세 정보
          </p>
        </div>
      </div>

      {/* 메타 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            작성 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-3 text-sm">
            {journal.createdAt && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">작성일시:</span>
                <Badge variant="outline" className="text-xs">
                  {formatDateTime(journal.createdAt)}
                </Badge>
              </div>
            )}
            {journal.updatedAt && journal.updatedAt !== journal.createdAt && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">수정일시:</span>
                <Badge variant="outline" className="text-xs">
                  {formatDateTime(journal.updatedAt)}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 내용이 없는 경우 */}
      {!hasContent && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">작성된 내용이 없습니다</p>
            <p className="text-sm text-gray-500">일지를 편집하여 내용을 추가해보세요</p>
          </CardContent>
        </Card>
      )}

      {/* 오늘의 계획 */}
      {journal.plans && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              📋 오늘의 계획
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {journal.plans}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 완료한 업무 */}
      {journal.completed && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              ✅ 완료한 업무
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {journal.completed}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 특이사항 및 메모 */}
      {journal.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              📝 특이사항 및 메모
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {journal.notes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 내일 할 일 */}
      {journal.nextDayPlans && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-orange-500" />
              🔮 내일 할 일
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {journal.nextDayPlans}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 요약 통계 */}
      {hasContent && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BadgeIcon className="w-4 h-4 text-gray-500" />
              일지 요약
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {journal.plans ? journal.plans.split('\n').filter(line => line.trim()).length : 0}
                </div>
                <div className="text-xs text-gray-600">계획 항목</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {journal.completed ? journal.completed.split('\n').filter(line => line.trim()).length : 0}
                </div>
                <div className="text-xs text-gray-600">완료 항목</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 편집 버튼 */}
      {onEdit && (
        <div className="sticky bottom-0 pt-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <Button 
            onClick={onEdit} 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            일지 편집하기
          </Button>
        </div>
      )}
    </div>
  );
};

export default JournalDetailPanel; 