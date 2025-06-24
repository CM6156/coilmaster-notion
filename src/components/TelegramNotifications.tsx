import React, { useState, useEffect } from 'react';
import { useTelegramNotifications } from '@/hooks/useTelegramNotifications';
import { telegramScheduler } from '@/services/telegramScheduler';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Settings, 
  Users, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Bot,
  MessageSquare,
  Clock,
  Calendar
} from 'lucide-react';

export default function TelegramNotifications() {
  const {
    settings,
    userTelegramInfos,
    botStatus,
    lastCheck,
    saveSettings,
    updateUserTelegramInfo,
    sendImmediateNotification,
    sendTestMessage,
    checkBotStatus,
    getNotificationStats,
    collectNotificationItems,
    getAllUsers
  } = useTelegramNotifications();

  const [loading, setLoading] = useState(false);
  const [testChatId, setTestChatId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', content: string } | null>(null);

  const stats = getNotificationStats();
  const allUsers = getAllUsers();
  const notificationItems = collectNotificationItems();

  // 봇 상태 초기 체크
  useEffect(() => {
    if (settings.enabled && botStatus === 'unknown') {
      checkBotStatus();
    }
  }, [settings.enabled, botStatus, checkBotStatus]);

  // 설정 업데이트 핸들러
  const handleSettingsUpdate = (updates: Partial<typeof settings>) => {
    const updatedSettings = { ...settings, ...updates };
    saveSettings(updatedSettings);
    
    // 새로운 스케줄러에 설정 업데이트
    telegramScheduler.updateSettings(updatedSettings);
    
    if (updates.enabled && botStatus === 'unknown') {
      checkBotStatus();
    }
  };

  // 텔레그램 사용자 정보 업데이트
  const handleUserUpdate = (userId: string, field: 'telegramUsername' | 'telegramChatId', value: string) => {
    updateUserTelegramInfo(userId, { [field]: value });
  };

  // 테스트 메시지 발송
  const handleTestMessage = async () => {
    if (!testChatId) {
      setMessage({ type: 'error', content: '채팅 ID를 입력해주세요.' });
      return;
    }

    setLoading(true);
    try {
      const success = await sendTestMessage(testChatId);
      setMessage({
        type: success ? 'success' : 'error',
        content: success ? '테스트 메시지가 발송되었습니다.' : '메시지 발송에 실패했습니다.'
      });
    } catch (error) {
      setMessage({ type: 'error', content: '오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 즉시 알림 발송
  const handleImmediateNotification = async () => {
    setLoading(true);
    try {
      // 기존 방식 시도
      const result = await sendImmediateNotification();
      
      // 새로운 스케줄러로도 수동 체크 트리거
      telegramScheduler.triggerManualCheck();
      
      setMessage({
        type: result.success ? 'success' : 'error',
        content: result.message
      });
    } catch (error) {
      setMessage({ type: 'error', content: '알림 발송 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 봇 상태 체크
  const handleBotStatusCheck = async () => {
    setLoading(true);
    try {
      const result = await checkBotStatus();
      setMessage({
        type: result.status === 'success' ? 'success' : 'error',
        content: result.message
      });
    } catch (error) {
      setMessage({ type: 'error', content: '봇 상태 확인 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const getBotStatusIcon = () => {
    switch (botStatus) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            텔레그램 알림 설정
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            마감일 알림을 텔레그램으로 자동 발송하도록 설정합니다.
          </p>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {message.content}
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              개요
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              설정
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              사용자
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              테스트
            </TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            {/* 상태 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">봇 상태</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getBotStatusIcon()}
                        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {botStatus === 'active' ? '활성' : botStatus === 'error' ? '오류' : '확인 중'}
                        </span>
                      </div>
                    </div>
                    <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">알림 대상</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {stats.total}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">설정된 사용자</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {stats.usersConfigured}/{stats.totalUsers}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">마지막 체크</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {lastCheck ? new Date(lastCheck).toLocaleString('ko-KR') : '없음'}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 현재 알림 대상 목록 */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Bell className="h-5 w-5" />
                  현재 알림 대상 (마감 3일 이하)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notificationItems.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    현재 알림을 보낼 항목이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {notificationItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            item.type === 'project' 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          }`}>
                            {item.type === 'project' ? '📁' : '📋'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              담당자: {item.assigneeName} | 마감: {new Date(item.dueDate).toLocaleDateString('ko-KR')}
                              {item.projectName && ` | 프로젝트: ${item.projectName}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          new Date(item.dueDate) < new Date() ? 'destructive' : 'secondary'
                        }>
                          {new Date(item.dueDate) < new Date() ? '지연' : '임박'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 설정 탭 */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Settings className="h-5 w-5" />
                  기본 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">알림 활성화</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">텔레그램 알림 기능을 활성화합니다.</p>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => handleSettingsUpdate({ enabled: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupChatId" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    그룹 채팅 ID
                  </Label>
                  <Input
                    id="groupChatId"
                    value={settings.groupChatId}
                    onChange={(e) => handleSettingsUpdate({ groupChatId: e.target.value })}
                    placeholder="-1001234567890"
                    className="bg-white/50 dark:bg-slate-700/50"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    전체 알림을 받을 그룹 채팅의 ID를 입력하세요.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">알림 시간</Label>
                  <Select
                    value={settings.notificationHour.toString()}
                    onValueChange={(value) => handleSettingsUpdate({ notificationHour: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-white/50 dark:bg-slate-700/50">
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

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">체크 간격 (분)</Label>
                  <Select
                    value={settings.checkInterval.toString()}
                    onValueChange={(value) => handleSettingsUpdate({ checkInterval: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-white/50 dark:bg-slate-700/50">
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

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">주말 알림</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">주말에도 알림을 발송합니다.</p>
                  </div>
                  <Switch
                    checked={settings.weekendNotifications}
                    onCheckedChange={(checked) => handleSettingsUpdate({ weekendNotifications: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 사용자 탭 */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Users className="h-5 w-5" />
                  사용자 텔레그램 설정
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers.map((user) => {
                    const telegramInfo = userTelegramInfos.find(u => u.userId === user.id);
                    return (
                      <div key={user.id} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{user.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.type}</p>
                          </div>
                          <Badge variant={telegramInfo?.telegramChatId ? 'default' : 'secondary'}>
                            {telegramInfo?.telegramChatId ? '설정완료' : '미설정'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm text-gray-600 dark:text-gray-400">텔레그램 사용자명</Label>
                            <Input
                              value={telegramInfo?.telegramUsername || ''}
                              onChange={(e) => handleUserUpdate(user.id, 'telegramUsername', e.target.value)}
                              placeholder="@username"
                              className="mt-1 bg-white/50 dark:bg-slate-600/50"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600 dark:text-gray-400">채팅 ID</Label>
                            <Input
                              value={telegramInfo?.telegramChatId || ''}
                              onChange={(e) => handleUserUpdate(user.id, 'telegramChatId', e.target.value)}
                              placeholder="123456789"
                              className="mt-1 bg-white/50 dark:bg-slate-600/50"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 테스트 탭 */}
          <TabsContent value="test" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Bot className="h-5 w-5" />
                    봇 상태 확인
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    {getBotStatusIcon()}
                    <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {botStatus === 'active' ? '봇이 정상 작동 중입니다.' : 
                       botStatus === 'error' ? '봇 설정에 문제가 있습니다.' : 
                       '봇 상태를 확인 중입니다.'}
                    </span>
                  </div>
                  <Button 
                    onClick={handleBotStatusCheck} 
                    disabled={loading}
                    className="w-full"
                  >
                    봇 상태 다시 확인
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <MessageSquare className="h-5 w-5" />
                    테스트 메시지
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="testChatId" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      채팅 ID
                    </Label>
                    <Input
                      id="testChatId"
                      value={testChatId}
                      onChange={(e) => setTestChatId(e.target.value)}
                      placeholder="123456789 또는 -1001234567890"
                      className="mt-1 bg-white/50 dark:bg-slate-700/50"
                    />
                  </div>
                  <Button 
                    onClick={handleTestMessage} 
                    disabled={loading || !testChatId}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    테스트 메시지 발송
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Bell className="h-5 w-5" />
                  즉시 알림 발송
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  현재 마감일이 임박한 모든 항목에 대해 즉시 알림을 발송합니다.
                </p>
                <Button 
                  onClick={handleImmediateNotification} 
                  disabled={loading || !settings.enabled}
                  className="w-full"
                  variant={stats.total > 0 ? "default" : "secondary"}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  즉시 알림 발송 ({stats.total}개 항목)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 