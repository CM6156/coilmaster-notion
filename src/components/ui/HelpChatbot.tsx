'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  HelpCircle,
  BookOpen,
  Settings,
  Users,
  LayoutDashboard,
  ClipboardList,
  Folder,
  Minimize2,
  Sparkles,
  Lightbulb,
  Search,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

const HelpChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { language } = useLanguage();

  // 다국어 텍스트
  const texts = {
    ko: {
      welcome: "안녕하세요! 🤖 Coilmaster 시스템 도우미입니다.\n\n궁금한 것이 있으시면 언제든 물어보세요. 프로그램 사용법부터 기능 설명까지 친절하게 도와드릴게요!",
      helpTitle: "도우미 봇",
      currentPageHelp: "현재 페이지 도움말",
      askSomething: "궁금한 것을 물어보세요...",
      systemHelper: "Coilmaster 시스템 도우미",
      greeting: "안녕하세요! 😊 Coilmaster 시스템에 대해 궁금한 것이 있으시면 언제든 물어보세요!",
      thanks: "천만에요! 😄 더 궁금한 것이 있으시면 언제든 말씀해 주세요. 도움이 되어서 기뻐요! ❤️",
      defaultResponse: "죄송해요, 정확히 이해하지 못했어요. 😅\n\n다음과 같은 질문들을 해보세요:\n• 대시보드 주요 기능\n• 프로젝트 관리 방법\n• 업무 할당 방법\n• 고객사 관리 방법\n• 업무 일지 작성법"
    },
    en: {
      welcome: "Hello! 🤖 I'm the Coilmaster system assistant.\n\nFeel free to ask me anything. I'll gladly help you with everything from program usage to feature explanations!",
      helpTitle: "Help Bot",
      currentPageHelp: "Current Page Help",
      askSomething: "Ask me anything...",
      systemHelper: "Coilmaster System Assistant",
      greeting: "Hello! 😊 Feel free to ask me anything about the Coilmaster system!",
      thanks: "You're welcome! 😄 Feel free to ask if you have any more questions. I'm happy to help! ❤️",
      defaultResponse: "Sorry, I didn't quite understand that. 😅\n\nTry asking questions like:\n• Dashboard main features\n• Project management methods\n• Task assignment methods\n• Client management methods\n• Work journal writing"
    },
    th: {
      welcome: "สวัสดีครับ! 🤖 ผมเป็นผู้ช่วยระบบ Coilmaster\n\nหากมีข้อสงสัยใดๆ สามารถสอบถามได้ตลอดเวลาครับ ผมยินดีช่วยเหลือทุกอย่างตั้งแต่การใช้งานโปรแกรมไปจนถึงคำอธิบายฟีเจอร์ต่างๆ!",
      helpTitle: "บอทช่วยเหลือ",
      currentPageHelp: "ความช่วยเหลือหน้าปัจจุบัน",
      askSomething: "สอบถามสิ่งที่สงสัย...",
      systemHelper: "ผู้ช่วยระบบ Coilmaster",
      greeting: "สวัสดีครับ! 😊 หากมีข้อสงสัยเกี่ยวกับระบบ Coilmaster สามารถสอบถามได้ตลอดเวลาครับ!",
      thanks: "ยินดีครับ! 😄 หากมีข้อสงสัยเพิ่มเติม สามารถสอบถามได้ตลอดเวลา ดีใจที่ได้ช่วยเหลือครับ! ❤️",
      defaultResponse: "ขออภัยครับ ผมไม่ค่อยเข้าใจคำถาม 😅\n\nลองถามคำถามแบบนี้ดูครับ:\n• ฟีเจอร์หลักของแดชบอร์ด\n• วิธีการจัดการโปรเจค\n• วิธีการมอบหมายงาน\n• วิธีการจัดการลูกค้า\n• วิธีการเขียนบันทึกการทำงาน"
    },
    zh: {
      welcome: "您好！🤖 我是 Coilmaster 系统助手。\n\n如果您有任何疑问，请随时询问。我很乐意为您提供从程序使用到功能说明的全方位帮助！",
      helpTitle: "助手机器人",
      currentPageHelp: "当前页面帮助",
      askSomething: "请询问您想了解的内容...",
      systemHelper: "Coilmaster 系统助手",
      greeting: "您好！😊 如果您对 Coilmaster 系统有任何疑问，请随时询问！",
      thanks: "不客气！😄 如果您还有其他问题，请随时提问。很高兴能为您提供帮助！❤️",
      defaultResponse: "抱歉，我没有完全理解您的问题。😅\n\n请尝试询问以下类型的问题：\n• 仪表板主要功能\n• 项目管理方法\n• 任务分配方法\n• 客户管理方法\n• 工作日志编写"
    }
  };

  const currentTexts = texts[language as keyof typeof texts] || texts.ko;

  // FAQ 데이터
  const getFaqData = (): FAQItem[] => {
    if (language === 'en') {
      return [
        {
          question: "How do I use the dashboard?",
          answer: "The dashboard provides an overview of project status, task progress, and team activities. You can access it by clicking 'Dashboard' in the left sidebar. Key features include:\n• Project status overview\n• Task completion statistics\n• Team activity monitoring\n• Quick action buttons\n• Performance metrics and charts",
          category: "Basic Usage",
          keywords: ["dashboard", "home", "main", "overview", "status", "features", "main features", "주요기능", "기능"]
        },
        {
          question: "How do I manage projects?",
          answer: "In the Projects section, you can:\n• Create new projects with detailed information\n• Track project progress and milestones\n• Assign team members to projects\n• Set deadlines and priorities\n• Monitor project budgets and resources\n• Generate project reports\n• Collaborate with team members",
          category: "Project Management",
          keywords: ["project", "projects", "create", "manage", "track", "progress"]
        },
        {
          question: "How do I manage clients?",
          answer: "The Clients section allows you to:\n• Add new client information\n• Edit existing client details\n• Track client contact information\n• Link clients to specific projects\n• Manage client communications\n• View client project history\n• Generate client reports",
          category: "Client Management",
          keywords: ["client", "clients", "customer", "company", "manage"]
        },
        {
          question: "How do I manage tasks?",
          answer: "Task Management helps you:\n• Create and assign tasks to team members\n• Set task priorities and deadlines\n• Track task progress and status\n• Add detailed task descriptions\n• Attach files and documents\n• Set up task dependencies\n• Monitor team workload",
          category: "Task Management",
          keywords: ["task", "tasks", "assign", "manage", "work", "todo"]
        },
        {
          question: "How do I use work journals?",
          answer: "Work Journals allow you to:\n• Record daily work activities\n• Track time spent on tasks\n• Document work progress and issues\n• Create detailed work reports\n• Share updates with team members\n• Maintain work history records\n• Generate productivity reports",
          category: "Work Journals",
          keywords: ["journal", "journals", "work journal", "daily", "record", "log"]
        }
      ];
    } else if (language === 'th') {
      return [
        {
          question: "ใช้แดชบอร์ดอย่างไร?",
          answer: "แดชบอร์ดเป็นหน้าหลักของระบบ Coilmaster ที่แสดงภาพรวมของสถานการณ์งานทั้งหมด ฟีเจอร์หลักมีดังนี้:\n\n📊 **ฟีเจอร์หลัก:**\n• ตรวจสอบสถานะและความคืบหน้าของโปรเจคทั้งหมด\n• แสดงจำนวนผู้ใช้ออนไลน์และโปรเจคที่ใช้งาน\n• สถิติลูกค้าและงานที่กำลังดำเนินการ\n• เข้าถึงการตั้งค่าระบบและการจัดการ\n• ติดตามกิจกรรมของทีมงานแบบเรียลไทม์\n\n💡 **เคล็ดลับการใช้งาน:**\n• คลิกที่ 'แดชบอร์ด' ในแถบด้านซ้ายเพื่อเข้าถึง\n• คลิกที่การ์ดสถิติเพื่อไปยังหน้ารายละเอียด\n• ใช้ปุ่มรีเฟรชเพื่อดูข้อมูลล่าสุด",
          category: "การใช้งานพื้นฐาน",
          keywords: ["แดชบอร์ด", "หน้าหลัก", "ภาพรวม", "สถานะ", "ฟีเจอร์", "ฟีเจอร์หลัก", "ความสามารถหลัก"]
        },
        {
          question: "จัดการโปรเจคอย่างไร?",
          answer: "การจัดการโปรเจคช่วยให้คุณจัดการโปรเจคของบริษัทอย่างเป็นระบบ\n\n🎯 **ฟีเจอร์หลัก:**\n• สร้างโปรเจคใหม่และตั้งค่าข้อมูลพื้นฐาน\n• ติดตามสถานะโปรเจค (วางแผน, ดำเนินการ, เสร็จสิ้น, พักงาน)\n• มอบหมายทีมงานและจัดการบทบาท\n• กำหนดตารางเวลาและวันครบกำหนด\n• จัดการงบประมาณและทรัพยากร\n• แนบเอกสารและไฟล์โปรเจค\n\n📝 **วิธีใช้งาน:**\n1. คลิกปุ่ม 'โปรเจคใหม่' ในหน้าโปรเจค\n2. กรอกชื่อโปรเจค คำอธิบาย ผู้รับผิดชอบ วันครบกำหนด\n3. ตั้งค่าลำดับความสำคัญและสถานะ\n4. มอบหมายทีมงานและกำหนดสิทธิ์\n5. บันทึกและเริ่มกิจกรรมโปรเจค",
          category: "การจัดการโปรเจค",
          keywords: ["โปรเจค", "สร้าง", "จัดการ", "ติดตาม", "ความคืบหน้า"]
        },
        {
          question: "จัดการลูกค้าอย่างไร?",
          answer: "การจัดการลูกค้าช่วยให้คุณจัดการข้อมูลลูกค้าและคู่ค้าอย่างครบถ้วน\n\n🏢 **ฟีเจอร์หลัก:**\n• ลงทะเบียนข้อมูลพื้นฐานลูกค้า (ชื่อบริษัท ที่อยู่ ข้อมูลติดต่อ)\n• จัดการข้อมูลผู้ติดต่อ (ชื่อ ตำแหน่ง เบอร์โทร อีเมล)\n• เชื่อมโยงลูกค้ากับโปรเจคและจัดการประวัติ\n• ติดตามข้อมูลสัญญาและประวัติการทำธุรกรรม\n• กำหนดระดับและความสำคัญของลูกค้า\n• จัดการประวัติการสื่อสาร\n\n📋 **วิธีจัดการ:**\n1. คลิก 'เพิ่มลูกค้าใหม่' ในหน้าลูกค้า\n2. กรอกข้อมูลพื้นฐาน (ชื่อบริษัท เลขผู้เสียภาษี ที่อยู่)\n3. ลงทะเบียนข้อมูลผู้ติดต่อ\n4. เชื่อมโยงโปรเจคและกรอกข้อมูลสัญญา\n5. อัปเดตและจัดการข้อมูลอย่างสม่ำเสมอ",
          category: "การจัดการลูกค้า",
          keywords: ["ลูกค้า", "คลายเอนต์", "บริษัท", "คู่ค้า", "จัดการ"]
        },
        {
          question: "จัดการงานอย่างไร?",
          answer: "การจัดการงานช่วยให้คุณมอบหมายและติดตามงานของทีมอย่างมีประสิทธิภาพ\n\n📋 **ฟีเจอร์หลัก:**\n• สร้างงานใหม่และกรอกข้อมูลรายละเอียด\n• มอบหมายงานให้ทีมงานและตั้งค่าสิทธิ์\n• กำหนดลำดับความสำคัญ (สูง ปานกลาง ต่ำ)\n• ติดตามสถานะการดำเนินงาน (มอบหมายแล้ว ดำเนินการ เสร็จสิ้น พักงาน)\n• ตั้งค่าวันครบกำหนดและการแจ้งเตือน\n• กำหนดการพึ่งพางานและงานที่เกี่ยวข้อง\n• แนบไฟล์และฟีเจอร์ความคิดเห็น\n\n✅ **วิธีมอบหมายงาน:**\n1. คลิกปุ่ม 'งานใหม่' ในหน้าการจัดการงาน\n2. เขียนหัวข้องานและคำอธิบายรายละเอียด\n3. เลือกผู้รับผิดชอบและตั้งลำดับความสำคัญ\n4. กรอกวันครบกำหนดและเวลาที่คาดการณ์\n5. เชื่อมโยงโปรเจคที่เกี่ยวข้อง\n6. บันทึกและส่งการแจ้งเตือนให้ผู้รับผิดชอบ",
          category: "การจัดการงาน",
          keywords: ["งาน", "มอบหมาย", "ทาสก์", "ภารกิจ", "จัดการ"]
        },
        {
          question: "เขียนบันทึกการทำงานอย่างไร?",
          answer: "บันทึกการทำงานเป็นฟีเจอร์สำหรับบันทึกและจัดการกิจกรรมการทำงานส่วนบุคคลอย่างเป็นระบบ\n\n📝 **ฟีเจอร์หลัก:**\n• บันทึกและจัดระเบียบกิจกรรมการทำงานรายวัน\n• กรอกเวลาที่ใช้และความคืบหน้าของแต่ละงาน\n• จัดทำเอกสารปัญหาและวิธีแก้ไข\n• วางแปลนงานและเป้าหมายครั้งต่อไป\n• แบ่งปันงานและร่วมมือกับทีม\n• สร้างรายงานงานรายสัปดาห์/รายเดือนอัตโนมัติ\n\n📖 **วิธีเขียน:**\n1. คลิก 'เขียนบันทึกใหม่' ในหน้าบันทึกการทำงาน\n2. เลือกวันทำงาน (ค่าเริ่มต้น: วันนี้)\n3. กรอกรายการงานที่ทำและรายละเอียด\n4. บันทึกเวลาที่ใช้และความคืบหน้าของแต่ละงาน\n5. เขียนปัญหาที่เกิดขึ้นและวิธีแก้ไข\n6. วางแผนงานและเป้าหมายของวันพรุ่งนี้\n7. บันทึกและแบ่งปันกับหัวหน้าทีมหรือผู้เกี่ยวข้อง",
          category: "การจัดการงาน",
          keywords: ["บันทึก", "บันทึกการทำงาน", "เขียน", "รายงาน"]
        }
      ];
    } else if (language === 'zh') {
      return [
        {
          question: "如何使用仪表板？",
          answer: "仪表板是 Coilmaster 系统的主界面，可以全面了解工作状况。主要功能如下：\n\n📊 **主要功能：**\n• 查看所有项目状态和进度\n• 显示在线用户数和活跃项目数\n• 进行中的客户和进行中的工作统计\n• 访问系统设置和管理功能\n• 实时监控团队成员活动状态\n\n💡 **使用技巧：**\n• 点击左侧边栏中的【仪表板】进入\n• 点击各统计卡片可跳转到详细页面\n• 使用刷新按钮查看最新信息",
          category: "基本使用",
          keywords: ["仪表板", "主页", "概览", "状态", "功能", "主要功能"]
        },
        {
          question: "如何管理项目？",
          answer: "项目管理可以系统地管理公司的所有项目\n\n🎯 **主要功能：**\n• 创建新项目并设置基本信息\n• 跟踪项目进度状态（计划中、进行中、完成、暂停）\n• 分配团队成员和管理角色\n• 设置项目时间表和截止日期\n• 管理预算和资源\n• 附加项目文档和文件\n\n📝 **使用方法：**\n1. 在项目页面点击【新建项目】按钮\n2. 输入项目名称、描述、负责人、截止日期\n3. 设置优先级和状态\n4. 分配团队成员并授予权限\n5. 保存后开始项目活动",
          category: "项目管理",
          keywords: ["项目", "创建", "管理", "跟踪", "进度"]
        },
        {
          question: "如何管理客户？",
          answer: "客户管理可以综合管理所有客户和合作伙伴信息\n\n🏢 **主要功能：**\n• 注册客户基本信息（公司名称、地址、联系方式）\n• 管理联系人信息（姓名、职位、联系方式、邮箱）\n• 连接客户与项目并管理历史记录\n• 跟踪合同信息和交易历史\n• 设置客户等级和重要性\n• 管理沟通历史\n\n📋 **管理方法：**\n1. 在客户页面点击【添加新客户】\n2. 输入基本信息（公司名称、税号、地址）\n3. 注册联系人信息\n4. 连接项目并输入合同信息\n5. 定期更新和管理信息",
          category: "客户管理",
          keywords: ["客户", "客户端", "公司", "合作伙伴", "管理"]
        },
        {
          question: "如何管理任务？",
          answer: "任务管理可以高效地分配和跟踪团队的所有工作\n\n📋 **主要功能：**\n• 创建新任务并输入详细信息\n• 向团队成员分配任务并设置权限\n• 设置任务优先级（高、中、低）\n• 跟踪进度状态（已分配、进行中、完成、暂停）\n• 设置截止日期和提醒管理\n• 设置任务依赖关系和关联任务\n• 文件附件和评论功能\n\n✅ **任务分配方法：**\n1. 在任务管理页面点击【新建任务】按钮\n2. 编写任务标题和详细描述\n3. 选择负责人并设置优先级\n4. 输入截止日期和预估时间\n5. 连接相关项目\n6. 保存后向负责人发送通知",
          category: "任务管理",
          keywords: ["任务", "分配", "工作", "管理"]
        },
        {
          question: "如何编写工作日志？",
          answer: "工作日志是系统地记录和管理个人工作活动的功能\n\n📝 **主要功能：**\n• 记录和整理每日工作活动\n• 输入各项工作的耗时和进度\n• 记录问题和解决方案\n• 设置下次工作计划和目标\n• 与团队成员分享工作和协作\n• 自动生成周/月工作报告\n\n📖 **编写方法：**\n1. 在工作日志页面点击【新建日志】\n2. 选择工作日期（默认：今天）\n3. 输入执行的工作列表和详细内容\n4. 记录各项工作的耗时和进度\n5. 编写发生的问题和解决方案\n6. 设置明天的工作计划和目标\n7. 保存后与团队负责人或相关人员分享",
          category: "任务管理",
          keywords: ["日志", "工作日志", "记录", "编写", "报告"]
        }
      ];
    } else {
      // Korean (default)
      return [
        {
          question: "대시보드는 어떻게 사용하나요?",
          answer: "대시보드는 Coilmaster 시스템의 메인 화면으로, 전체적인 업무 현황을 한눈에 파악할 수 있습니다. 주요 기능은 다음과 같습니다:\n\n📊 **주요 기능:**\n• 전체 프로젝트 현황 및 진행률 확인\n• 온라인 사용자 및 활성 프로젝트 수 표시\n• 진행 중인 고객사 및 진행 중인 업무 통계\n• 시스템 설정 및 관리 기능 접근\n• 팀원 활동 상태 실시간 모니터링\n\n💡 **사용 팁:**\n• 좌측 사이드바에서 '대시보드'를 클릭하여 접근\n• 각 통계 카드를 클릭하면 상세 페이지로 이동\n• 새로고침 버튼으로 최신 정보 확인 가능",
          category: "기본 사용법",
          keywords: ["대시보드", "홈", "메인", "현황", "상태", "주요기능", "기능", "주요 기능", "대시보드 기능"]
        },
        {
          question: "프로젝트는 어떻게 관리하나요?",
          answer: "프로젝트 관리에서는 회사의 모든 프로젝트를 체계적으로 관리할 수 있습니다.\n\n🎯 **주요 기능:**\n• 새 프로젝트 생성 및 기본 정보 설정\n• 프로젝트 진행 상태 추적 (계획중, 진행중, 완료, 보류)\n• 팀원 할당 및 역할 관리\n• 프로젝트 일정 및 마감일 설정\n• 예산 및 리소스 관리\n• 프로젝트 문서 및 파일 첨부\n\n📝 **사용 방법:**\n1. 프로젝트 페이지에서 '새 프로젝트' 버튼 클릭\n2. 프로젝트명, 설명, 담당자, 마감일 입력\n3. 우선순위 및 상태 설정\n4. 팀원 할당 및 권한 부여\n5. 저장 후 프로젝트 활동 시작",
          category: "프로젝트 관리",
          keywords: ["프로젝트", "생성", "새로만들기", "추가", "관리", "project", "진행", "상태"]
        },
        {
          question: "고객사는 어떻게 관리하나요?",
          answer: "고객사 관리에서는 모든 거래처와 고객 정보를 통합 관리할 수 있습니다.\n\n🏢 **주요 기능:**\n• 고객사 기본 정보 등록 (회사명, 주소, 연락처)\n• 담당자 정보 관리 (이름, 직책, 연락처, 이메일)\n• 고객사별 프로젝트 연결 및 이력 관리\n• 계약 정보 및 거래 내역 추적\n• 고객사 등급 및 중요도 설정\n• 커뮤니케이션 이력 관리\n\n📋 **관리 방법:**\n1. 고객사 페이지에서 '새 고객사 추가' 클릭\n2. 기본 정보 입력 (회사명, 사업자번호, 주소)\n3. 담당자 정보 등록\n4. 프로젝트 연결 및 계약 정보 입력\n5. 정기적인 정보 업데이트 및 관리",
          category: "고객사 관리",
          keywords: ["고객사", "클라이언트", "회사", "거래처", "client", "customer", "관리"]
        },
        {
          question: "업무는 어떻게 관리하나요?",
          answer: "업무 관리에서는 팀의 모든 업무를 효율적으로 할당하고 추적할 수 있습니다.\n\n📋 **주요 기능:**\n• 새 업무 생성 및 상세 정보 입력\n• 팀원에게 업무 할당 및 권한 설정\n• 업무 우선순위 설정 (높음, 보통, 낮음)\n• 진행 상태 추적 (할당됨, 진행중, 완료, 보류)\n• 마감일 설정 및 알림 관리\n• 업무 의존성 및 연관 업무 설정\n• 파일 첨부 및 댓글 기능\n\n✅ **업무 할당 방법:**\n1. 업무 관리 페이지에서 '새 업무' 버튼 클릭\n2. 업무 제목과 상세 설명 작성\n3. 담당자 선택 및 우선순위 설정\n4. 마감일 및 예상 소요시간 입력\n5. 관련 프로젝트 연결\n6. 저장 후 담당자에게 알림 발송",
          category: "업무 관리",
          keywords: ["업무", "할당", "태스크", "과제", "일감", "task", "관리", "업무관리"]
        },
        {
          question: "업무 일지는 어떻게 작성하나요?",
          answer: "업무 일지는 개인의 업무 활동을 체계적으로 기록하고 관리하는 기능입니다.\n\n📝 **주요 기능:**\n• 일일 업무 활동 기록 및 정리\n• 업무별 소요시간 및 진행률 입력\n• 이슈사항 및 해결방안 문서화\n• 다음 업무 계획 및 목표 설정\n• 팀원과의 업무 공유 및 협업\n• 주간/월간 업무 리포트 자동 생성\n\n📖 **작성 방법:**\n1. 업무 일지 페이지에서 '새 일지 작성' 클릭\n2. 작업 날짜 선택 (기본값: 오늘)\n3. 수행한 업무 목록 및 상세 내용 입력\n4. 각 업무별 소요시간 및 진행률 기록\n5. 발생한 이슈 및 해결방안 작성\n6. 내일 업무 계획 및 목표 설정\n7. 저장 후 팀장 또는 관련자와 공유",
          category: "업무 관리",
          keywords: ["일지", "업무일지", "기록", "작성", "보고", "journal", "일지목록", "업무 일지"]
        },
        {
          question: "팀원 권한은 어떻게 설정하나요?",
          answer: "관리자 권한이 있는 경우, 관리자 패널에서 사용자 관리 메뉴를 통해 팀원의 역할과 권한을 설정할 수 있습니다.",
          category: "관리자 기능",
          keywords: ["권한", "역할", "관리자", "사용자", "팀원"]
        },
        {
          question: "알림 설정은 어떻게 변경하나요?",
          answer: "프로필 메뉴 또는 설정에서 이메일 알림, 푸시 알림 등의 설정을 변경할 수 있습니다.",
          category: "설정",
          keywords: ["알림", "설정", "이메일", "푸시", "notification"]
        },
        {
          question: "온라인 사용자는 어디서 확인할 수 있나요?",
          answer: "좌측 사이드바의 '온라인 사용자' 섹션에서 현재 접속 중인 팀원들과 그들이 보고 있는 페이지를 실시간으로 확인할 수 있습니다.",
          category: "협업 기능",
          keywords: ["온라인", "사용자", "접속", "실시간", "협업"]
        }
      ];
    }
  };

  // 초기 환영 메시지
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        type: 'bot',
        content: currentTexts.welcome,
        timestamp: new Date(),
        suggestions: 
          language === 'en' 
            ? ["Dashboard usage", "Creating projects", "Assigning tasks", "Setting permissions"]
            : language === 'th'
            ? ["การใช้แดชบอร์ด", "การสร้างโปรเจค", "การมอบหมายงาน", "การตั้งค่าสิทธิ์"]
            : language === 'zh'
            ? ["仪表板使用", "创建项目", "分配任务", "权限设置"]
            : ["대시보드 사용법", "프로젝트 생성하기", "업무 할당하기", "팀원 권한 설정"]
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length, currentTexts.welcome, language]);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 페이지별 맞춤형 도움말
  const getPageSpecificHelp = () => {
    const pathname = location.pathname;
    
    if (pathname === '/' || pathname === '/dashboard') {
      return {
        title: language === 'en' ? "Dashboard Help" 
             : language === 'th' ? "ความช่วยเหลือแดชบอร์ด"
             : language === 'zh' ? "仪表板帮助"
             : "대시보드 도움말",
        content: language === 'en' 
          ? "You are currently on the dashboard. Here you can view overall project status and task progress."
          : language === 'th'
          ? "คุณอยู่ในหน้าแดชบอร์ด สามารถดูสถานะโปรเจคโดยรวมและความคืบหน้าของงานได้"
          : language === 'zh'
          ? "您当前在仪表板页面。在这里可以查看整体项目状态和任务进度。"
          : "현재 대시보드에 계십니다. 여기서는 전체 프로젝트 현황과 업무 상태를 확인할 수 있어요.",
        suggestions: language === 'en'
          ? ["Dashboard features", "View statistics", "Quick actions"]
          : language === 'th'
          ? ["ฟีเจอร์แดชบอร์ด", "ดูสถิติ", "การใช้งานด่วน"]
          : language === 'zh'
          ? ["仪表板功能", "查看统计", "快速操作"]
          : ["대시보드 기능 설명", "통계 보는 방법", "빠른 액션 사용법"]
      };
    } else if (pathname.startsWith('/projects')) {
      return {
        title: language === 'en' ? "Project Management Help" 
             : language === 'th' ? "ความช่วยเหลือการจัดการโปรเจค"
             : language === 'zh' ? "项目管理帮助"
             : "프로젝트 관리 도움말",
        content: language === 'en'
          ? "In the project management page, you can create new projects, track progress, and assign team members."
          : language === 'th'
          ? "ในหน้าการจัดการโปรเจค คุณสามารถสร้างโปรเจคใหม่ ติดตามความคืบหน้า และมอบหมายทีมงานได้"
          : language === 'zh'
          ? "在项目管理页面，您可以创建新项目、跟踪进度并分配团队成员。"
          : "프로젝트 관리 페이지에서는 새 프로젝트 생성, 진행 상황 추적, 팀원 할당 등을 할 수 있습니다.",
        suggestions: language === 'en'
          ? ["Create new project", "Change project status", "Assign team members"]
          : language === 'th'
          ? ["สร้างโปรเจคใหม่", "เปลี่ยนสถานะโปรเจค", "มอบหมายทีมงาน"]
          : language === 'zh'
          ? ["创建新项目", "更改项目状态", "分配团队成员"]
          : ["새 프로젝트 만들기", "프로젝트 상태 변경", "팀원 할당하기"]
      };
    } else if (pathname.startsWith('/tasks')) {
      return {
        title: language === 'en' ? "Task Management Help" 
             : language === 'th' ? "ความช่วยเหลือการจัดการงาน"
             : language === 'zh' ? "任务管理帮助"
             : "업무 관리 도움말",
        content: language === 'en'
          ? "In task management, you can create tasks, track progress, and write work journals."
          : language === 'th'
          ? "ในการจัดการงาน คุณสามารถสร้างงาน ติดตามความคืบหน้า และเขียนบันทึกการทำงานได้"
          : language === 'zh'
          ? "在任务管理中，您可以创建任务、跟踪进度并编写工作日志。"
          : "업무 관리에서는 할 일을 생성하고, 진행 상황을 추적하며, 업무 일지를 작성할 수 있습니다.",
        suggestions: language === 'en'
          ? ["Create new task", "Change task status", "Write work journal"]
          : language === 'th'
          ? ["สร้างงานใหม่", "เปลี่ยนสถานะงาน", "เขียนบันทึกการทำงาน"]
          : language === 'zh'
          ? ["创建新任务", "更改任务状态", "编写工作日志"]
          : ["새 업무 생성", "업무 상태 변경", "업무 일지 작성"]
      };
    } else if (pathname.startsWith('/admin')) {
      return {
        title: language === 'en' ? "Admin Panel Help" 
             : language === 'th' ? "ความช่วยเหลือแผงควบคุมผู้ดูแลระบบ"
             : language === 'zh' ? "管理员面板帮助"
             : "관리자 패널 도움말",
        content: language === 'en'
          ? "In the admin panel, you can manage system settings, user management, and permissions."
          : language === 'th'
          ? "ในแผงควบคุมผู้ดูแลระบบ คุณสามารถจัดการการตั้งค่าระบบ การจัดการผู้ใช้ และสิทธิ์การเข้าถึงได้"
          : language === 'zh'
          ? "在管理员面板中，您可以管理系统设置、用户管理和权限。"
          : "관리자 패널에서는 시스템 설정, 사용자 관리, 권한 설정 등을 할 수 있습니다.",
        suggestions: language === 'en'
          ? ["Set user permissions", "Change system settings", "Manage popups"]
          : language === 'th'
          ? ["ตั้งค่าสิทธิ์ผู้ใช้", "เปลี่ยนการตั้งค่าระบบ", "จัดการป๊อปอัพ"]
          : language === 'zh'
          ? ["设置用户权限", "更改系统设置", "管理弹窗"]
          : ["사용자 권한 설정", "시스템 설정 변경", "팝업 관리"]
      };
    }
    
    return {
      title: language === 'en' ? "General Help" 
           : language === 'th' ? "ความช่วยเหลือทั่วไป"
           : language === 'zh' ? "一般帮助"
           : "일반 도움말",
      content: language === 'en' 
        ? "You can get help with using the Coilmaster system."
        : language === 'th'
        ? "คุณสามารถรับความช่วยเหลือในการใช้งานระบบ Coilmaster ได้"
        : language === 'zh'
        ? "您可以获得 Coilmaster 系统使用方面的帮助。"
        : "Coilmaster 시스템 사용에 대해 도움을 받으실 수 있습니다.",
      suggestions: language === 'en'
        ? ["Basic usage", "Main features", "Troubleshooting"]
        : language === 'th'
        ? ["การใช้งานพื้นฐาน", "ฟีเจอร์หลัก", "การแก้ไขปัญหา"]
        : language === 'zh'
        ? ["基本使用", "主要功能", "故障排除"]
        : ["기본 사용법", "주요 기능 소개", "문제 해결"]
    };
  };

  // AI 응답 생성
  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    const faqData = getFaqData();
    
    // FAQ에서 키워드 매칭
    for (const faq of faqData) {
      for (const keyword of faq.keywords) {
        if (message.includes(keyword.toLowerCase())) {
          return faq.answer;
        }
      }
    }
    
    // 인사말 처리
    if (message.includes('안녕') || message.includes('헬로') || message.includes('hello') ||
        message.includes('สวัสดี') || message.includes('你好') || message.includes('hi')) {
      return currentTexts.greeting;
    }
    
    // 감사 표현 처리
    if (message.includes('고마') || message.includes('감사') || message.includes('thanks') ||
        message.includes('ขอบคุณ') || message.includes('谢谢')) {
      return currentTexts.thanks;
    }
    
    // 기본 응답
    return currentTexts.defaultResponse;
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // 타이핑 시뮬레이션
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateResponse(inputValue),
        timestamp: new Date(),
        suggestions: language === 'en'
          ? ["Ask another question", "View main features", "Troubleshooting"]
          : language === 'th'
          ? ["ถามคำถามอื่น", "ดูฟีเจอร์หลัก", "แก้ไขปัญหา"]
          : language === 'zh'
          ? ["问其他问题", "查看主要功能", "故障排除"]
          : ["다른 질문하기", "주요 기능 보기", "문제 해결하기"]
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  // 제안 클릭 처리
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  // 키보드 이벤트
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const pageHelp = getPageSpecificHelp();

  return (
    <>
      {/* 플로팅 버튼 */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 z-50 transition-all duration-300 hover:scale-110"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* 챗봇 창 */}
      {isOpen && (
        <Card className={cn(
          "fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl border border-gray-700 bg-gray-900 z-50 transition-all duration-300",
          isMinimized ? "h-16" : "h-[500px]"
        )}>
          {/* 헤더 */}
          <CardHeader className="pb-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-lg border-b border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-gray-500">
                    <AvatarFallback className="bg-gray-600 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800"></div>
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white">{currentTexts.helpTitle}</CardTitle>
                  <p className="text-xs text-gray-300">{pageHelp.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-6 w-6 text-gray-300 hover:text-white hover:bg-gray-600"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 text-gray-300 hover:text-white hover:bg-gray-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-[440px] bg-gray-900">
              {/* 페이지별 도움말 */}
              <div className="p-3 bg-gradient-to-r from-gray-800 to-gray-750 border-b border-gray-700">
                                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-200">{currentTexts.currentPageHelp}</span>
                  </div>
                  <p className="text-xs text-gray-300 mb-2">{pageHelp.content}</p>
                <div className="flex flex-wrap gap-1">
                  {pageHelp.suggestions.map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs cursor-pointer bg-gray-600 text-gray-200 hover:bg-gray-500 transition-colors border-gray-500"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 메시지 영역 */}
              <ScrollArea className="flex-1 p-4 bg-gray-900">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2",
                        message.type === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.type === 'bot' && (
                        <Avatar className="h-6 w-6 mt-1">
                          <AvatarFallback className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
                            <Bot className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] p-3 rounded-xl text-sm",
                          message.type === 'user'
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                            : "bg-gray-800 text-gray-200 border border-gray-700"
                        )}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        {message.suggestions && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.suggestions.map((suggestion, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs cursor-pointer bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 transition-colors"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {message.type === 'user' && (
                        <Avatar className="h-6 w-6 mt-1">
                          <AvatarFallback className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-2 justify-start">
                      <Avatar className="h-6 w-6 mt-1">
                        <AvatarFallback className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
                          <Bot className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* 입력 영역 */}
              <div className="p-4 border-t border-gray-700 bg-gray-800">
                <div className="flex gap-2">
                                      <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={currentTexts.askSomething}
                      className="flex-1 border-2 border-gray-600 bg-gray-900 text-gray-200 placeholder-gray-400 focus:border-blue-500"
                      disabled={isTyping}
                    />
                                      <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                      size="icon"
                    >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-center mt-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-400" />
                    {currentTexts.systemHelper}
                  </span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </>
  );
};

export default HelpChatbot; 