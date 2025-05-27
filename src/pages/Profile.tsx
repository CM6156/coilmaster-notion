import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DepartmentCode } from "@/types";
import { 
  User as UserIcon,
  Mail,
  Lock,
  Shield,
  Building2,
  Calendar,
  KeyRound,
  Save,
  RefreshCw,
  Camera,
  Award,
  UserCheck,
  Sparkles,
  Globe,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  position_id?: string;
  position_name?: string;
  corporation_id?: string;
  corporation_name?: string;
  role?: string;
  is_active?: boolean;
  login_method?: string;
  last_login?: string;
  avatar?: string;
  avatar_url?: string;
  phone?: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export default function Profile() {
  const { toast } = useToast();
  const { translations, language } = useLanguage();
  const { currentUser, setCurrentUser } = useAppContext();
  const t = translations.profile;
  
  // 디버깅을 위한 로그
  console.log('=== Profile 컴포넌트 로드 ===');
  console.log('currentUser:', currentUser);
  console.log('currentUser type:', typeof currentUser);
  console.log('currentUser?.id:', currentUser?.id);
  console.log('===============================');
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailResetLoading, setIsEmailResetLoading] = useState(false);
  const [isPasswordResetLoading, setIsPasswordResetLoading] = useState(false);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true);
  const [isActiveToggleLoading, setIsActiveToggleLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department_id: "",
    phone: "",
    is_active: true,
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // 부서 목록 로드
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsDepartmentsLoading(true);
        
        // 관리자 패널에서 등록한 부서 목록을 직접 조회
        const { data, error } = await supabase
          .from('departments')
          .select('id, name, code, description')
          .order('name');
        
        if (error) {
          throw error;
        }
        
        setDepartments(data || []);
        console.log('부서 목록 로드 성공:', data);
        
        if (data && data.length > 0) {
          toast({
            title: "부서 목록 로드 완료",
            description: `${data.length}개의 부서를 불러왔습니다.`,
          });
        }
      } catch (error) {
        console.error('부서 목록 로드 실패:', error);
        toast({
          title: "부서 목록 로드 실패",
          description: "부서 목록을 불러오는데 실패했습니다. 관리자 패널에서 부서를 먼저 등록해주세요.",
          variant: "destructive"
        });
        // 실패해도 빈 배열로 설정
        setDepartments([]);
      } finally {
        setIsDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // 현재 사용자 정보 로드
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        if (!currentUser?.id) {
          console.log('currentUser가 없습니다. 로그인이 필요합니다.');
          
          toast({
            title: "로그인 필요",
            description: "프로필을 보려면 먼저 로그인해주세요.",
            variant: "destructive"
          });
          return;
        }

        console.log('현재 사용자 ID:', currentUser.id);

        // 먼저 현재 사용자 정보로 시도
        let userId = currentUser.id;
        let useAuthCheck = true;

        // UUID 형식 검증 (관대하게)
        const uuidRegex = /^[0-9a-f-]{36}$/i;
        if (!uuidRegex.test(userId)) {
          console.log('UUID 형식이 아닌 사용자 ID, Supabase auth 확인 스킵:', userId);
          useAuthCheck = false;
        }

        // Supabase auth 사용자 확인 (가능한 경우에만)
        if (useAuthCheck) {
          try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (!authError && user) {
              userId = user.id;
              console.log('Supabase auth 사용자 확인:', userId);
            } else {
              console.log('Supabase auth 확인 실패, currentUser 사용:', authError);
            }
          } catch (authCheckError) {
            console.log('Supabase auth 확인 중 오류, currentUser 사용:', authCheckError);
          }
        }

        // user_profiles 뷰에서 사용자 정보 조회
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.log('user_profiles 뷰 조회 실패, users 테이블 직접 조회:', error);
          // 뷰 조회 실패 시 users 테이블 직접 조회
          const result = await supabase
            .from('users')
            .select(`
              *,
              department:department_id(id, name, code),
              position:position_id(id, name, code),
              corporation:corporation_id(id, name, code)
            `)
            .eq('id', userId)
            .single();
          
          if (result.error) {
            console.log('users 테이블 조회도 실패, currentUser 데이터 사용:', result.error);
            
            // DB 조회도 실패하면 currentUser 데이터 사용
            setProfile(currentUser as UserProfile);
      setFormData({
              name: currentUser.name || "",
              email: currentUser.email || "",
              department_id: (currentUser as any)?.department_id || "",
              phone: (currentUser as any)?.phone || "",
              is_active: (currentUser as any)?.is_active || currentUser.isActive || true,
              currentPassword: "",
              newPassword: "",
              confirmPassword: ""
            });
            return;
          }
          
          const userData = result.data;
          const profileData: UserProfile = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            department_id: userData.department?.id,
            department_name: userData.department?.name,
            department_code: userData.department?.code,
            position_id: userData.position?.id,
            position_name: userData.position?.name,
            corporation_id: userData.corporation?.id,
            corporation_name: userData.corporation?.name,
            role: userData.role,
            is_active: userData.is_active,
            login_method: userData.login_method,
            last_login: userData.last_login,
            avatar: userData.avatar,
            avatar_url: userData.avatar_url,
            phone: userData.phone
          };
          
          console.log('✅ users 테이블에서 프로필 로드 완료:', profileData);
          console.log('📋 부서 정보:', {
            id: profileData.department_id,
            name: profileData.department_name,
            code: profileData.department_code
          });
          
          setProfile(profileData);
          setFormData({
            name: profileData.name || "",
            email: profileData.email || "",
            department_id: profileData.department_id || "",
            phone: profileData.phone || "",
            is_active: profileData.is_active || true,
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
          
          console.log("✅ 프로필 로딩 완료 - 역할:", profileData.role, "활성화:", profileData.is_active);
          
          // Supabase 전용 저장 - localStorage 백업 제거
          
        } else {
          console.log('user_profiles 뷰에서 사용자 정보 로드 성공:', data);
          console.log('📋 부서 정보:', {
            id: data?.department_id,
            name: data?.department_name,
            code: data?.department_code
          });
          
          setProfile(data);
          setFormData({
            name: data?.name || "",
            email: data?.email || "",
            department_id: data?.department_id || "",
            phone: data?.phone || "",
            is_active: data?.is_active || true,
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
          
          console.log("✅ 프로필 로딩 완료 - 역할:", data?.role, "활성화:", data?.is_active);
          
          // Supabase 전용 저장 - localStorage 백업 제거
        }
      } catch (error: any) {
        console.error('사용자 프로필 로드 실패:', error);
        
        // 모든 DB 조회가 실패해도 currentUser가 있으면 표시
        if (currentUser) {
          console.log('DB 조회 실패, currentUser 데이터로 폴백:', currentUser);
          setProfile(currentUser as UserProfile);
          setFormData({
            name: currentUser.name || "",
            email: currentUser.email || "",
            department_id: (currentUser as any)?.department_id || "",
            phone: (currentUser as any)?.phone || "",
            is_active: (currentUser as any)?.is_active || currentUser.isActive || true,
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
          
          toast({
            title: "프로필 로드",
            description: "기본 정보만 표시됩니다. 일부 기능이 제한될 수 있습니다.",
            variant: "default"
          });
        } else {
          toast({
            title: "프로필 로드 실패",
            description: error.message || "사용자 프로필을 불러오는데 실패했습니다.",
            variant: "destructive"
          });
        }
      }
    };

    loadUserProfile();
  }, [currentUser]);

  // 부서 정보 실시간 동기화
  useEffect(() => {
    if (profile && departments.length > 0) {
      const currentDepartment = departments.find(d => d.id === profile.department_id);
      if (currentDepartment && (!profile.department_name || profile.department_name !== currentDepartment.name)) {
        console.log('🔄 부서 정보 동기화:', currentDepartment);
        
        const updatedProfile = {
          ...profile,
          department_name: currentDepartment.name,
          department_code: currentDepartment.code
        };
        
        setProfile(updatedProfile);
        
        // AppContext도 업데이트
        if (currentUser) {
          const updatedCurrentUser = {
            ...currentUser,
            department_id: profile.department_id,
            department_name: currentDepartment.name,
            department_code: currentDepartment.code,
            is_active: profile.is_active, // 활성화 상태 보존
          };
          setCurrentUser(updatedCurrentUser as any);
          
          // Supabase 전용 저장 - localStorage 제거
        }
      }
    }
  }, [profile, departments, currentUser, setCurrentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 프로필 업데이트
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // 유효성 검사
      if (!formData.name.trim()) {
        throw new Error(t?.nameRequired || "이름을 입력해주세요");
      }
      
      if (!formData.email.trim()) {
        throw new Error(t?.emailRequired || "이메일을 입력해주세요");
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error(t?.invalidEmail || "올바른 이메일 형식을 입력해주세요");
      }

      // 사용자 ID 확인 (auth 우선, currentUser fallback)
      let userId = currentUser?.id;
      
      console.log("=== 프로필 업데이트 시작 ===");
      console.log("시작 시 currentUser:", currentUser);
      console.log("폼 데이터:", formData);
      
      try {
        // Supabase auth 사용자 확인 시도
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!authError && user) {
          userId = user.id;
          console.log('✅ Supabase auth 사용자 사용:', userId);
        } else {
          console.log('⚠️ auth 확인 실패, currentUser 사용:', authError);
        }
      } catch (authCheckError) {
        console.log('⚠️ auth 확인 중 오류, currentUser 사용:', authCheckError);
      }

      if (!userId) {
        throw new Error("사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.");
      }

      console.log("📝 Supabase users 테이블 업데이트 시작...");
      
      // Supabase에서 프로필 업데이트 - 더 명확한 에러 처리
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        department_id: formData.department_id || null,
        phone: formData.phone?.trim() || null,
        is_active: formData.is_active, // 활성화 상태 저장
        updated_at: new Date().toISOString()
      };
      
      console.log("업데이트할 데이터:", updateData);
      console.log("대상 사용자 ID:", userId);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('*'); // 업데이트된 데이터 반환받기
      
      if (updateError) {
        console.error("❌ Supabase 업데이트 실패:", updateError);
        console.error("에러 상세:", {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
        throw new Error(`DB 업데이트 실패: ${updateError.message}`);
      }
      
      if (!updateResult || updateResult.length === 0) {
        console.error("❌ 업데이트된 행이 없음. 사용자 ID가 존재하지 않을 수 있습니다.");
        
        // 사용자가 없다면 자동으로 생성 시도
        console.log("🔧 사용자 자동 생성 시도...");
        
        try {
          // Supabase auth에서 사용자 정보 가져오기
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
          
          if (!authError && authUser) {
            console.log("📝 users 테이블에 새 사용자 생성 중...");
            
            // 새 사용자 생성
            const newUserData = {
              id: authUser.id,
              name: formData.name.trim(),
              email: formData.email.trim(),
              department_id: formData.department_id || null,
              phone: formData.phone?.trim() || null,
              role: 'user',
              is_active: formData.is_active, // 활성화 상태 포함
              login_method: 'email',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { data: createResult, error: createError } = await supabase
              .from('users')
              .insert([newUserData])
              .select('*');
            
            if (createError) {
              console.error("❌ 사용자 생성 실패:", createError);
              throw new Error(`사용자 생성 실패: ${createError.message}`);
            }
            
            if (createResult && createResult.length > 0) {
              console.log("✅ 새 사용자 생성 성공:", createResult[0]);
              
              // 생성된 사용자 데이터를 updateResult로 사용
              const updatedProfile: UserProfile = {
                ...createResult[0],
                department_name: departments.find(d => d.id === formData.department_id)?.name,
                department_code: departments.find(d => d.id === formData.department_id)?.code,
              };
              
      setProfile(updatedProfile);
              
              // AppContext도 업데이트
              if (currentUser) {
                const updatedCurrentUser = {
                  ...currentUser,
                  ...createResult[0],
                  name: updatedProfile.name,
                  email: updatedProfile.email,
                  department_id: updatedProfile.department_id,
                  department_name: departments.find(d => d.id === formData.department_id)?.name,
                  department_code: departments.find(d => d.id === formData.department_id)?.code,
                  phone: updatedProfile.phone,
                  role: createResult[0].role, // 역할 정보 포함
                  is_active: createResult[0].is_active, // 활성화 상태 포함
                };
                setCurrentUser(updatedCurrentUser);
                
                // 사이드바 동기화를 위한 localStorage 업데이트
                localStorage.setItem("userProfile", JSON.stringify(updatedCurrentUser));
                localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser));
                console.log("🔄 신규 사용자 - 사이드바 동기화 완료");
              }
              
              // 부서 정보 재확인을 위해 3초 후 DB에서 다시 로드
              setTimeout(async () => {
                try {
                  console.log("🔍 부서 정보 재확인 중...");
                  const { data: recheckData, error: recheckError } = await supabase
                    .from('users')
                    .select(`
                      *,
                      department:department_id(id, name, code)
                    `)
                    .eq('id', authUser.id)
                    .single();
                  
                  if (!recheckError && recheckData) {
                    console.log("✅ 부서 정보 재확인됨:", recheckData);
                    
                    const finalProfile: UserProfile = {
                      ...recheckData,
                      department_name: recheckData.department?.name,
                      department_code: recheckData.department?.code,
                    };
                    
                    setProfile(finalProfile);
                    
                    if (recheckData.department_id) {
                      console.log("✅ 부서 저장 및 연결 확인됨:", recheckData.department);
                    } else {
                      console.warn("⚠️ 부서 정보가 여전히 없습니다.");
                    }
                  }
                } catch (e) {
                  console.error("부서 정보 재확인 중 오류:", e);
                }
              }, 3000);
      
      toast({
                title: "사용자 계정 생성 및 프로필 업데이트 성공",
                description: "새 계정이 생성되고 프로필 정보가 저장되었습니다."
              });
              
              console.log("✅ 사용자 생성 및 프로필 업데이트 완료");
              setIsLoading(false);
              return; // 성공적으로 완료되었으므로 함수 종료
            }
          }
        } catch (userCreationError) {
          console.error("❌ 사용자 자동 생성 중 오류:", userCreationError);
        }
        
        throw new Error("해당 사용자를 찾을 수 없습니다. 다시 로그인해주세요.");
      }
      
      console.log("✅ Supabase 업데이트 성공:", updateResult[0]);

      // Auth 사용자 이메일 업데이트 (이메일이 변경된 경우, 선택사항)
      if (formData.email !== profile?.email) {
        try {
          console.log("📧 Auth 이메일 업데이트 시도...");
          const { error: authError } = await supabase.auth.updateUser({
            email: formData.email
          });
          
          if (authError) {
            console.warn("⚠️ Auth 이메일 업데이트 실패:", authError);
            // Auth 업데이트 실패해도 프로필 업데이트는 성공으로 처리
          } else {
            console.log("✅ Auth 이메일 업데이트 성공");
          }
        } catch (authUpdateError) {
          console.warn("⚠️ Auth 이메일 업데이트 중 오류:", authUpdateError);
          // 오류가 발생해도 프로필 업데이트는 성공으로 처리
        }
      }

      // 프로필 정보 새로고침
      const selectedDepartment = departments.find(d => d.id === formData.department_id);
      const updatedProfile: UserProfile = {
        ...profile!,
        ...updateResult[0], // Supabase에서 반환된 실제 데이터 사용
        department_name: selectedDepartment?.name,
        department_code: selectedDepartment?.code,
      };
      
      console.log("🔄 프로필 상태 업데이트:", updatedProfile);
      setProfile(updatedProfile);

      // AppContext의 currentUser도 업데이트
      if (currentUser) {
        const updatedCurrentUser = {
          ...currentUser,
          ...updateResult[0], // DB에서 반환된 전체 데이터 사용
          name: updatedProfile.name,
          email: updatedProfile.email,
          department_id: updatedProfile.department_id,
          department_name: updatedProfile.department_name,
          department_code: updatedProfile.department_code,
          phone: updatedProfile.phone,
          role: updateResult[0].role, // 역할 정보 포함
          is_active: formData.is_active, // 활성화 상태 포함
        };
        console.log("🔄 AppContext 업데이트:", updatedCurrentUser);
        setCurrentUser(updatedCurrentUser);
        
        // 사이드바 동기화를 위한 localStorage 업데이트 (역할 정보 포함)
        localStorage.setItem("userProfile", JSON.stringify(updatedCurrentUser));
        localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser));
        console.log("🔄 사이드바 동기화를 위한 localStorage 업데이트 완료 (역할 정보 포함)");
      }
      
      console.log("✅ 프로필 상태 업데이트 완료 (Supabase + 동기화):", updatedProfile);
      console.log("📋 선택된 부서:", selectedDepartment);
      
      toast({
        title: t?.profileUpdateSuccess || "프로필 업데이트 성공",
        description: formData.department_id ? 
          `프로필 정보와 부서(${selectedDepartment?.name})가 Supabase에 성공적으로 저장되었습니다.` :
          "프로필 정보가 Supabase에 성공적으로 저장되었습니다."
      });

      // 추가 백업 및 검증
      console.log("=== 프로필 업데이트 완료 ===");
      console.log("업데이트된 프로필:", updatedProfile);
      console.log("사용된 사용자 ID:", userId);
      console.log("================================");
      
      // DB 저장 확인 (3초 후)
      setTimeout(async () => {
        try {
          console.log("🔍 DB 저장 상태 재확인 중...");
          const { data: verifyData, error: verifyError } = await supabase
            .from('users')
            .select(`
              name, 
              email, 
              department_id, 
              phone, 
              is_active,
              role,
              updated_at,
              department:department_id(id, name, code)
            `)
            .eq('id', userId)
            .single();
          
          if (!verifyError && verifyData) {
            console.log("✅ DB 저장 재확인됨:", verifyData);
            console.log("📋 저장된 부서 정보:", verifyData.department);
            console.log("🔄 활성화 상태:", verifyData.is_active);
            console.log("👤 역할 정보:", verifyData.role);
            
            // 저장된 데이터와 폼 데이터 비교
            const isMatch = (
              verifyData.name === formData.name.trim() &&
              verifyData.email === formData.email.trim() &&
              verifyData.department_id === (formData.department_id || null) &&
              verifyData.phone === (formData.phone?.trim() || null) &&
              verifyData.is_active === formData.is_active // formData의 활성화 상태와 비교
            );
            
            if (isMatch) {
              console.log("✅ 데이터 일치 확인됨 - Supabase 저장 성공!");
              if (verifyData.department) {
                console.log("✅ 부서 연결 확인됨:", (verifyData.department as any)?.name);
              }
            } else {
              console.warn("⚠️ 저장된 데이터와 폼 데이터 불일치:", {
                form: {
                  name: formData.name.trim(),
                  email: formData.email.trim(),
                  department_id: formData.department_id || null,
                  phone: formData.phone?.trim() || null,
                  is_active: formData.is_active
                },
                db: verifyData
              });
            }
          } else {
            console.error("❌ DB 저장 재확인 실패:", verifyError);
          }
        } catch (e) {
          console.error("DB 재확인 중 오류:", e);
        }
      }, 3000);

    } catch (error: any) {
      console.error("프로필 업데이트 실패:", error);
      toast({
        title: t?.profileUpdateError || "프로필 업데이트 실패",
        description: error.message || "프로필 업데이트에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일 재설정 링크 보내기
  const handleEmailReset = async () => {
    setIsEmailResetLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      );

      if (error) throw error;

      toast({
        title: t?.emailResetSuccess || "이메일 재설정 링크 전송",
        description: "이메일 재설정 링크가 전송되었습니다. 이메일을 확인해주세요."
      });
    } catch (error: any) {
      console.error("이메일 재설정 실패:", error);
      toast({
        title: t?.emailResetError || "이메일 재설정 실패",
        description: error.message || "이메일 재설정 링크 전송에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsEmailResetLoading(false);
    }
  };

  // 비밀번호 변경
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordResetLoading(true);
    
    try {
      // 유효성 검사
      if (!formData.newPassword) {
        throw new Error("새 비밀번호를 입력해주세요");
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error(t?.passwordMismatch || "비밀번호가 일치하지 않습니다");
      }
      
      if (formData.newPassword.length < 6) {
        throw new Error(t?.passwordTooShort || "비밀번호는 최소 6자 이상이어야 합니다");
      }

      // Supabase Auth 비밀번호 업데이트
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;
      
      toast({
        title: t?.passwordChangeSuccess || "비밀번호 변경 성공",
        description: "비밀번호가 성공적으로 변경되었습니다."
      });
      
      // 폼 리셋
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      console.error("비밀번호 변경 실패:", error);
      toast({
        title: t?.passwordChangeError || "비밀번호 변경 실패",
        description: error.message || "비밀번호 변경에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsPasswordResetLoading(false);
    }
  };

  // 비밀번호 재설정 링크 보내기
  const handlePasswordResetEmail = async () => {
    setIsPasswordResetLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        profile?.email || "",
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      );

      if (error) throw error;

      toast({
        title: t?.passwordResetSuccess || "비밀번호 재설정 링크 전송",
        description: "비밀번호 재설정 링크가 전송되었습니다. 이메일을 확인해주세요."
      });
    } catch (error: any) {
      console.error("비밀번호 재설정 실패:", error);
      toast({
        title: t?.passwordResetError || "비밀번호 재설정 실패",
        description: error.message || "비밀번호 재설정 링크 전송에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsPasswordResetLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-r from-red-500 to-pink-500';
      case 'manager': return 'bg-gradient-to-r from-blue-500 to-purple-500';
      default: return 'bg-gradient-to-r from-green-500 to-emerald-500';
    }
  };

  // 활성화/비활성화 토글 핸들러 (로컬 상태만 변경)
  const handleActiveToggle = (checked: boolean) => {
    console.log("=== 활성화 상태 로컬 변경 ===");
    console.log("현재 상태:", formData.is_active);
    console.log("변경할 상태:", checked);
    
    setFormData({
      ...formData,
      is_active: checked
    });
    
    console.log("✅ 활성화 상태 로컬 변경 완료");
    
    toast({
      title: checked ? "활성화 상태로 변경됨" : "비활성화 상태로 변경됨",
      description: "저장 버튼을 눌러 변경사항을 저장하세요.",
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* 프로필 헤더 */}
          <div className="mb-8">
            <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                      <AvatarImage src={profile?.avatar} alt={profile?.name} />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {profile?.name ? getInitials(profile.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                      <h1 className="text-3xl font-bold">{profile?.name || "사용자"}</h1>
                      <Badge className={cn("text-white border-0", getRoleBadgeColor(profile?.role))}>
                        {profile?.role === 'admin' && '관리자'}
                        {profile?.role === 'manager' && '매니저'}
                        {(!profile?.role || profile?.role === 'user') && '사용자'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{profile?.email}</p>
                    
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                        <Building2 className="h-3 w-3" />
                        {(() => {
                          // 부서 표시 우선순위: profile -> currentUser -> departments 배열
                          const departmentId = profile?.department_id || (currentUser as any)?.department_id;
                          const departmentName = 
                            profile?.department_name || 
                            (currentUser as any)?.department_name ||
                            departments.find(d => d.id === departmentId)?.name;
                          
                          console.log('부서 표시 디버그:', {
                            departmentId,
                            departmentName,
                            profileDeptId: profile?.department_id,
                            profileDeptName: profile?.department_name,
                            currentUserDeptId: (currentUser as any)?.department_id,
                            currentUserDeptName: (currentUser as any)?.department_name,
                            departmentsCount: departments.length
                          });
                          
                          return departmentName || "부서 미지정";
                        })()}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                        <Globe className="h-3 w-3" />
                        {language === 'ko' ? '한국어' : language === 'en' ? 'English' : language === 'th' ? 'ไทย' : '中文'}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                        <Activity className="h-3 w-3" />
                        {formData.is_active ? '활성' : '비활성'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 items-center">
                    <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      <p className="text-sm text-muted-foreground">멤버십</p>
                      <p className="font-bold">SVIP</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
      </div>
      
      <div className="grid gap-6">
            <Tabs defaultValue="personal-info" className="w-full">
              <TabsList className="h-12 p-1.5 bg-white dark:bg-slate-800 shadow-lg border-0 mb-6">
                <TabsTrigger 
                  value="personal-info"
                  className={cn(
                    "h-9 px-6 font-medium transition-all duration-200",
                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500",
                    "data-[state=active]:text-white data-[state=active]:shadow-lg"
                  )}
                >
                  <UserIcon className="w-4 w-4 mr-2" />
                  {t?.personalInfo || "개인 정보"}
            </TabsTrigger>
                <TabsTrigger 
                  value="password"
                  className={cn(
                    "h-9 px-6 font-medium transition-all duration-200",
                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500",
                    "data-[state=active]:text-white data-[state=active]:shadow-lg"
                  )}
                >
                  <Lock className="w-4 w-4 mr-2" />
                  {t?.passwordChange || "비밀번호 변경"}
                </TabsTrigger>
                <TabsTrigger 
                  value="account"
                  className={cn(
                    "h-9 px-6 font-medium transition-all duration-200",
                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-500",
                    "data-[state=active]:text-white data-[state=active]:shadow-lg"
                  )}
                >
                  <Shield className="w-4 w-4 mr-2" />
                  {t?.accountSettings || "계정 설정"}
                </TabsTrigger>
          </TabsList>
          
          {/* Personal Info Tab */}
          <TabsContent value="personal-info">
                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-xl">
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      {t?.personalInfo || "개인 정보"}
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      {t?.updateProfileInfo || "프로필 정보를 업데이트하세요."}
                </CardDescription>
              </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            {t?.name || "이름"}
                          </Label>
                          <div className="relative">
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                              placeholder="이름을 입력하세요"
                              required
                              className="pr-10 border-0 bg-slate-50 dark:bg-slate-800"
                            />
                            <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                    </div>
                        </div>
                        
                    <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {t?.email || "이메일"}
                          </Label>
                          <div className="flex gap-2">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="email@example.com"
                              required
                              className="flex-1 border-0 bg-slate-50 dark:bg-slate-800"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleEmailReset}
                              disabled={isEmailResetLoading || !formData.email}
                              className="shrink-0"
                            >
                              <RefreshCw className={cn("h-4 w-4", isEmailResetLoading && "animate-spin")} />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t?.emailResetDescription || "이메일 재설정 버튼을 클릭하면 새 이메일로 확인 링크가 전송됩니다."}
                          </p>
                    </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                          <Label htmlFor="department" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {t?.department || "부서"}
                          </Label>
                      <Select
                            value={formData.department_id}
                            onValueChange={(value) => handleSelectChange("department_id", value)}
                            disabled={isDepartmentsLoading}
                      >
                            <SelectTrigger className="border-0 bg-slate-50 dark:bg-slate-800">
                          <SelectValue placeholder={
                                isDepartmentsLoading 
                                  ? "부서 로딩중..." 
                                  : (t?.selectDepartment || "부서 선택")
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    {dept.name}
                                  </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                        
                    <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            전화번호
                          </Label>
                          <div className="relative">
                            <Input
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="전화번호를 입력하세요"
                              className="pr-10 border-0 bg-slate-50 dark:bg-slate-800"
                            />
                            <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                          </div>
                    </div>
                  </div>
                  
                  {/* Login Information Section */}
                      <div className="pt-6 mt-6 border-t">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-500" />
                          {t?.loginInfo || "로그인 정보"}
                        </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="border-0 bg-blue-50 dark:bg-blue-900/20">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                  <KeyRound className="h-5 w-5 text-blue-600" />
                                </div>
                      <div>
                                  <div className="text-sm text-muted-foreground">{t?.loginMethod || "로그인 방식"}</div>
                        <div className="font-medium">
                                    {profile?.login_method === "microsoft" ? 
                                      (t?.microsoftLogin || "Microsoft") : 
                                      (t?.emailPasswordLogin || "이메일/비밀번호")
                                    }
                        </div>
                      </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-0 bg-purple-50 dark:bg-purple-900/20">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                                  <Calendar className="h-5 w-5 text-purple-600" />
                                </div>
                        <div>
                                  <div className="text-sm text-muted-foreground">{t?.lastLogin || "마지막 로그인"}</div>
                                  <div className="font-medium">
                                    {profile?.last_login ? 
                                      new Date(profile.last_login).toLocaleString() : 
                                      new Date().toLocaleString()
                                    }
                        </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      {/* 계정 활성화 토글 */}
                      <div className="pt-6 mt-6 border-t">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                              <Activity className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-white">
                                계정 활성화 상태
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {formData.is_active ? 
                                  "계정이 활성화되어 모든 기능을 사용할 수 있습니다." :
                                  "계정이 비활성화되어 일부 기능이 제한됩니다."
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-sm font-medium",
                              formData.is_active ? "text-green-600" : "text-red-600"
                            )}>
                              {formData.is_active ? "활성" : "비활성"}
                            </span>
                            <Switch
                              checked={formData.is_active}
                              onCheckedChange={handleActiveToggle}
                              disabled={isActiveToggleLoading}
                              className="data-[state=checked]:bg-green-500"
                            />
                          </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                        <Button 
                          type="submit" 
                          disabled={isLoading || isDepartmentsLoading}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              {t?.saving || "저장 중..."}
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              {t?.save || "저장"}
                            </>
                          )}
                    </Button>
                        
                        {/* 개발자 디버깅 도구 (개발 모드에서만) */}
                        {process.env.NODE_ENV === 'development' && (
                          <Button
                            type="button"
                            variant="outline"
                            className="ml-3"
                            onClick={() => {
                              console.log("=== 디버깅 정보 ===");
                              console.log("currentUser:", currentUser);
                              console.log("profile:", profile);
                              console.log("formData:", formData);
                              console.log("departments:", departments);
                              console.log("localStorage userProfile:", localStorage.getItem("userProfile"));
                              console.log("localStorage currentUser:", localStorage.getItem("currentUser"));
                              console.log("=== 부서 진단 ===");
                              const deptId = profile?.department_id || (currentUser as any)?.department_id;
                              const dept = departments.find(d => d.id === deptId);
                              console.log("선택된 부서 ID:", deptId);
                              console.log("찾은 부서 정보:", dept);
                              console.log("프로필 부서명:", profile?.department_name);
                              console.log("currentUser 부서명:", (currentUser as any)?.department_name);
                              console.log("departments 배열 길이:", departments.length);
                              console.log("==================");
                            }}
                          >
                            🔍 Debug
                          </Button>
                        )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Password Change Tab */}
          <TabsContent value="password">
                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-xl">
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      {t?.passwordChange || "비밀번호 변경"}
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      {t?.securityDescription || "보안을 위해 정기적으로 비밀번호를 변경하세요."}
                </CardDescription>
              </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* 비밀번호 재설정 링크 보내기 */}
                      <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50">
                              <Mail className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-2">
                                {t?.passwordReset || "비밀번호 재설정"}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                {t?.passwordResetDescription || "이메일로 비밀번호 재설정 링크를 받으실 수 있습니다."}
                              </p>
                              <Button
                                onClick={handlePasswordResetEmail}
                                disabled={isPasswordResetLoading}
                                variant="outline"
                                className="bg-white dark:bg-slate-800"
                              >
                                {isPasswordResetLoading ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    {t?.sendingInProgress || "전송 중..."}
                                  </>
                                ) : (
                                  <>
                                    <Mail className="h-4 w-4 mr-2" />
                                    {t?.sendPasswordReset || "비밀번호 재설정 링크 보내기"}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* 직접 비밀번호 변경 */}
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <KeyRound className="h-5 w-5 text-purple-500" />
                          {t?.directPasswordChange || "직접 비밀번호 변경"}
                        </h3>
                        
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                            <Label htmlFor="newPassword">
                              {t?.newPassword || "새 비밀번호"}
                            </Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                              placeholder="새 비밀번호를 입력하세요"
                              className="border-0 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                          
                  <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                              {t?.confirmPassword || "비밀번호 확인"}
                            </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                              placeholder="새 비밀번호를 다시 입력하세요"
                              className="border-0 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                          
                          <Button 
                            type="submit" 
                            disabled={isPasswordResetLoading}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                          >
                            {isPasswordResetLoading ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                {t?.changingInProgress || "변경 중..."}
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                {t?.changePassword || "비밀번호 변경"}
                              </>
                            )}
                    </Button>
                </form>
                      </div>
                    </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Account Settings Tab */}
          <TabsContent value="account">
                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-t-xl">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      {t?.accountSettings || "계정 설정"}
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      {t?.accountSettingsDescription || "계정과 관련된 설정을 관리합니다."}
                </CardDescription>
              </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* 계정 정보 */}
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              {t?.name || "이름"}
                            </span>
                            <span className="font-medium">{profile?.name}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {t?.email || "이메일"}
                            </span>
                            <span className="font-medium">{profile?.email}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              {t?.role || "역할"}
                            </span>
                            <Badge className={cn("text-white border-0", getRoleBadgeColor(profile?.role))}>
                              {profile?.role === 'admin' && '관리자'}
                              {profile?.role === 'manager' && '매니저'}
                              {(!profile?.role || profile?.role === 'user') && '사용자'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {t?.department || "부서"}
                            </span>
                            <span className="font-medium">
                              {departments.find(d => d.id === profile?.department_id)?.name || "미지정"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Danger Zone */}
                      <div className="border-t pt-6 mt-6" />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          {t?.dangerZone || "계정 관리"}
                        </h3>
                        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                                  <Activity className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-red-800 dark:text-red-200">계정 활성화 상태</h4>
                                  <p className="text-sm text-red-600 dark:text-red-300">
                                    {formData.is_active ? 
                                      "계정이 활성화되어 있습니다. 비활성화하면 일부 기능이 제한됩니다." :
                                      "계정이 비활성화되어 있습니다. 활성화하면 모든 기능을 사용할 수 있습니다."
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "text-sm font-medium",
                                  formData.is_active ? "text-green-600" : "text-red-600"
                                )}>
                                  {formData.is_active ? "활성" : "비활성"}
                                </span>
                                <Switch
                                  checked={formData.is_active}
                                  onCheckedChange={handleActiveToggle}
                                  disabled={isActiveToggleLoading}
                                  className="data-[state=checked]:bg-green-500"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
