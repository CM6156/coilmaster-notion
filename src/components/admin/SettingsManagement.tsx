'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  CheckCircle, 
  Save, 
  Settings, 
  Users, 
  Clock, 
  Shield, 
  Bell, 
  Building, 
  Globe,
  Sparkles,
  Activity,
  Eye,
  Edit3,
  History,
  UserCheck,
  Zap,
  Palette,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useUserActivity } from "@/context/UserActivityContext";

interface SettingChange {
  id: string;
  user: string;
  avatar: string;
  setting: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  category: string;
}

interface OnlineUser {
  id: string;
  name: string;
  avatar: string;
  status: 'editing' | 'viewing' | 'idle';
  currentSection?: string;
}

export default function SettingsManagement() {
  console.log("🚀 SettingsManagement 컴포넌트가 로드되었습니다!");
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [savedCategory, setSavedCategory] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("company");

  // 탭 변경 시 활동 업데이트
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    updateUserActivity('관리자', `설정관리-${tabValue}`);
  };
  const [saveProgress, setSaveProgress] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  const { currentUsers, updateUserActivity, getUsersOnTab } = useUserActivity();

  // 협업 관련 상태
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 실제 온라인 사용자 가져오기
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      setLoadingUsers(true);
      console.log('🔍 온라인 사용자 조회 시작');
      
      try {
        // 1. 현재 활성 사용자들 가져오기 (last_seen이 최근 5분 이내)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const { data: users, error } = await supabase
          .from('users')
          .select('id, name, email, avatar_url, last_seen, role')
          .gte('last_seen', fiveMinutesAgo)
          .order('last_seen', { ascending: false });

        if (error) {
          console.error('온라인 사용자 조회 오류:', error);
          return;
        }

        console.log('📊 조회된 온라인 사용자:', users);

        // 2. 사용자 상태 결정 로직
        const onlineUsersWithStatus = users?.map(user => {
          const lastSeenTime = new Date(user.last_seen).getTime();
          const now = Date.now();
          const minutesAgo = Math.floor((now - lastSeenTime) / (1000 * 60));

          let status: 'editing' | 'viewing' | 'idle' = 'idle';
          let currentSection = '';

          if (minutesAgo <= 1) {
            status = 'editing';
            currentSection = '설정 관리';
          } else if (minutesAgo <= 3) {
            status = 'viewing';
            currentSection = '관리자 패널';
          } else {
            status = 'idle';
          }

          return {
            id: user.id,
            name: user.name || user.email.split('@')[0],
            avatar: user.avatar_url || `/avatars/default.jpg`,
            status,
            currentSection,
            role: user.role,
            lastSeen: minutesAgo
          };
        }) || [];

        setOnlineUsers(onlineUsersWithStatus);
        console.log('✅ 온라인 사용자 상태 업데이트 완료:', onlineUsersWithStatus);

      } catch (error) {
        console.error('온라인 사용자 조회 중 오류:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    // 초기 로드
    fetchOnlineUsers();

    // 30초마다 갱신
    const interval = setInterval(fetchOnlineUsers, 30000);

    return () => clearInterval(interval);
  }, []);

  // 사용자 활동 추적을 위한 heartbeat 전송
  useEffect(() => {
    const updateUserActivity = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('users')
            .update({ 
              last_seen: new Date().toISOString(),
              current_page: 'admin/settings'
            })
            .eq('id', user.id);
        }
      } catch (error) {
        console.error('사용자 활동 업데이트 오류:', error);
      }
    };

    // 즉시 실행
    updateUserActivity();

    // 1분마다 heartbeat 전송
    const heartbeatInterval = setInterval(updateUserActivity, 60000);

    return () => clearInterval(heartbeatInterval);
  }, []);

  const [recentChanges, setRecentChanges] = useState<SettingChange[]>([]);

  // 최근 변경사항 가져오기
  useEffect(() => {
    const fetchRecentChanges = async () => {
      try {
        console.log('📝 최근 변경사항 조회 시작');
        
        const { data: changes, error } = await supabase
          .from('system_logs')
          .select(`
            id,
            action,
            details,
            created_at,
            user_id,
            users (name, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('변경사항 조회 오류:', error);
          return;
        }

        console.log('📊 조회된 변경사항:', changes);

        const formattedChanges = changes?.map(change => ({
          id: change.id,
          user: (change.users as any)?.name || '알 수 없음',
          avatar: (change.users as any)?.avatar_url || '/avatars/default.jpg',
          setting: change.action || '설정 변경',
          oldValue: change.details?.old_value || '-',
          newValue: change.details?.new_value || '-',
          timestamp: getTimeAgo(change.created_at),
          category: change.details?.category || '기타'
        })) || [];

        setRecentChanges(formattedChanges);
        console.log('✅ 변경사항 업데이트 완료:', formattedChanges);

      } catch (error) {
        console.error('변경사항 조회 중 오류:', error);
      }
    };

    fetchRecentChanges();
  }, []);

  // 시간 포맷 유틸리티
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };

  // 폼 상태 관리
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    ceo: "",
    businessNumber: ""
  });

  const [systemSettings, setSystemSettings] = useState({
    language: "",
    timezone: "",
    dateFormat: ""
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotification: "",
    pushNotification: "",
    notificationTime: ""
  });

  const [securitySettings, setSecuritySettings] = useState({
    passwordPolicy: "",
    sessionTimeout: "",
    twoFactor: ""
  });

  // 컴포넌트 마운트 시 기존 설정 로드
  useEffect(() => {
    console.log("SettingsManagement component mounted");
    loadSettings();
  }, []);

  // 저장 진행률 애니메이션
  useEffect(() => {
    if (isLoading) {
      setSaveProgress(0);
      const interval = setInterval(() => {
        setSaveProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // 기존 설정 로드
  const loadSettings = async () => {
    console.log("Loading settings from Supabase...");
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value');

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Loaded settings data:", data);

      // 설정 데이터를 상태에 매핑
      const settingsMap = data?.reduce((acc: any, setting: any) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {}) || {};

      console.log("Settings map:", settingsMap);

      // 회사 정보
      setCompanyInfo({
        name: settingsMap.company_name || "",
        ceo: settingsMap.company_ceo || "",
        businessNumber: settingsMap.business_number || ""
      });

      // 시스템 설정
      setSystemSettings({
        language: settingsMap.default_language || "",
        timezone: settingsMap.timezone || "",
        dateFormat: settingsMap.date_format || ""
      });

      // 알림 설정
      setNotificationSettings({
        emailNotification: settingsMap.email_notification || "",
        pushNotification: settingsMap.push_notification || "",
        notificationTime: settingsMap.notification_time || ""
      });

      // 보안 설정
      setSecuritySettings({
        passwordPolicy: settingsMap.password_policy || "",
        sessionTimeout: settingsMap.session_timeout || "",
        twoFactor: settingsMap.two_factor_auth || ""
      });

    } catch (error) {
      console.error('Failed to load settings:', error);
      console.log("Using fallback: settings load failed");
    }
  };

  // 설정 저장 함수
  const saveSettingsToSupabase = async (settings: any) => {
    console.log('💾 시스템 설정 저장 시작:', settings);
    
    try {
      // 1. 현재 사용자 및 역할 확인
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔐 현재 사용자:', user);
      
      if (!user) {
        throw new Error('사용자가 인증되지 않았습니다.');
      }

      // 2. 사용자 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, name, email')
        .eq('id', user.id)
        .single();
      
      console.log('👤 사용자 정보:', userData, userError);

      // 3. 관리자 권한 확인
      if (userData?.role !== 'admin') {
        console.warn('⚠️ 관리자 권한이 없습니다. 역할:', userData?.role);
        // 관리자가 아니어도 일단 시도해보기 (RLS 정책에서 판단)
      }

      // 4. 각 설정을 개별적으로 저장 (upsert 방식)
      const results = [];
      for (const [key, value] of Object.entries(settings)) {
        console.log(`📝 저장 중: ${key} = ${value}`);
        
        try {
          // 먼저 기존 설정이 있는지 확인
          const { data: existing, error: selectError } = await supabase
            .from('system_settings')
            .select('*')
            .eq('setting_key', key)
            .maybeSingle();
          
          console.log(`🔍 기존 설정 확인 [${key}]:`, existing, selectError);

          if (existing) {
            // 기존 설정이 있으면 업데이트
            const { data: updateData, error: updateError } = await supabase
              .from('system_settings')
              .update({
                setting_value: String(value),
                updated_at: new Date().toISOString()
              })
              .eq('setting_key', key)
              .select();
            
            console.log(`✏️ 업데이트 결과 [${key}]:`, updateData, updateError);
            
            if (updateError) {
              console.error(`❌ 업데이트 실패 [${key}]:`, updateError);
              throw updateError;
            }
            
            results.push({ key, action: 'update', success: true, data: updateData });
          } else {
            // 기존 설정이 없으면 새로 생성
            const { data: insertData, error: insertError } = await supabase
              .from('system_settings')
              .insert({
                setting_key: key,
                setting_value: String(value),
                setting_type: 'string',
                is_public: true,
                description: `${key} 설정`
              })
              .select();
            
            console.log(`➕ 생성 결과 [${key}]:`, insertData, insertError);
            
            if (insertError) {
              console.error(`❌ 생성 실패 [${key}]:`, insertError);
              throw insertError;
            }
            
            results.push({ key, action: 'insert', success: true, data: insertData });
          }
        } catch (error: any) {
          console.error(`❌ 설정 저장 실패 [${key}]:`, error);
          results.push({ key, action: 'failed', success: false, error: error.message });
        }
      }

      console.log('📊 전체 저장 결과:', results);
      
      // 성공한 항목과 실패한 항목 구분
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (failed.length > 0) {
        console.warn('⚠️ 일부 설정 저장 실패:', failed);
        alert(`일부 설정 저장에 실패했습니다:\n${failed.map(f => `- ${f.key}: ${f.error}`).join('\n')}`);
      }
      
      if (successful.length > 0) {
        console.log('✅ 저장 성공한 설정:', successful);
        alert(`${successful.length}개 설정이 성공적으로 저장되었습니다.`);
      }
      
      return { success: successful.length > 0, results };
      
    } catch (error: any) {
      console.error('❌ 시스템 설정 저장 중 전체 오류:', error);
      throw error;
    }
  };

  const handleSave = async (category: string) => {
    console.log("=== 설정 저장 버튼 클릭됨 ===");
    console.log(`Save button clicked for category: ${category}`);
    console.log("isLoading 현재 상태:", isLoading);
    console.log("현재 폼 데이터 상태:");
    console.log("- companyInfo:", companyInfo);
    console.log("- systemSettings:", systemSettings);
    console.log("- notificationSettings:", notificationSettings);
    console.log("- securitySettings:", securitySettings);
    
    if (isLoading) {
      console.log("이미 로딩 중이므로 중복 요청 차단");
      return;
    }
    
    setIsLoading(true);
    setSavedCategory(category);
    console.log("로딩 상태 설정 완료, 저장 시작...");

    try {
      let settingsData: { [key: string]: string } = {};

      // 카테고리별 설정 데이터 준비
      switch (category) {
        case "회사 정보":
          console.log("회사 정보 데이터 준비 중...");
          settingsData = {
            company_name: companyInfo.name,
            company_ceo: companyInfo.ceo,
            business_number: companyInfo.businessNumber
          };
          console.log("회사 정보 데이터:", settingsData);
          break;
        case "시스템 설정":
          console.log("시스템 설정 데이터 준비 중...");
          settingsData = {
            default_language: systemSettings.language,
            timezone: systemSettings.timezone,
            date_format: systemSettings.dateFormat
          };
          console.log("시스템 설정 데이터:", settingsData);
          break;
        case "알림 설정":
          console.log("알림 설정 데이터 준비 중...");
          settingsData = {
            email_notification: notificationSettings.emailNotification,
            push_notification: notificationSettings.pushNotification,
            notification_time: notificationSettings.notificationTime
          };
          console.log("알림 설정 데이터:", settingsData);
          break;
        case "보안 설정":
          console.log("보안 설정 데이터 준비 중...");
          settingsData = {
            password_policy: securitySettings.passwordPolicy,
            session_timeout: securitySettings.sessionTimeout,
            two_factor_auth: securitySettings.twoFactor
          };
          console.log("보안 설정 데이터:", settingsData);
          break;
        default:
          console.log("알 수 없는 카테고리:", category);
      }

      console.log("Prepared settings data:", settingsData);

      // 빈 값 제거
      const filteredSettings = Object.fromEntries(
        Object.entries(settingsData).filter(([_, value]) => value.trim() !== '')
      );

      console.log("Filtered settings:", filteredSettings);

      if (Object.keys(filteredSettings).length === 0) {
        console.log("No settings to save");
        toast({
          title: "저장할 설정이 없습니다",
          description: "최소 하나 이상의 설정을 입력해주세요.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Supabase에 저장
      await saveSettingsToSupabase(filteredSettings);
      
      // 진행률 완료
      setSaveProgress(100);
      
      // 설정 저장 후 다시 로드하여 화면 업데이트
      await loadSettings();
      
      setTimeout(() => {
        setIsLoading(false);
        setShowSuccessModal(true);
        setLastSaved(new Date());
        setSaveProgress(0);
      }, 500);

      console.log("Settings saved successfully");

      // 성공 토스트 메시지
      toast({
        title: "설정 저장 완료",
        description: `${category} 설정이 성공적으로 저장되었습니다.`,
      });

    } catch (error) {
      setIsLoading(false);
      setSaveProgress(0);
      console.error('Save error:', error);
      
      // 에러 메시지 설정
      const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
      
      toast({
        title: "저장 실패",
        description: `${category} 설정 저장 중 오류가 발생했습니다: ${errorMsg}`,
        variant: "destructive"
      });
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setSavedCategory("");
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setSavedCategory("");
    setErrorMessage("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'editing': return 'bg-orange-500';
      case 'viewing': return 'bg-green-500';
      case 'idle': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'company': return <Building className="h-5 w-5" />;
      case 'system': return <Settings className="h-5 w-5" />;
      case 'notifications': return <Bell className="h-5 w-5" />;
      case 'security': return <Shield className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더 섹션 */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">설정 관리</h1>
                    <p className="text-lg text-white/80">시스템 설정을 협업으로 관리합니다</p>
                  </div>
                </div>
                
                {lastSaved && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Clock className="h-4 w-4" />
                    마지막 저장: {lastSaved.toLocaleTimeString()}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={loadSettings} 
                        variant="secondary" 
                        size="lg"
                        className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                      >
                        <RefreshCw className="h-5 w-5 mr-2" />
                        새로고침
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>최신 설정을 불러옵니다</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          
          {/* 장식적 요소 */}
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10"></div>
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5"></div>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 왼쪽 사이드바 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 온라인 사용자 */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-green-600" />
                  온라인 사용자
                  <Badge variant="secondary" className="ml-auto">
                    {onlineUsers.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentUsers.filter(u => u.isOnline && u.currentPage === '관리자').length === 0 ? (
                  <div className="text-center py-4">
                    <UserCheck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">현재 설정관리에 온라인 사용자가 없습니다</p>
                  </div>
                ) : (
                  currentUsers
                    .filter(u => u.isOnline && u.currentPage === '관리자')
                    .map((user) => {
                      const minutesAgo = Math.floor((Date.now() - user.lastActivity.getTime()) / (1000 * 60));
                      return (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            {user.currentTab && (
                              <p className="text-xs text-gray-500 truncate">
                                {user.currentTab.replace('설정관리-', '')} 탭
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {minutesAgo === 0 ? '방금 전' : `${minutesAgo}분 전`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {minutesAgo <= 1 && <Edit3 className="h-3 w-3 text-orange-500" />}
                            {minutesAgo > 1 && minutesAgo <= 3 && <Eye className="h-3 w-3 text-green-500" />}
                            {user.role === 'admin' && <Shield className="h-3 w-3 text-purple-500" />}
                          </div>
                        </div>
                      );
                    })
                )}
              </CardContent>
            </Card>

            {/* 최근 변경사항 */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="h-5 w-5 text-blue-600" />
                  최근 변경사항
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentChanges.length === 0 ? (
                  <div className="text-center py-4">
                    <History className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">최근 변경사항이 없습니다</p>
                  </div>
                ) : (
                  recentChanges.map((change) => (
                    <div key={change.id} className="p-3 rounded-lg bg-gray-50 space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={change.avatar} />
                          <AvatarFallback>{change.user[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{change.user}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {change.category}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">{change.setting}</span> 변경
                      </div>
                      <div className="text-xs text-gray-500">
                        {change.timestamp}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border-0 shadow-lg p-1 h-14">
                <TabsTrigger 
                  value="company" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <Building className="h-4 w-4" />
                  회사 정보
                </TabsTrigger>
                <TabsTrigger 
                  value="system"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
                >
                  <Settings className="h-4 w-4" />
                  시스템
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
                >
                  <Bell className="h-4 w-4" />
                  알림
                </TabsTrigger>
                <TabsTrigger 
                  value="security"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                >
                  <Shield className="h-4 w-4" />
                  보안
                </TabsTrigger>
              </TabsList>

              {/* 저장 진행률 */}
              {isLoading && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {savedCategory} 설정 저장 중...
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              데이터베이스에 변경사항을 저장하고 있습니다
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 font-mono">{saveProgress}%</span>
                      </div>
                      <div className="space-y-2">
                        <Progress value={saveProgress} className="h-3" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>설정 검증 및 저장</span>
                          <span>완료되면 자동으로 새로고침됩니다</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 회사 정보 탭 */}
              <TabsContent value="company" className="space-y-6">
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 p-3 text-white">
                        <Building className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">회사 정보</CardTitle>
                        <CardDescription className="text-base">기본적인 회사 정보를 설정합니다</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="company-name" className="text-sm font-semibold">회사명</Label>
                        <Input 
                          id="company-name"
                          value={companyInfo.name}
                          onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                          placeholder="(주)코일마스터"
                          className="h-12 border-2 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ceo-name" className="text-sm font-semibold">대표자명</Label>
                        <Input 
                          id="ceo-name"
                          value={companyInfo.ceo}
                          onChange={(e) => setCompanyInfo({...companyInfo, ceo: e.target.value})}
                          placeholder="대표자명을 입력하세요"
                          className="h-12 border-2 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business-number" className="text-sm font-semibold">사업자등록번호</Label>
                      <Input 
                        id="business-number"
                        value={companyInfo.businessNumber}
                        onChange={(e) => setCompanyInfo({...companyInfo, businessNumber: e.target.value})}
                        placeholder="000-00-00000"
                        className="h-12 border-2 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <Button 
                      onClick={() => {
                        console.log("🔘 회사 정보 저장 버튼 클릭!");
                        handleSave("회사 정보");
                      }}
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isLoading && savedCategory === "회사 정보" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          저장 중...
                        </div>
                      ) : (
                        <>
                          <Zap className="h-5 w-5 mr-2" />
                          설정 저장
                        </>
                      )}
                    </Button>


                  </CardContent>
                </Card>
              </TabsContent>

              {/* 시스템 설정 탭 */}
              <TabsContent value="system" className="space-y-6">
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-green-500 to-teal-500"></div>
                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-gradient-to-r from-green-500 to-teal-500 p-3 text-white">
                        <Settings className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">시스템 설정</CardTitle>
                        <CardDescription className="text-base">시스템 기본 설정을 관리합니다</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="language" className="text-sm font-semibold">기본 언어</Label>
                        <Select value={systemSettings.language} onValueChange={(value) => setSystemSettings({...systemSettings, language: value})}>
                          <SelectTrigger id="language" className="h-12 border-2 focus:border-green-500">
                            <SelectValue placeholder="한국어" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ko">🇰🇷 한국어</SelectItem>
                            <SelectItem value="en">🇺🇸 English</SelectItem>
                            <SelectItem value="th">🇹🇭 ไทย</SelectItem>
                            <SelectItem value="zh">🇨🇳 中文</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-sm font-semibold">시간대</Label>
                        <Select value={systemSettings.timezone} onValueChange={(value) => setSystemSettings({...systemSettings, timezone: value})}>
                          <SelectTrigger id="timezone" className="h-12 border-2 focus:border-green-500">
                            <SelectValue placeholder="아시아/서울 (GMT+9)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Seoul">🇰🇷 아시아/서울 (GMT+9)</SelectItem>
                            <SelectItem value="UTC">🌍 UTC (GMT+0)</SelectItem>
                            <SelectItem value="America/New_York">🇺🇸 뉴욕 (GMT-5)</SelectItem>
                            <SelectItem value="Europe/London">🇬🇧 런던 (GMT+0)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-format" className="text-sm font-semibold">날짜 형식</Label>
                      <Select value={systemSettings.dateFormat} onValueChange={(value) => setSystemSettings({...systemSettings, dateFormat: value})}>
                        <SelectTrigger id="date-format" className="h-12 border-2 focus:border-green-500">
                          <SelectValue placeholder="YYYY-MM-DD" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                          <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                          <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={() => {
                        console.log("🔘 시스템 설정 저장 버튼 클릭!");
                        handleSave("시스템 설정");
                      }}
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isLoading && savedCategory === "시스템 설정" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          저장 중...
                        </div>
                      ) : (
                        <>
                          <Zap className="h-5 w-5 mr-2" />
                          설정 저장
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 알림 설정 탭 */}
              <TabsContent value="notifications" className="space-y-6">
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500"></div>
                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 p-3 text-white">
                        <Bell className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">알림 설정</CardTitle>
                        <CardDescription className="text-base">시스템 알림 설정을 관리합니다</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email-notification" className="text-sm font-semibold">이메일 알림</Label>
                        <Select value={notificationSettings.emailNotification} onValueChange={(value) => setNotificationSettings({...notificationSettings, emailNotification: value})}>
                          <SelectTrigger id="email-notification" className="h-12 border-2 focus:border-orange-500">
                            <SelectValue placeholder="모든 알림" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">📧 모든 알림</SelectItem>
                            <SelectItem value="important">⚠️ 중요 알림만</SelectItem>
                            <SelectItem value="none">🔕 알림 끄기</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="push-notification" className="text-sm font-semibold">푸시 알림</Label>
                        <Select value={notificationSettings.pushNotification} onValueChange={(value) => setNotificationSettings({...notificationSettings, pushNotification: value})}>
                          <SelectTrigger id="push-notification" className="h-12 border-2 focus:border-orange-500">
                            <SelectValue placeholder="중요 알림만" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">🔔 모든 알림</SelectItem>
                            <SelectItem value="important">⚠️ 중요 알림만</SelectItem>
                            <SelectItem value="none">🔕 알림 끄기</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notification-time" className="text-sm font-semibold">알림 시간</Label>
                      <Select value={notificationSettings.notificationTime} onValueChange={(value) => setNotificationSettings({...notificationSettings, notificationTime: value})}>
                        <SelectTrigger id="notification-time" className="h-12 border-2 focus:border-orange-500">
                          <SelectValue placeholder="오전 9시" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">🌅 오전 9시</SelectItem>
                          <SelectItem value="12:00">☀️ 오후 12시</SelectItem>
                          <SelectItem value="18:00">🌆 오후 6시</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={() => {
                        console.log("🔘 알림 설정 저장 버튼 클릭!");
                        handleSave("알림 설정");
                      }}
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isLoading && savedCategory === "알림 설정" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          저장 중...
                        </div>
                      ) : (
                        <>
                          <Zap className="h-5 w-5 mr-2" />
                          설정 저장
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 보안 설정 탭 */}
              <TabsContent value="security" className="space-y-6">
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-red-500 to-pink-500"></div>
                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 p-3 text-white">
                        <Shield className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">보안 설정</CardTitle>
                        <CardDescription className="text-base">시스템 보안 설정을 관리합니다</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="password-policy" className="text-sm font-semibold">비밀번호 정책</Label>
                        <Select value={securitySettings.passwordPolicy} onValueChange={(value) => setSecuritySettings({...securitySettings, passwordPolicy: value})}>
                          <SelectTrigger id="password-policy" className="h-12 border-2 focus:border-red-500">
                            <SelectValue placeholder="강력" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="strong">🔒 강력 (8자 이상, 특수문자 포함)</SelectItem>
                            <SelectItem value="medium">🔐 중간 (6자 이상)</SelectItem>
                            <SelectItem value="basic">🔓 기본 (4자 이상)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="two-factor" className="text-sm font-semibold">2단계 인증</Label>
                        <Select value={securitySettings.twoFactor} onValueChange={(value) => setSecuritySettings({...securitySettings, twoFactor: value})}>
                          <SelectTrigger id="two-factor" className="h-12 border-2 focus:border-red-500">
                            <SelectValue placeholder="비활성화" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">✅ 활성화</SelectItem>
                            <SelectItem value="disabled">❌ 비활성화</SelectItem>
                            <SelectItem value="optional">⚡ 선택사항</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-timeout" className="text-sm font-semibold">세션 타임아웃 (분)</Label>
                      <Input 
                        id="session-timeout"
                        type="number" 
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: e.target.value})}
                        placeholder="60"
                        className="h-12 border-2 focus:border-red-500 transition-colors"
                      />
                    </div>
                    <Button 
                      onClick={() => {
                        console.log("🔘 보안 설정 저장 버튼 클릭!");
                        handleSave("보안 설정");
                      }}
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isLoading && savedCategory === "보안 설정" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          저장 중...
                        </div>
                      ) : (
                        <>
                          <Zap className="h-5 w-5 mr-2" />
                          설정 저장
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* 저장 성공 모달 */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              저장 완료!
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              <span className="font-semibold text-gray-700">{savedCategory}</span> 설정이 성공적으로 저장되었습니다.
              <br />
              {lastSaved && (
                <div className="text-sm text-green-600 mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <span className="font-medium">저장 완료:</span> {lastSaved.toLocaleString('ko-KR')}
                </div>
              )}
              <span className="text-sm text-gray-500 mt-2 block">모든 팀원에게 변경사항이 동기화됩니다.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={handleCloseModal} 
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 저장 실패 모달 */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-400 to-pink-500 rounded-full">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              저장 실패
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              <span className="font-semibold text-gray-700">{savedCategory}</span> 설정 저장에 실패했습니다.
              <br />
              <div className="text-sm text-red-600 mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="font-medium">오류 상세:</span><br />
                {errorMessage}
              </div>
              <span className="text-sm text-gray-500 mt-2 block">잠시 후 다시 시도해주세요.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Button 
              onClick={handleCloseErrorModal} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              닫기
            </Button>
            <Button 
              onClick={() => {
                handleCloseErrorModal();
                handleSave(savedCategory);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold shadow-lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 