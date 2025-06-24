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
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { translations, language } = useLanguage();

  // URL에서 토큰 확인 및 인증 상태 리스너
  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      console.log("🔍 비밀번호 재설정 세션 확인 시작");
      console.log("현재 URL:", window.location.href);
      console.log("Search params:", searchParams.toString());
      console.log("Hash:", window.location.hash);
      
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
        
        if (accessToken && refreshToken && type === 'recovery') {
          console.log("🔑 유효한 토큰 발견, 세션 설정 시도");
          
          // 토큰으로 세션 설정
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            console.error("세션 설정 오류:", sessionError);
            throw new Error("비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.");
          }
          
          if (sessionData.session) {
            console.log("✅ 세션 설정 성공");
            // URL에서 토큰 제거 (보안상 좋음)
            if (mounted) {
              window.history.replaceState({}, document.title, "/reset-password");
            }
            return;
          } else {
            throw new Error("세션 생성에 실패했습니다.");
          }
        } else {
          console.log("❌ 필요한 토큰이 없음");
          console.log("- accessToken:", !!accessToken);
          console.log("- refreshToken:", !!refreshToken);
          console.log("- type:", type);
          throw new Error("비밀번호 재설정 링크가 유효하지 않습니다.");
        }
        
      } catch (error: any) {
        console.error("토큰 처리 오류:", error);
        
        if (mounted) {
          toast({
            title: "오류",
            description: error.message || "비밀번호 재설정 링크가 유효하지 않습니다.",
            variant: "destructive",
          });
          
          // 3초 후 로그인 페이지로 이동
          setTimeout(() => {
            if (mounted) {
              navigate("/login");
            }
          }, 3000);
        }
      }
    };

    // 인증 상태 변화 리스너
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 인증 상태 변화:", event, session ? "세션 있음" : "세션 없음");
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log("🔐 비밀번호 복구 이벤트 감지");
        // 비밀번호 재설정 모드 활성화
        return;
      }
      
      if (event === 'SIGNED_OUT') {
        console.log("🚪 로그아웃 감지");
        if (mounted) {
          navigate("/login");
        }
      }
    });

    checkSession();

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [searchParams, navigate, toast]);

  // Translation fallbacks
  const t = {
    title: language === "ko" ? "새 비밀번호 설정" : 
           language === "en" ? "Set New Password" : 
           language === "zh" ? "设置新密码" : "ตั้งรหัสผ่านใหม่",
    description: language === "ko" ? "새로운 비밀번호를 입력하여 계정을 보호하세요." : 
                 language === "en" ? "Enter a new password to secure your account." : 
                 language === "zh" ? "输入新密码以保护您的账户。" : "ป้อนรหัสผ่านใหม่เพื่อรักษาความปลอดภัยของบัญชีของคุณ",
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
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (error) throw error;
      
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
                <Lock className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              {t.title}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {t.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!isSuccess ? (
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
          
          {!isSuccess && (
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
