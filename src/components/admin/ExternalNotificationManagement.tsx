import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Bell, 
  Bot,
  MessageSquare,
  Send, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Users,
  TestTube,
  Activity,
  Clock,
  Globe,
  Smartphone,
  Mail,
  Slack,
  MessageCircle,
  Zap,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  UserPlus,
  Link,
  Save,
  Loader2,
  X,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { projectTaskNotificationService } from '@/services/projectTaskNotificationService';

interface TelegramSettings {
  enabled: boolean;
  botToken: string;
  groupChatId: string;
  checkInterval: number;
  notificationHour: number;
  weekendNotifications: boolean;
  autoNotifications: boolean;
  mentionUsers: boolean;
}

interface LineSettings {
  enabled: boolean;
  channelAccessToken: string;
  channelSecret: string;
  groupId: string;
  checkInterval: number;
  notificationHour: number;
  weekendNotifications: boolean;
  autoNotifications: boolean;
}

interface WeChatSettings {
  enabled: boolean;
  appId: string;
  appSecret: string;
  token: string;
  encodingAesKey: string;
  checkInterval: number;
  notificationHour: number;
  weekendNotifications: boolean;
  autoNotifications: boolean;
}

interface UserTelegramInfo {
  userId: string;
  name: string;
  telegramUsername: string;
  telegramChatId: string;
  isActive: boolean;
}

interface UserLineInfo {
  userId: string;
  name: string;
  lineUserId: string;
  displayName: string;
  isActive: boolean;
}

interface UserWeChatInfo {
  userId: string;
  name: string;
  openId: string;
  nickname: string;
  isActive: boolean;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'deadline_warning' | 'deadline_overdue' | 'task_completed' | 'project_update' | 'custom';
  template: string;
  isActive: boolean;
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: {
    id: string;
    name: string;
  };
  is_active: boolean;
}

interface IndividualMessage {
  userId: string;
  message: string;
  template?: string;
}

const ExternalNotificationManagement = () => {
  // 환경 변수에서 프록시 서버 URL 가져오기
  const LINE_PROXY_URL = import.meta.env.VITE_LINE_PROXY_URL || (
    import.meta.env.PROD 
      ? window.location.origin  // 프로덕션에서는 같은 도메인 사용
      : window.location.origin  // 개발환경에서는 Vite 프록시 사용
  );
  
  const { toast } = useToast();
  const { projects, tasks, users, employees, managers, departments, phases, calculateProjectProgress } = useAppContext();
  const [activeTab, setActiveTab] = useState('telegram');
  const [loading, setLoading] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);
  const [showLineToken, setShowLineToken] = useState(false);
  const [showWeChatSecret, setShowWeChatSecret] = useState(false);

  // 시스템 사용자 목록
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  
  // 개별 메시지 발송 다이얼로그
  const [showIndividualMessageDialog, setShowIndividualMessageDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [individualMessage, setIndividualMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'telegram' | 'line' | 'wechat'>('telegram');

  // 프로젝트 업무 알림 발송
  const [showProjectTaskDialog, setShowProjectTaskDialog] = useState(false);
  const [selectedProjectForNotification, setSelectedProjectForNotification] = useState<string>('');
  const [sendingProjectNotification, setSendingProjectNotification] = useState(false);
  const [projectNotificationResults, setProjectNotificationResults] = useState<Array<{
    assigneeId: string;
    assigneeName: string;
    success: boolean;
    error?: string;
  }>>([]);

  // 텔레그램 설정
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>({
    enabled: false,
    botToken: '',
    groupChatId: '',
    checkInterval: 60,
    notificationHour: 9,
    weekendNotifications: false,
    autoNotifications: true,
    mentionUsers: true
  });

  // LINE 설정
  const [lineSettings, setLineSettings] = useState<LineSettings>({
    enabled: false,
    channelAccessToken: '7Y+IS+94JFOge1JVxIZeJ7pp+JrIxBG9/nKPSsIQwFRo3Epxfu3wBfwqZ+ODmtuCSkJzIC4BquOcoX5ZLKQe7S5hidwLhNYqgQYaPvRpM5ZcwxgO7ifSsDEWWVdFd9HEuWoDw1KYSC2YjPH0HVvvwAdB04t89/1O/w1cDnyilFU=',
    channelSecret: 'd93eb78cf6a3e1bcd0accc74cb3e94cf',
    groupId: '',
    checkInterval: 60,
    notificationHour: 9,
    weekendNotifications: false,
    autoNotifications: true
  });

  // WeChat 설정
  const [wechatSettings, setWeChatSettings] = useState<WeChatSettings>({
    enabled: false,
    appId: '',
    appSecret: '',
    token: '',
    encodingAesKey: '',
    checkInterval: 60,
    notificationHour: 9,
    weekendNotifications: false,
    autoNotifications: true
  });

  // 사용자 텔레그램 정보
  const [userTelegramInfo, setUserTelegramInfo] = useState<UserTelegramInfo[]>([]);
  
  // 사용자 LINE 정보
  const [userLineInfo, setUserLineInfo] = useState<UserLineInfo[]>([]);
  
  // 사용자 WeChat 정보
  const [userWeChatInfo, setUserWeChatInfo] = useState<UserWeChatInfo[]>([]);

  // 알림 템플릿
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      name: '마감일 경고',
      type: 'deadline_warning',
      template: '⚠️ <b>마감일 알림</b>\n\n📁 프로젝트: {project_name}\n📋 업무: {task_title}\n📅 마감일: {due_date}\n👤 담당자: {assignee}\n📊 진행률: {progress}%',
      isActive: true
    },
    {
      id: '2',
      name: '마감일 초과',
      type: 'deadline_overdue',
      template: '🚨 <b>마감일 초과</b>\n\n📁 프로젝트: {project_name}\n📋 업무: {task_title}\n📅 마감일: {due_date} ({days_overdue}일 지연)\n👤 담당자: {assignee}\n📊 진행률: {progress}%',
      isActive: true
    },
    {
      id: '3',
      name: '업무 완료',
      type: 'task_completed',
      template: '✅ <b>업무 완료</b>\n\n📁 프로젝트: {project_name}\n📋 업무: {task_title}\n👤 완료자: {assignee}\n🎉 수고하셨습니다!',
      isActive: true
    }
  ]);

  // 통계 데이터
  const [stats, setStats] = useState({
    totalNotifications: 0,
    successfulNotifications: 0,
    failedNotifications: 0,
    activeUsers: 0,
    lastNotificationTime: null as Date | null
  });

  // 프로젝트 현황 발송 관련 상태
  const [selectedProjectReport, setSelectedProjectReport] = useState<string>('');
  const [isSendingProjectReport, setIsSendingProjectReport] = useState(false);

  // LINE User ID 수집 관련 상태
  const [showLineUserIdDialog, setShowLineUserIdDialog] = useState(false);
  const [lineUserIdCollection, setLineUserIdCollection] = useState({
    isCollecting: false,
    collectedUsers: [] as Array<{ userId: string; displayName: string; profileImage?: string; timestamp: string; }>
  });
  const [lineWebhookUrl, setLineWebhookUrl] = useState('');
  
  // LINE 그룹 ID 수집 관련 상태
  const [showLineGroupIdDialog, setShowLineGroupIdDialog] = useState(false);
  const [lineGroupIdCollection, setLineGroupIdCollection] = useState({
    isCollecting: false,
    collectedGroups: [] as Array<{ groupId: string; groupName: string; timestamp: string; }>
  });
  
  // 수동 User ID 입력 상태
  const [showManualInputDialog, setShowManualInputDialog] = useState(false);
  const [manualUserId, setManualUserId] = useState('');
  const [manualDisplayName, setManualDisplayName] = useState('');

  // 설정 로드
  useEffect(() => {
    loadSettings();
    loadUserTelegramInfo();
    loadUserLineInfo();
    loadUserWeChatInfo();
    loadStats();
    loadSystemUsers();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('telegram_admin_settings');
    if (saved) {
      setTelegramSettings(JSON.parse(saved));
    }
    
    const savedLine = localStorage.getItem('line_admin_settings');
    if (savedLine) {
      setLineSettings(JSON.parse(savedLine));
    }
    
    const savedWeChat = localStorage.getItem('wechat_admin_settings');
    if (savedWeChat) {
      setWeChatSettings(JSON.parse(savedWeChat));
    }
  };

  const loadUserTelegramInfo = () => {
    const saved = localStorage.getItem('user_telegram_info');
    if (saved) {
      setUserTelegramInfo(JSON.parse(saved));
    }
  };
  
  const loadUserLineInfo = () => {
    const saved = localStorage.getItem('user_line_info');
    if (saved) {
      setUserLineInfo(JSON.parse(saved));
    }
  };
  
  const loadUserWeChatInfo = () => {
    const saved = localStorage.getItem('user_wechat_info');
    if (saved) {
      setUserWeChatInfo(JSON.parse(saved));
    }
  };

  const loadStats = () => {
    const saved = localStorage.getItem('notification_stats');
    if (saved) {
      setStats(JSON.parse(saved));
    }
  };

  const loadSystemUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          is_active,
          departments!department_id(id, name)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setSystemUsers(data?.map(user => ({
        ...user,
        department: Array.isArray(user.departments) && user.departments.length > 0 ? {
          id: (user.departments as any)[0].id,
          name: (user.departments as any)[0].name
        } : user.departments ? {
          id: (user.departments as any).id,
          name: (user.departments as any).name
        } : undefined
      })) || []);
    } catch (error) {
      console.error('시스템 사용자 로드 오류:', error);
      toast({
        title: "오류",
        description: "시스템 사용자를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const saveSettings = () => {
    localStorage.setItem('telegram_admin_settings', JSON.stringify(telegramSettings));
    localStorage.setItem('line_admin_settings', JSON.stringify(lineSettings));
    localStorage.setItem('wechat_admin_settings', JSON.stringify(wechatSettings));
    toast({
      title: "설정 저장됨",
      description: "외부 알림 설정이 저장되었습니다.",
    });
  };

  const testBotConnection = async () => {
    if (!telegramSettings.botToken) {
      toast({
        title: "오류",
        description: "봇 토큰을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramSettings.botToken}/getMe`);
      const result = await response.json();
      
      if (result.ok) {
        toast({
          title: "연결 성공",
          description: `봇 "${result.result.first_name}"에 성공적으로 연결되었습니다.`,
        });
      } else {
        toast({
          title: "연결 실패",
          description: "봇 토큰이 유효하지 않습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "연결 오류",
        description: "봇 연결 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testLineConnection = async () => {
    if (!lineSettings.channelAccessToken) {
      toast({
        title: "오류",
        description: "Channel Access Token을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('LINE API 연결 테스트 시작...');

      // 토큰 유효성 검증
      const token = lineSettings.channelAccessToken.trim();
      
      // LINE Channel Access Token 형식 기본 검증
      if (token.length < 100) {
        toast({
          title: "토큰 길이 오류",
          description: "유효한 LINE Channel Access Token을 입력해주세요. (토큰이 너무 짧습니다)",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 백엔드 API를 통한 실제 LINE API 호출
      try {
        const response = await fetch('/api/line/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelAccessToken: token
          })
        });

        if (response.ok) {
          const result = await response.json();
          toast({
            title: "연결 성공",
            description: `LINE 봇 "${result.displayName || 'CoilMaster Bot'}"에 성공적으로 연결되었습니다.`,
          });
        } else if (response.status === 404) {
          // 백엔드 서버가 실행되지 않은 경우
          console.log('백엔드 서버 미실행 - 백엔드 서버를 먼저 시작해주세요');
          toast({
            title: "백엔드 서버 필요",
            description: "백엔드 서버가 실행되지 않았습니다. server 폴더에서 'npm start'를 실행해주세요.",
            variant: "destructive",
          });
        } else {
          const errorData = await response.json();
          toast({
            title: "연결 실패",
            description: errorData.error || "Channel Access Token이 유효하지 않습니다.",
            variant: "destructive",
          });
        }
      } catch (fetchError) {
        // 네트워크 오류 또는 백엔드 서버 미실행
        console.log('백엔드 서버 연결 실패:', fetchError);
        toast({
          title: "백엔드 서버 연결 실패",
          description: "백엔드 서버가 실행되지 않았습니다. server 폴더에서 'npm start'를 실행해주세요.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('LINE 연결 테스트 오류:', error);
      toast({
        title: "연결 오류",
        description: "LINE 봇 연결 설정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!telegramSettings.groupChatId) {
      toast({
        title: "오류",
        description: "그룹 채팅 ID를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const testMessage = `🤖 <b>관리자 테스트 메시지</b>\n\n✅ 텔레그램 알림 시스템이 정상적으로 작동합니다!\n📅 ${new Date().toLocaleString('ko-KR')}\n\n관리자가 발송한 테스트 메시지입니다.`;
      
      const response = await fetch(`https://api.telegram.org/bot${telegramSettings.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramSettings.groupChatId,
          text: testMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        toast({
          title: "테스트 메시지 발송 성공",
          description: "그룹 채팅에 테스트 메시지가 발송되었습니다.",
        });
      } else {
        toast({
          title: "메시지 발송 실패",
          description: "메시지 발송에 실패했습니다. 채팅 ID를 확인해주세요.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "발송 오류",
        description: "메시지 발송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendLineGroupTestMessage = async () => {
    if (!lineSettings.groupId) {
      toast({
        title: "오류",
        description: "LINE 그룹 ID를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const testMessage = `🤖 LINE 그룹 테스트 메시지\n\n✅ LINE 알림 시스템이 정상적으로 작동합니다!\n📅 ${new Date().toLocaleString('ko-KR')}\n\n관리자가 발송한 테스트 메시지입니다.`;
      
      // 백엔드 API를 통해 그룹 메시지 발송
      try {
        const response = await fetch('/api/line/send-group-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelAccessToken: lineSettings.channelAccessToken,
            to: lineSettings.groupId,
            messages: [{
              type: 'text',
              text: testMessage
            }]
          })
        });

        if (response.ok) {
          toast({
            title: "LINE 그룹 테스트 메시지 발송 성공",
            description: "그룹 채팅에 테스트 메시지가 발송되었습니다.",
          });
        } else {
          const errorData = await response.json();
          toast({
            title: "메시지 발송 실패",
            description: errorData.error || "메시지 발송에 실패했습니다. 그룹 ID를 확인해주세요.",
            variant: "destructive",
          });
        }
      } catch (fetchError) {
        // 백엔드 서버 연결 실패
        console.log('백엔드 서버 연결 실패:', fetchError);
        toast({
          title: "백엔드 서버 연결 실패",
          description: "백엔드 서버가 실행되지 않았습니다. server 폴더에서 'npm start'를 실행해주세요.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('LINE 그룹 메시지 발송 오류:', error);
      toast({
        title: "발송 오류",
        description: "메시지 발송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendLineTestMessage = async () => {
    if (!lineSettings.channelAccessToken) {
      toast({
        title: "오류",
        description: "Channel Access Token을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // LINE 사용자 중 첫 번째 활성 사용자 찾기
      const activeLineUser = userLineInfo.find(user => user.isActive && user.lineUserId);
      if (!activeLineUser) {
        toast({
          title: "오류",
          description: "테스트 메시지를 받을 LINE 사용자가 없습니다. 사용자 관리에서 LINE 사용자를 추가해주세요.",
          variant: "destructive",
        });
        return;
      }

      const testMessage = {
        to: activeLineUser.lineUserId,
        messages: [
          {
            type: 'text',
            text: `🤖 관리자 테스트 메시지\n\n✅ LINE 알림 시스템이 정상적으로 작동합니다!\n📅 ${new Date().toLocaleString('ko-KR')}\n\n관리자가 발송한 테스트 메시지입니다.`
          }
        ]
      };

      // 백엔드 API를 통해 메시지 발송
      try {
        const response = await fetch('/api/line/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelAccessToken: lineSettings.channelAccessToken,
            ...testMessage
          })
        });

        if (response.ok) {
          toast({
            title: "테스트 메시지 발송 성공",
            description: `${activeLineUser.name}님에게 LINE 테스트 메시지가 발송되었습니다.`,
          });
        } else {
          const errorData = await response.json();
          toast({
            title: "메시지 발송 실패",
            description: errorData.error || "메시지 발송에 실패했습니다.",
            variant: "destructive",
          });
        }
      } catch (fetchError) {
        // 백엔드 서버 연결 실패
        console.log('백엔드 서버 연결 실패:', fetchError);
        toast({
          title: "백엔드 서버 연결 실패",
          description: "백엔드 서버가 실행되지 않았습니다. server 폴더에서 'npm start'를 실행해주세요.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('LINE 메시지 발송 오류:', error);
      toast({
        title: "발송 오류",
        description: "LINE 메시지 발송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // LINE User ID 수집 관련 함수들
  const startLineUserIdCollection = async () => {
    if (!lineSettings.channelAccessToken) {
      toast({
        title: "오류",
        description: "LINE Channel Access Token을 먼저 설정해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLineUserIdCollection(prev => ({ ...prev, isCollecting: true, collectedUsers: [] }));
    setShowLineUserIdDialog(true);
    
    // Webhook URL 생성 (실제 운영시에는 서버에서 처리)
    const webhookUrl = `${window.location.origin}/api/line/webhook`;
    setLineWebhookUrl(webhookUrl);

    // 백엔드에서 이미 수집된 사용자 목록 가져오기
    try {
      const response = await fetch('/api/line/collected-users');
      if (response.ok) {
        const data = await response.json();
        setLineUserIdCollection(prev => ({
          ...prev,
          collectedUsers: data.users || []
        }));
      }
    } catch (error) {
      console.error('수집된 사용자 목록 로드 실패:', error);
    }
    
    // 주기적으로 새 사용자 확인 (3초마다)
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/line/collected-users');
        if (response.ok) {
          const data = await response.json();
          setLineUserIdCollection(prev => ({
            ...prev,
            collectedUsers: data.users || []
          }));
        }
      } catch (error) {
        console.error('사용자 목록 업데이트 실패:', error);
      }
    }, 3000);
    
    // 인터벌 저장 (정리용)
    (window as any).lineUserCollectionInterval = interval;

    toast({
      title: "LINE User ID 수집 시작",
      description: "사용자들이 LINE 봇에게 메시지를 보내면 자동으로 User ID가 수집됩니다.",
    });
  };

  const stopLineUserIdCollection = () => {
    setLineUserIdCollection(prev => ({ ...prev, isCollecting: false }));
    
    // 인터벌 정리
    if ((window as any).lineUserCollectionInterval) {
      clearInterval((window as any).lineUserCollectionInterval);
      (window as any).lineUserCollectionInterval = null;
    }
    
    toast({
      title: "수집 중단",
      description: "LINE User ID 수집을 중단했습니다.",
    });
  };

  // LINE 그룹 ID 수집 시작
  const startLineGroupIdCollection = async () => {
    setLineGroupIdCollection(prev => ({
      ...prev,
      isCollecting: true,
      collectedGroups: []
    }));

    // 백엔드에서 이미 수집된 그룹 목록 가져오기
    try {
      const response = await fetch('/api/line/collected-groups');
      if (response.ok) {
        const data = await response.json();
        setLineGroupIdCollection(prev => ({
          ...prev,
          collectedGroups: data.groups || []
        }));
      }
    } catch (error) {
      console.error('수집된 그룹 목록 로드 실패:', error);
    }
    
    // 주기적으로 새 그룹 확인 (3초마다)
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/line/collected-groups');
        if (response.ok) {
          const data = await response.json();
          setLineGroupIdCollection(prev => ({
            ...prev,
            collectedGroups: data.groups || []
          }));
        }
      } catch (error) {
        console.error('그룹 목록 업데이트 실패:', error);
      }
    }, 3000);
    
    // 인터벌 저장 (정리용)
    (window as any).lineGroupCollectionInterval = interval;

    toast({
      title: "LINE 그룹 ID 수집 시작됨",
      description: "이제 LINE 그룹에서 메시지를 보내주세요. 그룹 ID가 자동으로 수집됩니다.",
    });
  };

  // LINE 그룹 ID 수집 중지
  const stopLineGroupIdCollection = () => {
    setLineGroupIdCollection(prev => ({ ...prev, isCollecting: false }));
    
    // 인터벌 정리
    if ((window as any).lineGroupCollectionInterval) {
      clearInterval((window as any).lineGroupCollectionInterval);
      (window as any).lineGroupCollectionInterval = null;
    }
    
    toast({
      title: "수집 중단",
      description: "LINE 그룹 ID 수집을 중단했습니다.",
    });
  };

  // 수집된 그룹을 설정에 적용
  const addLineGroupFromCollection = async (collectedGroup: any) => {
    try {
      setLineSettings(prev => ({
        ...prev,
        groupId: collectedGroup.groupId
      }));

      toast({
        title: "LINE 그룹 설정 완료",
        description: `"${collectedGroup.groupName}" 그룹이 설정에 적용되었습니다.`,
      });

      setShowLineGroupIdDialog(false);
    } catch (error) {
      console.error('LINE 그룹 설정 오류:', error);
      toast({
        title: "오류",
        description: "LINE 그룹 설정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 그룹 메시지 시뮬레이션
  const simulateLineGroupMessage = (groupName: string, groupId?: string) => {
    const simulatedGroupId = groupId || `C${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    setLineGroupIdCollection(prev => ({
      ...prev,
      collectedGroups: [
        ...prev.collectedGroups.filter(g => g.groupId !== simulatedGroupId),
        {
          groupId: simulatedGroupId,
          groupName: groupName,
          timestamp: new Date().toLocaleString('ko-KR')
        }
      ]
    }));

    toast({
      title: "시뮬레이션 그룹 추가됨",
      description: `"${groupName}" 그룹 ID가 수집되었습니다.`,
    });
  };

  const getLineUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`${LINE_PROXY_URL}/api/line/profile/${userId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('LINE 프로필 조회 오류:', error);
      return null;
    }
  };

  const addLineUserFromCollection = async (collectedUser: any) => {
    // 시스템 사용자와 매칭
    const matchedUser = systemUsers.find(user => 
      user.name.includes(collectedUser.displayName) || 
      collectedUser.displayName.includes(user.name)
    );

    if (matchedUser) {
      const newLineUser: UserLineInfo = {
        userId: matchedUser.id,
        name: matchedUser.name,
        lineUserId: collectedUser.userId,
        displayName: collectedUser.displayName,
        isActive: true
      };

      const updatedInfo = [...userLineInfo.filter(u => u.userId !== matchedUser.id), newLineUser];
      setUserLineInfo(updatedInfo);
      localStorage.setItem('user_line_info', JSON.stringify(updatedInfo));

      toast({
        title: "사용자 추가됨",
        description: `${collectedUser.displayName}이(가) LINE 사용자로 추가되었습니다.`,
      });
    } else {
      toast({
        title: "매칭 실패",
        description: `${collectedUser.displayName}과 일치하는 시스템 사용자를 찾을 수 없습니다.`,
        variant: "destructive",
      });
    }
  };

  const sendLineUserIdRequest = async () => {
    if (!lineSettings.channelAccessToken) {
      toast({
        title: "오류",
        description: "Channel Access Token을 먼저 설정해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 사용자 등록 안내 메시지 생성
    const registrationMessage = `🤖 LINE 알림 설정 안내

안녕하세요! 프로젝트 관리 시스템의 LINE 알림 봇입니다.

📋 이 봇을 통해 다음과 같은 알림을 받으실 수 있습니다:
• 업무 마감일 알림
• 프로젝트 진행 상황
• 중요 공지사항

✅ 알림을 받으시려면 다음 중 하나를 입력해주세요:
• "등록"
• "가입"
• "시작"
• 본인의 이름

❓ 문의사항이 있으시면 관리자에게 연락해주세요.

📞 지원: 시스템 관리자`;

    toast({
      title: "등록 안내 메시지",
      description: "사용자들에게 다음 메시지를 공유하여 LINE 등록을 안내하세요.",
    });

    // 클립보드에 메시지 복사
    try {
      await navigator.clipboard.writeText(registrationMessage);
      toast({
        title: "메시지 복사됨",
        description: "등록 안내 메시지가 클립보드에 복사되었습니다.",
      });
    } catch (error) {
      console.log('클립보드 복사 실패:', error);
    }
  };

  // 테스트용 시뮬레이션 함수
  const simulateLineUserMessage = (displayName: string, userId?: string) => {
    const simulatedUser = {
      userId: userId || `U${Math.random().toString(36).substr(2, 15)}`,
      displayName: displayName,
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
      timestamp: new Date().toLocaleString('ko-KR')
    };

    setLineUserIdCollection(prev => ({
      ...prev,
      collectedUsers: [...prev.collectedUsers, simulatedUser]
    }));

    toast({
      title: "시뮬레이션 사용자 추가됨",
      description: `${displayName}님의 User ID가 수집되었습니다.`,
    });
  };

  // 수동 User ID 입력 함수
  const addManualLineUserId = () => {
    if (!manualUserId.trim() || !manualDisplayName.trim()) {
      toast({
        title: "오류",
        description: "User ID와 표시 이름을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 중복 체크
    const isDuplicate = lineUserIdCollection.collectedUsers.some(user => user.userId === manualUserId.trim());
    if (isDuplicate) {
      toast({
        title: "중복 User ID",
        description: "이미 등록된 User ID입니다.",
        variant: "destructive",
      });
      return;
    }

    const manualUser = {
      userId: manualUserId.trim(),
      displayName: manualDisplayName.trim(),
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(manualDisplayName.trim())}&background=random`,
      timestamp: new Date().toLocaleString('ko-KR')
    };

    setLineUserIdCollection(prev => ({
      ...prev,
      collectedUsers: [...prev.collectedUsers, manualUser]
    }));

    // 입력 필드 초기화
    setManualUserId('');
    setManualDisplayName('');
    setShowManualInputDialog(false);

    toast({
      title: "수동 사용자 추가됨",
      description: `${manualDisplayName.trim()}님의 User ID가 추가되었습니다.`,
    });
  };

  const addUserTelegramInfo = () => {
    const newUser: UserTelegramInfo = {
      userId: `user_${Date.now()}`,
      name: '',
      telegramUsername: '',
      telegramChatId: '',
      isActive: true
    };
    setUserTelegramInfo([...userTelegramInfo, newUser]);
  };

  const updateUserTelegramInfo = (userId: string, field: keyof UserTelegramInfo, value: string | boolean) => {
    setUserTelegramInfo(prev => 
      prev.map(user => 
        user.userId === userId ? { ...user, [field]: value } : user
      )
    );
  };

  const removeUserTelegramInfo = (userId: string) => {
    setUserTelegramInfo(prev => prev.filter(user => user.userId !== userId));
  };

  const saveUserTelegramInfo = () => {
    localStorage.setItem('user_telegram_info', JSON.stringify(userTelegramInfo));
    toast({
      title: "사용자 정보 저장됨",
      description: "사용자 텔레그램 정보가 저장되었습니다.",
    });
  };

  const saveUserLineInfo = () => {
    localStorage.setItem('user_line_info', JSON.stringify(userLineInfo));
    toast({
      title: "사용자 정보 저장됨",
      description: "사용자 LINE 정보가 저장되었습니다.",
    });
  };
  
  const saveUserWeChatInfo = () => {
    localStorage.setItem('user_wechat_info', JSON.stringify(userWeChatInfo));
    toast({
      title: "사용자 정보 저장됨",
      description: "사용자 WeChat 정보가 저장되었습니다.",
    });
  };

  // 이름 기준 자동 매칭 함수
  const autoMatchUsersByName = (platform: 'telegram' | 'line' | 'wechat') => {
    let matchCount = 0;
    
    if (platform === 'telegram') {
      const updatedTelegramInfo = userTelegramInfo.map(telegramUser => {
        const matchingSystemUser = systemUsers.find(systemUser => 
          systemUser.name.trim().toLowerCase() === telegramUser.name.trim().toLowerCase()
        );
        
        if (matchingSystemUser && !telegramUser.userId.startsWith('user_')) {
          matchCount++;
          return {
            ...telegramUser,
            userId: matchingSystemUser.id,
            name: matchingSystemUser.name
          };
        }
        
        return telegramUser;
      });
      
      setUserTelegramInfo(updatedTelegramInfo);
    } else if (platform === 'line') {
      const updatedLineInfo = userLineInfo.map(lineUser => {
        const matchingSystemUser = systemUsers.find(systemUser => 
          systemUser.name.trim().toLowerCase() === lineUser.name.trim().toLowerCase()
        );
        
        if (matchingSystemUser && !lineUser.userId.startsWith('user_')) {
          matchCount++;
          return {
            ...lineUser,
            userId: matchingSystemUser.id,
            name: matchingSystemUser.name
          };
        }
        
        return lineUser;
      });
      
      setUserLineInfo(updatedLineInfo);
    } else if (platform === 'wechat') {
      const updatedWeChatInfo = userWeChatInfo.map(wechatUser => {
        const matchingSystemUser = systemUsers.find(systemUser => 
          systemUser.name.trim().toLowerCase() === wechatUser.name.trim().toLowerCase()
        );
        
        if (matchingSystemUser && !wechatUser.userId.startsWith('user_')) {
          matchCount++;
          return {
            ...wechatUser,
            userId: matchingSystemUser.id,
            name: matchingSystemUser.name
          };
        }
        
        return wechatUser;
      });
      
      setUserWeChatInfo(updatedWeChatInfo);
    }
    
    toast({
      title: "자동 매칭 완료",
      description: `${matchCount}명의 사용자가 자동으로 매칭되었습니다.`,
    });
  };

  // 개별 메시지 발송 다이얼로그 열기
  const openIndividualMessageDialog = (user: SystemUser, platform?: 'telegram' | 'line' | 'wechat') => {
    setSelectedUser(user);
    setIndividualMessage('');
    setSelectedTemplate('custom');
    setSelectedPlatform(platform || 'telegram');
    setShowIndividualMessageDialog(true);
  };

  // 템플릿 적용
  const applyTemplate = (templateId: string) => {
    const template = notificationTemplates.find(t => t.id === templateId);
    if (template && selectedUser) {
      let message = template.template;
      
      // 템플릿 변수 치환
      message = message.replace('{user_name}', selectedUser.name);
      message = message.replace('{user_email}', selectedUser.email);
      message = message.replace('{user_role}', selectedUser.role === 'admin' ? '관리자' : selectedUser.role === 'manager' ? '매니저' : '사용자');
      message = message.replace('{department}', selectedUser.department?.name || '미지정');
      message = message.replace('{current_time}', new Date().toLocaleString('ko-KR'));
      
      setIndividualMessage(message);
    }
  };

  // 개별 메시지 발송
  const sendIndividualMessage = async () => {
    if (!selectedUser || !individualMessage) {
      toast({
        title: "오류",
        description: "사용자와 메시지를 확인해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 플랫폼별 사용자 정보 확인
    let userInfo: any = null;
    let platformName = '';
    
    if (selectedPlatform === 'telegram') {
      userInfo = userTelegramInfo.find(u => u.userId === selectedUser.id || u.name.toLowerCase() === selectedUser.name.toLowerCase());
      platformName = '텔레그램';
      if (!userInfo || !userInfo.telegramChatId) {
        toast({
          title: "오류",
          description: "텔레그램 채팅 ID가 설정되지 않았습니다.",
          variant: "destructive",
        });
        return;
      }
    } else if (selectedPlatform === 'line') {
      userInfo = userLineInfo.find(u => u.userId === selectedUser.id || u.name.toLowerCase() === selectedUser.name.toLowerCase());
      platformName = 'LINE';
      if (!userInfo || !userInfo.lineUserId) {
        toast({
          title: "오류",
          description: "LINE User ID가 설정되지 않았습니다.",
          variant: "destructive",
        });
        return;
      }
    } else if (selectedPlatform === 'wechat') {
      userInfo = userWeChatInfo.find(u => u.userId === selectedUser.id || u.name.toLowerCase() === selectedUser.name.toLowerCase());
      platformName = 'WeChat';
      if (!userInfo || !userInfo.openId) {
        toast({
          title: "오류",
          description: "WeChat OpenID가 설정되지 않았습니다.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      // 실제 메시지 발송 로직은 플랫폼별로 구현 필요
      // 여기서는 시뮬레이션만 수행
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "메시지 발송 성공",
        description: `${selectedUser.name}님에게 ${platformName} 메시지가 발송되었습니다.`,
      });
      setShowIndividualMessageDialog(false);
      
      // 통계 업데이트
      setStats(prev => ({
        ...prev,
        totalNotifications: prev.totalNotifications + 1,
        successfulNotifications: prev.successfulNotifications + 1,
        lastNotificationTime: new Date()
      }));
    } catch (error) {
      toast({
        title: "발송 오류",
        description: "메시지 발송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 프로젝트 현황 보고서 생성 함수
  const generateProjectStatusReport = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return '❌ 프로젝트를 찾을 수 없습니다.';

    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const projectProgress = calculateProjectProgress(projectId);
    
    // 날짜 처리 (안전한 방식)
    const today = new Date();
    const formatSafeDate = (dateValue: any): string => {
      if (!dateValue) return '미설정';
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? '미설정' : date.toLocaleDateString('ko-KR');
    };
    
    const calculateDaysLeft = (endDateValue: any): { days: number; text: string; icon: string } => {
      if (!endDateValue) return { days: 0, text: '마감일 미설정', icon: '⚪️' };
      const endDate = new Date(endDateValue);
      if (isNaN(endDate.getTime())) return { days: 0, text: '마감일 오류', icon: '⚪️' };
      
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 0) {
        return { days: daysLeft, text: `${Math.abs(daysLeft)}일 지남`, icon: '🔴' };
      } else if (daysLeft === 0) {
        return { days: daysLeft, text: '오늘 마감', icon: '🟠' };
      } else if (daysLeft <= 7) {
        return { days: daysLeft, text: `${daysLeft}일 남음`, icon: '🟡' };
      } else {
        return { days: daysLeft, text: `${daysLeft}일 남음`, icon: '🟢' };
      }
    };
    
    const startDate = formatSafeDate(project.startDate);
    const deadlineInfo = calculateDaysLeft(project.endDate);
    
    // 상태별 업무 통계 (다양한 상태값 고려)
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => 
      t.status === 'completed' || t.status === 'done' || t.status === 'finished'
    ).length;
    const inProgressTasks = projectTasks.filter(t => 
      t.status === 'in_progress' || t.status === 'in-progress' || t.status === 'active' || t.status === 'working'
    ).length;
    const notStartedTasks = projectTasks.filter(t => 
      t.status === 'not_started' || t.status === 'not-started' || t.status === 'pending' || t.status === 'planned'
    ).length;
    
    // 지연된 업무 계산 (안전한 날짜 처리)
    const overdueTasks = projectTasks.filter(t => {
      if (t.status === 'completed' || t.status === 'done' || t.status === 'finished') return false;
      if (!t.dueDate) return false;
      
      const dueDate = new Date(t.dueDate);
      if (isNaN(dueDate.getTime())) return false;
      
      return dueDate < today;
    });
    
    // 임박한 업무 계산 (7일 이내)
    const upcomingTasks = projectTasks.filter(t => {
      if (t.status === 'completed' || t.status === 'done' || t.status === 'finished') return false;
      if (!t.dueDate) return false;
      
      const dueDate = new Date(t.dueDate);
      if (isNaN(dueDate.getTime())) return false;
      
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 7;
    });

    // 진행률 바 생성
    const progressBars = Math.max(0, Math.min(5, Math.floor(projectProgress / 20)));
    const progressBar = '🟩'.repeat(progressBars) + '⬜️'.repeat(5 - progressBars);
    
    // 담당자별 상세 현황 (실제 데이터 기반)
    const assigneeStats = new Map();
    
    projectTasks.forEach(task => {
      // 할당자 필드 확인
      const assigneeId = (typeof task.assignees?.[0] === 'string' ? task.assignees[0] : task.assignees?.[0]?.id) || task.assignedTo || 'unassigned';
      
      // 사용자 이름 찾기 (모든 소스에서)
      let assigneeName = '미지정';
      if (assigneeId && assigneeId !== 'unassigned') {
        const employee = employees.find(e => e.id === assigneeId || e.employee_number === assigneeId);
        const manager = managers.find(m => m.id === assigneeId || m.email === assigneeId);
        const user = users.find(u => u.id === assigneeId || u.email === assigneeId);
        
        assigneeName = employee?.name || manager?.name || user?.name || user?.email || assigneeId;
      }
      
      if (!assigneeStats.has(assigneeId)) {
        assigneeStats.set(assigneeId, {
          name: assigneeName,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          notStartedTasks: 0,
          overdueTasks: 0,
          upcomingTasks: 0,
          totalProgress: 0,
          overdueDetails: []
        });
      }
      
      const stats = assigneeStats.get(assigneeId);
      stats.totalTasks++;
      stats.totalProgress += task.progress || 0;
      
      // 상태별 카운트
      if (task.status === 'completed' || task.status === 'done' || task.status === 'finished') {
        stats.completedTasks++;
      } else if (task.status === 'in_progress' || task.status === 'in-progress' || task.status === 'active' || task.status === 'working') {
        stats.inProgressTasks++;
      } else {
        stats.notStartedTasks++;
      }
      
      // 지연된 업무 체크
      if ((task.status !== 'completed' && task.status !== 'done' && task.status !== 'finished') && 
          task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (!isNaN(dueDate.getTime()) && dueDate < today) {
          stats.overdueTasks++;
          const daysPastDue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          const taskPhase = phases.find(p => p.id === task.taskPhase);
          const statusText = (task.status === 'in_progress' || task.status === 'in-progress' || task.status === 'active') ? '진행중' : '시작전';
          
          stats.overdueDetails.push({
            title: taskPhase?.name || task.title,
            status: statusText,
            progress: task.progress || 0,
            daysPastDue
          });
        }
      }
      
      // 임박한 업무 체크
      if ((task.status !== 'completed' && task.status !== 'done' && task.status !== 'finished') && 
          task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (!isNaN(dueDate.getTime())) {
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilDue >= 0 && daysUntilDue <= 7) {
            stats.upcomingTasks++;
          }
        }
      }
    });

    // 보고서 생성
    let report = `📊 ${project.name} 프로젝트 전체 현황 보고\n\n`;
    report += `📅 보고 시간: ${today.toLocaleDateString('ko-KR')} ${today.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}\n`;
    report += `📁 프로젝트명: ${project.name}\n`;
    report += `🚀 시작일: ${startDate}\n`;
    report += `📅 마감일: ${formatSafeDate(project.endDate)} (${deadlineInfo.text}) ${deadlineInfo.icon}\n\n`;
    
    report += `📈 전체 진행률: ${progressBar} ${Math.round(projectProgress)}%\n\n`;
    
    report += `📊 업무 현황 통계\n`;
    report += `📋 총 업무: ${totalTasks}개\n`;
    
    if (totalTasks > 0) {
      report += `✅ 완료: ${completedTasks}개 (${Math.round((completedTasks / totalTasks) * 100)}%)\n`;
      report += `🔄 진행중: ${inProgressTasks}개 (${Math.round((inProgressTasks / totalTasks) * 100)}%)\n`;
      report += `⭕️ 시작전: ${notStartedTasks}개 (${Math.round((notStartedTasks / totalTasks) * 100)}%)\n`;
      report += `⚠️ 지연: ${overdueTasks.length}개 (${Math.round((overdueTasks.length / totalTasks) * 100)}%) ${overdueTasks.length > 0 ? '🚨' : ''}\n`;
      report += `📅 임박(7일내): ${upcomingTasks.length}개 (${Math.round((upcomingTasks.length / totalTasks) * 100)}%) ${upcomingTasks.length > 0 ? '⚡️' : ''}\n\n`;
    } else {
      report += `⚠️ 등록된 업무가 없습니다.\n\n`;
    }
    
    report += `👥 담당자별 상세 현황\n\n`;
    
    if (assigneeStats.size === 0) {
      report += `📝 담당자가 배정된 업무가 없습니다.\n`;
    } else {
      let assigneeIndex = 1;
      // 지연 업무가 많은 순서로 정렬
      const sortedAssignees = Array.from(assigneeStats.entries()).sort(([,a], [,b]) => b.overdueTasks - a.overdueTasks);
      
      sortedAssignees.forEach(([assigneeId, stats]) => {
        const avgProgress = stats.totalTasks > 0 ? Math.round(stats.totalProgress / stats.totalTasks) : 0;
        const assigneeProgressBars = Math.max(0, Math.min(5, Math.floor(avgProgress / 20)));
        const assigneeProgressBar = '🟩'.repeat(assigneeProgressBars) + '⬜️'.repeat(5 - assigneeProgressBars);
        
        const hasIssues = stats.overdueTasks > 0;
        const hasUpcoming = stats.upcomingTasks > 0;
        
        report += `${assigneeIndex}. ${stats.name} ${hasIssues ? '🚨' : hasUpcoming ? '⚡️' : '✅'}\n`;
        report += `   📋 담당 업무: ${stats.totalTasks}개\n`;
        report += `   📊 진행률: ${assigneeProgressBar} ${avgProgress}%\n`;
        report += `   ✅ 완료: ${stats.completedTasks}개 | 🔄 진행중: ${stats.inProgressTasks}개 | ⭕️ 시작전: ${stats.notStartedTasks}개\n`;
        
        if (hasIssues) {
          report += `   ⚠️ 지연: ${stats.overdueTasks}개 - 즉시 확인 필요!\n`;
          
          if (stats.overdueDetails.length > 0) {
            report += `   🔥 주요 이슈:\n`;
            stats.overdueDetails.slice(0, 3).forEach(detail => { // 최대 3개만 표시
              report += `      🚨 ${detail.title} (${detail.status} ${detail.progress}%) ${detail.daysPastDue}일 지연\n`;
            });
            if (stats.overdueDetails.length > 3) {
              report += `      📎 외 ${stats.overdueDetails.length - 3}개 업무 지연\n`;
            }
          }
        }
        
        if (hasUpcoming && !hasIssues) {
          report += `   📅 임박: ${stats.upcomingTasks}개 (7일내 마감)\n`;
        }
        
        report += '\n';
        assigneeIndex++;
      });
    }
    
    // 마무리 메시지
    if (overdueTasks.length > 0) {
      report += `🚨 긴급: ${overdueTasks.length}개 업무가 지연 상태입니다. 즉시 조치가 필요합니다!\n`;
    } else if (upcomingTasks.length > 0) {
      report += `⚡️ 주의: ${upcomingTasks.length}개 업무가 7일 내 마감됩니다.\n`;
    } else {
      report += `✅ 모든 업무가 계획대로 진행되고 있습니다.\n`;
    }

    return report;
  };

  // 다중 플랫폼 프로젝트 현황 보고서 발송
  const sendProjectStatusReportToAllPlatforms = async () => {
    if (!selectedProjectReport) {
      toast({
        title: "오류",
        description: "프로젝트를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingProjectReport(true);
    
    try {
      const report = generateProjectStatusReport(selectedProjectReport);
      const results = {
        line: { success: 0, total: 0, errors: [] as string[] },
        telegram: { success: 0, total: 0, errors: [] as string[] },
        wechat: { success: 0, total: 0, errors: [] as string[] }
      };

      // LINE 발송
      if (lineSettings.enabled) {
        const activeLineUsers = userLineInfo.filter(u => u.isActive);
        results.line.total = activeLineUsers.length;
        
        // 개별 사용자에게 발송
        if (activeLineUsers.length > 0) {
          const linePromises = activeLineUsers.map(async (user) => {
            try {
              const response = await fetch(`${LINE_PROXY_URL}/api/line/send`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  to: user.lineUserId,
                  messages: [{
                    type: 'text',
                    text: report
                  }]
                })
              });

              if (response.ok) {
                results.line.success++;
              } else {
                results.line.errors.push(`${user.name}: LINE 발송 실패`);
              }
            } catch (error) {
              results.line.errors.push(`${user.name}: ${error}`);
            }
          });

          await Promise.allSettled(linePromises);
        }

        // LINE 그룹에도 발송
        if (lineSettings.groupId) {
          results.line.total++;
          try {
            const response = await fetch(`${LINE_PROXY_URL}/api/line/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                to: lineSettings.groupId,
                messages: [{
                  type: 'text',
                  text: report
                }]
              })
            });

            if (response.ok) {
              results.line.success++;
            } else {
              results.line.errors.push('LINE 그룹 발송 실패');
            }
          } catch (error) {
            results.line.errors.push(`LINE 그룹: ${error}`);
          }
        }
      }

      // Telegram 발송
      if (telegramSettings.enabled && telegramSettings.botToken) {
        const activeTelegramUsers = userTelegramInfo.filter(u => u.isActive && u.telegramChatId);
        results.telegram.total = activeTelegramUsers.length;

        if (activeTelegramUsers.length > 0) {
          const telegramPromises = activeTelegramUsers.map(async (user) => {
            try {
              const response = await fetch(`${LINE_PROXY_URL}/api/telegram/send`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  botToken: telegramSettings.botToken,
                  chatId: user.telegramChatId,
                  text: report,
                  parseMode: 'HTML'
                })
              });

              if (response.ok) {
                results.telegram.success++;
              } else {
                results.telegram.errors.push(`${user.name}: Telegram 발송 실패`);
              }
            } catch (error) {
              results.telegram.errors.push(`${user.name}: ${error}`);
            }
          });

          await Promise.allSettled(telegramPromises);
        }

        // Telegram 그룹 채팅에도 발송
        if (telegramSettings.groupChatId) {
          try {
            const response = await fetch(`${LINE_PROXY_URL}/api/telegram/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                botToken: telegramSettings.botToken,
                chatId: telegramSettings.groupChatId,
                text: report,
                parseMode: 'HTML'
              })
            });

            if (response.ok) {
              results.telegram.success++;
            } else {
              results.telegram.errors.push('그룹 채팅 발송 실패');
            }
          } catch (error) {
            results.telegram.errors.push(`그룹 채팅: ${error}`);
          }
          results.telegram.total++;
        }
      }

      // WeChat 발송 (현재는 준비중)
      if (wechatSettings.enabled) {
        const activeWeChatUsers = userWeChatInfo.filter(u => u.isActive);
        results.wechat.total = activeWeChatUsers.length;
        
        if (activeWeChatUsers.length > 0) {
          // WeChat은 현재 준비중이므로 에러로 처리
          results.wechat.errors.push('WeChat 기능은 현재 준비 중입니다.');
        }
      }

      // 결과 정리 및 토스트 메시지
      const totalSuccess = results.line.success + results.telegram.success + results.wechat.success;
      const totalSent = results.line.total + results.telegram.total + results.wechat.total;
      const allErrors = [...results.line.errors, ...results.telegram.errors, ...results.wechat.errors];

      let description = `총 ${totalSent}개 대상 중 ${totalSuccess}개 성공적으로 발송되었습니다.`;
      if (results.line.total > 0) description += `\n• LINE: ${results.line.success}/${results.line.total}`;
      if (results.telegram.total > 0) description += `\n• Telegram: ${results.telegram.success}/${results.telegram.total}`;
      if (results.wechat.total > 0) description += `\n• WeChat: ${results.wechat.success}/${results.wechat.total}`;

      toast({
        title: "다중 플랫폼 현황 보고서 발송 완료",
        description: description,
        variant: allErrors.length > 0 ? "default" : "default",
      });

      if (allErrors.length > 0) {
        console.warn('발송 중 일부 오류:', allErrors);
      }

    } catch (error) {
      console.error('현황 보고서 발송 오류:', error);
      toast({
        title: "발송 실패",
        description: error instanceof Error ? error.message : "프로젝트 현황 보고서 발송에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSendingProjectReport(false);
    }
  };

  // 다중 플랫폼 프로젝트 업무 알림 발송
  const sendProjectTaskNotificationsToAllPlatforms = async () => {
    if (!selectedProjectForNotification) return;
    
    setSendingProjectNotification(true);
    setProjectNotificationResults([]);
    
    // 시뮬레이션 모드 확인
    const isSimulationMode = import.meta.env.VITE_SIMULATION_MODE !== 'false' || 
                              !import.meta.env.VITE_LINE_PROXY_URL;
    
    console.log('🚀 외부 알림 발송 시작');
    console.log('📊 모드:', isSimulationMode ? '시뮬레이션 모드' : '실제 발송 모드');
    console.log('🔗 프록시 URL:', LINE_PROXY_URL);
    
    try {
      const project = projects.find(p => p.id === selectedProjectForNotification);
      if (!project) {
        throw new Error('프로젝트를 찾을 수 없습니다.');
      }
      
      const projectTasks = tasks.filter(task => task.projectId === selectedProjectForNotification);
      
      console.log('📁 프로젝트:', project.name);
      console.log('📋 업무 개수:', projectTasks.length);
      
      // 사용자 이름 가져오기 함수
      const getUserName = (userId: string): string => {
        const user = users.find(u => u.id === userId);
        if (user) return user.name || user.email;
        
        const employee = employees.find(e => e.id === userId || e.employee_number === userId);
        if (employee) return employee.name;
        
        const manager = managers.find(m => m.id === userId || m.email === userId);
        if (manager) return manager.name;
        
        return '알 수 없음';
      };

      const results = {
        line: { success: 0, total: 0, errors: [] as string[] },
        telegram: { success: 0, total: 0, errors: [] as string[] },
        wechat: { success: 0, total: 0, errors: [] as string[] }
      };

      // 각 담당자별로 업무 정리
      const assigneeTaskMap = new Map();
      projectTasks.forEach(task => {
        const assigneeId = task.assignees?.[0];
        if (assigneeId) {
          if (!assigneeTaskMap.has(assigneeId)) {
            assigneeTaskMap.set(assigneeId, []);
          }
          assigneeTaskMap.get(assigneeId).push(task);
        }
      });

      // LINE 개별 알림 발송
      if (lineSettings.enabled) {
        console.log('📱 LINE 알림 발송 시작');
        const activeLineUsers = userLineInfo.filter(u => u.isActive);
        console.log('👥 활성 LINE 사용자:', activeLineUsers.length, '명');
        
        // 개별 사용자에게 발송
        for (const [assigneeId, assigneeTasks] of assigneeTaskMap.entries()) {
          const lineUser = activeLineUsers.find(u => u.userId === assigneeId);
          if (lineUser) {
            results.line.total++;
            const userName = getUserName(assigneeId);
            
            try {
              const message = generateIndividualTaskMessage(assigneeTasks, userName, project);
              
              console.log(`📤 LINE 개별 발송: ${userName} (${lineUser.lineUserId})`);
              console.log(`💬 메시지 길이: ${message.length}자`);
              
              if (isSimulationMode) {
                // 시뮬레이션 모드: 실제 API 호출 없이 성공으로 처리
                console.log('✅ [시뮬레이션] LINE 개별 알림 발송 성공');
                results.line.success++;
              } else {
                // 실제 LINE API 호출
                const response = await fetch('https://api.line.me/v2/bot/message/push', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${lineSettings.channelAccessToken}`
                  },
                  body: JSON.stringify({
                    to: lineUser.lineUserId,
                    messages: [{
                      type: 'text',
                      text: message
                    }]
                  })
                });

                if (response.ok) {
                  console.log(`✅ LINE 개별 알림 발송 성공: ${userName}`);
                  results.line.success++;
                } else {
                  const errorText = await response.text();
                  console.error(`❌ LINE 개별 알림 발송 실패: ${userName}`, errorText);
                  results.line.errors.push(`${userName}: LINE 발송 실패 (${response.status})`);
                }
              }
            } catch (error) {
              console.error(`❌ LINE 개별 알림 에러: ${userName}`, error);
              results.line.errors.push(`${userName}: ${error}`);
            }
          }
        }

        // LINE 그룹에 전체 프로젝트 요약 발송
        if (lineSettings.groupId) {
          results.line.total++;
          console.log(`📤 LINE 그룹 발송: ${lineSettings.groupId}`);
          
          try {
            const groupMessage = generateProjectSummaryMessage(projectTasks, project);
            console.log(`💬 그룹 메시지 길이: ${groupMessage.length}자`);
            
            if (isSimulationMode) {
              // 시뮬레이션 모드
              console.log('✅ [시뮬레이션] LINE 그룹 알림 발송 성공');
              results.line.success++;
            } else {
              // 실제 LINE API 호출
              const response = await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${lineSettings.channelAccessToken}`
                },
                body: JSON.stringify({
                  to: lineSettings.groupId,
                  messages: [{
                    type: 'text',
                    text: groupMessage
                  }]
                })
              });

              if (response.ok) {
                console.log('✅ LINE 그룹 알림 발송 성공');
                results.line.success++;
              } else {
                const errorText = await response.text();
                console.error('❌ LINE 그룹 알림 발송 실패', errorText);
                results.line.errors.push(`LINE 그룹 발송 실패 (${response.status})`);
              }
            }
          } catch (error) {
            console.error('❌ LINE 그룹 알림 에러', error);
            results.line.errors.push(`LINE 그룹: ${error}`);
          }
        }
      }

      // Telegram 개별 알림 발송
      if (telegramSettings.enabled && telegramSettings.botToken) {
        console.log('🤖 Telegram 알림 발송 시작');
        const activeTelegramUsers = userTelegramInfo.filter(u => u.isActive && u.telegramChatId);
        console.log('👥 활성 Telegram 사용자:', activeTelegramUsers.length, '명');
        
        for (const [assigneeId, assigneeTasks] of assigneeTaskMap.entries()) {
          const telegramUser = activeTelegramUsers.find(u => u.userId === assigneeId);
          if (telegramUser) {
            results.telegram.total++;
            const userName = getUserName(assigneeId);
            
            try {
              const message = generateIndividualTaskMessage(assigneeTasks, userName, project);
              
              console.log(`📤 Telegram 개별 발송: ${userName} (${telegramUser.telegramChatId})`);
              console.log(`💬 메시지 길이: ${message.length}자`);
              
              if (isSimulationMode) {
                // 시뮬레이션 모드
                console.log('✅ [시뮬레이션] Telegram 개별 알림 발송 성공');
                results.telegram.success++;
              } else {
                // 실제 Telegram API 호출
                const response = await fetch(`https://api.telegram.org/bot${telegramSettings.botToken}/sendMessage`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    chat_id: telegramUser.telegramChatId,
                    text: message,
                    parse_mode: 'HTML'
                  })
                });

                if (response.ok) {
                  console.log(`✅ Telegram 개별 알림 발송 성공: ${userName}`);
                  results.telegram.success++;
                } else {
                  const errorText = await response.text();
                  console.error(`❌ Telegram 개별 알림 발송 실패: ${userName}`, errorText);
                  results.telegram.errors.push(`${userName}: Telegram 발송 실패 (${response.status})`);
                }
              }
            } catch (error) {
              console.error(`❌ Telegram 개별 알림 에러: ${userName}`, error);
              results.telegram.errors.push(`${userName}: ${error}`);
            }
          }
        }

        // Telegram 그룹 채팅에 전체 프로젝트 요약 발송
        if (telegramSettings.groupChatId) {
          results.telegram.total++;
          console.log(`📤 Telegram 그룹 발송: ${telegramSettings.groupChatId}`);
          
          try {
            const groupMessage = generateProjectSummaryMessage(projectTasks, project);
            console.log(`💬 그룹 메시지 길이: ${groupMessage.length}자`);
            
            if (isSimulationMode) {
              // 시뮬레이션 모드
              console.log('✅ [시뮬레이션] Telegram 그룹 알림 발송 성공');
              results.telegram.success++;
            } else {
              // 실제 Telegram API 호출
              const response = await fetch(`https://api.telegram.org/bot${telegramSettings.botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  chat_id: telegramSettings.groupChatId,
                  text: groupMessage,
                  parse_mode: 'HTML'
                })
              });

              if (response.ok) {
                console.log('✅ Telegram 그룹 알림 발송 성공');
                results.telegram.success++;
              } else {
                const errorText = await response.text();
                console.error('❌ Telegram 그룹 알림 발송 실패', errorText);
                results.telegram.errors.push(`그룹 채팅 발송 실패 (${response.status})`);
              }
            }
          } catch (error) {
            console.error('❌ Telegram 그룹 알림 에러', error);
            results.telegram.errors.push(`그룹 채팅: ${error}`);
          }
        }
      }

      // WeChat 발송 (현재는 준비중)
      if (wechatSettings.enabled) {
        const activeWeChatUsers = userWeChatInfo.filter(u => u.isActive);
        const wechatAssignees = Array.from(assigneeTaskMap.keys()).filter(assigneeId => 
          activeWeChatUsers.some(u => u.userId === assigneeId)
        );
        
        results.wechat.total = wechatAssignees.length;
        if (wechatAssignees.length > 0) {
          results.wechat.errors.push('WeChat 기능은 현재 준비 중입니다.');
        }
      }

      // 결과 정리
      const allResults = [];
      
      // LINE 결과
      for (const [assigneeId] of assigneeTaskMap.entries()) {
        const lineUser = userLineInfo.find(u => u.userId === assigneeId && u.isActive);
        if (lineUser) {
          allResults.push({
            assigneeId,
            assigneeName: getUserName(assigneeId),
            success: !results.line.errors.some(e => e.includes(getUserName(assigneeId))),
            platform: 'LINE'
          });
        }
      }

      // Telegram 결과
      for (const [assigneeId] of assigneeTaskMap.entries()) {
        const telegramUser = userTelegramInfo.find(u => u.userId === assigneeId && u.isActive);
        if (telegramUser) {
          allResults.push({
            assigneeId,
            assigneeName: getUserName(assigneeId),
            success: !results.telegram.errors.some(e => e.includes(getUserName(assigneeId))),
            platform: 'Telegram'
          });
        }
      }

      setProjectNotificationResults(allResults);

      const totalSuccess = results.line.success + results.telegram.success + results.wechat.success;
      const totalSent = results.line.total + results.telegram.total + results.wechat.total;
      const allErrors = [...results.line.errors, ...results.telegram.errors, ...results.wechat.errors];

      // 상세한 발송 결과 로그
      console.log('📊 === 외부 알림 발송 결과 ===');
      console.log(`📈 총 성공: ${totalSuccess}/${totalSent}`);
      console.log(`📱 LINE: ${results.line.success}/${results.line.total}`);
      console.log(`🤖 Telegram: ${results.telegram.success}/${results.telegram.total}`);
      console.log(`💬 WeChat: ${results.wechat.success}/${results.wechat.total}`);
      
      if (allErrors.length > 0) {
        console.log('❌ 발송 실패 목록:');
        allErrors.forEach(error => console.log(`  - ${error}`));
      }
      
      console.log('🎯 모드:', isSimulationMode ? '시뮬레이션' : '실제 발송');
      console.log('===============================');

      let description = `총 ${totalSent}개 대상 중 ${totalSuccess}개 ${isSimulationMode ? '시뮬레이션' : '실제 발송'} 완료`;
      if (results.line.total > 0) description += `\n• LINE: ${results.line.success}/${results.line.total}`;
      if (results.telegram.total > 0) description += `\n• Telegram: ${results.telegram.success}/${results.telegram.total}`;
      if (results.wechat.total > 0) description += `\n• WeChat: ${results.wechat.success}/${results.wechat.total}`;
      
      if (isSimulationMode) {
        description += '\n\n⚠️ 현재 시뮬레이션 모드입니다.\n실제 발송을 위해서는 환경변수 설정이 필요합니다.';
      }

      toast({
        title: `${isSimulationMode ? '🧪 시뮬레이션' : '📱 실제'} 다중 플랫폼 업무 알림 발송 완료`,
        description: description,
        variant: allErrors.length > 0 ? "default" : "default",
      });

      if (allErrors.length > 0) {
        console.warn('발송 중 일부 오류:', allErrors);
        
        // 에러가 있는 경우 추가 토스트
        toast({
          title: "⚠️ 일부 발송 실패",
          description: `${allErrors.length}개의 발송이 실패했습니다. 콘솔을 확인하세요.`,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('프로젝트 업무 알림 발송 오류:', error);
      toast({
        title: "발송 실패",
        description: error instanceof Error ? error.message : "알림 발송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSendingProjectNotification(false);
    }
  };

  // 개별 업무 메시지 생성
  const generateIndividualTaskMessage = (tasks: any[], assigneeName: string, project: any): string => {
    const today = new Date();
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'completed');
    const upcomingTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const daysUntilDue = Math.ceil((new Date(t.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 3;
    });
    
    let message = `👋 <b>${assigneeName}님 업무 알림</b>\n`;
    message += `📁 ${project.name}\n\n`;
    
    // 긴급도 순으로 정렬된 업무 표시
    if (overdueTasks.length > 0) {
      message += `🚨 <b>지연 업무 (${overdueTasks.length}개)</b>\n`;
      overdueTasks.slice(0, 3).forEach((task, index) => {
        const daysOverdue = Math.ceil((today.getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        message += `${index + 1}. ${task.title}\n`;
        message += `   📊 ${task.progress || 0}% | 🚨 ${daysOverdue}일 지연\n`;
      });
      if (overdueTasks.length > 3) {
        message += `   ...외 ${overdueTasks.length - 3}개\n`;
      }
      message += `\n`;
    }
    
    if (upcomingTasks.length > 0) {
      message += `⚡ <b>임박 업무 (${upcomingTasks.length}개)</b>\n`;
      upcomingTasks.slice(0, 3).forEach((task, index) => {
        const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const dueText = daysLeft === 0 ? '오늘 마감' : `${daysLeft}일 남음`;
        message += `${index + 1}. ${task.title}\n`;
        message += `   📊 ${task.progress || 0}% | ⏰ ${dueText}\n`;
      });
      if (upcomingTasks.length > 3) {
        message += `   ...외 ${upcomingTasks.length - 3}개\n`;
      }
      message += `\n`;
    }
    
    const normalTasks = tasks.filter(t => 
      !overdueTasks.includes(t) && !upcomingTasks.includes(t) && t.status !== 'completed'
    );
    
    if (normalTasks.length > 0) {
      message += `📋 <b>기타 업무 (${normalTasks.length}개)</b>\n`;
      normalTasks.slice(0, 2).forEach((task, index) => {
        const statusIcon = task.status === 'in_progress' ? '🔄' : '⭕';
        message += `${index + 1}. ${statusIcon} ${task.title} (${task.progress || 0}%)\n`;
      });
      if (normalTasks.length > 2) {
        message += `   ...외 ${normalTasks.length - 2}개\n`;
      }
    }
    
    // 총 업무 수 요약
    const completed = tasks.filter(t => t.status === 'completed').length;
    message += `\n📊 <b>요약:</b> 총 ${tasks.length}개 | 완료 ${completed}개`;
    if (overdueTasks.length > 0) message += ` | 🚨지연 ${overdueTasks.length}개`;
    if (upcomingTasks.length > 0) message += ` | ⚡임박 ${upcomingTasks.length}개`;
    
    return message;
  };

  // 프로젝트 요약 메시지 생성
  const generateProjectSummaryMessage = (tasks: any[], project: any): string => {
    const today = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const overdueTasks = tasks.filter(t => {
      return t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < today;
    });
    const upcomingTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const daysUntilDue = Math.ceil((new Date(t.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 7;
    });

    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let message = `📊 <b>${project.name} 프로젝트 현황</b>\n`;
    message += `📅 ${today.toLocaleDateString('ko-KR')} ${today.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}\n\n`;
    
    // 진행률 바
    const barLength = 10;
    const filledLength = Math.round((progressPercent / 100) * barLength);
    const progressBar = '🟩'.repeat(filledLength) + '⬜'.repeat(barLength - filledLength);
    message += `📈 <b>전체 진행률: ${progressPercent}%</b>\n${progressBar}\n\n`;
    
    // 업무 통계
    message += `📊 <b>업무 현황</b>\n`;
    message += `• 📋 총 업무: <b>${totalTasks}개</b>\n`;
    message += `• ✅ 완료: <b>${completedTasks}개</b> (${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)\n`;
    message += `• 🔄 진행중: <b>${inProgressTasks}개</b>\n`;
    message += `• ⭕ 시작전: <b>${totalTasks - completedTasks - inProgressTasks}개</b>\n`;
    
    if (overdueTasks.length > 0) {
      message += `• 🚨 지연: <b>${overdueTasks.length}개</b>\n`;
    }
    
    if (upcomingTasks.length > 0) {
      message += `• ⚡ 임박(7일내): <b>${upcomingTasks.length}개</b>\n`;
    }
    
    // 긴급 이슈가 있는 경우
    if (overdueTasks.length > 0 || upcomingTasks.filter(t => {
      const daysLeft = Math.ceil((new Date(t.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 1;
    }).length > 0) {
      message += `\n🚨 <b>긴급 대응 필요</b>\n`;
      
      // 가장 지연이 심한 업무 3개
      if (overdueTasks.length > 0) {
        const sortedOverdue = overdueTasks
          .map(t => ({
            ...t,
            daysOverdue: Math.ceil((today.getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          }))
          .sort((a, b) => b.daysOverdue - a.daysOverdue)
          .slice(0, 3);
        
        sortedOverdue.forEach((task, index) => {
          message += `${index + 1}. ${task.title} (${task.daysOverdue}일 지연)\n`;
        });
        
        if (overdueTasks.length > 3) {
          message += `   ...외 ${overdueTasks.length - 3}개 지연\n`;
        }
      }
    }
    
    // 상태 요약
    message += `\n💡 <b>상태:</b> `;
    if (overdueTasks.length > 0) {
      message += `🔴 지연 발생 - 즉시 점검 필요`;
    } else if (progressPercent >= 80) {
      message += `🟢 순조롭게 진행 중`;
    } else if (progressPercent >= 50) {
      message += `🟡 진행률 향상 필요`;
    } else {
      message += `🔴 진행 지연 - 전략 검토 필요`;
    }
    
    return message;
  };

  // 프로젝트 선택 다이얼로그 열기
  const openProjectTaskDialog = () => {
    if (!telegramSettings.enabled || !telegramSettings.botToken) {
      toast({
        title: "텔레그램 설정 필요",
        description: "프로젝트 업무 알림을 사용하려면 먼저 텔레그램을 설정해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    setShowProjectTaskDialog(true);
    setProjectNotificationResults([]);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">외부 알림 관리</h2>
          <p className="text-gray-600 dark:text-gray-400">텔레그램, 이메일 등 외부 알림 시스템을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            실시간 모니터링
          </Badge>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 알림 발송</p>
                <p className="text-2xl font-bold">{stats.totalNotifications}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">성공률</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalNotifications > 0 
                    ? Math.round((stats.successfulNotifications / stats.totalNotifications) * 100)
                    : 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">활성 사용자</p>
                <p className="text-2xl font-bold">{userTelegramInfo.filter(u => u.isActive).length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">마지막 알림</p>
                <p className="text-sm font-medium">
                  {stats.lastNotificationTime 
                    ? new Date(stats.lastNotificationTime).toLocaleString('ko-KR')
                    : '없음'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메인 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="telegram" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            텔레그램
          </TabsTrigger>
          <TabsTrigger value="line" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            LINE
          </TabsTrigger>
          <TabsTrigger value="wechat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WeChat
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            사용자 관리
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            메시지 템플릿
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            모니터링
          </TabsTrigger>
        </TabsList>

        {/* 텔레그램 설정 탭 */}
        <TabsContent value="telegram" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                텔레그램 봇 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">텔레그램 알림 활성화</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    텔레그램을 통한 자동 알림을 활성화합니다.
                  </p>
                </div>
                <Switch
                  checked={telegramSettings.enabled}
                  onCheckedChange={(checked) => 
                    setTelegramSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="botToken">봇 토큰</Label>
                  <div className="flex gap-2">
                    <Input
                      id="botToken"
                      type={showBotToken ? "text" : "password"}
                      value={telegramSettings.botToken}
                      onChange={(e) => 
                        setTelegramSettings(prev => ({ ...prev, botToken: e.target.value }))
                      }
                      placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowBotToken(!showBotToken)}
                    >
                      {showBotToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="groupChatId">그룹 채팅 ID</Label>
                  <Input
                    id="groupChatId"
                    value={telegramSettings.groupChatId}
                    onChange={(e) => 
                      setTelegramSettings(prev => ({ ...prev, groupChatId: e.target.value }))
                    }
                    placeholder="-1001234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="notificationHour">알림 시간</Label>
                  <Select
                    value={telegramSettings.notificationHour.toString()}
                    onValueChange={(value) => 
                      setTelegramSettings(prev => ({ ...prev, notificationHour: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="checkInterval">체크 간격 (분)</Label>
                  <Select
                    value={telegramSettings.checkInterval.toString()}
                    onValueChange={(value) => 
                      setTelegramSettings(prev => ({ ...prev, checkInterval: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30분</SelectItem>
                      <SelectItem value="60">1시간</SelectItem>
                      <SelectItem value="120">2시간</SelectItem>
                      <SelectItem value="360">6시간</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>주말 알림</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      주말에도 알림을 발송합니다.
                    </p>
                  </div>
                  <Switch
                    checked={telegramSettings.weekendNotifications}
                    onCheckedChange={(checked) => 
                      setTelegramSettings(prev => ({ ...prev, weekendNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>자동 알림</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      마감일 기반 자동 알림을 활성화합니다.
                    </p>
                  </div>
                  <Switch
                    checked={telegramSettings.autoNotifications}
                    onCheckedChange={(checked) => 
                      setTelegramSettings(prev => ({ ...prev, autoNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>사용자 멘션</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      그룹 메시지에서 담당자를 태그합니다.
                    </p>
                  </div>
                  <Switch
                    checked={telegramSettings.mentionUsers}
                    onCheckedChange={(checked) => 
                      setTelegramSettings(prev => ({ ...prev, mentionUsers: checked }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  설정 저장
                </Button>
                <Button variant="outline" onClick={testBotConnection} disabled={loading}>
                  <Bot className="h-4 w-4 mr-2" />
                  봇 연결 테스트
                </Button>
                <Button variant="outline" onClick={sendTestMessage} disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  테스트 메시지 발송
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LINE 설정 탭 */}
        <TabsContent value="line" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                LINE 봇 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">LINE 알림 활성화</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    LINE을 통한 자동 알림을 활성화합니다.
                  </p>
                </div>
                <Switch
                  checked={lineSettings.enabled}
                  onCheckedChange={(checked) => 
                    setLineSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="channelAccessToken">Channel Access Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="channelAccessToken"
                      type={showLineToken ? "text" : "password"}
                      value={lineSettings.channelAccessToken}
                      onChange={(e) => 
                        setLineSettings(prev => ({ ...prev, channelAccessToken: e.target.value }))
                      }
                      placeholder="Channel Access Token을 입력하세요"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowLineToken(!showLineToken)}
                    >
                      {showLineToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="channelSecret">Channel Secret</Label>
                  <Input
                    id="channelSecret"
                    type="password"
                    value={lineSettings.channelSecret}
                    onChange={(e) => 
                      setLineSettings(prev => ({ ...prev, channelSecret: e.target.value }))
                    }
                    placeholder="Channel Secret을 입력하세요"
                  />
                </div>

                <div>
                  <Label htmlFor="lineGroupId">그룹 ID (선택사항)</Label>
                  <Input
                    id="lineGroupId"
                    value={lineSettings.groupId}
                    onChange={(e) => 
                      setLineSettings(prev => ({ ...prev, groupId: e.target.value }))
                    }
                    placeholder="C1234567890abcdef..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    LINE 그룹에 봇을 추가한 후, 그룹 ID를 입력하면 그룹으로도 메시지가 발송됩니다.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lineNotificationHour">알림 시간</Label>
                    <Select
                      value={lineSettings.notificationHour.toString()}
                      onValueChange={(value) => 
                        setLineSettings(prev => ({ ...prev, notificationHour: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="lineCheckInterval">체크 간격 (분)</Label>
                    <Select
                      value={lineSettings.checkInterval.toString()}
                      onValueChange={(value) => 
                        setLineSettings(prev => ({ ...prev, checkInterval: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30분</SelectItem>
                        <SelectItem value="60">1시간</SelectItem>
                        <SelectItem value="120">2시간</SelectItem>
                        <SelectItem value="360">6시간</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>주말 알림</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        주말에도 알림을 발송합니다.
                      </p>
                    </div>
                    <Switch
                      checked={lineSettings.weekendNotifications}
                      onCheckedChange={(checked) => 
                        setLineSettings(prev => ({ ...prev, weekendNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>자동 알림</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        마감일 기반 자동 알림을 활성화합니다.
                      </p>
                    </div>
                    <Switch
                      checked={lineSettings.autoNotifications}
                      onCheckedChange={(checked) => 
                        setLineSettings(prev => ({ ...prev, autoNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 flex-wrap">
                <Button onClick={saveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  설정 저장
                </Button>
                <Button variant="outline" onClick={testLineConnection} disabled={loading}>
                  <Bot className="h-4 w-4 mr-2" />
                  봇 연결 테스트
                </Button>
                <Button variant="outline" onClick={sendLineTestMessage} disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  개별 테스트 메시지
                </Button>
                <Button 
                  variant="outline" 
                  onClick={sendLineGroupTestMessage} 
                  disabled={loading || !lineSettings.groupId}
                >
                  <Users className="h-4 w-4 mr-2" />
                  그룹 테스트 메시지
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowLineGroupIdDialog(true)}
                >
                  <Link className="h-4 w-4 mr-2" />
                  그룹 ID 수집
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 프로젝트 현황 보고서 발송 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                프로젝트 현황 보고서
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="projectReport">프로젝트 선택</Label>
                <Select
                  value={selectedProjectReport}
                  onValueChange={setSelectedProjectReport}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="현황 보고서를 발송할 프로젝트를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📊 발송될 보고서 내용</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• 프로젝트 전체 진행률 및 마감일 현황</li>
                  <li>• 업무 현황 통계 (완료/진행중/시작전/지연/임박)</li>
                  <li>• 담당자별 상세 현황 및 개별 진행률</li>
                  <li>• 지연된 업무 목록 및 지연 일수</li>
                  <li>• 시각적 이모지와 진행률 바 표시</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">🚀 다중 플랫폼 발송 상태</h4>
                <div className="space-y-2 text-sm">
                  <div className={`flex items-center justify-between ${lineSettings.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>LINE {lineSettings.enabled ? '✅' : '❌'}</span>
                    </div>
                    <div className="text-xs">
                      개별: {userLineInfo.filter(u => u.isActive).length}명
                      {lineSettings.groupId && ', 그룹: 1개'}
                    </div>
                  </div>
                  <div className={`flex items-center justify-between ${telegramSettings.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>Telegram {telegramSettings.enabled ? '✅' : '❌'}</span>
                    </div>
                    <div className="text-xs">
                      개별: {userTelegramInfo.filter(u => u.isActive).length}명
                      {telegramSettings.groupChatId && ', 그룹: 1개'}
                    </div>
                  </div>
                  <div className={`flex items-center justify-between ${wechatSettings.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>WeChat {wechatSettings.enabled ? '✅' : '❌'}</span>
                    </div>
                    <div className="text-xs">
                      개별: {userWeChatInfo.filter(u => u.isActive).length}명 (준비중)
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-green-700 dark:text-green-300">
                  • 활성화된 플랫폼에만 자동으로 발송됩니다<br/>
                  • 개별 사용자와 그룹 채팅 모두에 발송됩니다
                </div>
              </div>

              <Button 
                onClick={sendProjectStatusReportToAllPlatforms} 
                disabled={!selectedProjectReport || isSendingProjectReport}
                className="w-full"
                size="lg"
              >
                {isSendingProjectReport ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    현황 보고서 발송 중...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    3개 플랫폼으로 프로젝트 현황 보고서 발송
                  </>
                )}
              </Button>
              
              {userLineInfo.filter(u => u.isActive).length === 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ 현재 활성화된 LINE 사용자가 없습니다. 먼저 사용자 관리에서 LINE 사용자를 추가해주세요.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WeChat 설정 탭 */}
        <TabsContent value="wechat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                WeChat 봇 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">WeChat 알림 활성화</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    WeChat을 통한 자동 알림을 활성화합니다.
                  </p>
                </div>
                <Switch
                  checked={wechatSettings.enabled}
                  onCheckedChange={(checked) => 
                    setWeChatSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wechatAppId">App ID</Label>
                  <Input
                    id="wechatAppId"
                    value={wechatSettings.appId}
                    onChange={(e) => 
                      setWeChatSettings(prev => ({ ...prev, appId: e.target.value }))
                    }
                    placeholder="WeChat App ID를 입력하세요"
                  />
                </div>

                <div>
                  <Label htmlFor="wechatAppSecret">App Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      id="wechatAppSecret"
                      type={showWeChatSecret ? "text" : "password"}
                      value={wechatSettings.appSecret}
                      onChange={(e) => 
                        setWeChatSettings(prev => ({ ...prev, appSecret: e.target.value }))
                      }
                      placeholder="WeChat App Secret을 입력하세요"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowWeChatSecret(!showWeChatSecret)}
                    >
                      {showWeChatSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="wechatToken">Token</Label>
                  <Input
                    id="wechatToken"
                    value={wechatSettings.token}
                    onChange={(e) => 
                      setWeChatSettings(prev => ({ ...prev, token: e.target.value }))
                    }
                    placeholder="WeChat Token을 입력하세요"
                  />
                </div>

                <div>
                  <Label htmlFor="wechatEncodingAesKey">Encoding AES Key</Label>
                  <Input
                    id="wechatEncodingAesKey"
                    value={wechatSettings.encodingAesKey}
                    onChange={(e) => 
                      setWeChatSettings(prev => ({ ...prev, encodingAesKey: e.target.value }))
                    }
                    placeholder="Encoding AES Key를 입력하세요"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>주말 알림</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      주말에도 알림을 발송합니다.
                    </p>
                  </div>
                  <Switch
                    checked={wechatSettings.weekendNotifications}
                    onCheckedChange={(checked) => 
                      setWeChatSettings(prev => ({ ...prev, weekendNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>자동 알림</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      마감일 기반 자동 알림을 활성화합니다.
                    </p>
                  </div>
                  <Switch
                    checked={wechatSettings.autoNotifications}
                    onCheckedChange={(checked) => 
                      setWeChatSettings(prev => ({ ...prev, autoNotifications: checked }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  설정 저장
                </Button>
                <Button variant="outline" disabled>
                  <Bot className="h-4 w-4 mr-2" />
                  봇 연결 테스트 (준비중)
                </Button>
                <Button variant="outline" disabled>
                  <Send className="h-4 w-4 mr-2" />
                  테스트 메시지 발송 (준비중)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WeChat 설정 탭 */}
        <TabsContent value="wechat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                WeChat 봇 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">WeChat 알림 활성화</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    WeChat을 통한 자동 알림을 활성화합니다.
                  </p>
                </div>
                <Switch
                  checked={wechatSettings.enabled}
                  onCheckedChange={(checked) => 
                    setWeChatSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appId">App ID</Label>
                    <Input
                      id="appId"
                      value={wechatSettings.appId}
                      onChange={(e) => 
                        setWeChatSettings(prev => ({ ...prev, appId: e.target.value }))
                      }
                      placeholder="App ID를 입력하세요"
                    />
                  </div>

                  <div>
                    <Label htmlFor="appSecret">App Secret</Label>
                    <div className="flex gap-2">
                      <Input
                        id="appSecret"
                        type={showWeChatSecret ? "text" : "password"}
                        value={wechatSettings.appSecret}
                        onChange={(e) => 
                          setWeChatSettings(prev => ({ ...prev, appSecret: e.target.value }))
                        }
                        placeholder="App Secret을 입력하세요"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowWeChatSecret(!showWeChatSecret)}
                      >
                        {showWeChatSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="token">Token</Label>
                    <Input
                      id="token"
                      value={wechatSettings.token}
                      onChange={(e) => 
                        setWeChatSettings(prev => ({ ...prev, token: e.target.value }))
                      }
                      placeholder="Token을 입력하세요"
                    />
                  </div>

                  <div>
                    <Label htmlFor="encodingAesKey">Encoding AES Key</Label>
                    <Input
                      id="encodingAesKey"
                      value={wechatSettings.encodingAesKey}
                      onChange={(e) => 
                        setWeChatSettings(prev => ({ ...prev, encodingAesKey: e.target.value }))
                      }
                      placeholder="Encoding AES Key를 입력하세요"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="wechatNotificationHour">알림 시간</Label>
                    <Select
                      value={wechatSettings.notificationHour.toString()}
                      onValueChange={(value) => 
                        setWeChatSettings(prev => ({ ...prev, notificationHour: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="wechatCheckInterval">체크 간격 (분)</Label>
                    <Select
                      value={wechatSettings.checkInterval.toString()}
                      onValueChange={(value) => 
                        setWeChatSettings(prev => ({ ...prev, checkInterval: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30분</SelectItem>
                        <SelectItem value="60">1시간</SelectItem>
                        <SelectItem value="120">2시간</SelectItem>
                        <SelectItem value="360">6시간</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>주말 알림</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        주말에도 알림을 발송합니다.
                      </p>
                    </div>
                    <Switch
                      checked={wechatSettings.weekendNotifications}
                      onCheckedChange={(checked) => 
                        setWeChatSettings(prev => ({ ...prev, weekendNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>자동 알림</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        마감일 기반 자동 알림을 활성화합니다.
                      </p>
                    </div>
                    <Switch
                      checked={wechatSettings.autoNotifications}
                      onCheckedChange={(checked) => 
                        setWeChatSettings(prev => ({ ...prev, autoNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  설정 저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 사용자 관리 탭 */}
        <TabsContent value="users" className="space-y-6">
          <Tabs defaultValue="telegram" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="telegram">텔레그램 사용자</TabsTrigger>
              <TabsTrigger value="line">LINE 사용자</TabsTrigger>
              <TabsTrigger value="wechat">WeChat 사용자</TabsTrigger>
            </TabsList>

            {/* 텔레그램 사용자 관리 */}
            <TabsContent value="telegram" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      텔레그램 사용자 정보 관리
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => autoMatchUsersByName('telegram')}>
                        <Link className="h-4 w-4 mr-2" />
                        이름 기준 자동 매칭
                      </Button>
                      <Button onClick={addUserTelegramInfo}>
                        <Plus className="h-4 w-4 mr-2" />
                        사용자 추가
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userTelegramInfo.map((user) => {
                      const systemUser = systemUsers.find(sUser => sUser.id === user.userId);
                      
                      return (
                        <div key={user.userId} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{user.name}</h4>
                              {systemUser && (
                                <Badge variant="outline" className="text-xs">
                                  시스템 사용자 연동됨
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.isActive}
                                onCheckedChange={(checked) => updateUserTelegramInfo(user.userId, 'isActive', checked)}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeUserTelegramInfo(user.userId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label>이름</Label>
                              <Input
                                value={user.name}
                                onChange={(e) => updateUserTelegramInfo(user.userId, 'name', e.target.value)}
                                placeholder="사용자 이름"
                              />
                            </div>
                            <div>
                              <Label>텔레그램 사용자명</Label>
                              <Input
                                value={user.telegramUsername}
                                onChange={(e) => updateUserTelegramInfo(user.userId, 'telegramUsername', e.target.value)}
                                placeholder="@username"
                              />
                            </div>
                            <div>
                              <Label>채팅 ID</Label>
                              <Input
                                value={user.telegramChatId}
                                onChange={(e) => updateUserTelegramInfo(user.userId, 'telegramChatId', e.target.value)}
                                placeholder="123456789"
                              />
                            </div>
                          </div>
                          
                          {systemUser && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>연동된 시스템 사용자:</strong> {systemUser.email} ({systemUser.role === 'admin' ? '관리자' : systemUser.role === 'manager' ? '매니저' : '사용자'})
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {userTelegramInfo.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        등록된 텔레그램 사용자가 없습니다. 사용자를 추가해주세요.
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={saveUserTelegramInfo}>
                      <Save className="h-4 w-4 mr-2" />
                      사용자 정보 저장
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* LINE 사용자 관리 */}
            <TabsContent value="line" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      LINE 사용자 정보 관리
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={startLineUserIdCollection} disabled={lineUserIdCollection.isCollecting}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {lineUserIdCollection.isCollecting ? '수집 중...' : 'User ID 수집'}
                      </Button>
                      <Button variant="outline" onClick={sendLineUserIdRequest}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        등록 안내 메시지
                      </Button>
                      <Button variant="outline" onClick={() => setShowManualInputDialog(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        수동 User ID 입력
                      </Button>
                      <Button variant="outline" onClick={() => autoMatchUsersByName('line')}>
                        <Link className="h-4 w-4 mr-2" />
                        이름 기준 자동 매칭
                      </Button>
                      <Button onClick={() => {
                        const newUser: UserLineInfo = {
                          userId: `user_${Date.now()}`,
                          name: '',
                          lineUserId: '',
                          displayName: '',
                          isActive: true
                        };
                        setUserLineInfo([...userLineInfo, newUser]);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        사용자 추가
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userLineInfo.map((user) => {
                      const systemUser = systemUsers.find(sUser => sUser.id === user.userId);
                      
                      return (
                        <div key={user.userId} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{user.name}</h4>
                              {systemUser && (
                                <Badge variant="outline" className="text-xs">
                                  시스템 사용자 연동됨
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.isActive}
                                onCheckedChange={(checked) => {
                                  setUserLineInfo(prev => 
                                    prev.map(u => u.userId === user.userId ? { ...u, isActive: checked } : u)
                                  );
                                }}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setUserLineInfo(prev => prev.filter(u => u.userId !== user.userId))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label>이름</Label>
                              <Input
                                value={user.name}
                                onChange={(e) => {
                                  setUserLineInfo(prev => 
                                    prev.map(u => u.userId === user.userId ? { ...u, name: e.target.value } : u)
                                  );
                                }}
                                placeholder="사용자 이름"
                              />
                            </div>
                            <div>
                              <Label>LINE User ID</Label>
                              <Input
                                value={user.lineUserId}
                                onChange={(e) => {
                                  setUserLineInfo(prev => 
                                    prev.map(u => u.userId === user.userId ? { ...u, lineUserId: e.target.value } : u)
                                  );
                                }}
                                placeholder="U1234567890abcdef"
                              />
                            </div>
                            <div>
                              <Label>표시 이름</Label>
                              <Input
                                value={user.displayName}
                                onChange={(e) => {
                                  setUserLineInfo(prev => 
                                    prev.map(u => u.userId === user.userId ? { ...u, displayName: e.target.value } : u)
                                  );
                                }}
                                placeholder="LINE 표시 이름"
                              />
                            </div>
                          </div>
                          
                          {systemUser && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>연동된 시스템 사용자:</strong> {systemUser.email} ({systemUser.role === 'admin' ? '관리자' : systemUser.role === 'manager' ? '매니저' : '사용자'})
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {userLineInfo.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        등록된 LINE 사용자가 없습니다. 사용자를 추가해주세요.
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={saveUserLineInfo}>
                      <Save className="h-4 w-4 mr-2" />
                      사용자 정보 저장
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* WeChat 사용자 관리 */}
            <TabsContent value="wechat" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      WeChat 사용자 정보 관리
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => autoMatchUsersByName('wechat')}>
                        <Link className="h-4 w-4 mr-2" />
                        이름 기준 자동 매칭
                      </Button>
                      <Button onClick={() => {
                        const newUser: UserWeChatInfo = {
                          userId: `user_${Date.now()}`,
                          name: '',
                          openId: '',
                          nickname: '',
                          isActive: true
                        };
                        setUserWeChatInfo([...userWeChatInfo, newUser]);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        사용자 추가
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userWeChatInfo.map((user) => {
                      const systemUser = systemUsers.find(sUser => sUser.id === user.userId);
                      
                      return (
                        <div key={user.userId} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{user.name}</h4>
                              {systemUser && (
                                <Badge variant="outline" className="text-xs">
                                  시스템 사용자 연동됨
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.isActive}
                                onCheckedChange={(checked) => {
                                  setUserWeChatInfo(prev => 
                                    prev.map(u => u.userId === user.userId ? { ...u, isActive: checked } : u)
                                  );
                                }}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setUserWeChatInfo(prev => prev.filter(u => u.userId !== user.userId))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label>이름</Label>
                              <Input
                                value={user.name}
                                onChange={(e) => {
                                  setUserWeChatInfo(prev => 
                                    prev.map(u => u.userId === user.userId ? { ...u, name: e.target.value } : u)
                                  );
                                }}
                                placeholder="사용자 이름"
                              />
                            </div>
                            <div>
                              <Label>OpenID</Label>
                              <Input
                                value={user.openId}
                                onChange={(e) => {
                                  setUserWeChatInfo(prev => 
                                    prev.map(u => u.userId === user.userId ? { ...u, openId: e.target.value } : u)
                                  );
                                }}
                                placeholder="WeChat OpenID"
                              />
                            </div>
                            <div>
                              <Label>닉네임</Label>
                              <Input
                                value={user.nickname}
                                onChange={(e) => {
                                  setUserWeChatInfo(prev => 
                                    prev.map(u => u.userId === user.userId ? { ...u, nickname: e.target.value } : u)
                                  );
                                }}
                                placeholder="WeChat 닉네임"
                              />
                            </div>
                          </div>
                          
                          {systemUser && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>연동된 시스템 사용자:</strong> {systemUser.email} ({systemUser.role === 'admin' ? '관리자' : systemUser.role === 'manager' ? '매니저' : '사용자'})
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {userWeChatInfo.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        등록된 WeChat 사용자가 없습니다. 사용자를 추가해주세요.
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={saveUserWeChatInfo}>
                      <Save className="h-4 w-4 mr-2" />
                      사용자 정보 저장
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* 메시지 템플릿 탭 */}
        <TabsContent value="templates" className="space-y-6">
          {/* 프로젝트 업무 알림 발송 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                프로젝트 업무 알림 발송
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                선택한 프로젝트의 모든 하위 업무 담당자들에게 개별 알림을 발송합니다.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="projectSelect">프로젝트 선택</Label>
                  <Select 
                    value={selectedProjectForNotification} 
                    onValueChange={setSelectedProjectForNotification}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="알림을 발송할 프로젝트를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={openProjectTaskDialog}
                  disabled={!selectedProjectForNotification}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  발송 확인
                </Button>
              </div>
              
              {/* 발송 결과 표시 */}
              {projectNotificationResults.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium mb-3">발송 결과</h4>
                  <div className="space-y-2">
                    {projectNotificationResults.map((result, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">{result.assigneeName}</span>
                        <span className="text-gray-500">
                          {result.success ? '발송 성공' : `발송 실패: ${result.error}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 기존 메시지 템플릿 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                알림 메시지 템플릿
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationTemplates.map((template) => (
                  <div key={template.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "활성" : "비활성"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={template.isActive}
                          onCheckedChange={(checked) => {
                            // 템플릿 활성화/비활성화 로직
                          }}
                        />
                      </div>
                    </div>
                    <Textarea
                      value={template.template}
                      readOnly
                      className="min-h-[100px] font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      사용 가능한 변수: {'{project_name}, {task_title}, {due_date}, {assignee}, {progress}'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 모니터링 탭 */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                실시간 모니터링
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-800 dark:text-green-200">시스템 상태</h4>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      모든 시스템이 정상 작동 중입니다.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">봇 상태</h4>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      텔레그램 봇이 활성 상태입니다.
                    </p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">최근 알림 로그</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-500">2024-12-23 14:30:25</span>
                      <span>마감일 알림 발송 성공 - 프로젝트 A</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-500">2024-12-23 14:30:20</span>
                      <span>사용자 @john_doe에게 개별 알림 발송</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-500">2024-12-23 09:00:00</span>
                      <span>일일 알림 체크 시작</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 개별 메시지 발송 다이얼로그 */}
      <Dialog open={showIndividualMessageDialog} onOpenChange={setShowIndividualMessageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>개별 알림 발송</DialogTitle>
            <DialogDescription>
              선택한 사용자에게 개별 알림을 발송합니다.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">수신자</p>
                    <p className="font-medium">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">이메일</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="platform">발송 플랫폼</Label>
                <Select value={selectedPlatform} onValueChange={(value: 'telegram' | 'line' | 'wechat') => setSelectedPlatform(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telegram">텔레그램</SelectItem>
                    <SelectItem value="line">LINE</SelectItem>
                    <SelectItem value="wechat">WeChat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="template">메시지 템플릿</Label>
                <Select value={selectedTemplate} onValueChange={(value) => {
                  setSelectedTemplate(value);
                  applyTemplate(value);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">직접 입력</SelectItem>
                    {notificationTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">메시지 내용</Label>
                <Textarea
                  id="message"
                  value={individualMessage}
                  onChange={(e) => setIndividualMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="min-h-[200px]"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIndividualMessageDialog(false)}>
              취소
            </Button>
            <Button onClick={sendIndividualMessage} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              발송
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 프로젝트 업무 알림 확인 다이얼로그 */}
      <Dialog open={showProjectTaskDialog} onOpenChange={setShowProjectTaskDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>프로젝트 업무 알림 발송 확인</DialogTitle>
            <DialogDescription>
              선택한 프로젝트의 모든 하위 업무 담당자들에게 개별 알림을 발송합니다.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProjectForNotification && (
            <div className="space-y-4">
              {(() => {
                const project = projects.find(p => p.id === selectedProjectForNotification);
                const projectTasks = tasks.filter(task => task.projectId === selectedProjectForNotification);
                const assignees = [...new Set(projectTasks
                  .filter(task => task.assignedTo)
                  .map(task => task.assignedTo!)
                )];
                
                return (
                  <>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        📁 {project?.name}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 dark:text-blue-300">총 업무:</span>
                          <span className="font-medium ml-2">{projectTasks.length}개</span>
                        </div>
                        <div>
                          <span className="text-blue-700 dark:text-blue-300">담당자:</span>
                          <span className="font-medium ml-2">{assignees.length}명</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-medium mb-3">📤 발송 대상 담당자</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {assignees.map((assigneeId, index) => {
                          const assigneeName = (() => {
                            const user = users.find(u => u.id === assigneeId);
                            if (user) return user.name || user.email;
                            
                            const employee = employees.find(e => e.id === assigneeId || e.employee_number === assigneeId);
                            if (employee) return employee.name;
                            
                            const manager = managers.find(m => m.id === assigneeId || m.email === assigneeId);
                            if (manager) return manager.name;
                            
                            return '알 수 없음';
                          })();
                          
                          const userTasks = projectTasks.filter(task => task.assignedTo === assigneeId);
                          const telegramInfo = userTelegramInfo.find(info => info.userId === assigneeId && info.isActive);
                          
                          return (
                            <div key={index} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{assigneeName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {userTasks.length}개 업무
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {telegramInfo ? (
                                  <Badge variant="default" className="text-xs bg-green-500">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    텔레그램 설정됨
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    텔레그램 미설정
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            알림 발송 안내
                          </p>
                          <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                            <li>• 각 담당자별로 개별 맞춤 메시지가 발송됩니다</li>
                            <li>• 지연된 업무, 임박한 마감일 등이 포함됩니다</li>
                            <li>• 텔레그램이 설정되지 않은 사용자는 발송되지 않습니다</li>
                            <li>• 그룹 채팅에도 프로젝트 요약이 발송됩니다</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProjectTaskDialog(false)}>
              취소
            </Button>
            <Button 
                              onClick={sendProjectTaskNotificationsToAllPlatforms} 
              disabled={sendingProjectNotification}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendingProjectNotification ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  발송 중...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  즉시 발송
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LINE User ID 수집 다이얼로그 */}
      <Dialog open={showLineUserIdDialog} onOpenChange={setShowLineUserIdDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              LINE User ID 자동 수집
            </DialogTitle>
            <DialogDescription>
              사용자들이 LINE 봇에게 메시지를 보내면 자동으로 User ID가 수집됩니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 수집 상태 표시 */}
            <div className={`p-4 rounded-lg border-2 ${
              lineUserIdCollection.isCollecting 
                ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                : 'border-gray-300 bg-gray-50 dark:bg-gray-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-lg">
                  {lineUserIdCollection.isCollecting ? '🟢 수집 중' : '⚪ 수집 대기'}
                </h3>
                <div className="flex gap-2">
                  {lineUserIdCollection.isCollecting ? (
                    <Button variant="destructive" onClick={stopLineUserIdCollection}>
                      <X className="h-4 w-4 mr-2" />
                      수집 중단
                    </Button>
                  ) : (
                    <Button onClick={startLineUserIdCollection}>
                      <Play className="h-4 w-4 mr-2" />
                      수집 시작
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {lineUserIdCollection.isCollecting ? (
                  <p>✅ 사용자들이 LINE 봇에게 메시지를 보내면 실시간으로 User ID가 수집됩니다.</p>
                ) : (
                  <p>수집을 시작하면 LINE 봇으로 오는 메시지에서 자동으로 User ID를 추출합니다.</p>
                )}
              </div>
            </div>

            {/* 테스트 시뮬레이션 */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium mb-3 text-green-900 dark:text-green-100">
                🧪 테스트 시뮬레이션 (개발/테스트용)
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                실제 LINE 서버 연동 전에 User ID 수집 기능을 테스트해볼 수 있습니다.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => simulateLineUserMessage("홍길동")}
                  className="text-xs"
                >
                  홍길동 시뮬레이션
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => simulateLineUserMessage("김철수")}
                  className="text-xs"
                >
                  김철수 시뮬레이션
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => simulateLineUserMessage("이영희")}
                  className="text-xs"
                >
                  이영희 시뮬레이션
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => simulateLineUserMessage("박민수")}
                  className="text-xs"
                >
                  박민수 시뮬레이션
                </Button>
              </div>
            </div>

            {/* 사용자 안내 */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium mb-3 text-blue-900 dark:text-blue-100">
                📋 사용자 등록 안내 방법
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-700 dark:text-blue-300">1단계:</span>
                  <div>
                    <p className="text-blue-800 dark:text-blue-200">사용자들에게 LINE 봇 계정을 알려주세요</p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">LINE에서 봇을 친구 추가하도록 안내</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-700 dark:text-blue-300">2단계:</span>
                  <div>
                    <p className="text-blue-800 dark:text-blue-200">사용자들이 봇에게 아무 메시지나 보내도록 안내</p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">"등록", "안녕", 또는 자신의 이름 등</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-700 dark:text-blue-300">3단계:</span>
                  <div>
                    <p className="text-blue-800 dark:text-blue-200">수집된 User ID를 시스템 사용자와 매칭</p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">자동 매칭 또는 수동으로 연결</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
                <Button variant="outline" onClick={sendLineUserIdRequest} className="text-sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  등록 안내 메시지 생성
                </Button>
              </div>
            </div>

            {/* Webhook URL 정보 */}
            {lineWebhookUrl && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h4 className="font-medium mb-2 text-yellow-900 dark:text-yellow-100">
                  🔗 Webhook URL (개발자용)
                </h4>
                <div className="flex items-center gap-2">
                  <Input 
                    value={lineWebhookUrl} 
                    readOnly 
                    className="text-xs font-mono"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(lineWebhookUrl);
                      toast({ title: "복사됨", description: "Webhook URL이 클립보드에 복사되었습니다." });
                    }}
                  >
                    복사
                  </Button>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                  LINE Developers Console에서 이 URL을 Webhook URL로 설정하세요.
                </p>
              </div>
            )}

            {/* 수집된 사용자 목록 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">수집된 사용자 ({lineUserIdCollection.collectedUsers.length}명)</h4>
                {lineUserIdCollection.collectedUsers.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setLineUserIdCollection(prev => ({ ...prev, collectedUsers: [] }))}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    목록 초기화
                  </Button>
                )}
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {lineUserIdCollection.collectedUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    수집된 사용자가 없습니다. 사용자들이 LINE 봇에게 메시지를 보내면 여기에 표시됩니다.
                  </div>
                ) : (
                  lineUserIdCollection.collectedUsers.map((user, index) => {
                    const isAlreadyAdded = userLineInfo.some(u => u.lineUserId === user.userId);
                    
                    return (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {user.profileImage && (
                              <img 
                                src={user.profileImage} 
                                alt={user.displayName}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <div>
                              <p className="font-medium">{user.displayName}</p>
                              <p className="text-xs text-gray-500">{user.userId}</p>
                              <p className="text-xs text-gray-400">{user.timestamp}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isAlreadyAdded ? (
                              <Badge variant="secondary">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                추가됨
                              </Badge>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => addLineUserFromCollection(user)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                추가
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">⚠️ 중요: 실제 운영 환경 설정 필요</h4>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                <p className="font-medium">현재 상태: 시뮬레이션 모드</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>실제 LINE 메시지는 아직 수집되지 않습니다</li>
                  <li>위의 테스트 버튼으로 시뮬레이션 테스트 가능</li>
                  <li>실제 수집을 위해서는 백엔드 서버 설정이 필요합니다</li>
                </ul>
                
                <div className="mt-3 pt-2 border-t border-yellow-200 dark:border-yellow-600">
                  <p className="font-medium">실제 운영을 위한 설정:</p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>백엔드 서버에 LINE Webhook 엔드포인트 구현</li>
                    <li>LINE Developers Console에서 Webhook URL 설정</li>
                    <li>SSL 인증서 및 HTTPS 환경 필요</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 추가 안내 */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2">💡 사용 방법</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• <strong>지금 테스트:</strong> 위의 시뮬레이션 버튼을 클릭해보세요</li>
                <li>• <strong>수집된 사용자:</strong> 시스템 사용자와 이름으로 자동 매칭됩니다</li>
                <li>• <strong>수동 연결:</strong> 매칭되지 않은 경우 수동으로 연결할 수 있습니다</li>
                <li>• <strong>실제 운영:</strong> 백엔드 서버 설정 후 실시간 수집 가능</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLineUserIdDialog(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LINE 그룹 ID 수집 다이얼로그 */}
      <Dialog open={showLineGroupIdDialog} onOpenChange={setShowLineGroupIdDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              LINE 그룹 ID 자동 수집
            </DialogTitle>
            <DialogDescription>
              LINE 그룹에서 메시지를 보내면 자동으로 그룹 ID가 수집됩니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 수집 상태 표시 */}
            <div className={`p-4 rounded-lg border-2 ${
              lineGroupIdCollection.isCollecting 
                ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                : 'border-gray-300 bg-gray-50 dark:bg-gray-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-lg">
                  {lineGroupIdCollection.isCollecting ? '🟢 그룹 ID 수집 중' : '⚪ 수집 대기'}
                </h3>
                <div className="flex gap-2">
                  {lineGroupIdCollection.isCollecting ? (
                    <Button variant="destructive" onClick={stopLineGroupIdCollection}>
                      <X className="h-4 w-4 mr-2" />
                      수집 중단
                    </Button>
                  ) : (
                    <Button onClick={startLineGroupIdCollection}>
                      <Play className="h-4 w-4 mr-2" />
                      수집 시작
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {lineGroupIdCollection.isCollecting ? (
                  <p>✅ LINE 그룹에서 메시지를 보내면 실시간으로 그룹 ID가 수집됩니다.</p>
                ) : (
                  <p>수집을 시작하면 LINE 그룹 메시지에서 자동으로 그룹 ID를 추출합니다.</p>
                )}
              </div>
            </div>

            {/* 테스트 시뮬레이션 */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium mb-3 text-green-900 dark:text-green-100">
                🧪 테스트 시뮬레이션 (개발/테스트용)
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                실제 LINE 서버 연동 전에 그룹 ID 수집 기능을 테스트해볼 수 있습니다.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => simulateLineGroupMessage("개발팀 그룹")}
                  className="text-xs"
                >
                  개발팀 그룹
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => simulateLineGroupMessage("프로젝트팀")}
                  className="text-xs"
                >
                  프로젝트팀
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => simulateLineGroupMessage("관리팀 알림")}
                  className="text-xs"
                >
                  관리팀 알림
                </Button>
              </div>
            </div>

            {/* 그룹 설정 안내 */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium mb-3 text-blue-900 dark:text-blue-100">
                📋 LINE 그룹 설정 방법
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-700 dark:text-blue-300">1단계:</span>
                  <div>
                    <p className="text-blue-800 dark:text-blue-200">LINE 그룹 채팅방을 생성하세요</p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">팀원들을 그룹에 초대</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-700 dark:text-blue-300">2단계:</span>
                  <div>
                    <p className="text-blue-800 dark:text-blue-200">LINE 봇을 그룹에 초대하세요</p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">그룹 설정 → 멤버 초대 → 봇 계정 추가</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-700 dark:text-blue-300">3단계:</span>
                  <div>
                    <p className="text-blue-800 dark:text-blue-200">그룹에서 아무 메시지나 보내세요</p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">그룹 ID가 자동으로 수집됩니다</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 수집된 그룹 목록 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">수집된 그룹 ({lineGroupIdCollection.collectedGroups.length}개)</h4>
                {lineGroupIdCollection.collectedGroups.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setLineGroupIdCollection(prev => ({ ...prev, collectedGroups: [] }))}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    목록 초기화
                  </Button>
                )}
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {lineGroupIdCollection.collectedGroups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    수집된 그룹이 없습니다. LINE 그룹에서 메시지를 보내면 여기에 표시됩니다.
                  </div>
                ) : (
                  lineGroupIdCollection.collectedGroups.map((group, index) => {
                    const isCurrentGroup = lineSettings.groupId === group.groupId;
                    
                    return (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{group.groupName}</p>
                              <p className="text-xs text-gray-500 font-mono">{group.groupId}</p>
                              <p className="text-xs text-gray-400">{group.timestamp}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isCurrentGroup ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                현재 설정됨
                              </Badge>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => addLineGroupFromCollection(group)}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                설정으로 적용
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 현재 설정된 그룹 표시 */}
            {lineSettings.groupId && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <h4 className="font-medium mb-2 text-green-800 dark:text-green-200">
                  ✅ 현재 설정된 그룹
                </h4>
                <div className="text-sm">
                  <p className="text-green-700 dark:text-green-300 font-mono">
                    {lineSettings.groupId}
                  </p>
                  <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                    이 그룹으로 알림이 발송됩니다.
                  </p>
                </div>
              </div>
            )}

            {/* 안내 메시지 */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">⚠️ 중요: 실제 운영 환경 설정 필요</h4>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                <p className="font-medium">현재 상태: 시뮬레이션 모드</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>실제 LINE 그룹 메시지는 아직 수집되지 않습니다</li>
                  <li>위의 테스트 버튼으로 시뮬레이션 테스트 가능</li>
                  <li>실제 수집을 위해서는 백엔드 서버 설정이 필요합니다</li>
                </ul>
                
                <div className="mt-3 pt-2 border-t border-yellow-200 dark:border-yellow-600">
                  <p className="font-medium">실제 운영을 위한 설정:</p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>백엔드 서버에 LINE Webhook 엔드포인트 구현</li>
                    <li>그룹 메시지 이벤트 처리 로직 추가</li>
                    <li>LINE Developers Console에서 Webhook URL 설정</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 사용 방법 안내 */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2">💡 사용 방법</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• <strong>지금 테스트:</strong> 위의 시뮬레이션 버튼을 클릭해보세요</li>
                <li>• <strong>그룹 설정:</strong> 수집된 그룹을 "설정으로 적용" 버튼으로 적용</li>
                <li>• <strong>알림 발송:</strong> 설정된 그룹으로 프로젝트 현황이 자동 발송됩니다</li>
                <li>• <strong>실제 운영:</strong> 백엔드 서버 설정 후 실시간 수집 가능</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLineGroupIdDialog(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수동 User ID 입력 다이얼로그 */}
      <Dialog open={showManualInputDialog} onOpenChange={setShowManualInputDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              수동 User ID 입력
            </DialogTitle>
            <DialogDescription>
              LINE User ID와 표시 이름을 직접 입력하여 사용자를 추가합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="manual-userid">LINE User ID</Label>
              <Input
                id="manual-userid"
                value={manualUserId}
                onChange={(e) => setManualUserId(e.target.value)}
                placeholder="U1234567890abcdef..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                U로 시작하는 LINE User ID를 입력하세요 (예: U1234567890abcdef)
              </p>
            </div>
            
            <div>
              <Label htmlFor="manual-displayname">표시 이름</Label>
              <Input
                id="manual-displayname"
                value={manualDisplayName}
                onChange={(e) => setManualDisplayName(e.target.value)}
                placeholder="홍길동"
              />
              <p className="text-xs text-gray-500 mt-1">
                사용자의 표시 이름을 입력하세요
              </p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                💡 User ID 확인 방법
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• LINE Developers Console에서 확인</li>
                <li>• 사용자가 봇에게 메시지를 보내면 Webhook에서 확인 가능</li>
                <li>• LINE Official Account Manager에서 확인</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowManualInputDialog(false);
              setManualUserId('');
              setManualDisplayName('');
            }}>
              취소
            </Button>
            <Button onClick={addManualLineUserId}>
              <Plus className="h-4 w-4 mr-2" />
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExternalNotificationManagement; 