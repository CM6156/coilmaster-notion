
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { useAppContext } from "@/context/AppContext";
import LanguageSelector from "@/components/LanguageSelector";
import { UserPlus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { translations, language } = useLanguage();
  const { departments, positions } = useAppContext();
  const t = translations.register;

  const registerSchema = z.object({
    name: z.string().min(2, 
      language === "ko" ? "이름은 최소 2자 이상이어야 합니다" : 
      language === "en" ? "Name must be at least 2 characters" : 
      language === "zh" ? "姓名至少需要2个字符" : "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"
    ),
    email: z.string().email(
      language === "ko" ? "유효한 이메일 주소를 입력하세요" : 
      language === "en" ? "Enter a valid email address" : 
      language === "zh" ? "请输入有效的电子邮件地址" : "กรุณาใส่อีเมลที่ถูกต้อง"
    ),
    password: z.string().min(6, 
      language === "ko" ? "비밀번호는 최소 6자 이상이어야 합니다" : 
      language === "en" ? "Password must be at least 6 characters" : 
      language === "zh" ? "密码至少需要6个字符" : "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
    ),
    confirmPassword: z.string(),
    department: z.string().optional(),
    position: z.string().optional(),
    terms: z.boolean().refine(val => val === true, {
      message: language === "ko" ? "이용약관에 동의해야 합니다" : 
              language === "en" ? "You must accept the terms" : 
              language === "zh" ? "您必须接受条款" : "คุณต้องยอมรับข้อกำหนด"
    }),
  }).refine(data => data.password === data.confirmPassword, {
    message: language === "ko" ? "비밀번호가 일치하지 않습니다" : 
            language === "en" ? "Passwords don't match" : 
            language === "zh" ? "密码不匹配" : "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  // Calculate password strength
  const calculateStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    if (password.length >= 12) strength += 1;
    
    setPasswordStrength(strength);
  };

  // 부서 및 직책 옵션은 AppContext에서 가져옴

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      department: undefined,
      position: "",
      terms: false,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    
    try {
      console.log("Attempting to register with:", data.email);
      
      // Register with Supabase
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            department: data.department,
            position: data.position
          },
          emailRedirectTo: window.location.origin + '/login'
        }
      });
      
      if (error) throw error;
      
      // Show success message
      toast({
        title: language === "ko" ? "회원가입 성공" : 
               language === "en" ? "Registration successful" : 
               language === "zh" ? "注册成功" : "ลงทะเบียนสำเร็จ",
        description: language === "ko" ? "이메일 주소 확인 후 로그인할 수 있습니다." : 
                    language === "en" ? "Please check your email to complete registration." : 
                    language === "zh" ? "请检查您的电子邮件以完成注册。" : "กรุณาตรวจสอบอีเมลของคุณเพื่อดำเนินการลงทะเบียนให้เสร็จสมบูรณ์",
      });
      
      // Auto-sign in if email confirmation is not required
      if (authData && authData.user && !authData.user.identities?.[0].identity_data?.email_verified_at) {
        try {
          // Try to sign in immediately after registration if possible
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });
          
          if (signInError) {
            console.log("Auto login after registration failed, redirecting to login page");
            navigate('/login');
            return;
          }
          
          if (signInData && signInData.user) {
            // Login successful
            localStorage.setItem("isAuthenticated", "true");
            
            // Store user profile info
            const userProfile = {
              name: data.name,
              email: data.email,
              loginMethod: 'email',
              provider: 'email',
              department: data.department || null
            };
            
            localStorage.setItem("userProfile", JSON.stringify(userProfile));
            
            toast({
              title: language === "ko" ? "로그인 성공" : 
                     language === "en" ? "Login successful" : 
                     language === "zh" ? "登录成功" : "เข้าสู่ระบบสำเร็จ",
              description: language === "ko" ? "환영합니다! 대시보드로 이동합니다." : 
                           language === "en" ? "Welcome! Redirecting to dashboard." : 
                           language === "zh" ? "欢迎！正在重定向到仪表板。" : "ยินดีต้อนรับ! กำลังนำคุณไปยังแดชบอร์ด",
            });
            
            // Redirect to dashboard
            navigate('/');
            return;
          }
        } catch (autoLoginError) {
          console.error("Auto login after registration failed:", autoLoginError);
        }
      }
      
      // Redirect to login page
      navigate('/login');
    } catch (error: any) {
      console.error("회원가입 실패:", error);
      
      let errorMessage = error.message || (
        language === "ko" ? "회원가입에 실패했습니다. 다시 시도해주세요." : 
        language === "en" ? "Registration failed. Please try again." : 
        language === "zh" ? "注册失败。请再试一次。" : "การลงทะเบียนล้มเหลว โปรดลองอีกครั้ง"
      );
      
      // Handle specific error cases
      if (error.message && error.message.includes("User already registered")) {
        errorMessage = language === "ko" ? "이미 등록된 이메일 주소입니다." : 
                      language === "en" ? "Email address is already registered." : 
                      language === "zh" ? "电子邮件地址已注册。" : "อีเมลนี้ได้ลงทะเบียนไว้แล้ว";
      }
      
      toast({
        title: language === "ko" ? "회원가입 실패" : 
               language === "en" ? "Registration failed" : 
               language === "zh" ? "注册失败" : "การลงทะเบียนล้มเหลว",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">{t?.title}</CardTitle>
            <CardDescription className="text-center">
              {t?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t?.name}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t?.namePlaceholder} 
                          {...field} 
                          disabled={isLoading}
                          className="border-slate-200 focus-visible:ring-primary/50" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t?.email}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t?.emailPlaceholder || "email@company.com"}
                          {...field} 
                          disabled={isLoading}
                          className="border-slate-200 focus-visible:ring-primary/50"
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t?.department}</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-slate-200 focus-visible:ring-primary/50">
                              <SelectValue placeholder={t?.department} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map(department => (
                              <SelectItem key={department.id} value={department.id}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t?.position}</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                        <FormControl>
                            <SelectTrigger className="border-slate-200 focus-visible:ring-primary/50">
                              <SelectValue placeholder={t?.position} />
                            </SelectTrigger>
                        </FormControl>
                          <SelectContent>
                            {positions.map(position => (
                              <SelectItem key={position.id} value={position.id}>
                                {position.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t?.password}</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder={t?.passwordPlaceholder || "••••••••"}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            calculateStrength(e.target.value);
                          }}
                          disabled={isLoading}
                          autoComplete="new-password"
                          className="border-slate-200 focus-visible:ring-primary/50" 
                        />
                      </FormControl>
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">{t?.passwordStrength || "비밀번호 강도"}</div>
                        <div className="relative">
                          <Progress 
                            value={passwordStrength * 20} 
                            className={`h-2 ${
                              passwordStrength === 0 ? '' :
                              passwordStrength === 1 ? '[&>div]:bg-red-500' :
                              passwordStrength === 2 ? '[&>div]:bg-orange-500' :
                              passwordStrength === 3 ? '[&>div]:bg-yellow-500' :
                              passwordStrength === 4 ? '[&>div]:bg-green-500' :
                              '[&>div]:bg-green-600'
                            }`}
                          />
                        </div>
                        <div className="text-xs text-right mt-1">
                          {passwordStrength === 0 && ""}
                          {passwordStrength === 1 && <span className="text-red-500">{t?.veryWeak || "매우 약함"}</span>}
                          {passwordStrength === 2 && <span className="text-orange-500">{t?.weak || "약함"}</span>}
                          {passwordStrength === 3 && <span className="text-yellow-500">{t?.medium || "보통"}</span>}
                          {passwordStrength === 4 && <span className="text-green-500">{t?.strong || "강함"}</span>}
                          {passwordStrength === 5 && <span className="text-green-600">{t?.veryStrong || "매우 강함"}</span>}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t?.confirmPassword}</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder={t?.passwordPlaceholder || "••••••••"}
                          {...field} 
                          disabled={isLoading}
                          autoComplete="new-password"
                          className="border-slate-200 focus-visible:ring-primary/50" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          {t?.acceptTerms || "이용약관에 동의합니다"}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
                  disabled={isLoading}
                >
                  {isLoading ? t?.processing : t?.register}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-gray-600 w-full">
              {t?.alreadyHaveAccount || t?.haveAccount}{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                {t?.login}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
