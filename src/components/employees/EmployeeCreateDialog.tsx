import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppContext } from "@/context/AppContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  User,
  Building,
  Briefcase,
  Save,
  Loader2,
  Camera,
  X,
  Upload
} from "lucide-react";

interface EmployeeCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmployeeCreateDialog = ({ open, onOpenChange }: EmployeeCreateDialogProps) => {
  const { departments, positions, corporations, employees, createEmployee, refreshAllData } = useAppContext();

  // 폼 상태 - employees 테이블 구조에 맞게 수정
  const [formData, setFormData] = useState({
    employee_number: '',
    name: '',
    english_name: '',
    department_id: '',
    position_id: '',
    corporation_id: ''
  });

  // 파일 및 로딩 상태
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 입력 값 변경 핸들러
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 프로필 이미지 업로드 핸들러
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB 제한
        toast({
          title: "오류",
          description: "파일 크기는 5MB 이하여야 합니다.",
          variant: "destructive"
        });
        return;
      }

      setProfileImage(file);
      
      // 미리보기 URL 생성
      const imageUrl = URL.createObjectURL(file);
      setProfileImageUrl(imageUrl);
    }
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = () => {
    setProfileImage(null);
    if (profileImageUrl) {
      URL.revokeObjectURL(profileImageUrl);
    }
    setProfileImageUrl('');
  };

  // 프로필 이미지 업로드 (Supabase Storage)
  const uploadProfileImage = async (file: File, employeeNumber: string): Promise<string | null> => {
    try {
      console.log('=== 프로필 이미지 업로드 시작 ===');
      console.log('파일 정보:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `employees/${employeeNumber}.${fileExt}`;
      console.log('업로드할 파일명:', fileName);
      
      // Storage 버킷 존재 확인
      try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        console.log('사용 가능한 버킷들:', buckets);
        if (bucketError) {
          console.error('버킷 조회 오류:', bucketError);
        }
      } catch (bucketListError) {
        console.log('버킷 목록 조회 실패, 계속 진행:', bucketListError);
      }
      
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      console.log('업로드 결과:', { data, error });

      if (error) {
        console.error('이미지 업로드 오류:', error);
        
        // Storage 업로드 실패 시 Base64로 fallback
        console.log('Storage 업로드 실패, Base64 인코딩으로 fallback 시도...');
        
        try {
          // 이미지 크기를 줄여서 Base64로 변환
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          const processedImagePromise = new Promise<string>((resolve, reject) => {
            img.onload = () => {
              // 최대 크기 150x150으로 제한
              const maxSize = 150;
              let { width, height } = img;
              
              if (width > height) {
                if (width > maxSize) {
                  height *= maxSize / width;
                  width = maxSize;
                }
              } else {
                if (height > maxSize) {
                  width *= maxSize / height;
                  height = maxSize;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              
              ctx?.drawImage(img, 0, 0, width, height);
              
              // JPEG로 압축하여 크기 줄이기
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
              console.log('이미지 압축 완료:', {
                원본크기: file.size,
                압축후크기: compressedBase64.length,
                압축률: Math.round((1 - compressedBase64.length / file.size) * 100) + '%'
              });
              resolve(compressedBase64);
            };
            img.onerror = reject;
          });
          
          // FileReader로 이미지 로드
          const reader = new FileReader();
          reader.onload = (e) => {
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
          
          const base64Data = await processedImagePromise;
          
          console.log('Base64 변환 성공, 최종 크기:', base64Data.length);
          
          // 압축된 Base64 데이터를 avatar로 사용
          return base64Data;
          
        } catch (base64Error) {
          console.error('Base64 변환도 실패:', base64Error);
          
          // 마지막 fallback: placeholder 이미지
          const fallbackUrl = `https://via.placeholder.com/150/0066cc/ffffff?text=${encodeURIComponent(employeeNumber)}`;
          console.log('Placeholder 이미지 사용:', fallbackUrl);
          return fallbackUrl;
        }
      }

      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      console.log('생성된 공개 URL:', publicUrl);
      console.log('=== 프로필 이미지 업로드 완료 ===');

      return publicUrl;
    } catch (error) {
      console.error('이미지 업로드 중 오류:', error);
      return null;
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async () => {
    // 유효성 검사
    if (!formData.employee_number || !formData.name || !formData.department_id) {
      toast({
        title: "오류",
        description: "사번, 이름, 부서는 필수 항목입니다.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // 프로필 이미지 업로드 (있는 경우)
      let avatarUrl = null;
      if (profileImage) {
        avatarUrl = await uploadProfileImage(profileImage, formData.employee_number);
      }

      // 직원 생성 - employees 테이블에 맞는 데이터 구조
      const newEmployee = {
        employee_number: formData.employee_number,
        name: formData.name,
        english_name: formData.english_name || undefined,
        department_id: formData.department_id,
        position_id: formData.position_id || undefined,
        corporation_id: formData.corporation_id || undefined,
        avatar: avatarUrl || undefined
      };

      console.log('=== 직원 생성 데이터 ===');
      console.log('생성할 직원 데이터:', newEmployee);
      console.log('avatar URL:', avatarUrl);
      console.log('avatar URL 타입:', typeof avatarUrl);
      console.log('avatar URL 길이:', avatarUrl?.length);

      await createEmployee(newEmployee);
      
      console.log('=== 직원 생성 완료 ===');
      
      // 생성 후 바로 데이터 확인
      setTimeout(() => {
        console.log('=== 생성 후 데이터 확인 ===');
        // employees 배열에서 방금 생성된 직원 찾기
        const createdEmployee = employees.find(emp => emp.employee_number === formData.employee_number);
        console.log('생성된 직원 데이터:', createdEmployee);
        console.log('저장된 avatar:', createdEmployee?.avatar);
      }, 1000);

      toast({
        title: "성공",
        description: "새 직원이 성공적으로 등록되었습니다."
      });

      // 폼 초기화
      setFormData({
        employee_number: '',
        name: '',
        english_name: '',
        department_id: '',
        position_id: '',
        corporation_id: ''
      });
      handleRemoveImage();
      
      // 데이터 새로고침
      await refreshAllData();
      
      // 모달 닫기
      onOpenChange(false);

    } catch (error) {
      console.error('직원 등록 오류:', error);
      toast({
        title: "오류",
        description: "직원 등록 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 폼 초기화
  const handleCancel = () => {
    setFormData({
      employee_number: '',
      name: '',
      english_name: '',
      department_id: '',
      position_id: '',
      corporation_id: ''
    });
    handleRemoveImage();
    onOpenChange(false);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          새 직원 등록
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* 프로필 이미지 업로드 */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage 
                src={profileImageUrl} 
                alt="프로필 이미지" 
              />
              <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            
            {profileImageUrl && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={handleRemoveImage}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="profile-image"
            />
            <Label
              htmlFor="profile-image"
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Camera className="h-4 w-4" />
              프로필 사진 업로드
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">JPG, PNG, GIF (최대 5MB)</p>
        </div>

        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employee_number">사번 *</Label>
            <Input
              id="employee_number"
              value={formData.employee_number}
              onChange={(e) => handleInputChange('employee_number', e.target.value)}
              placeholder="EMP001"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">직원명 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="홍길동"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="english_name">영문명</Label>
          <Input
            id="english_name"
            value={formData.english_name}
            onChange={(e) => handleInputChange('english_name', e.target.value)}
            placeholder="Hong Gil Dong"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="corporation">법인</Label>
            <Select 
              value={formData.corporation_id} 
              onValueChange={(value) => handleInputChange('corporation_id', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="법인 선택" />
              </SelectTrigger>
              <SelectContent>
                {corporations.map(corp => (
                  <SelectItem key={corp.id} value={corp.id}>
                    {corp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">부서 *</Label>
            <Select 
              value={formData.department_id} 
              onValueChange={(value) => handleInputChange('department_id', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="부서 선택" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">직책</Label>
          <Select 
            value={formData.position_id} 
            onValueChange={(value) => handleInputChange('position_id', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="직책 선택" />
            </SelectTrigger>
            <SelectContent>
              {positions.map(pos => (
                <SelectItem key={pos.id} value={pos.id}>
                  {pos.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={handleCancel}
          disabled={loading}
        >
          취소
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={loading || !formData.employee_number || !formData.name || !formData.department_id}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          등록
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default EmployeeCreateDialog; 