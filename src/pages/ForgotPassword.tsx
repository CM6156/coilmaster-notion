import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { ArrowLeft, Mail, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(null);
  const { toast } = useToast();
  const { translations, language } = useLanguage();
  
  // 쿨다운 타이머 효과
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldownTime]);
  
  // Translation fallbacks for password reset
  const t = {
    title: translations.forgotPassword?.title || 
      (language === "ko" ? "비밀번호 재설정" : 
       language === "en" ? "Reset Password" : 
       language === "zh" ? "重置密码" : "รีเซ็ตรหัสผ่าน"),
    description: translations.forgotPassword?.description || 
      (language === "ko" ? "가입 시 사용한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다." : 
       language === "en" ? "Enter your email and we'll send you a password reset link." : 
       language === "zh" ? "输入您的电子邮件，我们将向您发送密码重置链接。" : "ป้อนอีเมลของคุณและเราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ"),
    email: translations.login?.email || 
      (language === "ko" ? "이메일" : 
       language === "en" ? "Email" : 
       language === "zh" ? "电子邮件" : "อีเมล"),
    sendLink: translations.forgotPassword?.sendLink || 
      (language === "ko" ? "재설정 링크 보내기" : 
       language === "en" ? "Send Reset Link" : 
       language === "zh" ? "发送重置链接" : "ส่งลิงก์รีเซ็ต"),
    processing: translations.forgotPassword?.processing || 
      (language === "ko" ? "처리 중..." : 
       language === "en" ? "Processing..." : 
       language === "zh" ? "处理中..." : "กำลังประมวลผล..."),
    backToLogin: translations.forgotPassword?.backToLogin || 
      (language === "ko" ? "로그인으로 돌아가기" : 
       language === "en" ? "Back to Login" : 
       language === "zh" ? "返回登录" : "กลับไปที่หน้าเข้าสู่ระบบ"),
    successMessage: translations.forgotPassword?.successMessage || 
      (language === "ko" ? "재설정 링크가 이메일로 전송되었습니다" : 
       language === "en" ? "Reset link has been sent to your email" : 
       language === "zh" ? "重置链接已发送到您的电子邮件" : "ลิงก์รีเซ็ตถูกส่งไปยังอีเมลของคุณแล้ว"),
    successDescription: translations.forgotPassword?.successDescription || 
      (language === "ko" ? "이메일을 확인하시고 링크를 클릭하여 비밀번호를 재설정하세요." : 
       language === "en" ? "Check your email and click the link to reset your password." : 
       language === "zh" ? "检查您的电子邮件并点击链接重置密码。" : "ตรวจสอบอีเมลของคุณและคลิกลิงก์เพื่อรีเซ็ตรหัสผ่านของคุณ"),
    errorMessage: translations.forgotPassword?.errorMessage || 
      (language === "ko" ? "오류가 발생했습니다" : 
       language === "en" ? "An error occurred" : 
       language === "zh" ? "发生错误" : "เกิดข้อผิดพลาด"),
    rateLimitMessage: language === "ko" ? "요청이 너무 빈번합니다" : 
                      language === "en" ? "Too many requests" : 
                      language === "zh" ? "请求过于频繁" : "คำขอมากเกินไป",
    waitMessage: language === "ko" ? "초 후에 다시 시도할 수 있습니다" : 
                 language === "en" ? "seconds before you can try again" : 
                 language === "zh" ? "秒后可以重试" : "วินาทีก่อนที่คุณจะลองอีกครั้ง",
    resendIn: language === "ko" ? "다시 보내기 (" : 
              language === "en" ? "Resend in (" : 
              language === "zh" ? "重新发送 (" : "ส่งอีกครั้งใน (",
  };
  
  const formSchema = z.object({
    email: z.string().email(
      language === "ko" ? "유효한 이메일 주소를 입력하세요" : 
      language === "en" ? "Enter a valid email address" : 
      language === "zh" ? "请输入有效的电子邮件地址" : "กรุณาใส่อีเมลที่ถูกต้อง"
    ),
  });

  type FormValues = z.infer<typeof formSchema>;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    // 쿨다운 체크
    if (cooldownTime > 0) {
      toast({
        title: t.rateLimitMessage,
        description: `${cooldownTime}${t.waitMessage}`,
        variant: "destructive",
      });
      return;
    }

    // 마지막 요청으로부터 10초가 지나지 않았다면 차단
    const now = Date.now();
    if (lastRequestTime && (now - lastRequestTime) < 10000) {
      const remainingTime = Math.ceil((10000 - (now - lastRequestTime)) / 1000);
      setCooldownTime(remainingTime);
      toast({
        title: t.rateLimitMessage,
        description: `${remainingTime}${t.waitMessage}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLastRequestTime(now);
    
    try {
      // 현재 환경에 맞는 리다이렉트 URL 설정
      const baseUrl = window.location.origin;
      const redirectTo = `${baseUrl}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectTo,
      });
      
      if (error) {
        // 429 오류 특별 처리
        if (error.message.includes('10 seconds') || error.message.includes('429')) {
          setCooldownTime(10);
          throw new Error(language === "ko" ? "보안을 위해 10초 후에 다시 시도해주세요." : 
                         language === "en" ? "For security, please try again after 10 seconds." : 
                         language === "zh" ? "为了安全，请在10秒后重试。" : "เพื่อความปลอดภัย โปรดลองอีกครั้งหลังจาก 10 วินาที");
        }
        throw error;
      }
      
      setIsSubmitted(true);
      
      toast({
        title: t.successMessage,
        description: t.successDescription,
      });
    } catch (error: any) {
      console.error("비밀번호 재설정 오류:", error);
      
      let errorDescription = language === "ko" ? "비밀번호 재설정 링크를 보내는 중 오류가 발생했습니다. 다시 시도해 주세요." : 
                            language === "en" ? "Error sending password reset link. Please try again." : 
                            language === "zh" ? "发送密码重置链接时出错。请再试一次。" : "เกิดข้อผิดพลาดในการส่งลิงก์รีเซ็ตรหัสผ่าน โปรดลองอีกครั้ง";
      
      // 사용자 정의 오류 메시지가 있다면 사용
      if (error.message && typeof error.message === 'string') {
        errorDescription = error.message;
      }
      
      toast({
        title: t.errorMessage,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return t.processing;
    if (cooldownTime > 0) return `${t.resendIn}${cooldownTime}s)`;
    return t.sendLink;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <div className="w-full max-w-md">
        <Card className="border-none shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-2">
            <div className="w-full flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                {cooldownTime > 0 ? (
                  <Clock className="h-6 w-6 text-orange-500" />
                ) : (
                  <Mail className="h-6 w-6 text-primary" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-bold">{t.title}</CardTitle>
            <CardDescription className="text-center">
              {isSubmitted ? t.successDescription : t.description}
              {cooldownTime > 0 && (
                <div className="mt-2 text-orange-600 text-sm">
                  {cooldownTime}초 후에 다시 시도할 수 있습니다
                </div>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!isSubmitted ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.email}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="email@company.com" 
                            {...field} 
                            autoComplete="email"
                            disabled={isLoading || cooldownTime > 0}
                            className="border-slate-200 focus-visible:ring-primary/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
                    disabled={isLoading || cooldownTime > 0}
                  >
                    {getButtonText()}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="py-4 text-center text-sm text-slate-600 space-y-6">
                <p>{t.successMessage}</p>
                <Button 
                  variant="outline" 
                  className="w-full border border-gray-300"
                  onClick={() => {
                    setIsSubmitted(false);
                    form.reset();
                  }}
                  disabled={cooldownTime > 0}
                >
                  {cooldownTime > 0 ? `${t.resendIn}${cooldownTime}s)` : t.sendLink}
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Link 
              to="/login" 
              className="text-sm text-primary hover:underline flex items-center gap-1 w-full justify-center"
            >
              <ArrowLeft className="h-4 w-4" /> {t.backToLogin}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
