import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TIMEZONE_OPTIONS } from '@/constants/timezones';
import { Clock, Globe, Bell, Users } from 'lucide-react';
import { formatDateInTimezone, getTimezoneDisplayName, isOptimalNotificationTime } from '@/utils/timezone';

export default function TimezoneNotificationTest() {
  const { 
    createTimezoneAwareNotification, 
    createBulkTimezoneAwareNotifications, 
    currentUser, 
    users 
  } = useAppContext();
  
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Seoul');
  const [message, setMessage] = useState('테스트 알림 메시지입니다.');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [scheduleDelay, setScheduleDelay] = useState(0);

  // 현재 시간을 다양한 시간대로 표시
  const getCurrentTimeInZones = () => {
    const zones = ['Asia/Seoul', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
    return zones.map(zone => ({
      zone,
      time: formatDateInTimezone(new Date(), zone),
      display: getTimezoneDisplayName(zone),
      isOptimal: isOptimalNotificationTime(zone)
    }));
  };

  const handleSingleNotification = async () => {
    if (!currentUser) {
      alert('사용자가 로그인되어 있지 않습니다.');
      return;
    }

    try {
      await createTimezoneAwareNotification(
        'test',
        message,
        currentUser.id,
        undefined,
        scheduleDelay
      );
      alert('✅ 시간대 기반 알림이 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error('알림 생성 실패:', error);
      alert('❌ 알림 생성에 실패했습니다.');
    }
  };

  const handleBulkNotification = async () => {
    if (selectedUsers.length === 0) {
      alert('사용자를 선택해 주세요.');
      return;
    }

    try {
      const results = await createBulkTimezoneAwareNotifications(
        'bulk_test',
        message,
        selectedUsers
      );
      
      const successCount = results.filter(r => r.success).length;
      alert(`✅ ${successCount}/${selectedUsers.length}명에게 시간대 기반 알림이 전송되었습니다!`);
    } catch (error) {
      console.error('대량 알림 전송 실패:', error);
      alert('❌ 대량 알림 전송에 실패했습니다.');
    }
  };

  const timeZoneInfo = getCurrentTimeInZones();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Globe className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-bold">시간대 기반 알림 시스템 테스트</h2>
      </div>

      {/* 현재 시간 표시 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            세계 시간
          </CardTitle>
          <CardDescription>
            주요 시간대별 현재 시간과 최적 알림 시간 여부
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {timeZoneInfo.map(({ zone, time, display, isOptimal }) => (
              <div 
                key={zone} 
                className={`p-3 rounded-lg border ${
                  isOptimal 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-sm font-medium text-gray-900">
                  {display}
                </div>
                <div className="text-lg font-mono text-gray-700">
                  {time}
                </div>
                <div className={`text-xs ${
                  isOptimal ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isOptimal ? '🟢 최적 시간' : '🔴 비활성 시간'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 단일 알림 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            단일 사용자 알림 테스트
          </CardTitle>
          <CardDescription>
            현재 로그인한 사용자에게 시간대 기반 알림을 보냅니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">알림 메시지</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="알림 메시지를 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delay">지연 시간 (분)</Label>
            <Input
              id="delay"
              type="number"
              value={scheduleDelay}
              onChange={(e) => setScheduleDelay(Number(e.target.value))}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label>현재 사용자 정보</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div><strong>이름:</strong> {currentUser?.name || '로그인 필요'}</div>
              <div><strong>시간대:</strong> {(currentUser as any)?.timezone || 'Asia/Seoul (기본값)'}</div>
              <div><strong>현재 시간:</strong> {
                formatDateInTimezone(new Date(), (currentUser as any)?.timezone || 'Asia/Seoul')
              }</div>
            </div>
          </div>

          <Button 
            onClick={handleSingleNotification}
            disabled={!currentUser}
            className="w-full"
          >
            시간대 기반 알림 보내기
          </Button>
        </CardContent>
      </Card>

      {/* 대량 알림 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            대량 알림 테스트
          </CardTitle>
          <CardDescription>
            여러 사용자에게 각자의 시간대에 맞는 알림을 보냅니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>사용자 선택</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {users.map(user => (
                <label key={user.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                  />
                  <span className="text-sm">
                    {user.name} ({(user as any).timezone || 'Asia/Seoul'})
                  </span>
                </label>
              ))}
            </div>
            <div className="text-sm text-gray-500">
              선택된 사용자: {selectedUsers.length}명
            </div>
          </div>

          <Button 
            onClick={handleBulkNotification}
            disabled={selectedUsers.length === 0}
            className="w-full"
            variant="outline"
          >
            선택된 사용자들에게 대량 알림 보내기
          </Button>
        </CardContent>
      </Card>

      {/* 사용법 안내 */}
      <Card>
        <CardHeader>
          <CardTitle>🛠️ 시간대 기반 알림 시스템 사용법</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>기본 사용법:</strong></p>
            <code className="block bg-gray-100 p-2 rounded text-xs">
              {`// 시간대 기반 알림 생성
await createTimezoneAwareNotification(
  'task_deadline',      // 알림 타입
  '마감일이 다가옵니다', // 메시지
  userId,               // 대상 사용자 ID
  taskId,               // 관련 ID (선택)
  30                    // 30분 후 전송 (선택)
);

// 여러 사용자에게 대량 전송
await createBulkTimezoneAwareNotifications(
  'project_update',
  '프로젝트가 업데이트되었습니다',
  [userId1, userId2, userId3]
);`}
            </code>

            <p><strong>주요 기능:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>사용자별 시간대 자동 인식</li>
              <li>최적 알림 시간 확인 (오전 8시 ~ 오후 10시)</li>
              <li>시간대별 시간 표시</li>
              <li>스케줄링 지원 (지연 전송)</li>
              <li>대량 알림 전송</li>
              <li>에러 처리 및 폴백</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 