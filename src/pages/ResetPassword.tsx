import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { translations, language } = useLanguage();

  // URL에서 토큰 확인 및 인증 상태 리스너
  useEffect(() => {
    let mounted = true;
    let validationTimeout: NodeJS.Timeout;
    let recoveryDetected = false;

    const finalizeValidation = (isValid: boolean, errorMessage?: string) => {
      if (!mounted) return;
      
      setIsValidating(false);
      setIsTokenValid(isValid);
      
      if (!isValid && errorMessage) {
        setValidationError(errorMessage);
      }
    };

    const checkSession = async () => {
      console.log("🔍 비밀번호 재설정 세션 확인 시작");
      console.log("현재 URL:", window.location.href);
      console.log("Search params:", searchParams.toString());
      console.log("Hash:", window.location.hash);
      
      // URL 파라미터 상세 분석
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
              console.log("Hash 파라미터 분석:");
        console.log("- access_token:", hashParams.get('access_token') ? '있음' : '없음');
        console.log("- refresh_token:", hashParams.get('refresh_token') ? '있음' : '없음');
        console.log("- type:", hashParams.get('type'));
        console.log("- expires_at:", hashParams.get('expires_at'));
        
        // 코드 버전 확인용
        console.log("🆕 코드 버전: 2024-01-20-17:30 - FINAL FIX 배포됨");
      
      console.log("Search 파라미터 분석:");
      for (const [key, value] of searchParams) {
        console.log(`- ${key}:`, value);
      }
      
      try {
        // 먼저 현재 세션 확인
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("세션 확인 오류:", sessionError);
        }
        
        console.log("현재 세션:", sessionData.session ? "있음" : "없음");
        
        // 세션이 이미 있으면 비밀번호 재설정 가능
        if (sessionData.session) {
          console.log("✅ 유효한 세션 발견, 비밀번호 재설정 가능");
          finalizeValidation(true);
          return;
        }
        
        // URL에서 토큰 추출 (Query Parameters 방식)
        let accessToken = searchParams.get('access_token');
        let refreshToken = searchParams.get('refresh_token');
        let type = searchParams.get('type');
        
        // URL Hash에서 토큰 추출 (Supabase 기본 방식)
        if (!accessToken && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
          type = hashParams.get('type');
          
          console.log("Hash에서 추출한 토큰들:");
          console.log("- access_token:", accessToken ? "있음" : "없음");
          console.log("- refresh_token:", refreshToken ? "있음" : "없음");
          console.log("- type:", type);
        }
        
        // access_token과 type=recovery가 있으면 진행 (refresh_token은 선택사항)
        if (accessToken && type === 'recovery') {
          console.log("🔑 유효한 토큰 발견, 세션 설정 시도");
          
          try {
            if (refreshToken) {
              console.log("📝 refresh_token이 있음 - setSession 사용");
              // refresh_token이 있는 경우 setSession 사용
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (sessionError) {
                console.error("세션 설정 오류:", sessionError);
                throw new Error("비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.");
              }
              
              if (sessionData.session) {
                console.log("✅ 세션 설정 성공 (setSession)");
                if (mounted) {
                  window.history.replaceState({}, document.title, "/reset-password");
                }
                finalizeValidation(true);
                return;
              }
            } else {
              console.log("🔄 refresh_token이 없음 - 토큰 검증 후 직접 진행");
              
              // access_token으로 사용자 정보 확인
              const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
              
              if (userError || !userData.user) {
                throw new Error("토큰이 유효하지 않거나 만료되었습니다.");
              }
              
              console.log("✅ 토큰 검증 성공 - 비밀번호 재설정 허용");
              // URL에서 토큰 제거
              if (mounted) {
                window.history.replaceState({}, document.title, "/reset-password");
              }
              finalizeValidation(true);
              return;
            }
          } catch (error: any) {
            console.error("토큰 처리 오류:", error);
            throw error;
          }
        } else {
          console.log("❌ 필요한 토큰이 없음 - PASSWORD_RECOVERY 이벤트를 기다립니다");
          console.log("- accessToken:", !!accessToken);
          console.log("- refreshToken:", !!refreshToken);
          console.log("- type:", type);
          
          // 토큰이 없어도 즉시 실패하지 않고 PASSWORD_RECOVERY 이벤트를 기다림
          // 하지만 직접 접근한 경우 더 빠르게 안내
          if (!recoveryDetected) {
            validationTimeout = setTimeout(() => {
              if (mounted && !recoveryDetected) {
                const errorMsg = language === "ko" ? 
                  "비밀번호 재설정은 이메일 링크를 통해서만 가능합니다. 비밀번호 찾기를 다시 시도해주세요." :
                  language === "en" ? 
                  "Password reset is only available through email link. Please try password recovery again." :
                  language === "zh" ? 
                  "密码重置只能通过邮件链接进行。请重新尝试密码恢复。" :
                  "การรีเซ็ตรหัสผ่านสามารถทำได้ผ่านลิงก์อีเมลเท่านั้น โปรดลองกู้คืนรหัสผ่านอีกครั้ง";
                
                finalizeValidation(false, errorMsg);
              }
            }, 3000); // 3초로 단축
          }
        }
        
      } catch (error: any) {
        console.error("토큰 처리 오류:", error);
        finalizeValidation(false, error.message || "비밀번호 재설정 링크가 유효하지 않습니다.");
      }
    };

    // 인증 상태 변화 리스너
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 인증 상태 변화:", event, session ? "세션 있음" : "세션 없음");
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log("🔐 비밀번호 복구 이벤트 감지 - 토큰이 유효함");
        recoveryDetected = true;
        
        // 기존 타이머 취소
        if (validationTimeout) {
          clearTimeout(validationTimeout);
        }
        
        finalizeValidation(true);
        return;
      }
      
      if (event === 'SIGNED_IN' && session) {
        console.log("✅ 로그인 완료 - 비밀번호 재설정 가능");
        recoveryDetected = true;
        
        if (validationTimeout) {
          clearTimeout(validationTimeout);
        }
        
        finalizeValidation(true);
        return;
      }
      
      if (event === 'SIGNED_OUT') {
        console.log("🚪 로그아웃 감지");
        if (mounted && !isValidating) {
          navigate("/login");
        }
      }
    });

    // 초기 세션 확인 시작
    checkSession();

    return () => {
      mounted = false;
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
      authListener?.subscription?.unsubscribe();
    };
  }, [searchParams, navigate, isValidating]);

  // Translation fallbacks
  const t = {
    title: language === "ko" ? "새 비밀번호 설정" : 
           language === "en" ? "Set New Password" : 
           language === "zh" ? "设置新密码" : "ตั้งรหัสผ่านใหม่",
    description: language === "ko" ? "새로운 비밀번호를 입력하여 계정을 보호하세요." : 
                 language === "en" ? "Enter a new password to secure your account." : 
                 language === "zh" ? "输入新密码以保护您的账户。" : "ป้อนรหัสผ่านใหม่เพื่อรักษาความปลอดภัยของบัญชีของคุณ",
    validating: language === "ko" ? "링크 검증 중..." : 
                language === "en" ? "Validating link..." : 
                language === "zh" ? "正在验证链接..." : "กำลังตรวจสอบลิงก์...",
    validatingDesc: language === "ko" ? "비밀번호 재설정 링크를 확인하고 있습니다." : 
                    language === "en" ? "Verifying your password reset link." : 
                    language === "zh" ? "正在验证您的密码重置链接。" : "กำลังตรวจสอบลิงก์รีเซ็ตรหัสผ่านของคุณ",
    invalidLink: language === "ko" ? "유효하지 않은 링크" : 
                 language === "en" ? "Invalid Link" : 
                 language === "zh" ? "无效链接" : "ลิงก์ไม่ถูกต้อง",
    tryAgain: language === "ko" ? "다시 시도" : 
              language === "en" ? "Try Again" : 
              language === "zh" ? "重试" : "ลองอีกครั้ง",
    requestNew: language === "ko" ? "비밀번호 찾기" : 
                language === "en" ? "Forgot Password" : 
                language === "zh" ? "忘记密码" : "ลืมรหัสผ่าน",
    newPassword: language === "ko" ? "새 비밀번호" : 
                 language === "en" ? "New Password" : 
                 language === "zh" ? "新密码" : "รหัสผ่านใหม่",
    confirmPassword: language === "ko" ? "비밀번호 확인" : 
                     language === "en" ? "Confirm Password" : 
                     language === "zh" ? "确认密码" : "ยืนยันรหัสผ่าน",
    updatePassword: language === "ko" ? "비밀번호 업데이트" : 
                    language === "en" ? "Update Password" : 
                    language === "zh" ? "更新密码" : "อัปเดตรหัสผ่าน",
    updating: language === "ko" ? "업데이트 중..." : 
              language === "en" ? "Updating..." : 
              language === "zh" ? "更新中..." : "กำลังอัปเดต...",
    backToLogin: language === "ko" ? "로그인으로 돌아가기" : 
                 language === "en" ? "Back to Login" : 
                 language === "zh" ? "返回登录" : "กลับไปที่หน้าเข้าสู่ระบบ",
    successMessage: language === "ko" ? "비밀번호가 성공적으로 변경되었습니다!" : 
                    language === "en" ? "Password has been successfully changed!" : 
                    language === "zh" ? "密码已成功更改！" : "รหัสผ่านได้รับการเปลี่ยนแปลงเรียบร้อยแล้ว!",
    successDescription: language === "ko" ? "이제 새로운 비밀번호로 로그인할 수 있습니다." : 
                        language === "en" ? "You can now login with your new password." : 
                        language === "zh" ? "您现在可以使用新密码登录。" : "ตอนนี้คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว",
    loginNow: language === "ko" ? "지금 로그인" : 
              language === "en" ? "Login Now" : 
              language === "zh" ? "立即登录" : "เข้าสู่ระบบตอนนี้",
  };

  const formSchema = z.object({
    password: z.string()
      .min(6, language === "ko" ? "비밀번호는 최소 6자 이상이어야 합니다" : 
               language === "en" ? "Password must be at least 6 characters" : 
               language === "zh" ? "密码至少需要6个字符" : "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: language === "ko" ? "비밀번호가 일치하지 않습니다" : 
             language === "en" ? "Passwords don't match" : 
             language === "zh" ? "密码不匹配" : "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
      // 현재 세션 확인
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        // 세션이 있는 경우 일반적인 방법 사용
        const { error } = await supabase.auth.updateUser({
          password: data.password
        });
        
        if (error) throw error;
      } else {
        // 세션이 없는 경우 URL에서 토큰 추출하여 임시 세션 생성
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          console.log("🔑 토큰을 사용하여 비밀번호 업데이트 시도");
          
          // access_token으로 사용자 정보 확인 후 비밀번호 변경
          const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
          
          if (userError || !userData.user) {
            throw new Error("토큰이 유효하지 않습니다.");
          }
          
          // 유효한 토큰이므로 비밀번호 업데이트 진행
          const { error } = await supabase.auth.updateUser({
            password: data.password
          });
          
          if (error) throw error;
        } else {
          throw new Error("인증 토큰이 없습니다. 다시 시도해 주세요.");
        }
      }
      
      setIsSuccess(true);
      
      toast({
        title: t.successMessage,
        description: t.successDescription,
      });
    } catch (error: any) {
      console.error("비밀번호 업데이트 오류:", error);
      
      toast({
        title: language === "ko" ? "오류가 발생했습니다" : 
               language === "en" ? "An error occurred" : 
               language === "zh" ? "发生错误" : "เกิดข้อผิดพลาด",
        description: error.message || (
          language === "ko" ? "비밀번호 업데이트에 실패했습니다. 다시 시도해 주세요." : 
          language === "en" ? "Failed to update password. Please try again." : 
          language === "zh" ? "更新密码失败。请再试一次。" : "อัปเดตรหัสผ่านไม่สำเร็จ โปรดลองอีกครั้ง"
        ),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setIsValidating(true);
    setValidationError(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                {isValidating ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : validationError ? (
                  <AlertCircle className="h-8 w-8 text-white" />
                ) : (
                  <Lock className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              {isValidating ? t.validating : validationError ? t.invalidLink : t.title}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {isValidating ? t.validatingDesc : validationError ? validationError : t.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isValidating ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : validationError ? (
              <div className="space-y-4 text-center">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-sm text-amber-800">
                    {language === "ko" ? 
                      "올바른 비밀번호 재설정 과정:" :
                      language === "en" ? 
                      "Correct password reset process:" :
                      language === "zh" ? 
                      "正确的密码重置流程：" :
                      "ขั้นตอนการรีเซ็ตรหัสผ่านที่ถูกต้อง:"
                    }
                  </p>
                  <ol className="text-xs text-amber-700 mt-2 text-left space-y-1">
                    <li>1. {language === "ko" ? "비밀번호 찾기 페이지에서 이메일 입력" : 
                           language === "en" ? "Enter email on forgot password page" :
                           language === "zh" ? "在忘记密码页面输入邮箱" :
                           "ป้อนอีเมลในหน้าลืมรหัสผ่าน"}</li>
                    <li>2. {language === "ko" ? "이메일에서 재설정 링크 클릭" : 
                           language === "en" ? "Click reset link in email" :
                           language === "zh" ? "点击邮件中的重置链接" :
                           "คลิกลิงก์รีเซ็ตในอีเมล"}</li>
                    <li>3. {language === "ko" ? "새 비밀번호 입력" : 
                           language === "en" ? "Enter new password" :
                           language === "zh" ? "输入新密码" :
                           "ป้อนรหัสผ่านใหม่"}</li>
                  </ol>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-sm text-red-800 font-medium">
                    {language === "ko" ? 
                      "문제 진단 도구" :
                      language === "en" ? 
                      "Problem Diagnosis Tool" :
                      language === "zh" ? 
                      "问题诊断工具" :
                      "เครื่องมือวินิจฉัยปัญหา"
                    }
                  </p>
                  <p className="text-xs text-red-700 mt-2">
                    {language === "ko" ? 
                      "개발자 도구(F12) → Console 탭을 열어서 URL 파라미터 정보를 확인하세요. 이메일 링크에 'access_token'과 'type=recovery'가 있어야 합니다." :
                      language === "en" ? 
                      "Open Developer Tools (F12) → Console tab to check URL parameter info. Email link should contain 'access_token' and 'type=recovery'." :
                      language === "zh" ? 
                      "打开开发者工具(F12) → Console选项卡查看URL参数信息。邮件链接应包含'access_token'和'type=recovery'。" :
                      "เปิด Developer Tools (F12) → แท็บ Console เพื่อตรวจสอบข้อมูล URL parameter ลิงก์อีเมลควรมี 'access_token' และ 'type=recovery'"
                    }
                  </p>
                </div>
                <div className="space-y-2">
                  <Link to="/forgot-password">
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      {t.requestNew}
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleRetry}
                    variant="outline"
                    className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    {t.tryAgain}
                  </Button>
                </div>
              </div>
            ) : !isSuccess ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          {t.newPassword}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••" 
                              {...field} 
                              autoComplete="new-password"
                              disabled={isLoading}
                              className="pr-10 border-slate-200 focus-visible:ring-purple-500/50"
                            />
                            <button 
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              onClick={() => setShowPassword(!showPassword)}
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          {t.confirmPassword}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••" 
                              {...field} 
                              autoComplete="new-password"
                              disabled={isLoading}
                              className="pr-10 border-slate-200 focus-visible:ring-purple-500/50"
                            />
                            <button 
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              tabIndex={-1}
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" 
                    disabled={isLoading}
                  >
                    {isLoading ? t.updating : t.updatePassword}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {t.successMessage}
                  </h3>
                  <p className="text-slate-600">
                    {t.successDescription}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/login")}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {t.loginNow}
                </Button>
              </div>
            )}
          </CardContent>
          
          {!isSuccess && !isValidating && !validationError && (
            <div className="px-6 pb-6">
              <Link 
                to="/login" 
                className="text-sm text-purple-600 hover:text-purple-500 hover:underline flex items-center gap-1 justify-center transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> {t.backToLogin}
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
