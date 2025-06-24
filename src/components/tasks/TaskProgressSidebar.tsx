import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, FileText, Image as ImageIcon, Trash2, User, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, TaskComment, CreateTaskCommentInput, TaskCommentAttachment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TaskProgressSidebarProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export const TaskProgressSidebar: React.FC<TaskProgressSidebarProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdate
}) => {
  const { toast } = useToast();
  const { currentUser, createNotification } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [progressValue, setProgressValue] = useState(task.progress || 0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    commentId: string;
    commentAuthorId: string;
  }>({
    isOpen: false,
    commentId: '',
    commentAuthorId: ''
  });

  // 댓글 로드
  useEffect(() => {
    if (isOpen && task.id) {
      loadComments();
      setProgressValue(task.progress || 0);
    }
  }, [isOpen, task.id, task.progress]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      console.log('=== 댓글 로딩 시작 ===');
      console.log('Task ID:', task.id);
      console.log('Task 전체 정보:', task);
      
      if (!task.id) {
        console.error('❌ Task ID가 없습니다!');
        setComments([]);
        return;
      }

      // 먼저 해당 task_id로 댓글이 몇 개나 있는지 간단히 확인
      const { count, error: countError } = await supabase
        .from('task_comments')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', task.id);

      console.log('해당 업무의 총 댓글 수:', count);
      if (countError) {
        console.error('댓글 수 조회 오류:', countError);
      }
      
      // 실제 데이터베이스에서 댓글과 첨부파일을 로드 (사용자 정보는 별도 조회)
      const { data: commentsData, error } = await supabase
        .from('task_comments')
        .select(`
          id,
          task_id,
          author_id,
          author_name,
          content,
          created_at,
          updated_at,
          task_comment_attachments (
            id,
            file_name,
            file_type,
            file_size,
            storage_path,
            public_url,
            uploaded_by,
            created_at
          )
        `)
        .eq('task_id', task.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ 댓글 로드 오류:', error);
        throw error;
      }

      console.log('✅ 로드된 댓글 데이터:', commentsData);
      console.log('댓글 개수:', commentsData?.length || 0);

      // 댓글 데이터 변환
      const formattedComments: TaskComment[] = (commentsData || []).map(comment => {
        console.log('댓글 처리 중:', comment.id, '첨부파일 수:', comment.task_comment_attachments?.length || 0);
        
        const attachments = (comment.task_comment_attachments || []).map(att => {
          console.log('첨부파일 처리:', att.file_name, 'URL:', att.public_url);
          return {
            id: att.id,
            comment_id: comment.id,
            file_name: att.file_name,
            file_type: att.file_type,
            file_size: att.file_size,
            storage_path: att.storage_path,
            public_url: att.public_url,
            uploaded_by: att.uploaded_by,
            created_at: att.created_at,
            updated_at: att.created_at
          };
        });

        return {
          id: comment.id,
          task_id: comment.task_id,
          user_id: comment.author_id,
          user_name: comment.author_name || '알 수 없는 사용자',
          user_avatar: undefined, // 사용자 아바타는 별도 조회 필요
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          attachments: attachments
        };
      });

      console.log('변환된 댓글 데이터:', formattedComments);
      setComments(formattedComments);
    } catch (error) {
      console.error('댓글 로드 오류:', error);
      setComments([]); // 오류 시 빈 배열로 설정
      toast({
        title: "오류",
        description: "댓글을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: File[], commentId: string): Promise<TaskCommentAttachment[]> => {
    const uploadedAttachments: TaskCommentAttachment[] = [];

    for (const file of files) {
      try {
        // 파일명을 안전하게 변환 (공백, 특수문자 제거)
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop() || '';
        const baseName = file.name.replace(/\.[^/.]+$/, ""); // 확장자 제거
        
        // 안전한 파일명 생성 (공백을 언더스코어로, 특수문자 제거)
        const safeBaseName = baseName
          .replace(/\s+/g, '_')           // 공백을 언더스코어로
          .replace(/[^\w.-]/g, '')        // 영문, 숫자, 언더스코어, 점, 하이픈만 허용 (한글 제거)
          .replace(/^_+|_+$/g, '')        // 앞뒤 언더스코어 제거
          .substring(0, 100);             // 길이 제한
        
        // 파일명이 비어있거나 너무 짧으면 기본 이름 사용
        const finalBaseName = safeBaseName.length >= 2 ? safeBaseName : 'file';
        const safeFileName = `${timestamp}_${finalBaseName}.${fileExt}`;
        const filePath = `comment-attachments/${commentId}/${safeFileName}`;

        console.log('원본 파일명:', file.name);
        console.log('안전한 파일명:', safeFileName);
        console.log('업로드 경로:', filePath);

        // Supabase Storage에 파일 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('task-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('파일 업로드 오류:', uploadError);
          throw uploadError;
        }

        // 공개 URL 생성
        const { data: urlData } = supabase.storage
          .from('task-files')
          .getPublicUrl(filePath);

        console.log('업로드된 파일 URL:', urlData.publicUrl); // 디버깅용

        // 첨부파일 정보를 데이터베이스에 저장 (원본 파일명으로 저장)
        const { data: attachmentData, error: attachmentError } = await supabase
          .from('task_comment_attachments')
          .insert([{
            comment_id: commentId,
            file_name: file.name, // 원본 파일명으로 저장
            file_type: file.type,
            file_size: file.size,
            storage_path: filePath,
            public_url: urlData.publicUrl,
            uploaded_by: currentUser!.id
          }])
          .select()
          .single();

        if (attachmentError) {
          console.error('첨부파일 정보 저장 오류:', attachmentError);
          throw attachmentError;
        }

        uploadedAttachments.push({
          id: attachmentData.id,
          comment_id: attachmentData.comment_id,
          file_name: attachmentData.file_name,
          file_type: attachmentData.file_type,
          file_size: attachmentData.file_size,
          storage_path: attachmentData.storage_path,
          public_url: attachmentData.public_url,
          uploaded_by: attachmentData.uploaded_by,
          created_at: attachmentData.created_at,
          updated_at: attachmentData.updated_at
        });

      } catch (error) {
        console.error(`파일 ${file.name} 업로드 실패:`, error);
        toast({
          title: "파일 업로드 실패",
          description: `${file.name} 업로드에 실패했습니다.`,
          variant: "destructive"
        });
      }
    }

    return uploadedAttachments;
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() && selectedFiles.length === 0) {
      toast({
        title: "입력 필요",
        description: "댓글 내용을 입력하거나 파일을 첨부해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "오류",
        description: "로그인이 필요합니다.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // 데이터베이스에 댓글 저장
      const { data: commentData, error: commentError } = await supabase
        .from('task_comments')
        .insert([{
          task_id: task.id,
          author_id: currentUser.id,
          author_name: currentUser.name,
          content: newComment.trim()
        }])
        .select(`
          id,
          task_id,
          author_id,
          author_name,
          content,
          created_at,
          updated_at
        `)
        .single();

      if (commentError) {
        console.error('댓글 저장 오류:', commentError);
        throw commentError;
      }

      // 파일이 있다면 업로드
      let uploadedAttachments: TaskCommentAttachment[] = [];
      if (selectedFiles.length > 0) {
        uploadedAttachments = await uploadFiles(selectedFiles, commentData.id);
      }

      // 새 댓글을 로컬 상태에 추가
      const newCommentData: TaskComment = {
        id: commentData.id,
        task_id: commentData.task_id,
        user_id: commentData.author_id,
        user_name: commentData.author_name,
        content: commentData.content,
        created_at: commentData.created_at,
        updated_at: commentData.updated_at,
        attachments: uploadedAttachments
      };

      setComments(prev => [...prev, newCommentData]);

      // 진행도가 변경되었다면 업무 업데이트
      if (progressValue !== task.progress) {
        await onTaskUpdate(task.id, { progress: progressValue });
      }

      // 알림 생성
      const attachmentText = selectedFiles.length > 0 ? ` (첨부파일 ${selectedFiles.length}개)` : '';
      await createNotification(
        'comment',
        `${currentUser.name}님이 "${task.title}" 업무에 댓글을 추가했습니다: "${newComment.trim().substring(0, 50)}${newComment.trim().length > 50 ? '...' : ''}"${attachmentText}`,
        currentUser.id
      );

      // 상태 초기화
      setNewComment('');
      setSelectedFiles([]);

      toast({
        title: "성공",
        description: "댓글이 등록되었습니다.",
      });

    } catch (error) {
      console.error('댓글 등록 오류:', error);
      toast({
        title: "오류",
        description: "댓글 등록에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  // 상태에서 진행률 추출하는 함수
  const extractProgressFromStatus = (status: string): number => {
    if (!status) return 0;
    
    // 상태에서 숫자 추출 (예: "진행중 80%" -> 80, "완료 100%" -> 100)
    const percentMatch = status.match(/(\d+)%/);
    if (percentMatch) {
      return parseInt(percentMatch[1], 10);
    }
    
    // 특정 상태에 대한 기본 진행률 매핑
    const statusProgressMap: { [key: string]: number } = {
      '완료': 100,
      'completed': 100,
      '완료 100%': 100,
      '진행중': 50, // 기본 진행중 상태
      'in-progress': 50,
      '시작전': 0,
      'not-started': 0,
      'pending': 0,
      '시작전 0%': 0
    };
    
    return statusProgressMap[status] || 0;
  };

  // 상태에서 추출한 진행률 사용
  const statusProgress = extractProgressFromStatus(task.status || '');

  const handleFileView = (attachment: TaskCommentAttachment) => {
    if (attachment.public_url) {
      window.open(attachment.public_url, '_blank');
    }
  };

  const isImageFile = (fileType: string): boolean => {
    return fileType.startsWith('image/');
  };

  const ImageWithFallback: React.FC<{
    src?: string;
    alt: string;
    fileName: string;
    onClick: () => void;
  }> = ({ src, alt, fileName, onClick }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
      setImageError(false);
      setImageLoaded(false);
      
      // URL 유효성 사전 검증
      if (src && src.trim() !== '') {
        // 간단한 URL 검증
        try {
          new URL(src);
        } catch {
          setImageError(true);
        }
      } else {
        setImageError(true);
      }
    }, [src]);

    if (imageError || !src || src.trim() === '') {
      return (
        <div 
          className="flex items-center justify-center bg-gray-100 dark:bg-slate-600 rounded h-32 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors border-2 border-dashed border-gray-300 dark:border-slate-500"
          onClick={onClick}
        >
          <div className="text-center p-4">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate max-w-48 mb-1">
              {fileName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              이미지를 클릭하여 보기
            </div>
            {src && src.trim() !== '' && (
              <div className="text-xs text-red-500 mt-1">
                이미지 로드 실패
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-slate-600 rounded z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-xs text-gray-500 dark:text-gray-400">로딩 중...</div>
            </div>
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className={`max-w-full h-auto max-h-64 rounded cursor-pointer hover:opacity-90 transition-opacity ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClick}
          onError={() => {
            console.log('이미지 로딩 실패:', src);
            setImageError(true);
          }}
          onLoad={() => {
            console.log('이미지 로딩 성공:', src);
            setImageLoaded(true);
          }}
        />
      </div>
    );
  };

  const handleDeleteComment = async (commentId: string, commentAuthorId: string) => {
    if (!currentUser) {
      toast({
        title: "오류",
        description: "로그인이 필요합니다.",
        variant: "destructive"
      });
      return;
    }

    // 본인이 작성한 댓글만 삭제 가능
    if (commentAuthorId !== currentUser.id) {
      toast({
        title: "권한 없음",
        description: "본인이 작성한 댓글만 삭제할 수 있습니다.",
        variant: "destructive"
      });
      return;
    }

    // 삭제 확인 모달 열기
    setDeleteConfirm({
      isOpen: true,
      commentId,
      commentAuthorId
    });
  };

  const confirmDeleteComment = async () => {
    const { commentId, commentAuthorId } = deleteConfirm;
    
    try {
      // 먼저 첨부파일들을 스토리지에서 삭제
      const { data: attachments, error: attachmentsFetchError } = await supabase
        .from('task_comment_attachments')
        .select('storage_path')
        .eq('comment_id', commentId);

      if (attachmentsFetchError) {
        console.error('첨부파일 조회 오류:', attachmentsFetchError);
      } else if (attachments && attachments.length > 0) {
        // 스토리지에서 첨부파일들 삭제
        const filePaths = attachments.map(att => att.storage_path);
        const { error: storageError } = await supabase.storage
          .from('task-files')
          .remove(filePaths);

        if (storageError) {
          console.error('스토리지 파일 삭제 오류:', storageError);
        }
      }

      // 데이터베이스에서 댓글 삭제 (첨부파일은 CASCADE로 자동 삭제됨)
      const { error: deleteError } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', currentUser.id); // 추가 보안 검증

      if (deleteError) {
        console.error('댓글 삭제 오류:', deleteError);
        throw deleteError;
      }

      // 로컬 상태에서 댓글 제거
      setComments(prev => prev.filter(comment => comment.id !== commentId));

      toast({
        title: "성공",
        description: "댓글이 삭제되었습니다.",
      });

    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      toast({
        title: "오류",
        description: "댓글 삭제에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      // 모달 닫기
      setDeleteConfirm({
        isOpen: false,
        commentId: '',
        commentAuthorId: ''
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-[40vw] min-w-[500px] max-w-[800px] bg-white dark:bg-slate-900 shadow-2xl z-[9998] border-l border-gray-200 dark:border-slate-700 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {task.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            진행도 업데이트 및 댓글
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            디버그: Task ID = {task.id}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="flex-shrink-0 ml-2"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* 현재 진행도 */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              현재 진행도
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  상태
                </span>
                <span className="text-lg font-semibold text-blue-600">
                  {task.status || '상태 없음'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${statusProgress}%` }}
                />
              </div>
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                진행률: {statusProgress}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 댓글 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-sm">아직 댓글이 없습니다</div>
            <div className="text-xs mt-1">첫 번째 댓글을 작성해보세요!</div>
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="bg-gray-50 dark:bg-slate-800">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user_avatar || undefined} alt={comment.user_name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      {comment.user_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {comment.user_name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(comment.created_at), 'MM월 dd일 HH:mm', { locale: ko })}
                        </span>
                      </div>
                      {/* 삭제 버튼 - 본인 댓글만 표시 */}
                      {currentUser && comment.user_id === currentUser.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    {comment.content && (
                      <div 
                        className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: comment.content }}
                      />
                    )}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="space-y-2">
                        {comment.attachments.map((attachment) => (
                          <div key={attachment.id} className="border rounded-lg p-2 bg-white dark:bg-slate-700">
                            {isImageFile(attachment.file_type) ? (
                              <div className="space-y-2">
                                <ImageWithFallback
                                  src={attachment.public_url}
                                  alt={attachment.file_name}
                                  fileName={attachment.file_name}
                                  onClick={() => handleFileView(attachment)}
                                />
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                  <span className="truncate font-medium">{attachment.file_name}</span>
                                  <span>{formatFileSize(attachment.file_size)}</span>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 rounded transition-colors"
                                onClick={() => handleFileView(attachment)}
                              >
                                {getFileIcon(attachment.file_type)}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {attachment.file_name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatFileSize(attachment.file_size)}
                                  </div>
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  클릭하여 보기
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 댓글 작성 영역 */}
      <div className="border-t border-gray-200 dark:border-slate-700 p-4 space-y-3">
        {/* 선택된 파일 목록 */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-800 rounded text-sm"
              >
                {getFileIcon(file.type)}
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {formatFileSize(file.size)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* 댓글 입력 */}
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="진행 상황이나 의견을 입력하세요..."
          className="min-h-[80px] resize-none"
        />

        {/* 하단 버튼들 */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFileSelect}
            className="flex items-center gap-2"
          >
            <Paperclip className="w-4 h-4" />
            파일 첨부
          </Button>

          <Button
            onClick={handleSubmitComment}
            disabled={isSubmitting || (!newComment.trim() && selectedFiles.length === 0)}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? '등록 중...' : '댓글 등록'}
          </Button>
        </div>

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        />
      </div>
    </div>

    {/* 댓글 삭제 확인 모달 */}
    <div className="z-[10001]">
      <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(open) => {
        if (!open) {
          setDeleteConfirm({
            isOpen: false,
            commentId: '',
            commentAuthorId: ''
          });
        }
      }}>
      <AlertDialogContent className="z-[10000] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <AlertDialogHeader>
          <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            이 댓글을 삭제하시겠습니까? 첨부파일도 함께 삭제됩니다.
            <br />
            이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeleteComment}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
    </>
  );
};
