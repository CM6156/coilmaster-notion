import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  MessageCircle, 
  Users, 
  Settings, 
  Monitor, 
  Send, 
  CheckCircle, 
  XCircle, 
  Bot,
  Zap,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  Activity,
  Clock,
  User
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';

interface TelegramSettings {
  id: string;
  bot_token: string;
  webhook_url?: string;
  is_active: boolean;
  default_chat_id?: string;
  created_at: string;
  updated_at: string;
}

interface TelegramUser {
  id: string;
  user_id: string;
  telegram_chat_id: string;
  telegram_username?: string;
  telegram_first_name?: string;
  telegram_last_name?: string;
  is_active: boolean;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

interface MessageTemplate {
  id: string;
  name: string;
  type: string;
  template_text: string;
  variables?: any;
  is_active: boolean;
  created_by?: string;
}

interface MessageLog {
  id: string;
  chat_id: string;
  message_text: string;
  message_type: string;
  sent_by?: string;
  sent_at: string;
  success: boolean;
  error_message?: string;
  telegram_message_id?: number;
  sender?: {
    name: string;
    email: string;
  };
}

const TelegramManagement: React.FC = () => {
  const { currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(false);
  
  // 텔레그램 설정 상태
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    bot_token: '',
    webhook_url: '',
    is_active: false,
    default_chat_id: ''
  });

  // 텔레그램 사용자 상태
  const [telegramUsers, setTelegramUsers] = useState<TelegramUser[]>([]);
  const [newUserForm, setNewUserForm] = useState({
    user_id: '',
    telegram_chat_id: '',
    telegram_username: ''
  });

  // 메시지 템플릿 상태
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: '',
    type: 'custom',
    template_text: '',
    is_active: true
  });
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  // 메시지 로그 상태
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [testMessage, setTestMessage] = useState({
    chat_id: '',
    message: ''
  });

  // 봇 상태 확인
  const [botStatus, setBotStatus] = useState<{
    isOnline: boolean;
    username?: string;
    firstName?: string;
    canJoinGroups?: boolean;
    canReadAllGroupMessages?: boolean;
    supportsInlineQueries?: boolean;
  } | null>(null);

  // 데이터 로드
  useEffect(() => {
    loadTelegramSettings();
    loadTelegramUsers();
    loadMessageTemplates();
    loadMessageLogs();
  }, []);

  // 텔레그램 설정 로드
  const loadTelegramSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('텔레그램 설정 로드 오류:', error);
        return;
      }

      if (data) {
        setTelegramSettings(data);
        setSettingsForm({
          bot_token: data.bot_token || '',
          webhook_url: data.webhook_url || '',
          is_active: data.is_active || false,
          default_chat_id: data.default_chat_id || ''
        });

        // 봇 상태 확인
        if (data.bot_token && data.is_active) {
          checkBotStatus(data.bot_token);
        }
      }
    } catch (error) {
      console.error('텔레그램 설정 로드 실패:', error);
    }
  };

  // 텔레그램 사용자 로드
  const loadTelegramUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_users')
        .select(`
          *,
          user:users(name, email, role)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('텔레그램 사용자 로드 오류:', error);
        return;
      }

      setTelegramUsers(data || []);
    } catch (error) {
      console.error('텔레그램 사용자 로드 실패:', error);
    }
  };

  // 메시지 템플릿 로드
  const loadMessageTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('메시지 템플릿 로드 오류:', error);
        return;
      }

      setMessageTemplates(data || []);
    } catch (error) {
      console.error('메시지 템플릿 로드 실패:', error);
    }
  };

  // 메시지 로그 로드
  const loadMessageLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_message_logs')
        .select(`
          *,
          sender:users(name, email)
        `)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('메시지 로그 로드 오류:', error);
        return;
      }

      setMessageLogs(data || []);
    } catch (error) {
      console.error('메시지 로그 로드 실패:', error);
    }
  };

  // 봇 상태 확인
  const checkBotStatus = async (token: string) => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await response.json();

      if (data.ok) {
        setBotStatus({
          isOnline: true,
          username: data.result.username,
          firstName: data.result.first_name,
          canJoinGroups: data.result.can_join_groups,
          canReadAllGroupMessages: data.result.can_read_all_group_messages,
          supportsInlineQueries: data.result.supports_inline_queries
        });
      } else {
        setBotStatus({ isOnline: false });
      }
    } catch (error) {
      console.error('봇 상태 확인 실패:', error);
      setBotStatus({ isOnline: false });
    }
  };

  // 텔레그램 설정 저장
  const saveTelegramSettings = async () => {
    setLoading(true);
    try {
      const settingsData = {
        bot_token: settingsForm.bot_token,
        webhook_url: settingsForm.webhook_url || null,
        is_active: settingsForm.is_active,
        default_chat_id: settingsForm.default_chat_id || null,
        updated_at: new Date().toISOString()
      };

      if (telegramSettings) {
        // 업데이트
        const { error } = await supabase
          .from('telegram_settings')
          .update(settingsData)
          .eq('id', telegramSettings.id);

        if (error) throw error;
      } else {
        // 생성
        const { error } = await supabase
          .from('telegram_settings')
          .insert([settingsData]);

        if (error) throw error;
      }

      await loadTelegramSettings();

      toast({
        title: "설정 저장 완료",
        description: "텔레그램 설정이 성공적으로 저장되었습니다.",
      });

      // 봇 상태 재확인
      if (settingsForm.bot_token && settingsForm.is_active) {
        checkBotStatus(settingsForm.bot_token);
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
      toast({
        title: "설정 저장 실패",
        description: "텔레그램 설정 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 테스트 메시지 발송
  const sendTestMessage = async () => {
    if (!settingsForm.bot_token || !testMessage.chat_id || !testMessage.message) {
      toast({
        title: "입력 오류",
        description: "봇 토큰, 채팅 ID, 메시지를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://api.telegram.org/bot${settingsForm.bot_token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: testMessage.chat_id,
          text: testMessage.message,
        }),
      });

      const data = await response.json();

      // 로그 저장
      await supabase
        .from('telegram_message_logs')
        .insert([{
          chat_id: testMessage.chat_id,
          message_text: testMessage.message,
          message_type: 'test',
          sent_by: currentUser?.id,
          sent_at: new Date().toISOString(),
          success: data.ok,
          error_message: data.ok ? null : data.description,
          telegram_message_id: data.ok ? data.result.message_id : null
        }]);

      if (data.ok) {
        toast({
          title: "메시지 발송 성공",
          description: "테스트 메시지가 성공적으로 발송되었습니다.",
        });
        setTestMessage({ chat_id: '', message: '' });
      } else {
        toast({
          title: "메시지 발송 실패",
          description: data.description || "메시지 발송 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }

      await loadMessageLogs();
    } catch (error) {
      console.error('테스트 메시지 발송 실패:', error);
      toast({
        title: "메시지 발송 실패",
        description: "네트워크 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 메시지 템플릿 저장
  const saveMessageTemplate = async () => {
    setLoading(true);
    try {
      const templateData = {
        name: newTemplateForm.name,
        type: newTemplateForm.type,
        template_text: newTemplateForm.template_text,
        is_active: newTemplateForm.is_active,
        created_by: currentUser?.id,
        variables: {}
      };

      if (editingTemplate) {
        // 업데이트
        const { error } = await supabase
          .from('message_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        // 생성
        const { error } = await supabase
          .from('message_templates')
          .insert([templateData]);

        if (error) throw error;
      }

      await loadMessageTemplates();
      setNewTemplateForm({ name: '', type: 'custom', template_text: '', is_active: true });
      setEditingTemplate(null);

      toast({
        title: "템플릿 저장 완료",
        description: "메시지 템플릿이 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error('템플릿 저장 실패:', error);
      toast({
        title: "템플릿 저장 실패",
        description: "메시지 템플릿 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 메시지 템플릿 삭제
  const deleteMessageTemplate = async (templateId: string) => {
    if (!confirm('정말로 이 템플릿을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      await loadMessageTemplates();

      toast({
        title: "템플릿 삭제 완료",
        description: "메시지 템플릿이 성공적으로 삭제되었습니다.",
      });
    } catch (error) {
      console.error('템플릿 삭제 실패:', error);
      toast({
        title: "템플릿 삭제 실패",
        description: "메시지 템플릿 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">텔레그램 알림 관리</h2>
            <p className="text-muted-foreground">텔레그램 봇 설정 및 알림 관리</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {botStatus && (
            <Badge variant={botStatus.isOnline ? "default" : "destructive"} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${botStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              {botStatus.isOnline ? '봇 온라인' : '봇 오프라인'}
            </Badge>
          )}
          <Button onClick={() => {
            loadTelegramSettings();
            loadTelegramUsers();
            loadMessageTemplates();
            loadMessageLogs();
          }} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            봇 설정
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            사용자 관리
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            메시지 템플릿
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            모니터링
          </TabsTrigger>
        </TabsList>

        {/* 봇 설정 탭 */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 봇 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  봇 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bot_token">봇 토큰</Label>
                  <Input
                    id="bot_token"
                    type="password"
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    value={settingsForm.bot_token}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, bot_token: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_chat_id">기본 채팅 ID</Label>
                  <Input
                    id="default_chat_id"
                    placeholder="-1001234567890"
                    value={settingsForm.default_chat_id}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, default_chat_id: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook_url">웹훅 URL (선택사항)</Label>
                  <Input
                    id="webhook_url"
                    placeholder="https://your-domain.com/webhook"
                    value={settingsForm.webhook_url}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, webhook_url: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={settingsForm.is_active}
                    onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">텔레그램 알림 활성화</Label>
                </div>

                <Button onClick={saveTelegramSettings} disabled={loading} className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  {loading ? '저장 중...' : '설정 저장'}
                </Button>
              </CardContent>
            </Card>

            {/* 봇 상태 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  봇 상태
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {botStatus ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">상태</span>
                      <Badge variant={botStatus.isOnline ? "default" : "destructive"}>
                        {botStatus.isOnline ? '온라인' : '오프라인'}
                      </Badge>
                    </div>

                    {botStatus.isOnline && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">사용자명</span>
                          <span className="text-sm">@{botStatus.username}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">이름</span>
                          <span className="text-sm">{botStatus.firstName}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">그룹 참여</span>
                          <Badge variant={botStatus.canJoinGroups ? "default" : "secondary"}>
                            {botStatus.canJoinGroups ? '가능' : '불가능'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">인라인 쿼리</span>
                          <Badge variant={botStatus.supportsInlineQueries ? "default" : "secondary"}>
                            {botStatus.supportsInlineQueries ? '지원' : '미지원'}
                          </Badge>
                        </div>
                      </>
                    )}

                    <Button 
                      onClick={() => settingsForm.bot_token && checkBotStatus(settingsForm.bot_token)} 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      상태 새로고침
                    </Button>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      봇 토큰을 입력하고 활성화하여 봇 상태를 확인하세요.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 테스트 메시지 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                테스트 메시지
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="test_chat_id">채팅 ID</Label>
                  <Input
                    id="test_chat_id"
                    placeholder="채팅 ID를 입력하세요"
                    value={testMessage.chat_id}
                    onChange={(e) => setTestMessage(prev => ({ ...prev, chat_id: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test_message">메시지</Label>
                  <Input
                    id="test_message"
                    placeholder="테스트 메시지를 입력하세요"
                    value={testMessage.message}
                    onChange={(e) => setTestMessage(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={sendTestMessage} disabled={loading || !settingsForm.bot_token}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? '발송 중...' : '테스트 메시지 발송'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 사용자 관리 탭 */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                텔레그램 사용자 목록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {telegramUsers.length > 0 ? (
                  <div className="space-y-2">
                    {telegramUsers.map((telegramUser) => (
                      <div key={telegramUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-blue-100">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {telegramUser.user?.name || '알 수 없는 사용자'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {telegramUser.user?.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              채팅 ID: {telegramUser.telegram_chat_id}
                              {telegramUser.telegram_username && ` • @${telegramUser.telegram_username}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={telegramUser.user?.role === 'admin' ? "default" : "secondary"}>
                            {telegramUser.user?.role || 'user'}
                          </Badge>
                          <Badge variant={telegramUser.is_active ? "default" : "secondary"}>
                            {telegramUser.is_active ? '활성' : '비활성'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      등록된 텔레그램 사용자가 없습니다.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 메시지 템플릿 탭 */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 템플릿 목록 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  메시지 템플릿 목록
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {messageTemplates.map((template) => (
                    <div key={template.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{template.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{template.type}</Badge>
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? '활성' : '비활성'}
                          </Badge>
                          <Button
                            onClick={() => {
                              setEditingTemplate(template);
                              setNewTemplateForm({
                                name: template.name,
                                type: template.type,
                                template_text: template.template_text,
                                is_active: template.is_active
                              });
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => deleteMessageTemplate(template.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {template.template_text.slice(0, 100)}
                        {template.template_text.length > 100 && '...'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 새 템플릿 추가/편집 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {editingTemplate ? '템플릿 편집' : '새 템플릿 추가'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template_name">템플릿 이름</Label>
                  <Input
                    id="template_name"
                    placeholder="템플릿 이름을 입력하세요"
                    value={newTemplateForm.name}
                    onChange={(e) => setNewTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template_type">템플릿 유형</Label>
                  <select
                    id="template_type"
                    className="w-full px-3 py-2 border rounded-md"
                    value={newTemplateForm.type}
                    onChange={(e) => setNewTemplateForm(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="custom">커스텀</option>
                    <option value="task_assigned">업무 할당</option>
                    <option value="project_update">프로젝트 업데이트</option>
                    <option value="deadline_reminder">마감일 알림</option>
                    <option value="system_alert">시스템 알림</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template_text">메시지 템플릿</Label>
                  <Textarea
                    id="template_text"
                    placeholder="메시지 템플릿을 입력하세요..."
                    rows={6}
                    value={newTemplateForm.template_text}
                    onChange={(e) => setNewTemplateForm(prev => ({ ...prev, template_text: e.target.value }))}
                  />
                  <div className="text-xs text-muted-foreground">
                    변수 사용 예: {'{task_title}'}, {'{assignee}'}, {'{due_date}'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="template_active"
                    checked={newTemplateForm.is_active}
                    onCheckedChange={(checked) => setNewTemplateForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="template_active">템플릿 활성화</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveMessageTemplate} disabled={loading} className="flex-1">
                    {loading ? '저장 중...' : editingTemplate ? '템플릿 수정' : '템플릿 추가'}
                  </Button>
                  {editingTemplate && (
                    <Button
                      onClick={() => {
                        setEditingTemplate(null);
                        setNewTemplateForm({ name: '', type: 'custom', template_text: '', is_active: true });
                      }}
                      variant="outline"
                    >
                      취소
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 모니터링 탭 */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                메시지 발송 로그
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messageLogs.length > 0 ? (
                  messageLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${log.success ? 'bg-green-100' : 'bg-red-100'}`}>
                          {log.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {log.message_text.slice(0, 50)}
                            {log.message_text.length > 50 && '...'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            채팅 ID: {log.chat_id} • 발송자: {log.sender?.name || '시스템'}
                            {log.error_message && ` • 오류: ${log.error_message}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={log.success ? "default" : "destructive"}>
                          {log.success ? '성공' : '실패'}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(log.sent_at).toLocaleString('ko-KR')}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      발송된 메시지가 없습니다.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TelegramManagement; 