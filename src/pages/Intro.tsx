import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { 
  LogIn, 
  UserPlus, 
  FileText, 
  Calendar, 
  Users, 
  Database,
  Zap,
  Shield,
  Cpu,
  Brain,
  Activity,
  Briefcase,
  BarChart3,
  Settings,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Globe,
  Building2,
  Target,
  TrendingUp,
  Layers,
  Bell
} from "lucide-react";

const Intro = () => {
  const { language, translations } = useLanguage();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 번역 텍스트 헬퍼 함수들
  const getText = (ko: string, en: string, zh: string, th: string) => {
    return language === "ko" ? ko 
         : language === "zh" ? zh
         : language === "th" ? th
         : en;
  };

  // 사이보그 애니메이션 컴포넌트
  const CyborgAnimation = () => (
    <div className="relative w-full h-full">
      {/* 메인 사이보그 원형 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-80 h-80">
          {/* 외부 링 애니메이션 */}
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-spin-slow">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* 중간 링 애니메이션 */}
          <div className="absolute inset-4 rounded-full border-2 border-purple-500/40 animate-spin-reverse">
            <div className="absolute top-4 right-4 w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
            <div className="absolute bottom-4 left-4 w-3 h-3 bg-pink-400 rounded-full animate-bounce"></div>
          </div>
          
          {/* 내부 코어 */}
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 animate-pulse-slow flex items-center justify-center">
            <div className="relative">
              <Brain className="w-16 h-16 text-white animate-pulse" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
          </div>
          
          {/* 데이터 스트림 */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-8 bg-gradient-to-t from-transparent to-blue-400 animate-pulse"
                style={{
                  left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                  top: `${50 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                  transform: `rotate(${i * 45}deg)`,
                  animationDelay: `${i * 0.2}s`
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 플로팅 아이콘들 */}
      <div className="absolute inset-0 overflow-hidden">
        {[
          { icon: Database, x: 10, y: 20, delay: 0 },
          { icon: Users, x: 85, y: 15, delay: 1 },
          { icon: FileText, x: 15, y: 80, delay: 2 },
          { icon: Calendar, x: 80, y: 75, delay: 3 },
          { icon: BarChart3, x: 5, y: 50, delay: 4 },
          { icon: Settings, x: 90, y: 45, delay: 5 }
        ].map(({ icon: Icon, x, y, delay }, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: `${delay}s`
            }}
          >
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        ))}
      </div>
      
      {/* 마우스 추적 효과 */}
      <div 
        className="absolute w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl pointer-events-none transition-all duration-300"
        style={{
          left: mousePosition.x - 64,
          top: mousePosition.y - 64,
        }}
      ></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* 배경 애니메이션 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-spin-very-slow"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Cpu className="h-8 w-8 text-cyan-400 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
            Coilmaster Notion
          </h1>
          <div className="px-2 py-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full text-xs font-medium border border-green-500/30">
            <Sparkles className="inline w-3 h-3 mr-1" />
            AI-Powered
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSelector />
          <div className="hidden sm:flex items-center space-x-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="flex items-center text-white hover:bg-white/10 border border-white/20">
                <LogIn className="mr-2 h-4 w-4" />
                {getText("로그인", "Login", "登录", "เข้าสู่ระบบ")}
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="flex items-center bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0">
                <UserPlus className="mr-2 h-4 w-4" />
                {getText("가입하기", "Register", "注册", "สมัครสมาชิก")}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wider">
                  {getText("차세대 기업 솔루션", "Next-Gen Enterprise Solution", "下一代企业解决方案", "โซลูชันองค์กรรุ่นต่อไป")}
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 animate-gradient">
                  {getText("AI 기반", "AI-Powered", "AI 驱动", "ขับเคลื่อนด้วย AI")}
                </span>
                <br />
                <span className="text-white">
                  {getText("기업 관리", "Enterprise", "企业管理", "การจัดการองค์กร")}
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
                  {getText("플랫폼", "Platform", "平台", "แพลตฟอร์ม")}
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                {getText(
                  "Coilmaster Notion은 프로젝트 관리, 업무 추적, 팀 협업을 위한 차세대 AI 기반 통합 플랫폼입니다. 스마트한 자동화와 실시간 인사이트로 비즈니스를 혁신하세요.",
                  "Coilmaster Notion is the next-generation AI-powered integrated platform for project management, task tracking, and team collaboration. Transform your business with smart automation and real-time insights.",
                  "Coilmaster Notion 是用于项目管理、任务跟踪和团队协作的下一代 AI 驱动集成平台。通过智能自动化和实时洞察转变您的业务。",
                  "Coilmaster Notion เป็นแพลตฟอร์มรวมที่ขับเคลื่อนด้วย AI รุ่นใหม่สำหรับการจัดการโครงการ การติดตามงาน และการทำงานร่วมกันของทีม เปลี่ยนแปลงธุรกิจของคุณด้วยระบบอัตโนมัติที่ชาญฉลาดและข้อมูลเชิงลึกแบบเรียลไทม์"
                )}
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                <Link to="/register">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25">
                    <Zap className="mr-2 h-5 w-5" />
                    {getText("지금 시작하기", "Get Started Now", "立即开始", "เริ่มใช้งานตอนนี้")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button className="w-full sm:w-auto bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg border-2 border-white/30 hover:border-white/50 transition-all duration-300 transform hover:scale-105">
                    <LogIn className="mr-2 h-5 w-5" />
                    {getText("로그인", "Login", "登录", "เข้าสู่ระบบ")}
                  </Button>
                </Link>
              </div>
              

              
              {/* 통계 */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">99.9%</div>
                  <div className="text-sm text-gray-400">{getText("가동률", "Uptime", "正常运行时间", "เวลาทำงาน")}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">50+</div>
                  <div className="text-sm text-gray-400">{getText("기업 도입", "Companies", "企业客户", "บริษัท")}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-400">24/7</div>
                  <div className="text-sm text-gray-400">{getText("지원", "Support", "技术支持", "การสนับสนุน")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 사이보그 애니메이션 */}
          <div className={`relative h-96 lg:h-[600px] transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <CyborgAnimation />
          </div>
        </div>
      </section>

      {/* 기능 섹션 */}
      <section className="relative z-10 py-20 px-4 bg-gradient-to-r from-slate-800/50 to-purple-800/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                {getText("핵심 기능", "Core Features", "核心功能", "คุณสมบัติหลัก")}
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {getText(
                "AI 기반 자동화와 실시간 분석으로 업무 효율성을 극대화하세요",
                "Maximize work efficiency with AI-powered automation and real-time analytics",
                "通过 AI 驱动的自动化和实时分析最大化工作效率",
                "เพิ่มประสิทธิภาพการทำงานให้สูงสุดด้วยระบบอัตโนมัติที่ขับเคลื่อนด้วย AI และการวิเคราะห์แบบเรียลไทม์"
              )}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: getText("프로젝트 관리", "Project Management", "项目管理", "การจัดการโครงการ"),
                description: getText(
                  "AI 기반 프로젝트 추적 및 자동 진행률 계산",
                  "AI-powered project tracking and automatic progress calculation",
                  "AI 驱动的项目跟踪和自动进度计算",
                  "การติดตามโครงการที่ขับเคลื่อนด้วย AI และการคำนวณความคืบหน้าอัตโนมัติ"
                ),
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Users,
                title: getText("팀 협업", "Team Collaboration", "团队协作", "การทำงานร่วมกันของทีม"), 
                description: getText(
                  "실시간 협업 도구와 스마트 알림 시스템",
                  "Real-time collaboration tools and smart notification system",
                  "实时协作工具和智能通知系统",
                  "เครื่องมือการทำงานร่วมกันแบบเรียลไทม์และระบบการแจ้งเตือนอัจฉริยะ"
                ),
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: BarChart3,
                title: getText("데이터 분석", "Data Analytics", "数据分析", "การวิเคราะห์ข้อมูล"),
                description: getText(
                  "고급 분석 대시보드와 예측 인사이트",
                  "Advanced analytics dashboard and predictive insights",
                  "高级分析仪表板和预测洞察",
                  "แดชบอร์ดการวิเคราะห์ขั้นสูงและข้อมูลเชิงลึกเชิงทำนาย"
                ),
                color: "from-green-500 to-teal-500"
              },
              {
                icon: Shield,
                title: getText("보안", "Security", "安全性", "ความปลอดภัย"),
                description: getText(
                  "엔터프라이즈급 보안과 권한 관리",
                  "Enterprise-grade security and access control",
                  "企业级安全和访问控制",
                  "ความปลอดภัยระดับองค์กรและการควบคุมการเข้าถึง"
                ),
                color: "from-orange-500 to-red-500"
              },
              {
                icon: Zap,
                title: getText("자동화", "Automation", "自动化", "ระบบอัตโนมัติ"),
                description: getText(
                  "워크플로우 자동화와 스마트 작업 배정",
                  "Workflow automation and smart task assignment",
                  "工作流程自动化和智能任务分配",
                  "ระบบอัตโนมัติของเวิร์กโฟลว์และการมอบหมายงานอัจฉริยะ"
                ),
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: Globe,
                title: getText("다국어 지원", "Multi-language", "多语言支持", "รองรับหลายภาษา"),
                description: getText(
                  "글로벌 팀을 위한 다국어 인터페이스",
                  "Multi-language interface for global teams",
                  "为全球团队提供多语言界面",
                  "อินเทอร์เฟซหลายภาษาสำหรับทีมทั่วโลก"
                ),
                color: "from-indigo-500 to-purple-500"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group relative p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-gradient-to-r from-slate-800/80 to-purple-800/80 backdrop-blur-md rounded-3xl border border-white/10 p-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                  {getText("미래를 시작하세요", "Start Your Future", "开启未来", "เริ่มต้นอนาคตของคุณ")}
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                {getText(
                  "지금 가입하고 AI 기반 기업 관리 플랫폼의 혁신을 경험해보세요",
                  "Join now and experience the innovation of AI-powered enterprise management platform",
                  "立即加入，体验 AI 驱动的企业管理平台创新",
                  "เข้าร่วมตอนนี้และสัมผัสนวัตกรรมของแพลตฟอร์มการจัดการองค์กรที่ขับเคลื่อนด้วย AI"
                )}
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link to="/register">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {getText("무료로 시작하기", "Start Free Trial", "免费开始", "เริ่มทดลองใช้ฟรี")}
                  </Button>
                </Link>
                <Link to="/login">
                  <Button className="w-full sm:w-auto bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg border-2 border-white/30 hover:border-white/50 transition-all duration-300 transform hover:scale-105">
                    <LogIn className="mr-2 h-5 w-5" />
                    {getText("로그인", "Login", "登录", "เข้าสู่ระบบ")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 bg-slate-900/80 backdrop-blur-md border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Cpu className="h-6 w-6 text-cyan-400" />
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                Coilmaster Notion
              </h2>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Coilmaster Corporation. 
              {getText(" 모든 권리 보유.", " All rights reserved.", " 版权所有。", " สงวนลิขสิทธิ์ทั้งหมด")}
            </p>
          </div>
        </div>
      </footer>

      {/* 커스텀 CSS 애니메이션 */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
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
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 6s linear infinite;
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
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Intro;
