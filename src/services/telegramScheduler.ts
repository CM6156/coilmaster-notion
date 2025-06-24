import { differenceInDays, parseISO, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  isOptimalNotificationTime, 
  scheduleNotification, 
  formatDateInTimezone,
  getTimezoneDisplayName 
} from '../utils/timezone';

interface ScheduledNotification {
  id: string;
  type: 'project' | 'task';
  itemId: string;
  dueDate: string;
  assignedTo: string;
  notificationTime: string; // 'HH:mm' 형식
  enabled: boolean;
  lastSent?: string; // ISO date string
  timezone?: string; // 사용자별 시간대 추가
}

class TelegramSchedulerService {
  private workers: Worker[] = [];
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    // Web Worker를 사용하여 백그라운드에서 실행
    if (typeof Worker !== 'undefined' && !this.isInitialized) {
      this.createNotificationWorker();
      this.isInitialized = true;
    }
  }

  private createNotificationWorker() {
    // Web Worker 코드를 문자열로 생성
    const workerCode = `
      let notificationInterval;
      let settings = {
        enabled: false,
        notificationHour: 9,
        checkInterval: 60,
        weekendNotifications: false
      };

      // 메인 스레드로부터 설정 받기
      self.onmessage = function(e) {
        const { type, data } = e.data;
        
        if (type === 'UPDATE_SETTINGS') {
          settings = { ...settings, ...data };
          if (settings.enabled) {
            startScheduler();
          } else {
            stopScheduler();
          }
        } else if (type === 'TRIGGER_CHECK') {
          checkAndSendNotifications();
        }
      };

      function startScheduler() {
        stopScheduler(); // 기존 스케줄러 정리
        
        notificationInterval = setInterval(() => {
          const now = new Date();
          const currentHour = now.getHours();
          const isWeekend = now.getDay() === 0 || now.getDay() === 6;

          // 주말 알림 비활성화 체크
          if (isWeekend && !settings.weekendNotifications) return;

          // 설정된 시간에만 알림 체크
          if (currentHour === settings.notificationHour) {
            checkAndSendNotifications();
          }
        }, settings.checkInterval * 60 * 1000);
      }

      function stopScheduler() {
        if (notificationInterval) {
          clearInterval(notificationInterval);
          notificationInterval = null;
        }
      }

      function checkAndSendNotifications() {
        // 메인 스레드에 알림 체크 요청
        self.postMessage({
          type: 'CHECK_NOTIFICATIONS',
          timestamp: new Date().toISOString()
        });
      }
    `;

    // Blob으로 Worker 생성
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      const { type, timestamp } = e.data;
      
      if (type === 'CHECK_NOTIFICATIONS') {
        console.log('스케줄러에서 알림 체크 요청:', timestamp);
        this.triggerNotificationCheck();
      }
    };

    this.workers.push(worker);
    
    // URL 정리
    URL.revokeObjectURL(workerUrl);
  }

  // 스케줄러 설정 업데이트
  updateSettings(settings: any) {
    this.workers.forEach(worker => {
      worker.postMessage({
        type: 'UPDATE_SETTINGS',
        data: settings
      });
    });
  }

  // 수동 알림 체크 트리거
  triggerManualCheck() {
    this.workers.forEach(worker => {
      worker.postMessage({
        type: 'TRIGGER_CHECK'
      });
    });
  }

  // 알림 체크 실행 (메인 스레드에서 실행)
  private async triggerNotificationCheck() {
    try {
      // localStorage에서 설정 가져오기
      const settingsData = localStorage.getItem('telegram_settings');
      const userInfoData = localStorage.getItem('telegram_users');
      
      if (!settingsData) {
        console.log('텔레그램 설정이 없습니다.');
        return;
      }

      const settings = JSON.parse(settingsData);
      const userInfos = userInfoData ? JSON.parse(userInfoData) : [];

      if (!settings.enabled) {
        console.log('텔레그램 알림이 비활성화되어 있습니다.');
        return;
      }

      // AppContext에서 데이터 가져오기 (전역 상태 활용)
      const contextData = this.getAppContextData();
      if (!contextData) {
        console.log('앱 컨텍스트 데이터를 가져올 수 없습니다.');
        return;
      }

      // 알림 필요 항목들 수집
      const notificationItems = this.collectNotificationItems(contextData);
      
      if (notificationItems.length === 0) {
        console.log('알림을 보낼 항목이 없습니다.');
        return;
      }

      // 오늘 이미 알림을 보냈는지 체크
      const lastSentData = localStorage.getItem('telegram_last_sent');
      const today = new Date().toDateString();
      
      if (lastSentData === today) {
        console.log('오늘 이미 알림을 발송했습니다.');
        return;
      }

      // 텔레그램 알림 발송
      await this.sendTelegramNotifications(settings, userInfos, notificationItems);
      
      // 마지막 발송 시간 저장
      localStorage.setItem('telegram_last_sent', today);
      
      console.log('자동 알림이 발송되었습니다:', notificationItems);

    } catch (error) {
      console.error('자동 알림 발송 중 오류:', error);
    }
  }

  // AppContext 데이터 가져오기 (전역 window 객체 활용)
  private getAppContextData() {
    // React 앱의 전역 데이터에 접근
    const globalData = (window as any).__APP_CONTEXT_DATA__;
    return globalData;
  }

  // 알림 필요 항목들 수집
  private collectNotificationItems(contextData: any) {
    const { projects, tasks } = contextData;
    const items: any[] = [];
    const today = new Date();

    // 프로젝트 체크
    projects?.forEach((project: any) => {
      if (project.dueDate && project.status !== '완료') {
        const daysLeft = differenceInDays(parseISO(project.dueDate), today);
        if (daysLeft <= 3) {
          items.push({
            type: 'project',
            id: project.id,
            title: project.name,
            dueDate: project.dueDate,
            assignedTo: project.managerId,
            progress: project.progress || 0
          });
        }
      }
    });

    // 업무 체크
    tasks?.forEach((task: any) => {
      if (task.dueDate && task.status !== '완료') {
        const daysLeft = differenceInDays(parseISO(task.dueDate), today);
        if (daysLeft <= 3) {
          const project = projects?.find((p: any) => p.id === task.projectId);
          items.push({
            type: 'task',
            id: task.id,
            title: task.title,
            dueDate: task.dueDate,
            assignedTo: task.assignedTo,
            progress: task.progress || 0,
            projectName: project?.name
          });
        }
      }
    });

    return items;
  }

  // 시간대별 텔레그램 알림 발송
  private async sendTelegramNotifications(settings: any, userInfos: any[], items: any[]) {
    if (!settings.groupChatId) {
      console.log('그룹 채팅 ID가 설정되지 않았습니다.');
      return;
    }

    try {
      // 설정된 시간대 또는 기본 시간대 사용
      const targetTimezone = settings.timezone || 'Asia/Seoul';
      
      // 현재 설정된 시간대가 최적 시간인지 확인
      if (!isOptimalNotificationTime(targetTimezone)) {
        console.log(`[시간대 알림] 현재 시간(${getTimezoneDisplayName(targetTimezone)})은 최적 알림 시간이 아닙니다.`);
        
        // 다음 최적 시간으로 스케줄링
        const nextOptimalTime = scheduleNotification(targetTimezone);
        console.log(`[시간대 알림] 다음 최적 시간으로 재스케줄됨: ${formatDateInTimezone(nextOptimalTime, targetTimezone)}`);
        return;
      }

      const message = this.generateTimezoneAwareNotificationMessage(items, targetTimezone);
      
      const response = await fetch(`https://api.telegram.org/bot${import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: settings.groupChatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log(`[시간대 알림] 텔레그램 알림 발송 성공 (${getTimezoneDisplayName(targetTimezone)})`);
      } else {
        console.error('텔레그램 알림 발송 실패:', result);
      }
    } catch (error) {
      console.error('텔레그램 API 호출 오류:', error);
    }
  }

  // 시간대별 알림 메시지 생성
  private generateTimezoneAwareNotificationMessage(items: any[], timezone: string = 'Asia/Seoul'): string {
    const today = new Date();
    
    let message = `⚠️ <b>마감일 알림</b> ⚠️\n`;
    message += `🌍 ${getTimezoneDisplayName(timezone)}\n`;
    message += `🕐 ${formatDateInTimezone(today, timezone)}\n\n`;
    
    // 3일 이하 남은 항목들
    const warningItems = items.filter(item => {
      const daysLeft = differenceInDays(parseISO(item.dueDate), today);
      return daysLeft >= 0 && daysLeft <= 3;
    });

    // 마감일 지난 항목들
    const overdueItems = items.filter(item => {
      const daysLeft = differenceInDays(parseISO(item.dueDate), today);
      return daysLeft < 0;
    });

    if (warningItems.length > 0) {
      message += `🔔 <b>마감임박 (3일 이하)</b>\n`;
      warningItems.forEach(item => {
        const daysLeft = differenceInDays(parseISO(item.dueDate), today);
        const itemType = item.type === 'project' ? '📁' : '📋';
        const dueText = daysLeft === 0 ? '오늘 마감' : 
                       daysLeft === 1 ? '내일 마감' : 
                       `${daysLeft}일 후 마감`;
        
        message += `${itemType} <b>${item.title}</b>\n`;
        message += `   📅 ${format(parseISO(item.dueDate), 'MM월 dd일', { locale: ko })} (${dueText})\n`;
        message += `   📊 진행률: ${item.progress}%\n`;
        if (item.projectName) {
          message += `   📁 프로젝트: ${item.projectName}\n`;
        }
        message += `\n`;
      });
    }

    if (overdueItems.length > 0) {
      if (warningItems.length > 0) message += `\n`;
      message += `🚨 <b>마감일 경과</b>\n`;
      overdueItems.forEach(item => {
        const daysOverdue = Math.abs(differenceInDays(parseISO(item.dueDate), today));
        const itemType = item.type === 'project' ? '📁' : '📋';
        
        message += `${itemType} <b>${item.title}</b>\n`;
        message += `   📅 ${format(parseISO(item.dueDate), 'MM월 dd일', { locale: ko })} (${daysOverdue}일 지연)\n`;
        message += `   📊 진행률: ${item.progress}%\n`;
        if (item.projectName) {
          message += `   📁 프로젝트: ${item.projectName}\n`;
        }
        message += `\n`;
      });
    }

    message += `\n📱 업무 관리 시스템에서 확인하세요!`;
    message += `\n🤖 ${formatDateInTimezone(new Date(), timezone)} 자동 발송`;
    
    return message;
  }

  // 기존 알림 메시지 생성 (하위 호환성)
  private generateNotificationMessage(items: any[]): string {
    return this.generateTimezoneAwareNotificationMessage(items, 'Asia/Seoul');
  }

  // 스케줄러 정리
  destroy() {
    this.workers.forEach(worker => {
      worker.terminate();
    });
    this.workers = [];
    this.isInitialized = false;
  }
}

// 싱글톤 인스턴스
export const telegramScheduler = new TelegramSchedulerService();

// AppContext 데이터를 전역에 노출하는 헬퍼 함수
export const exposeAppContextData = (data: any) => {
  (window as any).__APP_CONTEXT_DATA__ = data;
};

// 스케줄러 초기화 헬퍼
export const initializeTelegramScheduler = (settings: any) => {
  telegramScheduler.updateSettings(settings);
};

export default telegramScheduler; 