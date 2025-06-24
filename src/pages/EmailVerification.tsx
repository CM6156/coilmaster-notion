import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { ArrowLeft, Mail, CheckCircle, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function EmailVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();

  // Translation function
  const getText = (ko: string, en: string, zh: string, th: string) => {
    switch (language) {
      case "ko": return ko;
      case "en": return en;
      case "zh": return zh;
      case "th": return th;
      default: return en;
    }
  };

  // URL에서 토큰 확인 및 인증 상태 리스너
  useEffect(() => {
    let mounted = true;
    let validationTimeout: NodeJS.Timeout;
    let verificationDetected = false;

    const finalizeValidation = (isValid: boolean, errorMessage?: string) => {
      if (!mounted) return;
      
      setIsValidating(false);
      
      if (!isValid && errorMessage) {
        setValidationError(errorMessage);
      }
    };

    const checkEmailVerificationToken = async () => {
      console.log("🔍 이메일 인증 토큰 확인 시작");
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
        
        // URL에서 토큰 추출 (Query Parameters 방식)
        let accessToken = searchParams.get('access_token');
        let refreshToken = searchParams.get('refresh_token');
        let type = searchParams.get('type');
        let tokenHash = searchParams.get('token_hash');
        
        // URL Hash에서 토큰 추출 (Supabase 기본 방식)
        if (!accessToken && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
          type = hashParams.get('type');
          tokenHash = hashParams.get('token_hash');
          
          console.log("Hash에서 추출한 토큰들:");
          console.log("- access_token:", accessToken ? "있음" : "없음");
          console.log("- refresh_token:", refreshToken ? "있음" : "없음");
          console.log("- type:", type);
          console.log("- token_hash:", tokenHash ? "있음" : "없음");
        }
        
        if (type === 'email_change' || type === 'signup') {
          console.log("🔑 이메일 인증 토큰 발견");
          
          if (accessToken && refreshToken) {
            // 토큰으로 세션 설정
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (sessionError) {
              console.error("세션 설정 오류:", sessionError);
              throw new Error("이메일 인증 링크가 만료되었거나 유효하지 않습니다.");
            }
            
            if (sessionData.session) {
              console.log("✅ 세션 설정 성공");
              setUserEmail(sessionData.session.user.email || "");
              
              // URL에서 토큰 제거 (보안상 좋음)
              if (mounted) {
                window.history.replaceState({}, document.title, "/email-verification");
              }
              
              finalizeValidation(true);
              return;
            }
          }
        } else if (sessionData.session) {
          // 이미 로그인된 상태라면 사용자 이메일 설정
          console.log("✅ 기존 세션 발견");
          setUserEmail(sessionData.session.user.email || "");
          finalizeValidation(true);
          return;
        } else {
          console.log("❌ 이메일 인증 토큰이 없음 - 인증 이벤트를 기다립니다");
          
          // 토큰이 없어도 즉시 실패하지 않고 이메일 인증 이벤트를 기다림
          if (!verificationDetected) {
            validationTimeout = setTimeout(() => {
              if (mounted && !verificationDetected) {
                finalizeValidation(false, "이메일 인증 링크가 유효하지 않습니다.");
              }
            }, 5000);
          }
        }
        
      } catch (error: any) {
        console.error("토큰 처리 오류:", error);
        finalizeValidation(false, error.message || "이메일 인증 링크가 유효하지 않습니다.");
      }
    };

    // 인증 상태 변화 리스너
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 인증 상태 변화:", event, session ? "세션 있음" : "세션 없음");
      
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        console.log("🔐 이메일 인증 이벤트 감지");
        verificationDetected = true;
        
        // 기존 타이머 취소
        if (validationTimeout) {
          clearTimeout(validationTimeout);
        }
        
        if (session) {
          setUserEmail(session.user.email || "");
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

    // 초기 토큰 확인 시작
    checkEmailVerificationToken();

    return () => {
      mounted = false;
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
      authListener?.subscription?.unsubscribe();
    };
  }, [searchParams, navigate, isValidating]);

  // Translation object
  const t = {
    title: getText(
      "이메일 인증",
      "Email Verification",
      "邮箱验证",
      "การยืนยันอีเมล"
    ),
    description: getText(
      "아래 버튼을 클릭하여 이메일 주소를 인증해주세요.",
      "Click the button below to verify your email address.",
      "点击下面的按钮验证您的电子邮件地址。",
      "คลิกปุ่มด้านล่างเพื่อยืนยันที่อยู่อีเมลของคุณ"
    ),
    validating: getText(
      "링크 검증 중...",
      "Validating link...",
      "正在验证链接...",
      "กำลังตรวจสอบลิงก์..."
    ),
    validatingDesc: getText(
      "이메일 인증 링크를 확인하고 있습니다.",
      "Verifying your email verification link.",
      "正在验证您的邮箱验证链接。",
      "กำลังตรวจสอบลิงก์ยืนยันอีเมลของคุณ"
    ),
    invalidLink: getText(
      "유효하지 않은 링크",
      "Invalid Link",
      "无效链接",
      "ลิงก์ไม่ถูกต้อง"
    ),
    verifyEmail: getText(
      "이메일 인증하기",
      "Verify Email",
      "验证邮箱",
      "ยืนยันอีเมล"
    ),
    verifying: getText(
      "인증 중...",
      "Verifying...",
      "验证中...",
      "กำลังยืนยัน..."
    ),
    successMessage: getText(
      "이메일 인증 완료!",
      "Email Verified Successfully!",
      "邮箱验证成功！",
      "ยืนยันอีเมลสำเร็จ!"
    ),
    successDescription: getText(
      "이메일 주소가 성공적으로 인증되었습니다. 이제 모든 기능을 사용할 수 있습니다.",
      "Your email address has been successfully verified. You can now access all features.",
      "您的电子邮件地址已成功验证。现在您可以访问所有功能。",
      "ที่อยู่อีเมลของคุณได้รับการยืนยันเรียบร้อยแล้ว ตอนนี้คุณสามารถเข้าถึงคุณสมบัติทั้งหมดได้แล้ว"
    ),
    goToDashboard: getText(
      "대시보드로 이동",
      "Go to Dashboard",
      "前往仪表板",
      "ไปที่แดชบอร์ด"
    ),
    backToLogin: getText(
      "로그인으로 돌아가기",
      "Back to Login",
      "返回登录",
      "กลับไปที่หน้าเข้าสู่ระบบ"
    ),
    tryAgain: getText(
      "다시 시도",
      "Try Again",
      "重试",
      "ลองอีกครั้ง"
    ),
    requestNew: getText(
      "새 인증 링크 요청",
      "Request New Link",
      "请求新链接",
      "ขอลิงก์ใหม่"
    ),
    emailAddress: getText(
      "이메일 주소",
      "Email Address",
      "邮箱地址",
      "ที่อยู่อีเมล"
    )
  };

  const handleVerifyEmail = async () => {
    setIsLoading(true);
    
    try {
      console.log("🔍 이메일 인증 시작");
      
      // 현재 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
      }
      
      console.log("📧 사용자 이메일:", user.email);
      console.log("✅ 이메일 인증 상태:", user.email_confirmed_at ? "인증됨" : "미인증");
      
      // 1단계: Supabase Auth에서 이메일 인증 상태 확인
      const isEmailConfirmed = !!user.email_confirmed_at;
      
      // 2단계: users 테이블에서 현재 사용자 확인
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, email, email_verified')
        .eq('email', user.email)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = 데이터 없음
        console.error("사용자 정보 조회 오류:", fetchError);
        throw new Error("사용자 정보를 조회할 수 없습니다.");
      }
      
      // 3단계: users 테이블에 사용자가 없다면 생성
      if (!existingUser) {
        console.log("📝 새 사용자 생성 중...");
        
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email_verified: isEmailConfirmed,
            role: 'user',
            is_active: true,
            login_method: 'email',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error("사용자 생성 오류:", insertError);
          throw new Error("사용자 정보 생성에 실패했습니다.");
        }
        
        console.log("✅ 새 사용자 생성 완료");
      } else {
        console.log("👤 기존 사용자 발견:", existingUser.email);
        
        // 4단계: 이메일 인증 상태가 다르다면 업데이트
        if (isEmailConfirmed && !existingUser.email_verified) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              email_verified: true,
              updated_at: new Date().toISOString()
            })
            .eq('email', user.email);
          
          if (updateError) {
            console.error("Users 테이블 업데이트 오류:", updateError);
            throw new Error("이메일 인증 처리 중 오류가 발생했습니다.");
          }
          
          console.log("✅ Users 테이블 email_verified 업데이트 완료");
        } else if (existingUser.email_verified) {
          console.log("✅ 이메일이 이미 인증되어 있습니다");
        }
      }
      
      // 5단계: 성공 처리
      setIsVerified(true);
      
      toast({
        title: t.successMessage,
        description: t.successDescription,
      });
      
      console.log("🎉 이메일 인증 프로세스 완료!");
      
    } catch (error: any) {
      console.error("이메일 인증 오류:", error);
      
      toast({
        title: getText(
          "인증 오류",
          "Verification Error",
          "验证错误",
          "ข้อผิดพลาดในการยืนยัน"
        ),
        description: error.message || getText(
          "이메일 인증에 실패했습니다. 다시 시도해 주세요.",
          "Email verification failed. Please try again.",
          "邮箱验证失败。请再试一次。",
          "การยืนยันอีเมลล้มเหลว โปรดลองอีกครั้ง"
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
                ) : isVerified ? (
                  <CheckCircle className="h-8 w-8 text-white" />
                ) : (
                  <Mail className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              {isValidating ? t.validating : 
               validationError ? t.invalidLink : 
               isVerified ? t.successMessage : t.title}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {isValidating ? t.validatingDesc : 
               validationError ? validationError : 
               isVerified ? t.successDescription : t.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isValidating ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : validationError ? (
              <div className="space-y-4 text-center">
                <div className="space-y-2">
                  <Button 
                    onClick={handleRetry}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    {t.tryAgain}
                  </Button>
                  <Link to="/register">
                    <Button 
                      variant="outline"
                      className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      {t.requestNew}
                    </Button>
                  </Link>
                </div>
              </div>
            ) : isVerified ? (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <ShieldCheck className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  {userEmail && (
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                      <p className="font-medium">{t.emailAddress}:</p>
                      <p className="text-purple-600">{userEmail}</p>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => navigate("/projects")}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {t.goToDashboard}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {userEmail && (
                  <div className="text-center">
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                      <p className="font-medium">{t.emailAddress}:</p>
                      <p className="text-purple-600">{userEmail}</p>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleVerifyEmail}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.verifying}
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      {t.verifyEmail}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
          
          {!isVerified && !isValidating && !validationError && (
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