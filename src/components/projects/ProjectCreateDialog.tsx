import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, FileUp, Target, CheckCircle2, Upload, Image as ImageIcon, X, Sparkles, Zap } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import { Client, CompetitorInfo, Competitor, Project, PromotionStatuses, promotionStatusesList, defaultCompetitors, promotionStatusOptions } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 간소화된 스키마 - 필수 필드만
const projectFormSchema = z.object({
  name: z.string().min(1, { message: "프로젝트명은 필수입니다." }),
  currentPhase: z.string().min(1, { message: "현재 단계를 선택해주세요." }),
  manager: z.string().min(1, { message: "담당자는 필수입니다." }),
  requestDate: z.date().optional(),
  targetSOPDate: z.date({ required_error: "마감일은 필수입니다." }),
  promotionStatus: z.string().min(1, { message: "진행 상태를 선택해주세요." }),
  
  // 주석처리된 필드들 (나중에 추가 예정)
  // projectType: z.string().optional(),
  // description: z.string().optional(),
  // department: z.string().optional(),
  // annualQuantity: z.coerce.number().optional(),
  // averageAmount: z.coerce.number().optional(),
  // annualAmount: z.coerce.number().optional(),
  // completed: z.boolean().optional(),
  // competitor: z.string().optional(),
  // issueCorporation: z.string().optional(),
  // startDate: z.string().optional(),
  // endDate: z.string().optional(),
  // team: z.array(z.string()).optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const ProjectCreateDialog = ({ open, onOpenChange }: ProjectCreateDialogProps) => {
  const { clients, managers, addProject, departments, corporations, getProjectStatuses, phases } = useAppContext();
  const { translations } = useLanguage();
  const today = new Date();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 프로젝트 상태 목록 가져오기
  const projectStatuses = getProjectStatuses();
  const defaultStatus = projectStatuses.length > 0 ? projectStatuses[0].name : 'Planning';

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      currentPhase: phases.length > 0 ? phases[0].id : "",
      manager: "",
      requestDate: today,
      targetSOPDate: new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()),
      promotionStatus: defaultStatus,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      // Create a unique ID
      const newProjectId = `p${Date.now()}`;
      
      // 이미지 URL 처리 (임시로 base64 데이터 URL 저장)
      let imageUrl = '';
      if (selectedImage && imagePreview) {
        imageUrl = imagePreview;
      }
      
      const newProject: Project = {
        id: newProjectId,
        name: values.name,
        description: "", // 나중에 추가
        status: values.promotionStatus || defaultStatus,
        progress: 0,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(values.targetSOPDate, 'yyyy-MM-dd'),
        endDate: "",
        team: [],
        manager: values.manager || "",
        managerId: "",
        clientId: "",
        clientName: "고객사 미지정",
        department: "", // 나중에 추가
        phase: values.currentPhase || phases[0]?.id || "",
        type: "일반", // 기본값
        projectType: "일반", // 기본값
        requestDate: values.requestDate ? format(values.requestDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        targetSOPDate: format(values.targetSOPDate, 'yyyy-MM-dd'),
        currentPhase: values.currentPhase,
        annualQuantity: 0, // 나중에 추가
        averageAmount: 0, // 나중에 추가
        annualAmount: 0, // 나중에 추가
        promotionStatus: values.promotionStatus as PromotionStatuses || 'planned',
        competitor: "", // 나중에 추가
        issueCorporation: "", // 나중에 추가
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        image: imageUrl, // 프로젝트 이미지 (임시로 base64 저장)
      };
      
      await addProject(newProject);
      
      // 파일 업로드 처리
      if (selectedFiles.length > 0) {
        await uploadProjectFiles(newProjectId, selectedFiles);
      }
      
      // 성공 메시지
      toast({
        title: "프로젝트 생성 완료",
        description: `"${newProject.name}" 프로젝트가 성공적으로 생성되었습니다.${selectedFiles.length > 0 ? ` (파일 ${selectedFiles.length}개 업로드 완료)` : ''}`,
      });
      
      // 폼 리셋
      form.reset();
      setSelectedFiles([]);
      setSelectedImage(null);
      setImagePreview(null);
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "프로젝트 생성 실패",
        description: "프로젝트 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  // 파일 업로드 함수
  const uploadProjectFiles = async (projectId: string, files: File[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    for (const file of files) {
      try {
        // 1. Supabase Storage에 파일 업로드
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}_${Date.now()}.${fileExt}`;
        const filePath = `project-files/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('파일 업로드 오류:', uploadError);
          continue; // 다음 파일로 진행
        }

        // 2. files 테이블에 파일 정보 저장
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .insert([{
            filename: fileName,
            original_filename: file.name,
            file_size: file.size,
            content_type: file.type,
            file_path: filePath,
            uploaded_by: user.id
          }])
          .select()
          .single();

        if (fileError) {
          console.error('파일 정보 저장 오류:', fileError);
          continue;
        }

        // 3. project_attachments 테이블에 연결 정보 저장
        const { error: attachmentError } = await supabase
          .from('project_attachments')
          .insert([{
            project_id: projectId,
            file_id: fileData.id,
            description: `프로젝트 첨부파일: ${file.name}`
          }]);

        if (attachmentError) {
          console.error('첨부파일 연결 오류:', attachmentError);
        }

      } catch (error) {
        console.error(`파일 "${file.name}" 업로드 중 오류:`, error);
      }
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedFiles([]);
    setSelectedImage(null);
    setImagePreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
        {/* 화려한 헤더 */}
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          
          <DialogHeader className="relative z-10">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-6 w-6" />
              </div>
              새 프로젝트 생성
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Zap className="h-3 w-3 mr-1" />
                간편 생성
              </Badge>
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-6">
            {/* 기본 정보 섹션 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  기본 정보
                </h3>
                
                <div className="space-y-4">
                  {/* 프로젝트명 */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">프로젝트명 *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="프로젝트명을 입력하세요"
                            className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 담당자 (PIC) */}
                    <FormField
                      control={form.control}
                      name="manager"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">담당자 (PIC) *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base border-2 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder="담당자 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {managers.map(user => (
                                <SelectItem key={user.id} value={user.name}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                                      {user.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-medium">{user.name}</div>
                                      {user.email && (
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                      )}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 현재 단계 */}
                    <FormField
                      control={form.control}
                      name="currentPhase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">프로젝트 단계 *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base border-2 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder="단계 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {phases.map(phase => (
                                <SelectItem key={phase.id} value={phase.id}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: phase.color }}
                                    />
                                    {phase.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 일정 정보 섹션 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-purple-600" />
                  일정 정보
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 요청일 */}
                  <FormField
                    control={form.control}
                    name="requestDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-base font-medium">요청일</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-12 text-base border-2 focus:border-purple-500 transition-colors justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'yyyy년 MM월 dd일') : <span>날짜 선택</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="p-3"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* 마감일 */}
                  <FormField
                    control={form.control}
                    name="targetSOPDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-base font-medium">마감일 *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-12 text-base border-2 focus:border-purple-500 transition-colors justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'yyyy년 MM월 dd일') : <span>날짜 선택</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="p-3"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 상태 정보 섹션 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-green-500 to-teal-500" />
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  상태 정보
                </h3>
                
                <FormField
                  control={form.control}
                  name="promotionStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">진행 상태 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-base border-2 focus:border-green-500 transition-colors">
                            <SelectValue placeholder="상태 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projectStatuses.map(status => (
                            <SelectItem key={status.id} value={status.name}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: status.color }}
                                />
                                {status.translationKey && translations.global?.[status.translationKey] 
                                  ? translations.global[status.translationKey] 
                                  : status.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 파일 업로드 섹션 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500" />
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-orange-600" />
                  파일 및 이미지
                </h3>
                
                <div className="space-y-4">
                  {/* 프로젝트 이미지 업로드 */}
                  <div>
                    <Label className="text-base font-medium">프로젝트 이미지</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-orange-300 rounded-lg cursor-pointer bg-orange-50 hover:bg-orange-100 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-8 h-8 mb-2 text-orange-500" />
                          <p className="mb-2 text-sm text-orange-700">
                            <span className="font-semibold">클릭하여 이미지 업로드</span>
                          </p>
                          <p className="text-xs text-orange-500">PNG, JPG, JPEG (최대 10MB)</p>
                        </div>
                      </label>
                    </div>
                    
                    {/* 이미지 미리보기 */}
                    {imagePreview && (
                      <div className="mt-4 relative">
                        <img 
                          src={imagePreview} 
                          alt="미리보기" 
                          className="w-full h-48 object-cover rounded-lg border-2 border-orange-200"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 파일 업로드 */}
                  <div>
                    <Label className="text-base font-medium">첨부 파일</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FileUp className="w-8 h-8 mb-2 text-blue-500" />
                          <p className="mb-2 text-sm text-blue-700">
                            <span className="font-semibold">클릭하여 파일 업로드</span>
                          </p>
                          <p className="text-xs text-blue-500">모든 파일 형식 지원</p>
                        </div>
                      </label>
                    </div>
                    
                    {/* 업로드된 파일 목록 */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-2">
                              <FileUp className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{file.name}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 주석처리된 섹션들 - 나중에 추가 예정 */}
            {/*
            // 추가 정보 섹션 (나중에 활성화)
            <Card className="border-0 shadow-lg overflow-hidden opacity-50">
              <div className="h-1 bg-gradient-to-r from-gray-400 to-gray-600" />
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  추가 정보 (추후 추가 예정)
                </h3>
                <p className="text-gray-500">프로젝트 구분, 부서, 수량/금액 정보 등이 여기에 추가될 예정입니다.</p>
              </CardContent>
            </Card>
            */}

            {/* 화려한 버튼 섹션 */}
            <DialogFooter className="pt-6 border-t">
              <div className="flex gap-3 w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-12 text-base border-2 hover:bg-gray-50"
                >
                  취소
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  프로젝트 생성
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCreateDialog;
