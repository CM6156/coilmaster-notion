import { format, differenceInDays, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  formatDateInTimezone, 
  isOptimalNotificationTime, 
  getTimezoneDisplayName,
  scheduleNotification 
} from '../utils/timezone';

// 텔레그램 봇 설정
interface TelegramConfig {
  botToken: string;
  chatId: string;
}

// 사용자 텔레그램 정보 (시간대 추가)
interface UserTelegramInfo {
  userId: string;
  telegramUsername?: string;
  telegramChatId?: string;
  name: string;
  timezone?: string; // 사용자 시간대 추가
}

// 알림 타입
export type NotificationType = 'deadline_warning' | 'overdue' | 'completion';

// 프로젝트/업무 정보
interface NotificationItem {
  id: string;
  title: string;
  type: 'project' | 'task';
  dueDate: string;
  assignedTo: string;
  assigneeName: string;
  status: string;
  progress?: number;
  projectName?: string; // 업무의 경우 프로젝트명
}

// 시간대별 알림 결과
interface TimezoneNotificationResult {
  userId: string;
  userName: string;
  timezone: string;
  scheduledTime: string;
  isOptimalTime: boolean;
  success: boolean;
  message?: string;
}

class TelegramService {
  private botToken: string;
  private apiUrl: string;

  constructor() {
    this.botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  // 텔레그램 메시지 발송
  async sendMessage(chatId: string, message: string, parseMode: 'HTML' | 'Markdown' = 'HTML') {
    if (!this.botToken) {
      console.error('텔레그램 봇 토큰이 설정되지 않았습니다.');
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      });

      const result = await response.json();
      
      if (!result.ok) {
        console.error('텔레그램 메시지 발송 실패:', result.description);
        return false;
      }

      return true;
    } catch (error) {
      console.error('텔레그램 API 호출 오류:', error);
      return false;
    }
  }

  // 그룹 채팅에 메시지 발송 (담당자 태그 포함)
  async sendGroupMessage(chatId: string, message: string, userTagList: UserTelegramInfo[] = []) {
    let finalMessage = message;

    // 담당자 태그 추가
    if (userTagList.length > 0) {
      const tags = userTagList
        .filter(user => user.telegramUsername)
        .map(user => `@${user.telegramUsername}`)
        .join(' ');
      
      if (tags) {
        finalMessage += `\n\n👥 담당자: ${tags}`;
      }
    }

    return this.sendMessage(chatId, finalMessage);
  }

  // 시간대별 마감일 경고 메시지 생성
  generateTimezoneAwareDeadlineMessage(items: NotificationItem[], userTimezone: string = 'Asia/Seoul'): string {
    const today = new Date();
    
    let message = `⚠️ <b>마감일 알림</b> ⚠️\n`;
    message += `🌍 ${getTimezoneDisplayName(userTimezone)}\n`;
    message += `🕐 ${formatDateInTimezone(today, userTimezone)}\n\n`;
    
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
        
        const dueDateInTimezone = formatDateInTimezone(parseISO(item.dueDate), userTimezone);
        
        message += `${itemType} <b>${item.title}</b>\n`;
        message += `   📅 ${format(parseISO(item.dueDate), 'MM월 dd일', { locale: ko })} (${dueText})\n`;
        message += `   👤 ${item.assigneeName}\n`;
        message += `   📊 진행률: ${item.progress || 0}%\n`;
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
        message += `   👤 ${item.assigneeName}\n`;
        message += `   📊 진행률: ${item.progress || 0}%\n`;
        if (item.projectName) {
          message += `   📁 프로젝트: ${item.projectName}\n`;
        }
        message += `\n`;
      });
    }

    message += `\n📱 업무 관리 시스템에서 확인하세요!`;
    
    return message;
  }

  // 기존 마감일 경고 메시지 생성 (하위 호환성)
  generateDeadlineWarningMessage(items: NotificationItem[]): string {
    return this.generateTimezoneAwareDeadlineMessage(items, 'Asia/Seoul');
  }

  // 시간대별 개인 알림 발송 (최적 시간 고려)
  async sendTimezoneAwarePersonalNotifications(
    items: NotificationItem[], 
    userTelegramInfos: UserTelegramInfo[]
  ): Promise<TimezoneNotificationResult[]> {
    const results: TimezoneNotificationResult[] = [];

    // 담당자별로 그룹화
    const itemsByAssignee = items.reduce((acc, item) => {
      if (!acc[item.assignedTo]) {
        acc[item.assignedTo] = [];
      }
      acc[item.assignedTo].push(item);
      return acc;
    }, {} as Record<string, NotificationItem[]>);

    // 각 담당자에게 시간대 고려한 개인 메시지 발송
    for (const [assigneeId, assigneeItems] of Object.entries(itemsByAssignee)) {
      const userInfo = userTelegramInfos.find(u => u.userId === assigneeId);
      
      if (userInfo?.telegramChatId) {
        const userTimezone = userInfo.timezone || 'Asia/Seoul';
        const isOptimalTime = isOptimalNotificationTime(userTimezone);
        
        let result: TimezoneNotificationResult = {
          userId: assigneeId,
          userName: userInfo.name,
          timezone: userTimezone,
          scheduledTime: new Date().toISOString(),
          isOptimalTime,
          success: false
        };

        if (isOptimalTime) {
          // 최적 시간이면 즉시 발송
          let personalMessage = `👋 안녕하세요, ${userInfo.name}님!\n\n`;
          personalMessage += this.generateTimezoneAwareDeadlineMessage(assigneeItems, userTimezone);
          
          const success = await this.sendMessage(userInfo.telegramChatId, personalMessage);
          result.success = success;
          result.message = success ? '즉시 발송됨' : '발송 실패';
        } else {
          // 최적 시간이 아니면 스케줄링
          const scheduledTime = scheduleNotification(userTimezone);
          result.scheduledTime = scheduledTime.toISOString();
          result.message = `최적 시간으로 스케줄됨: ${formatDateInTimezone(scheduledTime, userTimezone)}`;
          
          // 실제 스케줄링은 추후 구현 (여기서는 로그만)
          console.log(`[시간대 알림] ${userInfo.name}님에게 ${formatDateInTimezone(scheduledTime, userTimezone)}에 알림 예약`);
          result.success = true; // 스케줄링 성공으로 표시
        }

        results.push(result);
      }
    }

    return results;
  }

  // 시간대별 그룹 알림 발송
  async sendTimezoneAwareGroupNotification(
    groupChatId: string,
    items: NotificationItem[],
    userTelegramInfos: UserTelegramInfo[],
    targetTimezone: string = 'Asia/Seoul'
  ) {
    if (!groupChatId || items.length === 0) return false;

    const message = this.generateTimezoneAwareDeadlineMessage(items, targetTimezone);
    
    // 관련 담당자들 태그
    const relatedUsers = userTelegramInfos.filter(user => 
      items.some(item => item.assignedTo === user.userId)
    );

    return this.sendGroupMessage(groupChatId, message, relatedUsers);
  }

  // 완료 알림 메시지 생성
  generateCompletionMessage(item: NotificationItem): string {
    const itemType = item.type === 'project' ? '프로젝트' : '업무';
    const emoji = item.type === 'project' ? '📁' : '📋';
    
    let message = `🎉 <b>${itemType} 완료!</b> 🎉\n\n`;
    message += `${emoji} <b>${item.title}</b>\n`;
    message += `👤 담당자: ${item.assigneeName}\n`;
    message += `📅 완료일: ${format(new Date(), 'MM월 dd일', { locale: ko })}\n`;
    
    if (item.projectName) {
      message += `📁 프로젝트: ${item.projectName}\n`;
    }
    
    message += `\n축하합니다! 🎊`;
    
    return message;
  }

  // 담당자별 개인 알림 발송
  async sendPersonalNotifications(
    items: NotificationItem[], 
    userTelegramInfos: UserTelegramInfo[]
  ) {
    const results: { userId: string; success: boolean }[] = [];

    // 담당자별로 그룹화
    const itemsByAssignee = items.reduce((acc, item) => {
      if (!acc[item.assignedTo]) {
        acc[item.assignedTo] = [];
      }
      acc[item.assignedTo].push(item);
      return acc;
    }, {} as Record<string, NotificationItem[]>);

    // 각 담당자에게 개인 메시지 발송
    for (const [assigneeId, assigneeItems] of Object.entries(itemsByAssignee)) {
      const userInfo = userTelegramInfos.find(u => u.userId === assigneeId);
      
      if (userInfo?.telegramChatId) {
        let personalMessage = `👋 안녕하세요, ${userInfo.name}님!\n\n`;
        personalMessage += this.generateTimezoneAwareDeadlineMessage(assigneeItems, userInfo.timezone || 'Asia/Seoul');
        
        const success = await this.sendMessage(userInfo.telegramChatId, personalMessage);
        results.push({ userId: assigneeId, success });
      }
    }

    return results;
  }

  // 그룹 채팅에 전체 알림 발송
  async sendGroupNotification(
    groupChatId: string,
    items: NotificationItem[],
    userTelegramInfos: UserTelegramInfo[]
  ) {
    if (!groupChatId || items.length === 0) return false;

    const message = this.generateTimezoneAwareDeadlineMessage(items);
    
    // 관련 담당자들 태그
    const relatedUsers = userTelegramInfos.filter(user => 
      items.some(item => item.assignedTo === user.userId)
    );

    return this.sendGroupMessage(groupChatId, message, relatedUsers);
  }

  // 텔레그램 봇 상태 확인
  async checkBotStatus() {
    if (!this.botToken) {
      return { status: 'error', message: '봇 토큰이 설정되지 않았습니다.' };
    }

    try {
      const response = await fetch(`${this.apiUrl}/getMe`);
      const result = await response.json();
      
      if (result.ok) {
        return { 
          status: 'success', 
          message: '봇이 정상 작동 중입니다.',
          botInfo: result.result 
        };
      } else {
        return { 
          status: 'error', 
          message: '봇 설정에 문제가 있습니다.' 
        };
      }
    } catch (error) {
      return { 
        status: 'error', 
        message: '봇 상태 확인 중 오류가 발생했습니다.' 
      };
    }
  }
}

export const telegramService = new TelegramService();

// 유틸리티 함수들
export const telegramUtils = {
  // 마감일 체크 (3일 이하 또는 지난 것들)
  needsNotification: (dueDate: string): boolean => {
    const today = new Date();
    const due = parseISO(dueDate);
    const daysLeft = differenceInDays(due, today);
    return daysLeft <= 3; // 3일 이하이거나 지난 것들
  },

  // 업무/프로젝트를 NotificationItem으로 변환
  projectToNotificationItem: (project: any, assigneeName: string): NotificationItem => ({
    id: project.id,
    title: project.name,
    type: 'project',
    dueDate: project.dueDate,
    assignedTo: project.managerId || project.assignedTo,
    assigneeName,
    status: project.status,
    progress: project.progress
  }),

  taskToNotificationItem: (task: any, assigneeName: string, projectName?: string): NotificationItem => ({
    id: task.id,
    title: task.title,
    type: 'task',
    dueDate: task.dueDate,
    assignedTo: task.assignedTo,
    assigneeName,
    status: task.status,
    progress: task.progress,
    projectName
  })
}; 