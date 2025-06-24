import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { useAppContext } from '@/context/AppContext';
import { User, Mail, Lock, Building, Award, UserPlus, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { language } = useLanguage();
  const { departments, positions, getTranslatedDepartmentName, getTranslatedPositionName } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [passwordStrength, setPasswordStrength] = useState(0);

  // 번역 헬퍼 함수
  const getText = (ko: string, en: string, zh: string, th: string) => {
    switch (language) {
      case "ko": return ko;
      case "en": return en;
      case "zh": return zh;
      case "th": return th;
      default: return ko;
    }
  };

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const registerSchema = z.object({
    name: z.string().min(2, 
      getText(
        "이름은 최소 2자 이상이어야 합니다",
        "Name must be at least 2 characters",
        "姓名至少需要2个字符",
        "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"
      )
    ),
    email: z.string().email(
      getText(
        "유효한 이메일 주소를 입력하세요",
        "Enter a valid email address",
        "请输入有效的电子邮件地址",
        "กรุณาใส่อีเมลที่ถูกต้อง"
      )
    ),
    password: z.string().min(6, 
      getText(
        "비밀번호는 최소 6자 이상이어야 합니다",
        "Password must be at least 6 characters",
        "密码至少需要6个字符",
        "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
      )
    ),
    confirmPassword: z.string(),
    department: z.string().optional(),
    position: z.string().optional(),
    terms: z.boolean().refine(val => val === true, {
      message: getText(
        "이용약관에 동의해야 합니다",
        "You must accept the terms",
        "您必须接受条款",
        "คุณต้องยอมรับข้อกำหนด"
      )
    }),
  }).refine(data => data.password === data.confirmPassword, {
    message: getText(
      "비밀번호가 일치하지 않습니다",
      "Passwords don't match",
      "密码不匹配",
      "รหัสผ่านไม่ตรงกัน"
    ),
    path: ["confirmPassword"],
  });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      department: '',
      position: '',
      terms: false,
    },
  });

  // 비밀번호 강도 계산
  const calculateStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    setPasswordStrength(strength);
  };

  // Cyborg Register Animation Component
  const CyborgRegisterAnimation = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated circuits */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-cyan-400/20 rounded-full animate-spin-slow"></div>
      <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border border-purple-400/20 rounded-full animate-spin-very-slow"></div>
      
      {/* Floating particles */}
      <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-cyan-400/40 rounded-full animate-pulse-slow"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400/40 rounded-full animate-float"></div>
      <div className="absolute bottom-1/2 left-1/2 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-pulse-slow"></div>
      
      {/* Mouse follower */}
      <div 
        className="absolute w-24 h-24 bg-gradient-to-r from-purple-400/10 to-cyan-400/10 rounded-full blur-xl pointer-events-none transition-all duration-300"
        style={{
          left: mousePosition.x / 15,
          top: mousePosition.y / 15,
        }}
      ></div>
    </div>
  );

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    
    try {
      console.log("Attempting to register with:", data.email);
      
      // 마지막 요청 시간 체크 (Rate Limit 방지)
      const lastRequest = localStorage.getItem('lastSignupRequest');
      const now = Date.now();
      
      if (lastRequest && (now - parseInt(lastRequest)) < 60000) {
        throw new Error(
          getText(
            "⏰ 잠시만 기다려주세요. 1분 후 다시 시도해주세요.",
            "⏰ Please wait. Try again after 1 minute.",
            "⏰ 请稍等。1分钟后再试。",
            "⏰ กรุณารอสักครู่ ลองใหม่หลังจาก 1 นาที"
          )
        );
      }
      
      // Register with Supabase (이메일 인증 포함)
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            department: data.department,
            position: data.position
          },
          emailRedirectTo: `${window.location.origin}/email-verification`
        }
      });
      
      // 요청 시간 저장
      localStorage.setItem('lastSignupRequest', now.toString());
      
      if (error) throw error;
      
      // Show success message
      toast({
        title: getText(
          "회원가입 성공",
          "Registration successful",
          "注册成功",
          "ลงทะเบียนสำเร็จ"
        ),
        description: getText(
          "이메일에서 인증 링크를 클릭한 후 이메일 인증을 완료해주세요.",
          "Please click the verification link in your email to complete email verification.",
          "请点击邮件中的验证链接以完成邮箱验证。",
          "กรุณาคลิกลิงก์ยืนยันในอีเมลของคุณเพื่อดำเนินการยืนยันอีเมลให้เสร็จสมบูรณ์"
        ),
      });
      
      // Redirect to login page
      navigate('/login');
    } catch (error: any) {
      console.error("회원가입 실패:", error);
      
      const errorMessage = error.message || getText(
        "회원가입에 실패했습니다. 다시 시도해주세요.",
        "Registration failed. Please try again.",
        "注册失败。请再试一次。",
        "การลงทะเบียนล้มเหลว โปรดลองอีกครั้ง"
      );
      
      let finalErrorMessage = errorMessage;
      
      // Handle specific error cases
      if (error.message && error.message.includes("User already registered")) {
        finalErrorMessage = getText(
          "이미 등록된 이메일 주소입니다.",
          "Email address is already registered.",
          "电子邮件地址已注册。",
          "อีเมลนี้ได้ลงทะเบียนไว้แล้ว"
        );
      } else if (error.message && (error.message.includes("rate limit") || error.message.includes("Too Many Requests"))) {
        finalErrorMessage = getText(
          "🚨 너무 많은 요청이 발생했습니다. 잠시 후 다시 시도하거나 다른 이메일을 사용해주세요.",
          "🚨 Too many requests. Please try again later or use a different email.",
          "🚨 请求过多。请稍后再试或使用其他电子邮件。",
          "🚨 คำขอมากเกินไป กรุณาลองใหม่ในภายหลังหรือใช้อีเมลอื่น"
        );
      }
      
      toast({
        title: getText(
          "회원가입 실패",
          "Registration failed",
          "注册失败",
          "การลงทะเบียนล้มเหลว"
        ),
        description: finalErrorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 강도 텍스트
  const getStrengthText = (strength: number) => {
    if (strength <= 20) return getText("매우 약함", "Very Weak", "非常弱", "อ่อนแอมาก");
    if (strength <= 40) return getText("약함", "Weak", "弱", "อ่อนแอ");
    if (strength <= 60) return getText("보통", "Medium", "中等", "ปานกลาง");
    if (strength <= 80) return getText("강함", "Strong", "强", "แข็งแกร่ง");
    return getText("매우 강함", "Very Strong", "非常强", "แข็งแกร่งมาก");
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 20) return "bg-red-500";
    if (strength <= 40) return "bg-orange-500";
    if (strength <= 60) return "bg-yellow-500";
    if (strength <= 80) return "bg-blue-500";
    return "bg-green-500";
  };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Background Animation */}
        <CyborgRegisterAnimation />
        
        {/* Main Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-3xl blur-xl"></div>
              
              {/* Main Card */}
              <Card className="relative border-0 bg-white/10 backdrop-blur-md shadow-2xl rounded-3xl border border-white/20">
                <div className="p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500">
                        <UserPlus className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                        {getText("회원가입", "Sign Up", "注册", "ลงทะเบียน")}
                      </span>
                    </h1>
                    <p className="text-gray-300">
                      {getText(
                        "AI 기반 기업 관리 플랫폼에 가입하세요",
                        "Join our AI-powered enterprise platform",
                        "加入我们的AI驱动企业平台",
                        "เข้าร่วมแพลตฟอร์มองค์กรที่ขับเคลื่อนด้วย AI ของเรา"
                      )}
                    </p>
                  </div>

                  {/* Register Form */}
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Name Field */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{getText("이름", "Name", "姓名", "ชื่อ")}</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                                placeholder={getText(
                                  "이름을 입력하세요",
                                  "Enter your name",
                                  "请输入您的姓名",
                                  "กรุณาใส่ชื่อของคุณ"
                                )}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      {/* Email Field */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white flex items-center space-x-2">
                              <Mail className="w-4 h-4" />
                              <span>{getText("이메일", "Email", "电子邮件", "อีเมล")}</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email"
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                                placeholder={getText(
                                  "이메일을 입력하세요",
                                  "Enter your email",
                                  "请输入您的电子邮件",
                                  "กรุณาใส่อีเมลของคุณ"
                                )}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      {/* Password Field */}
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white flex items-center space-x-2">
                              <Lock className="w-4 h-4" />
                              <span>{getText("비밀번호", "Password", "密码", "รหัสผ่าน")}</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type={showPassword ? "text" : "password"}
                                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 pr-10"
                                  placeholder={getText(
                                    "비밀번호를 입력하세요",
                                    "Enter your password",
                                    "请输入您的密码",
                                    "กรุณาใส่รหัสผ่านของคุณ"
                                  )}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateStrength(e.target.value);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            {/* Password Strength Indicator */}
                            {field.value && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-300">{getText("비밀번호 강도", "Password Strength", "密码强度", "ความแข็งแกร่งของรหัสผ่าน")}</span>
                                  <span className="text-gray-300">{getStrengthText(passwordStrength)}</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                                    style={{ width: `${passwordStrength}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      {/* Confirm Password Field */}
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white flex items-center space-x-2">
                              <Lock className="w-4 h-4" />
                              <span>{getText("비밀번호 확인", "Confirm Password", "确认密码", "ยืนยันรหัสผ่าน")}</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type={showConfirmPassword ? "text" : "password"}
                                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 pr-10"
                                  placeholder={getText(
                                    "비밀번호를 다시 입력하세요",
                                    "Confirm your password",
                                    "请再次输入密码",
                                    "กรุณายืนยันรหัสผ่านของคุณ"
                                  )}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      {/* Department and Position Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white flex items-center space-x-2">
                                <Building className="w-4 h-4" />
                                <span>{getText("부서", "Department", "部门", "แผนก")}</span>
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-cyan-400">
                                    <SelectValue placeholder={getText(
                                      "부서 선택",
                                      "Select department",
                                      "选择部门",
                                      "เลือกแผนก"
                                    )} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-800 border-white/20">
                                  {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.name} className="text-white hover:bg-white/10">
                                      {getTranslatedDepartmentName(dept, language)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white flex items-center space-x-2">
                                <Award className="w-4 h-4" />
                                <span>{getText("직책", "Position", "职位", "ตำแหน่ง")}</span>
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-cyan-400">
                                    <SelectValue placeholder={getText(
                                      "직책 선택",
                                      "Select position",
                                      "选择职位",
                                      "เลือกตำแหน่ง"
                                    )} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-800 border-white/20">
                                  {positions.map((pos) => (
                                    <SelectItem key={pos.id} value={pos.name} className="text-white hover:bg-white/10">
                                      {getTranslatedPositionName(pos, language)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Terms Checkbox */}
                      <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-white text-sm">
                                {getText(
                                  "이용약관 및 개인정보처리방침에 동의합니다",
                                  "I agree to the Terms of Service and Privacy Policy",
                                  "我同意服务条款和隐私政策",
                                  "ฉันยอมรับข้อกำหนดการให้บริการและนโยบายความเป็นส่วนตัว"
                                )}
                              </FormLabel>
                              <FormMessage className="text-red-400" />
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Submit Button */}
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500 hover:from-purple-600 hover:via-cyan-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>{getText("가입 중...", "Signing up...", "注册中...", "กำลังลงทะเบียน...")}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>{getText("회원가입", "Sign Up", "注册", "ลงทะเบียน")}</span>
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>

                  {/* Footer */}
                  <div className="mt-8 text-center">
                    <div className="flex items-center justify-center space-x-2 text-gray-300">
                      <span>{getText(
                        "이미 계정이 있으신가요?",
                        "Already have an account?",
                        "已有账户？",
                        "มีบัญชีอยู่แล้ว？"
                      )}</span>
                      <Link 
                        to="/login" 
                        className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                      >
                        {getText("로그인", "Sign In", "登录", "เข้าสู่ระบบ")}
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* 커스텀 CSS 애니메이션 */}
        <style>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes spin-very-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }
          .animate-spin-very-slow {
            animation: spin-very-slow 20s linear infinite;
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s ease-in-out infinite;
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
}
