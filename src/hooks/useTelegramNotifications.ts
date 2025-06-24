import { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { telegramService, telegramUtils } from '@/services/telegramService';
import { differenceInDays, parseISO } from 'date-fns';

interface TelegramSettings {
  enabled: boolean;
  groupChatId: string;
  checkInterval: number; // 분 단위
  notificationHour: number; // 하루 중 알림을 보낼 시간 (0-23)
  weekendNotifications: boolean;
}

interface UserTelegramInfo {
  userId: string;
  telegramUsername?: string;
  telegramChatId?: string;
  name: string;
}

export const useTelegramNotifications = () => {
  const { projects, tasks, users, managers, employees } = useAppContext();
  
  // 텔레그램 설정
  const [settings, setSettings] = useState<TelegramSettings>({
    enabled: false,
    groupChatId: '',
    checkInterval: 60, // 1시간마다
    notificationHour: 9, // 오전 9시
    weekendNotifications: false
  });

  // 사용자 텔레그램 정보
  const [userTelegramInfos, setUserTelegramInfos] = useState<UserTelegramInfo[]>([]);
  
  // 마지막 체크 시간
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  
  // 봇 상태
  const [botStatus, setBotStatus] = useState<'unknown' | 'active' | 'error'>('unknown');

  // 설정 로드/저장
  useEffect(() => {
    const savedSettings = localStorage.getItem('telegram_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    const savedUserInfos = localStorage.getItem('telegram_users');
    if (savedUserInfos) {
      setUserTelegramInfos(JSON.parse(savedUserInfos));
    }
  }, []);

  const saveSettings = useCallback((newSettings: TelegramSettings) => {
    setSettings(newSettings);
    localStorage.setItem('telegram_settings', JSON.stringify(newSettings));
  }, []);

  const saveUserTelegramInfos = useCallback((infos: UserTelegramInfo[]) => {
    setUserTelegramInfos(infos);
    localStorage.setItem('telegram_users', JSON.stringify(infos));
  }, []);

  // 모든 사용자 정보 통합
  const getAllUsers = useCallback(() => {
    const allUsers = [
      ...users.map(u => ({ id: u.id, name: u.name, type: 'user' })),
      ...managers.map(m => ({ id: m.id, name: m.name, type: 'manager' })),
      ...employees.map(e => ({ id: e.id, name: e.name, type: 'employee' }))
    ];
    return allUsers;
  }, [users, managers, employees]);

  // 사용자 이름 가져오기
  const getUserName = useCallback((userId: string) => {
    const allUsers = getAllUsers();
    return allUsers.find(u => u.id === userId)?.name || '알 수 없음';
  }, [getAllUsers]);

  // 알림이 필요한 항목들 수집
  const collectNotificationItems = useCallback(() => {
    const items: any[] = [];
    const today = new Date();

    // 프로젝트 체크
    projects.forEach(project => {
      if (project.dueDate && project.status !== '완료') {
        const daysLeft = differenceInDays(parseISO(project.dueDate), today);
        if (daysLeft <= 3) { // 3일 이하 또는 지난 것
          const assigneeName = getUserName(project.managerId || '');
          items.push(telegramUtils.projectToNotificationItem(project, assigneeName));
        }
      }
    });

    // 업무 체크
    tasks.forEach(task => {
      if (task.dueDate && task.status !== '완료') {
        const daysLeft = differenceInDays(parseISO(task.dueDate), today);
        if (daysLeft <= 3) { // 3일 이하 또는 지난 것
          const assigneeName = getUserName(task.assignedTo || '');
          const project = projects.find(p => p.id === task.projectId);
          items.push(telegramUtils.taskToNotificationItem(task, assigneeName, project?.name));
        }
      }
    });

    return items;
  }, [projects, tasks, getUserName]);

  // 알림 발송
  const sendNotifications = useCallback(async () => {
    if (!settings.enabled) return { success: false, message: '알림이 비활성화되어 있습니다.' };

    const items = collectNotificationItems();
    if (items.length === 0) {
      return { success: true, message: '알림을 보낼 항목이 없습니다.' };
    }

    try {
      const results = [];

      // 개인 알림 발송
      if (userTelegramInfos.length > 0) {
        const personalResults = await telegramService.sendPersonalNotifications(items, userTelegramInfos);
        results.push(...personalResults);
      }

      // 그룹 알림 발송
      if (settings.groupChatId) {
        const groupResult = await telegramService.sendGroupNotification(
          settings.groupChatId,
          items,
          userTelegramInfos
        );
        results.push({ type: 'group', success: groupResult });
      }

      setLastCheck(new Date());
      
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      return {
        success: successCount > 0,
        message: `${successCount}/${totalCount} 알림이 성공적으로 발송되었습니다.`,
        details: results
      };
    } catch (error) {
      console.error('알림 발송 오류:', error);
      return { success: false, message: '알림 발송 중 오류가 발생했습니다.' };
    }
  }, [settings, userTelegramInfos, collectNotificationItems]);

  // 테스트 메시지 발송
  const sendTestMessage = useCallback(async (chatId: string) => {
    const testMessage = `🤖 <b>테스트 메시지</b>\n\n✅ 텔레그램 봇이 정상적으로 작동합니다!\n📅 ${new Date().toLocaleString('ko-KR')}`;
    return await telegramService.sendMessage(chatId, testMessage);
  }, []);

  // 봇 상태 확인
  const checkBotStatus = useCallback(async () => {
    try {
      const status = await telegramService.checkBotStatus();
      setBotStatus(status.status === 'success' ? 'active' : 'error');
      return status;
    } catch (error) {
      setBotStatus('error');
      return { status: 'error', message: '봇 상태 확인 실패' };
    }
  }, []);

  // 주기적 체크 설정
  useEffect(() => {
    if (!settings.enabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;

      // 주말 알림 비활성화 시 체크
      if (isWeekend && !settings.weekendNotifications) return;

      // 설정된 시간에만 알림 발송
      if (currentHour === settings.notificationHour) {
        // 이미 오늘 알림을 보냈는지 체크
        if (lastCheck) {
          const lastCheckDate = new Date(lastCheck);
          const today = new Date();
          
          // 같은 날이면 알림 발송하지 않음
          if (
            lastCheckDate.getDate() === today.getDate() &&
            lastCheckDate.getMonth() === today.getMonth() &&
            lastCheckDate.getFullYear() === today.getFullYear()
          ) {
            return;
          }
        }

        sendNotifications();
      }
    }, settings.checkInterval * 60 * 1000); // 분을 밀리초로 변환

    return () => clearInterval(interval);
  }, [settings, lastCheck, sendNotifications]);

  // 즉시 알림 발송 (수동)
  const sendImmediateNotification = useCallback(async () => {
    return await sendNotifications();
  }, [sendNotifications]);

  // 특정 사용자의 텔레그램 정보 업데이트
  const updateUserTelegramInfo = useCallback((userId: string, telegramInfo: Partial<UserTelegramInfo>) => {
    const userName = getUserName(userId);
    const updatedInfos = [...userTelegramInfos];
    const existingIndex = updatedInfos.findIndex(info => info.userId === userId);

    if (existingIndex >= 0) {
      updatedInfos[existingIndex] = { ...updatedInfos[existingIndex], ...telegramInfo };
    } else {
      updatedInfos.push({
        userId,
        name: userName,
        ...telegramInfo
      });
    }

    saveUserTelegramInfos(updatedInfos);
  }, [userTelegramInfos, getUserName, saveUserTelegramInfos]);

  // 통계 정보
  const getNotificationStats = useCallback(() => {
    const items = collectNotificationItems();
    const today = new Date();
    
    const warningItems = items.filter(item => {
      const daysLeft = differenceInDays(parseISO(item.dueDate), today);
      return daysLeft >= 0 && daysLeft <= 3;
    });

    const overdueItems = items.filter(item => {
      const daysLeft = differenceInDays(parseISO(item.dueDate), today);
      return daysLeft < 0;
    });

    return {
      total: items.length,
      warning: warningItems.length,
      overdue: overdueItems.length,
      usersConfigured: userTelegramInfos.filter(u => u.telegramChatId).length,
      totalUsers: getAllUsers().length
    };
  }, [collectNotificationItems, userTelegramInfos, getAllUsers]);

  return {
    // 상태
    settings,
    userTelegramInfos,
    botStatus,
    lastCheck,
    
    // 액션
    saveSettings,
    updateUserTelegramInfo,
    sendImmediateNotification,
    sendTestMessage,
    checkBotStatus,
    
    // 데이터
    getNotificationStats,
    collectNotificationItems,
    getAllUsers
  };
}; 