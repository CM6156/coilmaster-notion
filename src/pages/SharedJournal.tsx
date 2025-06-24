import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { format, parseISO, isValid } from "date-fns";
import { ko } from "date-fns/locale";
import { supabase } from "../lib/supabase";
import {
  FileText,
  Calendar,
  Clock,
  User,
  Building2,
  Briefcase,
  Copy,
  Check
} from "lucide-react";

const SharedJournal = () => {
  const { journalId } = useParams<{ journalId: string }>();
  const [journal, setJournal] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // 이니셜 생성 함수
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString?: string) => {
    if (!dateString) return "날짜 없음";
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "잘못된 날짜";
      
      return format(date, 'yyyy년 MM월 dd일 (E)', { locale: ko });
    } catch (error) {
      return "날짜 오류";
    }
  };

  // 업무일지 데이터 로드
  useEffect(() => {
    const loadJournal = async () => {
      if (!journalId) {
        setError("잘못된 업무일지 ID입니다.");
        setIsLoading(false);
        return;
      }

      try {
        // 업무일지 조회
        const { data: journalData, error: journalError } = await supabase
          .from('work_journals')
          .select('*')
          .eq('id', journalId)
          .single();

        if (journalError) {
          throw new Error('업무일지를 찾을 수 없습니다.');
        }

        if (!journalData) {
          throw new Error('업무일지가 존재하지 않습니다.');
        }

        setJournal(journalData);

        // 작성자 정보 조회
        const { data: authorData, error: authorError } = await supabase
          .from('managers')
          .select(`
            *,
            departments:department_id(name),
            positions:position_id(name),
            corporations:corporation_id(name)
          `)
          .eq('id', journalData.user_id)
          .single();

        if (authorError) {
          console.warn('작성자 정보를 가져올 수 없습니다:', authorError);
        } else {
          setAuthor(authorData);
        }

      } catch (error: any) {
        console.error('업무일지 로드 오류:', error);
        setError(error.message || '업무일지를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadJournal();
  }, [journalId]);

  // 링크 복사
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('링크 복사 실패:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">업무일지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !journal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">업무일지를 찾을 수 없습니다</h1>
            <p className="text-muted-foreground mb-4">
              {error || "요청하신 업무일지가 존재하지 않거나 삭제되었습니다."}
            </p>
            <Button onClick={() => window.close()}>
              창 닫기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">업무일지 공유</h1>
          </div>
          <p className="text-muted-foreground">
            업무일지가 공유되었습니다. 아래 내용을 확인하세요.
          </p>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="space-y-6">
          {/* 업무일지 기본 정보 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  업무일지
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={journal.status === 'completed' ? 'default' : 'outline'}>
                    {journal.status === 'completed' ? '완료' : journal.status === 'in-progress' ? '진행중' : '보류'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyLink}
                    className="flex items-center gap-1"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span className="text-xs">복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span className="text-xs">링크 복사</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(journal.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{format(parseISO(journal.created_at), 'HH:mm')}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 작성자 정보 */}
              {author && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={author.profile_image} alt={author.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {getInitials(author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-lg">{author.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {author.departments?.name} · {author.positions?.name}
                      </div>
                      {author.corporations?.name && (
                        <div className="text-xs text-muted-foreground">
                          {author.corporations.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 업무일지 내용 */}
              <div>
                <h3 className="font-medium mb-3">업무 내용</h3>
                <div className="p-4 border rounded-lg bg-white min-h-[200px] space-y-4">
                  {journal.content ? (
                    (() => {
                      try {
                        // JSON 형태인지 확인하고 파싱
                        const parsedContent = JSON.parse(journal.content);
                        if (Array.isArray(parsedContent)) {
                          // 다중 업무 항목인 경우
                          return parsedContent.map((task: any, index: number) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4 py-3 bg-slate-50 rounded-r-lg">
                              <h4 className="font-semibold text-lg mb-2 text-blue-800">
                                {task.title || `업무 ${index + 1}`}
                              </h4>
                              <div 
                                className="text-gray-700 whitespace-pre-wrap prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: task.content || '' }}
                              />
                            </div>
                          ));
                        } else {
                          // 단일 객체인 경우
                          return (
                            <div className="border-l-4 border-blue-500 pl-4 py-3 bg-slate-50 rounded-r-lg">
                              <h4 className="font-semibold text-lg mb-2 text-blue-800">
                                {parsedContent.title || '업무일지'}
                              </h4>
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
                          <div className="border-l-4 border-blue-500 pl-4 py-3 bg-slate-50 rounded-r-lg">
                            <h4 className="font-semibold text-lg mb-2 text-blue-800">업무일지</h4>
                            <div 
                              className="text-gray-700 whitespace-pre-wrap prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: journal.content }}
                            />
                          </div>
                        );
                      }
                    })()
                  ) : (
                    <p className="text-muted-foreground">내용이 없습니다.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 푸터 */}
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                이 업무일지는 Coilmaster 업무 관리 시스템에서 공유되었습니다.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                생성일: {format(parseISO(journal.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SharedJournal; 