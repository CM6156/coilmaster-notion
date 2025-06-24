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

// 간소화된 스키마 - 핵심 필드만
const projectFormSchema = z.object({
  name: z.string().min(1, { message: "프로젝트명은 필수입니다." }),
  manager: z.string().min(1, { message: "담당자는 필수입니다." }),
  department: z.string().min(1, { message: "부서는 필수입니다." }),
  startDate: z.date().optional(),
  targetSOPDate: z.date({ required_error: "마감일은 필수입니다." }),
  promotionStage: z.enum(['Promotion', 'Sample', '1차검증', '설계검증', 'Set검증', '승인', '수주', 'Drop']),
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

  // 다이얼로그가 열릴 때 현재 상태 확인
  useEffect(() => {
    if (open) {
      console.log('🔍 프로젝트 생성 다이얼로그 열림 - 현재 상태 확인:');
      console.log('📊 부서 목록:', {
        개수: departments.length,
        목록: departments.map(d => ({ id: d.id, name: d.name, code: d.code }))
      });
      console.log('👥 담당자 목록:', {
        개수: managers.length,
        목록: managers.map(m => ({ id: m.id, name: m.name, email: m.email, department: m.department?.name }))
      });
      console.log('📋 프로젝트 상태 목록:', {
        개수: projectStatuses.length,
        기본상태: defaultStatus,
        목록: projectStatuses.map(s => ({ id: s.id, name: s.name, color: s.color }))
      });
    }
  }, [open, departments, managers, projectStatuses, defaultStatus]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      manager: "",
      department: "",
      startDate: today,
      targetSOPDate: new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()),
      promotionStage: "Promotion",
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
      console.log('🚀 프로젝트 생성 시작 - 입력값:', values);
      
      // 필수 데이터 검증
      if (!values.name?.trim()) {
        toast({
          title: "입력 오류",
          description: "프로젝트명을 입력해주세요.",
          variant: "destructive",
        });
        return;
      }

      if (!values.manager?.trim()) {
        toast({
          title: "입력 오류", 
          description: "담당자를 선택해주세요.",
          variant: "destructive",
        });
        return;
      }

      if (!values.department?.trim()) {
        toast({
          title: "입력 오류",
          description: "부서를 선택해주세요.",
          variant: "destructive",
        });
        return;
      }

      if (!values.targetSOPDate) {
        toast({
          title: "입력 오류",
          description: "마감일을 선택해주세요.",
          variant: "destructive",
        });
        return;
      }
      
      // Create a unique ID - UUID 형식으로 변경
      const newProjectId = crypto.randomUUID();
      
      // 이미지 URL 처리 (임시로 base64 데이터 URL 저장)
      let imageUrl = '';
      if (selectedImage && imagePreview) {
        imageUrl = imagePreview;
      }

      // 선택된 부서 정보 확인
      const selectedDepartment = departments.find(d => d.id === values.department);
      console.log('🏢 선택된 부서 정보:', {
        입력된_부서ID: values.department,
        찾은_부서: selectedDepartment,
        전체_부서목록: departments.map(d => ({ id: d.id, name: d.name, code: d.code }))
      });

      if (!selectedDepartment) {
        console.error('❌ 선택된 부서를 찾을 수 없습니다:', values.department);
        toast({
          title: "부서 오류",
          description: "선택된 부서 정보를 찾을 수 없습니다. 다시 선택해주세요.",
          variant: "destructive",
        });
        return;
      }

      // 선택된 담당자 정보 확인
      const selectedManager = managers.find(m => m.name === values.manager);
      console.log('👤 선택된 담당자 정보:', {
        입력된_담당자명: values.manager,
        찾은_담당자: selectedManager
      });

      if (!selectedManager) {
        console.error('❌ 선택된 담당자를 찾을 수 없습니다:', values.manager);
        toast({
          title: "담당자 오류",
          description: "선택된 담당자 정보를 찾을 수 없습니다. 다시 선택해주세요.",
          variant: "destructive",
        });
        return;
      }

      // 날짜 검증
      const startDate = values.startDate || new Date();
      const dueDate = values.targetSOPDate;
      
      if (dueDate <= startDate) {
        toast({
          title: "날짜 오류",
          description: "마감일은 시작일보다 늦어야 합니다.",
          variant: "destructive",
        });
        return;
      }
      
      const newProject: Project = {
        id: newProjectId,
        name: values.name.trim(),
        description: "", // 나중에 추가
        status: defaultStatus,
        progress: 0,
        // 시작일과 마감일 올바르게 매핑 - 날짜 객체를 문자열로 변환
        startDate: format(startDate, 'yyyy-MM-dd'),
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        endDate: "",
        team: [],
        manager: values.manager.trim(),
        managerId: selectedManager.id, // 담당자 ID도 저장
        clientId: "",
        clientName: "", // 고객사는 나중에 설정
        // 부서 정보 올바르게 설정 - ID 저장
        department: values.department,
        phase: values.promotionStage || "Promotion",
        type: "일반",
        projectType: "일반",
        // requestDate를 startDate로 설정
        requestDate: format(startDate, 'yyyy-MM-dd'),
        // targetSOPDate를 입력받은 마감일로 설정
        targetSOPDate: format(dueDate, 'yyyy-MM-dd'),
        promotionStatus: 'planned',
        promotionStage: values.promotionStage || 'Promotion',
        competitor: "",
        issueCorporation: "",
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        image: imageUrl,
      };
      
      console.log('📋 생성할 프로젝트 데이터:', newProject);
      console.log('📅 날짜 정보 확인:', {
        원본_시작일: values.startDate,
        변환된_시작일: newProject.startDate,
        원본_마감일: values.targetSOPDate,
        변환된_마감일: newProject.dueDate,
        변환된_요청일: newProject.requestDate,
        변환된_목표양산일: newProject.targetSOPDate
      });
      console.log('🏢 부서 정보 확인:', {
        원본_부서ID: values.department,
        저장될_부서ID: newProject.department,
        부서명: selectedDepartment.name
      });
      console.log('👤 담당자 정보 확인:', {
        원본_담당자명: values.manager,
        저장될_담당자명: newProject.manager,
        저장될_담당자ID: newProject.managerId,
        담당자_이메일: selectedManager.email
      });
      
      await addProject(newProject);
      console.log('✅ 프로젝트 생성 완료');
      
      // 프로젝트 생성 후 프로모션명 15개만 자동 생성
      console.log('🚀 프로모션명 하위업무 생성 시작...');
      console.log('📋 생성할 프로젝트 ID:', newProjectId);
      console.log('📋 생성할 프로젝트명:', values.name);
      
      try {
        await createFallbackTasks(newProjectId, values.name);
        console.log('✅ 하위업무 생성 성공적으로 완료');
      } catch (taskError) {
        console.error('⚠️ 하위업무 생성 실패했지만 프로젝트는 성공적으로 생성됨:', taskError);
        console.error('📋 에러 상세 정보:', {
          message: taskError?.message,
          code: taskError?.code,
          details: taskError?.details,
          hint: taskError?.hint
        });
        
        // 사용자에게 알림
        toast({
          title: "하위업무 생성 부분 실패",
          description: "프로젝트는 생성되었지만 하위업무 자동 생성에 실패했습니다. 수동으로 추가해주세요.",
          variant: "destructive",
        });
        
        // 하위업무 생성 실패해도 프로젝트는 이미 생성되었으므로 계속 진행
      }
      
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
      console.error("💥 프로젝트 생성 중 오류:", error);
      toast({
        title: "프로젝트 생성 실패",
        description: "프로젝트 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  // 템플릿 기반 하위업무 자동 생성 함수
  const createDefaultTasks = async (projectId: string, projectName: string) => {
    try {
      console.log('🚀 템플릿 기반 하위업무 생성 시작:', { projectId, projectName });
      
      // task_phases 템플릿에서 모든 활성화된 단계 가져오기
      const { data: taskTemplates, error: templatesError } = await supabase
        .from('task_phases')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      console.log('📋 task_phases 템플릿 조회 결과:', { taskTemplates, templatesError });

      if (templatesError) {
        console.error('❌ 업무 템플릿 조회 오류:', templatesError);
        console.error('📌 Supabase 콘솔에서 supabase_uuid_fix.sql을 실행하세요.');
        
        // 템플릿이 없는 경우 하드코딩된 기본 업무들을 생성
        return await createFallbackTasks(projectId, projectName);
      }

      if (!taskTemplates || taskTemplates.length === 0) {
        console.log('⚠️ 활성화된 업무 템플릿이 없습니다.');
        console.log('📌 Supabase 콘솔에서 supabase_uuid_fix.sql을 실행하세요.');
        
        // 템플릿이 없는 경우 기본 업무 생성
        return await createFallbackTasks(projectId, projectName);
      }

      console.log(`✅ ${taskTemplates.length}개의 업무 템플릿을 찾았습니다:`, 
        taskTemplates.map(t => `${t.order_index}. ${t.name}`));

      // 템플릿을 기반으로 프로젝트별 업무 생성
      const projectTasks = taskTemplates.map((template, index) => {
        const taskData = {
          title: template.name,
          description: `${projectName} - ${template.description || template.name}`,
          project_id: projectId,
          task_phase: template.id, // 템플릿 ID 참조
          status: '시작전',
          priority: 'medium',
          progress: 0,
          start_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + (30 + index * 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          assigned_to: null,
          department: null,
          // 템플릿에서 추가 정보 복사
          stage_number: template.order_index,
          stage_label: template.name,
          color: template.color,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log(`📝 템플릿에서 생성할 업무 ${index + 1}:`, taskData);
        return taskData;
      });

      console.log('📊 템플릿 기반 업무 목록 (총 ' + projectTasks.length + '개):', projectTasks);

      // Supabase에 프로젝트 업무들 일괄 생성
      const { data: createdTasks, error: tasksError } = await supabase
        .from('tasks')
        .insert(projectTasks)
        .select();

      if (tasksError) {
        console.error('❌ 템플릿 기반 하위업무 생성 오류:', tasksError);
        console.error('  - 코드:', tasksError.code);
        console.error('  - 메시지:', tasksError.message);
        console.error('  - 세부사항:', tasksError.details);
        console.error('  - 힌트:', tasksError.hint);
        
        // 템플릿 기반 생성 실패 시 기본 업무로 대체
        console.log('🔄 템플릿 기반 생성 실패, 기본 업무로 대체 시도...');
        return await createFallbackTasks(projectId, projectName);
      }

      console.log(`🎉 ${createdTasks?.length || 0}개의 템플릿 기반 하위업무가 성공적으로 생성되었습니다!`);
      console.log('✅ 생성된 업무들:', createdTasks);
      
      // 성공 토스트 메시지
      toast({
        title: "템플릿 기반 하위업무 생성 완료",
        description: `${createdTasks?.length || 0}개의 단계별 하위업무가 템플릿을 기반으로 자동 생성되었습니다.`,
      });
      
    } catch (error) {
      console.error('💥 템플릿 기반 하위업무 생성 실패:', error);
      
      // 최종 대체 방안으로 기본 업무 생성 시도
      try {
        console.log('🔄 최종 대체 방안으로 기본 업무 생성 시도...');
        await createFallbackTasks(projectId, projectName);
      } catch (fallbackError) {
        console.error('💥 기본 업무 생성도 실패:', fallbackError);
        toast({
          title: "하위업무 생성 실패",
          description: "하위업무 자동 생성에 실패했습니다. 수동으로 추가해주세요.",
          variant: "destructive",
        });
      }
    }
  };

  // 대체 업무 생성 함수 (템플릿이 없을 때)
  const createFallbackTasks = async (projectId: string, projectName: string) => {
    console.log('🔄 프로모션명 기반 하위업무 생성 시작...', { projectId, projectName });
    
    // 먼저 간단한 테스트 업무로 데이터베이스 접근 확인
    console.log('🧪 데이터베이스 접근 테스트 시작...');
    try {
      const testTask = {
        title: '테스트 업무',
        description: 'DB 접근 테스트용',
        project_id: projectId,
        status: '시작전',
        priority: 'medium',
        progress: 0,
        start_date: null,
        due_date: null,
        assigned_to: null,
        department: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('🧪 테스트 업무 데이터:', testTask);
      
      const { data: testResult, error: testError } = await supabase
        .from('tasks')
        .insert([testTask])
        .select();
        
      if (testError) {
        console.error('❌ 데이터베이스 접근 테스트 실패:', {
          error: testError,
          code: testError.code,
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          data: testTask
        });
        throw new Error(`DB 접근 실패: ${testError.message}`);
      }
      
      console.log('✅ 데이터베이스 접근 테스트 성공:', testResult);
      
      // 테스트 업무 삭제
      if (testResult && testResult[0]?.id) {
        await supabase.from('tasks').delete().eq('id', testResult[0].id);
        console.log('🗑️ 테스트 업무 삭제 완료');
      }
      
    } catch (testError) {
      console.error('💥 데이터베이스 접근 테스트 실패:', testError);
      throw testError;
    }
    
    // 프로모션명만 15개 자동 생성하는 템플릿
    const promotionNames = [
      '영업정보',
      '견적서 및 접수',
      '견적서 분석',
      '원자재 소싱전략',
      'SPL 접수',
      '원재 소싱전략',
      '원재 결정',
      'E-Service Content',
      'E-Service 완성',
      'LINE 그래디',
      '결과 산출',
      'PP',
      '품질 Review',
      '최종 개선',
      '수주'
    ];
    
    console.log(`📝 생성할 프로모션명 목록 (총 ${promotionNames.length}개):`, promotionNames);
    
    // 프로모션명만 채우고 나머지는 빈칸으로 생성
    const fallbackTasks = promotionNames.map((promotionName, index) => ({
      title: promotionName, // 프로모션명만 자동 생성
      description: '', // 빈칸
      project_id: projectId, // UUID 형식이므로 그대로 사용
      status: '시작전', // 기본 상태만 설정
      priority: 'medium', // 기본 우선순위 설정 (null 방지)
      progress: 0,
      start_date: null, // 빈칸 - 사용자가 선택
      due_date: null, // 빈칸 - 사용자가 선택
      assigned_to: null, // 빈칸 - 사용자가 선택
      department: null, // 빈칸 - 사용자가 선택
      task_phase: null, // 빈칸 - 사용자가 선택
      parent_task_id: null, // 상위 업무 없음
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log('📊 생성할 업무 데이터:', fallbackTasks);

    try {
      const { data: createdTasks, error: tasksError } = await supabase
        .from('tasks')
        .insert(fallbackTasks)
        .select();

      if (tasksError) {
        console.error('❌ 프로모션명 하위업무 생성 오류:', {
          error: tasksError,
          code: tasksError.code,
          message: tasksError.message,
          details: tasksError.details,
          hint: tasksError.hint,
          data: fallbackTasks
        });
        
        // 더 구체적인 에러 메시지 표시
        toast({
          title: "하위업무 생성 실패",
          description: `데이터베이스 오류: ${tasksError.message}. 개발자 도구 콘솔을 확인해주세요.`,
          variant: "destructive",
        });
        
        throw tasksError;
      }

      console.log(`🎉 ${createdTasks?.length || 0}개의 프로모션명 하위업무가 성공적으로 생성되었습니다!`);
      console.log('✅ 생성된 업무 목록:', createdTasks);
      
      toast({
        title: "프로모션명 하위업무 생성 완료",
        description: `${createdTasks?.length || 0}개의 프로모션명이 생성되었습니다. 세부 정보는 각 업무를 편집하여 입력해주세요.`,
      });
      
    } catch (error) {
      console.error('💥 프로모션명 하위업무 생성 실패:', error);
      throw error;
    }
  };

   // Supabase Function을 사용한 템플릿 기반 업무 생성 (더 안정적)
   const createTasksUsingFunction = async (projectId: string, projectName: string) => {
     try {
       console.log('🚀 Supabase Function을 사용한 템플릿 기반 업무 생성 시작:', { projectId, projectName });
       
       // Supabase Function 호출
       const { data, error } = await supabase.rpc('create_project_with_default_tasks', {
         project_data: {
           name: projectName,
           id: projectId
         }
       });

       console.log('📋 Supabase Function 결과:', { data, error });

       if (error) {
         console.error('❌ Supabase Function 호출 오류:', error);
         // Function 실패 시 클라이언트 사이드 방법으로 대체
         console.log('🔄 클라이언트 사이드 방법으로 대체...');
         return await createDefaultTasks(projectId, projectName);
       }

       if (data && data.success) {
         console.log(`🎉 ${data.created_tasks_count}개의 템플릿 기반 업무가 Function으로 생성되었습니다!`);
         
         toast({
           title: "템플릿 기반 업무 생성 완료",
           description: data.message || `${data.created_tasks_count}개의 업무가 자동 생성되었습니다.`,
         });
       } else {
         console.log('⚠️ Function 실행 결과가 예상과 다름, 클라이언트 방법으로 대체...');
         return await createDefaultTasks(projectId, projectName);
       }
       
     } catch (error) {
       console.error('💥 Supabase Function 호출 실패:', error);
       
       // Function 호출 실패 시 클라이언트 사이드 방법으로 대체
       console.log('🔄 클라이언트 사이드 방법으로 대체...');
       return await createDefaultTasks(projectId, projectName);
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
                            {managers.map(manager => (
                              <SelectItem key={manager.id} value={manager.name}>
                                <div className="flex items-center gap-3 py-1">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                    {manager.name.charAt(0)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{manager.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {manager.email && (
                                        <div className="text-xs text-gray-500">{manager.email}</div>
                                      )}
                                      {manager.department?.name && (
                                        <div className="flex items-center gap-1">
                                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border-blue-200">
                                            {manager.department.name}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* 선택된 담당자 정보 표시 */}
                        {field.value && (() => {
                          const selectedManager = managers.find(m => m.name === field.value);
                          return selectedManager && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                  {selectedManager.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 mb-1">{selectedManager.name}</div>
                                  <div className="flex items-center gap-3 text-sm">
                                    {selectedManager.email && (
                                      <div className="text-gray-600">{selectedManager.email}</div>
                                    )}
                                    {selectedManager.department?.name && (
                                      <div className="flex items-center gap-1">
                                        <Badge variant="outline" className="text-xs px-2 py-1 bg-white text-blue-700 border-blue-300">
                                          <span className="mr-1">📁</span>
                                          {selectedManager.department.name}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 부서 선택 */}
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">부서 *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base border-2 focus:border-blue-500 transition-colors">
                              <SelectValue placeholder="부서 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map(department => (
                              <SelectItem key={department.id} value={department.id}>
                                <div className="flex items-center gap-3 py-1">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white text-sm font-medium">
                                    {department.name.charAt(0)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{department.name}</div>
                                    {department.code && (
                                      <div className="text-xs text-gray-500">{department.code}</div>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* 선택된 부서 정보 표시 */}
                        {field.value && (() => {
                          const selectedDepartment = departments.find(d => d.id === field.value);
                          return selectedDepartment && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-medium">
                                  {selectedDepartment.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 mb-1">{selectedDepartment.name}</div>
                                  <div className="flex items-center gap-2 text-sm">
                                    {selectedDepartment.code && (
                                      <Badge variant="outline" className="text-xs px-2 py-1 bg-white text-green-700 border-green-300">
                                        <span className="mr-1">🏢</span>
                                        {selectedDepartment.code}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-base font-medium">시작일</FormLabel>
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
                  name="promotionStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">프로모션 단계 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-base border-2 focus:border-green-500 transition-colors">
                            <SelectValue placeholder="프로모션 단계 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Promotion">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              Promotion
                            </div>
                          </SelectItem>
                          <SelectItem value="Sample">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500" />
                              Sample 및 견적
                            </div>
                          </SelectItem>
                          <SelectItem value="1차검증">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500" />
                              1차 특성 검증
                            </div>
                          </SelectItem>
                          <SelectItem value="설계검증">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                              설계 검증
                            </div>
                          </SelectItem>
                          <SelectItem value="Set검증">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-cyan-500" />
                              Set 검증
                            </div>
                          </SelectItem>
                          <SelectItem value="승인">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              승인
                            </div>
                          </SelectItem>
                          <SelectItem value="수주">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500" />
                              수주
                            </div>
                          </SelectItem>
                          <SelectItem value="Drop">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-gray-500" />
                              Drop
                            </div>
                          </SelectItem>
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
