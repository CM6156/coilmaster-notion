import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
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
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Monitor, 
  Edit, 
  Trash2, 
  Plus, 
  Upload, 
  Eye, 
  EyeOff,
  Crown,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';

interface PopupSetting {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  image_url?: string;
  image_alt?: string;
  button_text: string;
  is_active: boolean;
  show_dont_show_today: boolean;
  background_gradient: string;
  created_at: string;
  updated_at: string;
}

interface PopupFormData {
  title: string;
  subtitle: string;
  content: string;
  image_url: string;
  image_alt: string;
  button_text: string;
  is_active: boolean;
  show_dont_show_today: boolean;
  background_gradient: string;
}

const defaultFormData: PopupFormData = {
  title: '',
  subtitle: '',
  content: '',
  image_url: '',
  image_alt: '',
  button_text: '확인',
  is_active: true,
  show_dont_show_today: true,
  background_gradient: 'from-blue-600 via-purple-600 to-blue-600'
};

const PopupManagement = () => {
  const { toast } = useToast();
  const [popups, setPopups] = useState<PopupSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPopup, setSelectedPopup] = useState<PopupSetting | null>(null);
  const [formData, setFormData] = useState<PopupFormData>(defaultFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching popups...');
      
      const { data, error } = await supabase
        .from('popup_settings')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }
      
      console.log('Fetched popups:', data);
      setPopups(data || []);
    } catch (error) {
      console.error('Error fetching popups:', error);
      toast({
        title: "에러",
        description: `팝업 목록을 불러오는데 실패했습니다: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `popup-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('popups')
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('popups')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;

    try {
      setIsUploading(true);
      const imageUrl = await uploadImage(imageFile);
      setFormData(prev => ({
        ...prev,
        image_url: imageUrl,
        image_alt: imageFile.name
      }));
      toast({
        title: "업로드 완료",
        description: "이미지가 성공적으로 업로드되었습니다.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "업로드 실패",
        description: "이미지 업로드에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setImageFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "에러",
        description: "제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      if (selectedPopup) {
        // 수정
        console.log('Updating popup with ID:', selectedPopup.id);
        console.log('Form data:', formData);
        
        const updateData = {
          title: formData.title,
          subtitle: formData.subtitle || null,
          content: formData.content || null,
          image_url: formData.image_url || null,
          image_alt: formData.image_alt || null,
          button_text: formData.button_text,
          is_active: formData.is_active,
          show_dont_show_today: formData.show_dont_show_today,
          background_gradient: formData.background_gradient,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('popup_settings')
          .update(updateData)
          .eq('id', selectedPopup.id)
          .select();

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }

        console.log('Update result:', data);

        toast({
          title: "수정 완료",
          description: "팝업이 성공적으로 수정되었습니다.",
        });
      } else {
        // 새로 생성
        console.log('Creating new popup with data:', formData);
        
        const insertData = {
          title: formData.title,
          subtitle: formData.subtitle || null,
          content: formData.content || null,
          image_url: formData.image_url || null,
          image_alt: formData.image_alt || null,
          button_text: formData.button_text,
          is_active: formData.is_active,
          show_dont_show_today: formData.show_dont_show_today,
          background_gradient: formData.background_gradient
        };

        const { data, error } = await supabase
          .from('popup_settings')
          .insert(insertData)
          .select();

        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }

        console.log('Insert result:', data);

        toast({
          title: "생성 완료",
          description: "새 팝업이 성공적으로 생성되었습니다.",
        });
      }

      setIsModalOpen(false);
      setSelectedPopup(null);
      setFormData(defaultFormData);
      fetchPopups();
    } catch (error) {
      console.error('Error saving popup:', error);
      toast({
        title: "저장 실패",
        description: `팝업 저장에 실패했습니다: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (popup: PopupSetting) => {
    setSelectedPopup(popup);
    setFormData({
      title: popup.title,
      subtitle: popup.subtitle || '',
      content: popup.content || '',
      image_url: popup.image_url || '',
      image_alt: popup.image_alt || '',
      button_text: popup.button_text,
      is_active: popup.is_active,
      show_dont_show_today: popup.show_dont_show_today,
      background_gradient: popup.background_gradient
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPopup) return;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('popup_settings')
        .delete()
        .eq('id', selectedPopup.id);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: "팝업이 성공적으로 삭제되었습니다.",
      });

      setIsDeleteDialogOpen(false);
      setSelectedPopup(null);
      fetchPopups();
    } catch (error) {
      console.error('Error deleting popup:', error);
      toast({
        title: "삭제 실패",
        description: "팝업 삭제에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPopup = () => {
    setSelectedPopup(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                팝업창 관리
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                사용자에게 표시될 팝업창을 관리합니다.
              </p>
            </div>
            <Button onClick={handleNewPopup} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              새 팝업 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>부제목</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>업데이트</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {popups.map((popup) => (
                <TableRow key={popup.id}>
                  <TableCell className="font-medium">{popup.title}</TableCell>
                  <TableCell>{popup.subtitle || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {popup.is_active ? (
                        <>
                          <Eye className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">활성</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-400">비활성</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(popup.updated_at).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(popup)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPopup(popup);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {popups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    등록된 팝업이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 팝업 생성/수정 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-blue-600" />
              {selectedPopup ? '팝업 수정' : '새 팝업 추가'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                  placeholder="팝업 제목을 입력하세요"
                />
              </div>
              <div>
                <Label htmlFor="subtitle">부제목</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({...prev, subtitle: e.target.value}))}
                  placeholder="부제목을 입력하세요"
                />
              </div>
            </div>

            {/* 내용 */}
            <div>
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({...prev, content: e.target.value}))}
                placeholder="팝업에 표시될 내용을 입력하세요"
                className="min-h-[100px]"
              />
            </div>

            {/* 이미지 업로드 */}
            <div>
              <Label>이미지</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleImageUpload}
                    disabled={!imageFile || isUploading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {isUploading ? '업로드 중...' : '업로드'}
                  </Button>
                </div>
                
                {formData.image_url && (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={formData.image_url}
                        alt={formData.image_alt}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="이미지 URL"
                        value={formData.image_url}
                        onChange={(e) => setFormData(prev => ({...prev, image_url: e.target.value}))}
                      />
                      <Input
                        placeholder="이미지 설명"
                        value={formData.image_alt}
                        onChange={(e) => setFormData(prev => ({...prev, image_alt: e.target.value}))}
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 버튼 텍스트 및 배경 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="button_text">버튼 텍스트</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => setFormData(prev => ({...prev, button_text: e.target.value}))}
                  placeholder="확인"
                />
              </div>
              <div>
                <Label htmlFor="background_gradient">배경 그라디언트</Label>
                <Input
                  id="background_gradient"
                  value={formData.background_gradient}
                  onChange={(e) => setFormData(prev => ({...prev, background_gradient: e.target.value}))}
                  placeholder="from-blue-600 via-purple-600 to-blue-600"
                />
              </div>
            </div>

            {/* 설정 옵션 */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({...prev, is_active: checked}))}
                  />
                  <Label htmlFor="is_active">팝업 활성화</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_dont_show_today"
                    checked={formData.show_dont_show_today}
                    onCheckedChange={(checked) => setFormData(prev => ({...prev, show_dont_show_today: checked}))}
                  />
                  <Label htmlFor="show_dont_show_today">"오늘은 표시 안함" 옵션 제공</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? '저장 중...' : (selectedPopup ? '수정' : '생성')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>팝업 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 팝업을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {isLoading ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PopupManagement; 