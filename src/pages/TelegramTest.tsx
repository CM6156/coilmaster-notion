import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Bot,
  MessageSquare,
  Send, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TelegramTest() {
  const [botToken] = useState('7904123264:AAFe7T54dRKNv-c64sHMDpBWKZIhtYq9ZD8');
  const [testChatId, setTestChatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', content: string } | null>(null);
  const [botStatus, setBotStatus] = useState<'unknown' | 'active' | 'error'>('unknown');

  // 텔레그램 메시지 발송
  const sendMessage = async (chatId: string, messageText: string) => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('텔레그램 API 호출 오류:', error);
      return false;
    }
  };

  // 봇 상태 확인
  const checkBotStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const result = await response.json();
      
      if (result.ok) {
        setBotStatus('active');
        setMessage({
          type: 'success',
          content: `봇이 정상 작동 중입니다! 봇 이름: ${result.result.first_name}`
        });
      } else {
        setBotStatus('error');
        setMessage({
          type: 'error',
          content: '봇 설정에 문제가 있습니다.'
        });
      }
    } catch (error) {
      setBotStatus('error');
      setMessage({
        type: 'error',
        content: '봇 상태 확인 중 오류가 발생했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  // 테스트 메시지 발송
  const handleTestMessage = async () => {
    if (!testChatId) {
      setMessage({ type: 'error', content: '채팅 ID를 입력해주세요.' });
      return;
    }

    setLoading(true);
    try {
      const testMessage = `🤖 <b>테스트 메시지</b>\n\n✅ 텔레그램 봇이 정상적으로 작동합니다!\n📅 ${new Date().toLocaleString('ko-KR')}`;
      const success = await sendMessage(testChatId, testMessage);
      
      setMessage({
        type: success ? 'success' : 'error',
        content: success ? '테스트 메시지가 발송되었습니다!' : '메시지 발송에 실패했습니다.'
      });
    } catch (error) {
      setMessage({ type: 'error', content: '오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 샘플 마감일 알림 메시지 발송
  const handleSampleNotification = async () => {
    if (!testChatId) {
      setMessage({ type: 'error', content: '채팅 ID를 입력해주세요.' });
      return;
    }

    setLoading(true);
    try {
      const sampleMessage = `⚠️ <b>마감일 알림</b> ⚠️

🔔 <b>마감임박 (3일 이하)</b>
📁 <b>프로젝트 A 개발</b>
   📅 12월 25일 (2일 후 마감)
   👤 김개발
   📊 진행률: 75%

📋 <b>UI 디자인 작업</b>
   📅 12월 24일 (내일 마감)
   👤 이디자인
   📊 진행률: 90%
   📁 프로젝트: 프로젝트 A 개발

🚨 <b>마감일 경과</b>
📁 <b>프로젝트 B 기획</b>
   📅 12월 20일 (3일 지연)
   👤 박기획
   📊 진행률: 60%

📱 업무 관리 시스템에서 확인하세요!

👥 담당자: @kim_dev @lee_design @park_plan`;

      const success = await sendMessage(testChatId, sampleMessage);
      
      setMessage({
        type: success ? 'success' : 'error',
        content: success ? '샘플 마감일 알림이 발송되었습니다!' : '메시지 발송에 실패했습니다.'
      });
    } catch (error) {
      setMessage({ type: 'error', content: '오류가 발생했습니다.' });
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
          <Link 
            to="/intro" 
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            텔레그램 알림 테스트
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Supabase 연결 없이 텔레그램 봇 기능을 테스트합니다.
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

        {/* 봇 정보 */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Bot className="h-5 w-5" />
              봇 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">봇 토큰</p>
                  <p className="text-lg font-mono text-gray-900 dark:text-gray-100">
                    {botToken.substring(0, 20)}...
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getBotStatusIcon()}
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {botStatus === 'active' ? '활성' : botStatus === 'error' ? '오류' : '확인 중'}
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={checkBotStatus} 
                disabled={loading}
                className="w-full"
              >
                봇 상태 확인
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 채팅 ID 안내 */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <MessageSquare className="h-5 w-5" />
              채팅 ID 확인 방법
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">📱 개인 채팅 ID</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>텔레그램에서 봇과 대화 시작</li>
                  <li>/start 메시지 전송</li>
                  <li>아래 링크 클릭하여 채팅 ID 확인:</li>
                </ol>
                <a 
                  href={`https://api.telegram.org/bot${botToken}/getUpdates`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50"
                >
                  getUpdates API 확인
                </a>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">👥 그룹 채팅 ID</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>그룹에 봇을 초대</li>
                  <li>그룹에서 아무 메시지나 전송</li>
                  <li>위 링크에서 chat.id 확인 (음수)</li>
                  <li>봇에게 관리자 권한 부여</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 테스트 메시지 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Send className="h-5 w-5" />
                간단한 테스트 메시지
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

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Bell className="h-5 w-5" />
                샘플 마감일 알림
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                실제 마감일 알림과 동일한 형식의 샘플 메시지를 발송합니다.
              </p>
              <Button 
                onClick={handleSampleNotification} 
                disabled={loading || !testChatId}
                className="w-full"
                variant="secondary"
              >
                <Bell className="h-4 w-4 mr-2" />
                샘플 마감일 알림 발송
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 사용 가능한 기능 안내 */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <AlertTriangle className="h-5 w-5" />
              알림 기능 설명
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">🔔 자동 알림 조건</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• 마감일이 3일 이하로 남은 항목</li>
                  <li>• 마감일이 지난 항목</li>
                  <li>• 완료되지 않은 프로젝트/업무만</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">📱 알림 방식</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• 개인 채팅으로 개별 알림</li>
                  <li>• 그룹 채팅으로 전체 알림</li>
                  <li>• 담당자 @태그 기능</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 