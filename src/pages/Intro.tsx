
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { LogIn, UserPlus, FileText, Calendar, Users, Database } from "lucide-react";

const Intro = () => {
  const { language, translations } = useLanguage();
  const t = translations.intro || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100">
      {/* Navigation */}
      <nav className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            Coilmaster Notion
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSelector />
          <div className="hidden sm:flex items-center space-x-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="flex items-center">
                <LogIn className="mr-1 h-4 w-4" />
                {translations.login?.login || "Login"}
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="default" size="sm" className="flex items-center">
                <UserPlus className="mr-1 h-4 w-4" />
                {translations.register?.register || "Register"}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-24 px-4 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                  {language === "ko" ? "팀 협업을 위한" : 
                   language === "zh" ? "简化的" : 
                   language === "th" ? "การทำงานร่วมกัน" : 
                   "Streamlined"}
                </span>
                <br />
                {language === "ko" ? "직관적인 업무 관리" : 
                 language === "zh" ? "团队协作" : 
                 language === "th" ? "ของทีมที่มีประสิทธิภาพ" : 
                 "Team Collaboration"}
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                {language === "ko" 
                  ? "Coilmaster Notion은 팀의 협업, 프로젝트 관리, 작업 추적을 위한 올인원 솔루션입니다. 여러 부서와 법인의 업무를 쉽게 정리하고 관리하세요."
                  : language === "zh"
                  ? "Coilmaster Notion是团队协作、项目管理和任务跟踪的一体化解决方案。轻松组织和管理跨部门和公司的工作。"
                  : language === "th"
                  ? "Coilmaster Notion เป็นโซลูชันครบวงจรสำหรับการทำงานร่วมกันของทีม การจัดการโครงการ และการติดตามงาน จัดระเบียบและจัดการงานข้ามแผนกและบริษัทได้อย่างง่ายดาย"
                  : "Coilmaster Notion is your all-in-one solution for team collaboration, project management, and task tracking. Easily organize and manage work across departments and corporations."}
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/register">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-all">
                    {language === "ko" ? "시작하기" : 
                     language === "zh" ? "开始使用" : 
                     language === "th" ? "เริ่มต้นใช้งาน" : 
                     "Get Started"}
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="w-full sm:w-auto font-medium px-6 py-3 rounded-lg">
                    {language === "ko" ? "로그인" : 
                     language === "zh" ? "登录" : 
                     language === "th" ? "เข้าสู่ระบบ" : 
                     "Login"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Abstract Illustration */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
            <div className="relative grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-6">
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg">
                  <FileText className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-1">
                    {language === "ko" ? "업무 일지" : 
                     language === "zh" ? "任务日志" : 
                     language === "th" ? "บันทึกงาน" : 
                     "Task Journal"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {language === "ko" ? "일일 작업 기록 및 추적" : 
                     language === "zh" ? "每日工作记录和跟踪" : 
                     language === "th" ? "การบันทึกและติดตามงานประจำวัน" : 
                     "Daily work logging and tracking"}
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg">
                  <Calendar className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-1">
                    {language === "ko" ? "일정 관리" : 
                     language === "zh" ? "日历" : 
                     language === "th" ? "ปฏิทิน" : 
                     "Calendar"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {language === "ko" ? "법인별 일정 관리" : 
                     language === "zh" ? "企业事件管理" : 
                     language === "th" ? "การจัดการกิจกรรมขององค์กร" : 
                     "Corporate event management"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-6 mt-12">
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg">
                  <Users className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-1">
                    {language === "ko" ? "팀 관리" : 
                     language === "zh" ? "团队管理" : 
                     language === "th" ? "การจัดการทีม" : 
                     "Team Management"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {language === "ko" ? "부서 및 법인별 인원 관리" : 
                     language === "zh" ? "部门和公司人员管理" : 
                     language === "th" ? "จัดการบุคลากรตามแผนกและบริษัท" : 
                     "Department and corporate personnel"}
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg">
                  <Database className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-1">
                    {language === "ko" ? "데이터 관리" : 
                     language === "zh" ? "数据管理" : 
                     language === "th" ? "การจัดการข้อมูล" : 
                     "Data Management"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {language === "ko" ? "프로젝트 및 문서 관리" : 
                     language === "zh" ? "项目和文档处理" : 
                     language === "th" ? "การจัดการโครงการและเอกสาร" : 
                     "Project and document handling"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            {language === "ko" ? "주요 기능" : 
             language === "zh" ? "主要功能" : 
             language === "th" ? "คุณสมบัติหลัก" : 
             "Key Features"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">
                {language === "ko" ? "업무 일지 관리" : 
                 language === "zh" ? "任务日志管理" : 
                 language === "th" ? "การจัดการบันทึกงาน" : 
                 "Task Journal Management"}
              </h3>
              <p className="text-gray-600">
                {language === "ko" 
                  ? "일일 업무 기록을 작성하고 팀원과 공유하세요. 업무 진행 상황을 실시간으로 추적할 수 있습니다."
                  : language === "zh"
                  ? "创建每日工作日志并与团队共享。实时跟踪工作进度。"
                  : language === "th"
                  ? "สร้างบันทึกการทำงานประจำวันและแชร์กับทีมของคุณ ติดตามความคืบหน้าของงานแบบเรียลไทม์"
                  : "Create daily work logs and share them with your team. Track work progress in real-time."}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">
                {language === "ko" ? "일정 및 캘린더" : 
                 language === "zh" ? "日程安排与日历" : 
                 language === "th" ? "ปฏิทินและการจัดกำหนดการ" : 
                 "Calendar & Scheduling"}
              </h3>
              <p className="text-gray-600">
                {language === "ko" 
                  ? "법인별 일정을 관리하고 중요한 이벤트를 추적하세요. 한눈에 모든 일정을 확인할 수 있습니다."
                  : language === "zh"
                  ? "按公司管理日程并跟踪重要事件。一目了然地查看所有日程安排。"
                  : language === "th"
                  ? "จัดการกำหนดการตามบริษัทและติดตามกิจกรรมสำคัญ ดูตารางเวลาทั้งหมดได้ในที่เดียว"
                  : "Manage schedules by corporation and track important events. View all schedules at a glance."}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">
                {language === "ko" ? "팀 및 부서 관리" : 
                 language === "zh" ? "团队与部门管理" : 
                 language === "th" ? "การจัดการทีมและแผนก" : 
                 "Team & Department Management"}
              </h3>
              <p className="text-gray-600">
                {language === "ko" 
                  ? "법인, 부서, 임원별로 팀을 구성하고 관리하세요. 조직 구조를 시각적으로 확인할 수 있습니다."
                  : language === "zh"
                  ? "按公司、部门和管理层设置和管理团队。可视化组织结构。"
                  : language === "th"
                  ? "จัดตั้งและจัดการทีมตามบริษัท แผนก และผู้บริหาร แสดงโครงสร้างองค์กรอย่างเห็นภาพ"
                  : "Set up and manage teams by corporation, department, and executive. Visualize organizational structures."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Coilmaster Notion
            </h2>
          </div>
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Coilmaster Corporation. 
            {language === "ko" ? "모든 권리 보유." : 
             language === "zh" ? "版权所有。" : 
             language === "th" ? "สงวนสิทธิ์ทั้งหมด" : 
             "All rights reserved."}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Intro;
