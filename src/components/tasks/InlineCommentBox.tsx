import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { TaskCommentAttachment } from '@/types';

interface InlineCommentBoxProps {
  taskId: string;
  onClose: () => void;
  onCommentSubmit?: (comment: string, files: File[]) => void;
}

export const InlineCommentBox: React.FC<InlineCommentBoxProps> = ({
  taskId,
  onClose,
  onCommentSubmit
}) => {
  const { toast } = useToast();
  const { currentUser, createNotification, tasks } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [comment, setComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          .replace(/[^\w가-힣.-]/g, '')   // 영문, 숫자, 한글, 점, 하이픈만 허용
          .substring(0, 100);             // 길이 제한
        
        const safeFileName = `${timestamp}_${safeBaseName}.${fileExt}`;
        const filePath = `comment-attachments/${commentId}/${safeFileName}`;

        console.log('인라인 댓글 - 원본 파일명:', file.name);
        console.log('인라인 댓글 - 안전한 파일명:', safeFileName);
        console.log('인라인 댓글 - 업로드 경로:', filePath);

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

  const handleSubmit = async () => {
    if (!comment.trim() && selectedFiles.length === 0) {
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
      
      // 현재 업무 정보 가져오기
      const currentTask = tasks.find(t => t.id === taskId);
      
      // 데이터베이스에 댓글 저장
      const { data: commentData, error: commentError } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          author_id: currentUser.id,
          author_name: currentUser.name,
          content: comment.trim()
        }])
        .select('id')
        .single();

      if (commentError) {
        console.error('인라인 댓글 저장 오류:', commentError);
        throw commentError;
      }

      // 파일이 있다면 업로드
      if (selectedFiles.length > 0) {
        await uploadFiles(selectedFiles, commentData.id);
      }

      // 알림 생성
      const attachmentText = selectedFiles.length > 0 ? ` (첨부파일 ${selectedFiles.length}개)` : '';
      await createNotification(
        'comment',
        `${currentUser.name}님이 "${currentTask?.title || '업무'}" 업무에 댓글을 추가했습니다: "${comment.trim().substring(0, 50)}${comment.trim().length > 50 ? '...' : ''}"${attachmentText}`,
        currentUser.id
      );

      // 상태 초기화
      setComment('');
      setSelectedFiles([]);
      
      toast({
        title: "성공",
        description: "댓글이 등록되었습니다.",
      });

      // 댓글 박스 닫기
      onClose();

      // 부모 컴포넌트에 알림 (기존 호환성을 위해)
      if (onCommentSubmit) {
        await onCommentSubmit(comment.trim(), selectedFiles);
      }

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

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="space-y-3">
        <Textarea
          placeholder="댓글을 입력하세요..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        
        {/* 첨부파일 표시 */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">첨부파일</label>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded border text-sm"
                >
                  {getFileIcon(file.type)}
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-gray-500 text-xs">
                    {formatFileSize(file.size)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0 hover:bg-red-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFileSelect}
              className="text-gray-600 hover:text-gray-800"
            >
              <Paperclip className="h-4 w-4 mr-1" />
              파일 첨부
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button 
              size="sm" 
              onClick={handleSubmit} 
              disabled={isSubmitting || (!comment.trim() && selectedFiles.length === 0)}
            >
              <Send className="h-4 w-4 mr-1" />
              {isSubmitting ? '전송 중...' : '전송'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
