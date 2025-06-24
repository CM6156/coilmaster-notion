import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { Task, TaskFile, TaskLink, TaskAttachment } from '@/types';
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Loader2,
  Link as LinkIcon,
  ExternalLink,
  Eye,
  Download,
  Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TaskAttachmentDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const TaskAttachmentDialog: React.FC<TaskAttachmentDialogProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { toast } = useToast();
  const { currentUser } = useAppContext();
  
  // 상태 관리
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // 파일 업로드 상태
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // 링크 추가 상태
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    description: ''
  });

  // 첨부 파일 로드
  const loadAttachments = async () => {
    if (!task.id) return;
    
    setIsLoading(true);
    try {
      // 파일과 링크를 각각 로드
      const [filesResponse, linksResponse] = await Promise.all([
        supabase
          .from('task_files')
          .select('*')
          .eq('task_id', task.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('task_links')
          .select('*')
          .eq('task_id', task.id)
          .order('created_at', { ascending: false })
      ]);

      if (filesResponse.error) throw filesResponse.error;
      if (linksResponse.error) throw linksResponse.error;

      // 파일과 링크를 통합하여 attachments 형태로 변환
      const fileAttachments = (filesResponse.data || []).map(file => ({
        id: file.id,
        task_id: file.task_id,
        attachment_type: 'file' as const,
        created_at: file.created_at,
        updated_at: file.updated_at,
        file_name: file.file_name,
        file_size: file.file_size,
        file_type: file.file_type,
        file_url: file.file_url,
        is_image: file.is_image
      }));

      const linkAttachments = (linksResponse.data || []).map(link => ({
        id: link.id,
        task_id: link.task_id,
        attachment_type: 'link' as const,
        created_at: link.created_at,
        updated_at: link.updated_at,
        link_url: link.url,
        link_title: link.title,
        link_description: link.description || ''
      }));

      // 시간순으로 정렬하여 통합
      const allAttachments = [...fileAttachments, ...linkAttachments]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAttachments(allAttachments);
    } catch (error) {
      console.error('첨부 파일 로드 오류:', error);
      toast({
        title: "오류",
        description: "첨부 파일을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && task.id) {
      loadAttachments();
    }
  }, [isOpen, task.id]);

  // 파일 선택 핸들러
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  // 선택된 파일 제거
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 파일 업로드
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of selectedFiles) {
        // 1. Supabase Storage에 파일 업로드 (project-files 버킷 사용)
        const fileName = `task_${task.id}_${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Storage 업로드 오류:', uploadError);
          throw uploadError;
        }

        // 2. 공개 URL 생성
        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(fileName);

        // 3. task_files 테이블에 직접 저장 (간단한 방식)
        const { error: fileError } = await supabase
          .from('task_files')
          .insert({
            task_id: task.id,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            file_url: publicUrl,
            is_image: file.type.startsWith('image/'),
            uploaded_by: currentUser?.id
          });

        if (fileError) {
          console.error('DB 저장 오류:', fileError);
          throw fileError;
        }
      }

      toast({
        title: "성공",
        description: `${selectedFiles.length}개의 파일이 업로드되었습니다.`
      });

      setSelectedFiles([]);
      await loadAttachments();
      onUpdate();
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      toast({
        title: "오류",
        description: "파일 업로드에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 링크 추가
  const handleLinkAdd = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast({
        title: "입력 오류",
        description: "링크 제목과 URL을 모두 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('task_links')
        .insert({
          task_id: task.id,
          url: newLink.url,
          title: newLink.title,
          description: newLink.description || null,
          created_by: currentUser?.id
        });

      if (error) throw error;

      toast({
        title: "성공",
        description: "링크가 추가되었습니다."
      });

      setNewLink({ title: '', url: '', description: '' });
      await loadAttachments();
      onUpdate();
    } catch (error) {
      console.error('링크 추가 오류:', error);
      toast({
        title: "오류",
        description: "링크 추가에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // 첨부 파일 삭제
  const handleAttachmentDelete = async (attachment: TaskAttachment) => {
    try {
      if (attachment.attachment_type === 'file') {
        // 파일 삭제
        const { error } = await supabase
          .from('task_files')
          .delete()
          .eq('id', attachment.id);

        if (error) throw error;
      } else if (attachment.attachment_type === 'link') {
        // 링크 삭제
        const { error } = await supabase
          .from('task_links')
          .delete()
          .eq('id', attachment.id);

        if (error) throw error;
      }

      toast({
        title: "성공",
        description: `${attachment.attachment_type === 'file' ? '파일' : '링크'}이 삭제되었습니다.`
      });

      await loadAttachments();
      onUpdate();
    } catch (error) {
      console.error('첨부 파일 삭제 오류:', error);
      toast({
        title: "오류",
        description: "삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            업무 자료 관리 - {task.title}
          </DialogTitle>
          <DialogDescription>
            업무에 관련된 파일과 링크를 관리할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files">파일 첨부</TabsTrigger>
            <TabsTrigger value="links">링크 추가</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            {/* 파일 업로드 영역 */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label
                      htmlFor="file-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      파일 선택
                    </Label>
                    <p className="text-sm text-gray-500">
                      또는 파일을 여기로 드래그하세요
                    </p>
                  </div>
                </div>
              </div>

              {/* 선택된 파일 목록 */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">선택된 파일</h4>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSelectedFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    onClick={handleFileUpload}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        업로드 중...
                      </>
                    ) : (
                      '파일 업로드'
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* 업로드된 파일 목록 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">첨부된 파일</h4>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">로딩 중...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.filter(att => att.attachment_type === 'file').map((attachment) => {
                    // 새로운 구조에서는 attachment 자체에 파일 정보가 있음
                    const fileUrl = (attachment as any).file_url;
                    const fileName = (attachment as any).file_name;
                    const fileSize = (attachment as any).file_size;
                    const fileType = (attachment as any).file_type;
                    const isImage = (attachment as any).is_image || fileType?.startsWith('image/');
                    const isPdf = fileType?.includes('pdf');

                    return (
                      <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          {isImage ? (
                            <ImageIcon className="h-5 w-5 text-blue-500" />
                          ) : isPdf ? (
                            <FileText className="h-5 w-5 text-red-500" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{fileName}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(fileSize)} • {new Date(attachment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(fileUrl, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            보기
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = fileUrl;
                              link.download = fileName;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            다운로드
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleAttachmentDelete(attachment)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {attachments.filter(att => att.attachment_type === 'file').length === 0 && (
                    <p className="text-center py-8 text-gray-500">첨부된 파일이 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            {/* 링크 추가 폼 */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700">새 링크 추가</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="link-title">링크 제목 *</Label>
                  <Input
                    id="link-title"
                    value={newLink.title}
                    onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="링크 제목을 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-url">URL *</Label>
                  <Input
                    id="link-url"
                    type="url"
                    value={newLink.url}
                    onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-description">설명</Label>
                <Textarea
                  id="link-description"
                  value={newLink.description}
                  onChange={(e) => setNewLink(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="링크에 대한 설명을 입력하세요 (선택사항)"
                  rows={2}
                />
              </div>
              <Button onClick={handleLinkAdd} className="w-full">
                <LinkIcon className="h-4 w-4 mr-2" />
                링크 추가
              </Button>
            </div>

            {/* 추가된 링크 목록 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">추가된 링크</h4>
              <div className="space-y-2">
                {attachments.filter(att => att.attachment_type === 'link').map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3 flex-1">
                      <LinkIcon className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{attachment.link_title}</p>
                        <p className="text-xs text-blue-600 hover:underline cursor-pointer" 
                           onClick={() => window.open(attachment.link_url, '_blank')}>
                          {attachment.link_url}
                        </p>
                        {attachment.link_description && (
                          <p className="text-xs text-gray-500 mt-1">{attachment.link_description}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(attachment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(attachment.link_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        열기
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleAttachmentDelete(attachment)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {attachments.filter(att => att.attachment_type === 'link').length === 0 && (
                  <p className="text-center py-8 text-gray-500">추가된 링크가 없습니다.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 