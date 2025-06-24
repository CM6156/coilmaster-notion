import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Project } from '@/types';
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Loader2,
  Edit
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProjectEditDialogProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface ProjectFile {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'document';
  url: string;
  size: number;
  file?: File;
}

export const ProjectEditDialog: React.FC<ProjectEditDialogProps> = ({
  project,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { updateProject, departments } = useAppContext();
  const { toast } = useToast();
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    name: project.name || '',
    startDate: project.startDate || '',
    dueDate: project.dueDate || '',
    managerId: project.managerId || '',
    manager: project.manager || '',
    department: project.department || ''
  });
  
  // 파일 관련 상태
  const [projectImage, setProjectImage] = useState<string>(project.image || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<ProjectFile[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        name: project.name || '',
        startDate: project.startDate || '',
        dueDate: project.dueDate || '',
        managerId: project.managerId || '',
        manager: project.manager || '',
        department: project.department || ''
      });
      setProjectImage(project.image || '');
      loadProjectFiles();
    }
  }, [isOpen, project]);

  // 프로젝트 파일 로드
  const loadProjectFiles = async () => {
    try {
      const { data: attachments, error } = await supabase
        .from('project_attachments')
        .select(`
          id,
          file_id,
          description,
          created_at,
          files:file_id (
            id,
            original_filename,
            filename,
            content_type,
            file_size,
            file_path
          )
        `)
        .eq('project_id', project.id);

      if (error) throw error;

      const files: ProjectFile[] = (attachments || []).map(att => {
        const file = att.files as any;
        if (!file) return null;

        let fileUrl = file.file_path;
        if (file.file_path && !file.file_path.startsWith('http')) {
          const { data: { publicUrl } } = supabase.storage
            .from('project-files')
            .getPublicUrl(file.file_path);
          fileUrl = publicUrl;
        }

        return {
          id: file.id,
          name: file.original_filename || file.filename,
          type: file.content_type?.includes('pdf') ? 'pdf' as const :
                file.content_type?.includes('image') ? 'image' as const : 'document' as const,
          url: fileUrl || '',
          size: file.file_size || 0
        };
      }).filter(Boolean) as ProjectFile[];

      setAttachedFiles(files);
    } catch (error) {
      console.error('파일 로드 오류:', error);
    }
  };

  // 이미지 파일 선택 핸들러
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setProjectImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "오류",
          description: "이미지 파일만 선택할 수 있습니다.",
          variant: "destructive"
        });
      }
    }
  };

  // 첨부 파일 선택 핸들러
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setNewFiles(prev => [...prev, ...files]);
  };

  // 파일 제거 핸들러
  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 기존 파일 제거 핸들러
  const removeAttachedFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('project_attachments')
        .delete()
        .eq('project_id', project.id)
        .eq('file_id', fileId);

      if (error) throw error;

      setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
      toast({
        title: "성공",
        description: "파일이 삭제되었습니다."
      });
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      toast({
        title: "오류",
        description: "파일 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // 파일 업로드 함수
  const uploadFiles = async () => {
    const uploadedFileIds: string[] = [];

    // 이미지 업로드
    if (imageFile) {
      const imageFileName = `${project.id}_image_${Date.now()}.${imageFile.name.split('.').pop()}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from('project-files')
        .upload(imageFileName, imageFile);

      if (imageError) throw imageError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(imageFileName);

      setProjectImage(publicUrl);
    }

    // 첨부 파일 업로드
    for (const file of newFiles) {
      const fileName = `${project.id}_${Date.now()}_${file.name}`;
      const { data: fileData, error: fileError } = await supabase.storage
        .from('project-files')
        .upload(fileName, file);

      if (fileError) throw fileError;

      // files 테이블에 파일 정보 저장
      const { data: fileRecord, error: fileRecordError } = await supabase
        .from('files')
        .insert({
          original_filename: file.name,
          filename: fileName,
          content_type: file.type,
          file_size: file.size,
          file_path: fileData.path
        })
        .select()
        .single();

      if (fileRecordError) throw fileRecordError;

      // project_attachments 테이블에 연결 정보 저장
      const { error: attachmentError } = await supabase
        .from('project_attachments')
        .insert({
          project_id: project.id,
          file_id: fileRecord.id,
          description: file.name
        });

      if (attachmentError) throw attachmentError;

      uploadedFileIds.push(fileRecord.id);
    }

    return uploadedFileIds;
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 파일 업로드
      if (imageFile || newFiles.length > 0) {
        setIsUploading(true);
        await uploadFiles();
        setIsUploading(false);
      }

      // 프로젝트 정보 업데이트
      const updateData: Partial<Project> = {
        name: formData.name,
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        managerId: formData.managerId,
        manager: formData.manager,
        department: formData.department,
        image: projectImage,
        updatedAt: new Date().toISOString()
      };

      await updateProject(project.id, updateData);

      toast({
        title: "성공",
        description: "프로젝트가 성공적으로 수정되었습니다."
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('프로젝트 수정 오류:', error);
      toast({
        title: "오류",
        description: "프로젝트 수정에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
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
            <Edit className="h-5 w-5" />
            프로젝트 수정
          </DialogTitle>
          <DialogDescription>
            프로젝트 정보, 이미지, 첨부파일을 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">프로젝트 이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">마감일</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager">담당자</Label>
              <Input
                id="manager"
                value={formData.manager}
                onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                placeholder="담당자 이름"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">부서</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 프로젝트 이미지 */}
          <div className="space-y-4">
            <Label>프로젝트 이미지</Label>
            {projectImage && (
              <div className="relative w-full max-w-md">
                <img
                  src={projectImage}
                  alt="프로젝트 이미지"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setProjectImage('');
                    setImageFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <Label
                htmlFor="image-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
              >
                <ImageIcon className="h-4 w-4" />
                이미지 선택
              </Label>
            </div>
          </div>

          {/* 첨부 파일 */}
          <div className="space-y-4">
            <Label>첨부 파일</Label>
            
            {/* 기존 파일 목록 */}
            {attachedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">기존 파일</h4>
                {attachedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {file.type === 'pdf' ? (
                        <FileText className="h-5 w-5 text-red-500" />
                      ) : file.type === 'image' ? (
                        <ImageIcon className="h-5 w-5 text-blue-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeAttachedFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 새 파일 목록 */}
            {newFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">새 파일</h4>
                {newFiles.map((file, index) => (
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
                      onClick={() => removeNewFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 파일 선택 버튼 */}
            <div>
              <Input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
                파일 선택
              </Label>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploading ? '업로드 중...' : '저장 중...'}
                </>
              ) : (
                '저장'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 