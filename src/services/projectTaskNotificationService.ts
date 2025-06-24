import { Project, Task } from '@/types';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface TaskAssigneeInfo {
  assigneeId: string;
  assigneeName: string;
  tasks: TaskInfo[];
}

export interface TaskInfo {
  id: string;
  title: string;
  dueDate?: string;
  progress: number;
  status: string;
  priority?: string;
  description?: string;
  phaseInfo?: {
    name: string;
    color: string;
  };
}

export interface ProjectNotificationData {
  project: Project;
  assigneeGroups: TaskAssigneeInfo[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  upcomingTasks: number;
}

class ProjectTaskNotificationService {
  
  // 프로젝트의 업무를 담당자별로 그룹화
  groupTasksByAssignee(tasks: Task[], userNameGetter: (id: string) => string): TaskAssigneeInfo[] {
    const assigneeMap = new Map<string, TaskInfo[]>();
    
    tasks.forEach(task => {
      const assigneeId = task.assignedTo || 'unassigned';
      const assigneeName = assigneeId === 'unassigned' ? '미할당' : userNameGetter(assigneeId);
      
      const taskInfo: TaskInfo = {
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        progress: task.progress || 0,
        status: task.status,
        priority: task.priority,
        description: task.description,
      };
      
      if (!assigneeMap.has(assigneeId)) {
        assigneeMap.set(assigneeId, []);
      }
      assigneeMap.get(assigneeId)!.push(taskInfo);
    });
    
    return Array.from(assigneeMap.entries()).map(([assigneeId, tasks]) => ({
      assigneeId,
      assigneeName: assigneeId === 'unassigned' ? '미할당' : userNameGetter(assigneeId),
      tasks
    }));
  }
  
  // 프로젝트 알림 데이터 생성
  generateProjectNotificationData(project: Project, tasks: Task[], userNameGetter: (id: string) => string): ProjectNotificationData {
    const today = new Date();
    
    const completedTasks = tasks.filter(task => 
      task.status === '완료 100%' || task.progress === 100
    );
    
    const inProgressTasks = tasks.filter(task => 
      task.status !== '완료 100%' && task.progress !== 100 && task.progress > 0
    );
    
    const overdueTasks = tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < today && 
      task.status !== '완료 100%' && 
      task.progress !== 100
    );
    
    const upcomingTasks = tasks.filter(task => 
      task.dueDate && 
      differenceInDays(parseISO(task.dueDate), today) <= 7 &&
      differenceInDays(parseISO(task.dueDate), today) >= 0 &&
      task.status !== '완료 100%' && 
      task.progress !== 100
    );
    
    const assigneeGroups = this.groupTasksByAssignee(tasks, userNameGetter);
    
    return {
      project,
      assigneeGroups,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      overdueTasks: overdueTasks.length,
      upcomingTasks: upcomingTasks.length
    };
  }
  
  // 전체 프로젝트 요약 메시지 생성
  generateProjectSummaryMessage(data: ProjectNotificationData): string {
    const { project, assigneeGroups, totalTasks, completedTasks, inProgressTasks, overdueTasks, upcomingTasks } = data;
    
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const notStartedTasks = totalTasks - completedTasks - inProgressTasks;
    
    let message = `📊 **${project.name} 프로젝트 전체 현황 보고**\n\n`;
    message += `📅 보고 시간: ${format(new Date(), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}\n`;
    
    // 프로젝트 기본 정보
    message += `📁 프로젝트명: **${project.name}**\n`;
    if (project.description) {
      message += `📝 설명: ${project.description.length > 100 ? project.description.substring(0, 100) + '...' : project.description}\n`;
    }
    if (project.startDate) {
      message += `🚀 시작일: ${format(parseISO(project.startDate), 'yyyy년 MM월 dd일', { locale: ko })}\n`;
    }
    if (project.dueDate) {
      const daysLeft = differenceInDays(parseISO(project.dueDate), new Date());
      const dueStatus = daysLeft >= 0 ? `${daysLeft}일 남음` : `${Math.abs(daysLeft)}일 지연`;
      const statusIcon = daysLeft >= 0 ? '🟢' : '🔴';
      message += `📅 마감일: ${format(parseISO(project.dueDate), 'yyyy년 MM월 dd일', { locale: ko })} (${dueStatus}) ${statusIcon}\n`;
    }
    
    message += `\n═══════════════════════\n\n`;
    
    // 전체 진행률 및 통계
    const progressBar = this.generateProgressBar(progressPercentage);
    message += `📈 **전체 진행률: ${progressBar} ${progressPercentage}%**\n\n`;
    
    message += `📊 **업무 현황 통계**\n`;
    message += `📋 총 업무: **${totalTasks}개**\n`;
    message += `✅ 완료: **${completedTasks}개** (${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)\n`;
    message += `🔄 진행중: **${inProgressTasks}개** (${totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%)\n`;
    message += `⭕ 시작전: **${notStartedTasks}개** (${totalTasks > 0 ? Math.round((notStartedTasks / totalTasks) * 100) : 0}%)\n`;
    
    if (overdueTasks > 0) {
      message += `⚠️ **지연: ${overdueTasks}개** (${totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0}%) 🚨\n`;
    }
    if (upcomingTasks > 0) {
      message += `📅 임박(7일내): **${upcomingTasks}개** (${totalTasks > 0 ? Math.round((upcomingTasks / totalTasks) * 100) : 0}%) ⚡\n`;
    }
    
    message += `\n═══════════════════════\n\n`;
    
    // 담당자별 상세 현황
    message += `👥 **담당자별 상세 현황**\n`;
    
    // 담당자를 완료율 순으로 정렬
    const sortedAssignees = assigneeGroups
      .filter(group => group.assigneeId !== 'unassigned')
      .map(group => {
        const completed = group.tasks.filter(t => t.status === '완료 100%' || t.progress === 100).length;
        const inProgress = group.tasks.filter(t => t.status !== '완료 100%' && t.progress !== 100 && t.progress > 0).length;
        const notStarted = group.tasks.filter(t => t.progress === 0).length;
        const overdue = group.tasks.filter(t => 
          t.dueDate && 
          new Date(t.dueDate) < new Date() && 
          t.status !== '완료 100%' && 
          t.progress !== 100
        ).length;
        const total = group.tasks.length;
        const progressRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
          ...group,
          completed,
          inProgress,
          notStarted,
          overdue,
          total,
          progressRate
        };
      })
      .sort((a, b) => {
        // 지연 업무가 있는 담당자를 먼저, 그 다음 완료율 순
        if (a.overdue !== b.overdue) {
          return b.overdue - a.overdue; // 지연 업무 많은 순
        }
        return a.progressRate - b.progressRate; // 완료율 낮은 순
      });
    
    sortedAssignees.forEach((assignee, index) => {
      const statusIcon = assignee.overdue > 0 ? '🚨' : 
                        assignee.progressRate === 100 ? '🎉' : 
                        assignee.progressRate >= 80 ? '🟢' : 
                        assignee.progressRate >= 50 ? '🟡' : '🔴';
      
      message += `\n${index + 1}. **${assignee.assigneeName}** ${statusIcon}\n`;
      message += `   📋 담당 업무: ${assignee.total}개\n`;
      message += `   📊 진행률: ${this.generateProgressBar(assignee.progressRate)} ${assignee.progressRate}%\n`;
      message += `   ✅ 완료: ${assignee.completed}개 | 🔄 진행중: ${assignee.inProgress}개 | ⭕ 시작전: ${assignee.notStarted}개\n`;
      
      if (assignee.overdue > 0) {
        message += `   ⚠️ **지연: ${assignee.overdue}개** - 즉시 확인 필요!\n`;
      }
      
      // 주요 이슈가 있는 업무들 (지연 또는 임박)
      const criticalTasks = assignee.tasks.filter(task => {
        if (!task.dueDate) return false;
        const daysLeft = differenceInDays(parseISO(task.dueDate), new Date());
        const isOverdue = daysLeft < 0 && task.status !== '완료 100%' && task.progress !== 100;
        const isUpcoming = daysLeft >= 0 && daysLeft <= 3 && task.status !== '완료 100%' && task.progress !== 100;
        return isOverdue || isUpcoming;
      });
      
      if (criticalTasks.length > 0) {
        message += `   🔥 주요 이슈:\n`;
        criticalTasks.slice(0, 2).forEach(task => {
          const daysLeft = differenceInDays(parseISO(task.dueDate!), new Date());
          const urgencyText = daysLeft < 0 ? `${Math.abs(daysLeft)}일 지연` : 
                             daysLeft === 0 ? '오늘 마감' : 
                             `${daysLeft}일 남음`;
          const urgencyIcon = daysLeft < 0 ? '🚨' : daysLeft <= 1 ? '⚡' : '⚠️';
          
          message += `      ${urgencyIcon} ${task.title} (${task.progress}%, ${urgencyText})\n`;
        });
        if (criticalTasks.length > 2) {
          message += `      ... 외 ${criticalTasks.length - 2}개 이슈\n`;
        }
      }
    });
    
    // 미할당 업무가 있는 경우
    const unassignedGroup = assigneeGroups.find(group => group.assigneeId === 'unassigned');
    if (unassignedGroup && unassignedGroup.tasks.length > 0) {
      message += `\n⚠️ **미할당 업무: ${unassignedGroup.tasks.length}개**\n`;
      unassignedGroup.tasks.slice(0, 3).forEach((task, index) => {
        message += `   ${index + 1}. ${task.title}\n`;
      });
      if (unassignedGroup.tasks.length > 3) {
        message += `   ... 외 ${unassignedGroup.tasks.length - 3}개\n`;
      }
    }
    
    message += `\n═══════════════════════\n\n`;
    
    // 프로젝트 상태 요약 및 권장사항
    message += `💡 **프로젝트 상태 및 권장사항**\n`;
    
    if (overdueTasks > 0) {
      message += `🚨 **긴급**: ${overdueTasks}개 업무가 지연되었습니다. 즉시 점검이 필요합니다.\n`;
    }
    
    if (upcomingTasks > 0) {
      message += `⚡ **주의**: ${upcomingTasks}개 업무의 마감일이 임박했습니다.\n`;
    }
    
    if (progressPercentage >= 90) {
      message += `🎉 프로젝트가 거의 완료 단계입니다! 마무리 작업에 집중하세요.\n`;
    } else if (progressPercentage >= 70) {
      message += `🟢 프로젝트가 순조롭게 진행 중입니다.\n`;
    } else if (progressPercentage >= 50) {
      message += `🟡 프로젝트 진행률을 높이기 위한 추가 노력이 필요합니다.\n`;
    } else {
      message += `🔴 프로젝트 진행이 지연되고 있습니다. 전략 검토가 필요합니다.\n`;
    }
    
    const lowPerformers = sortedAssignees.filter(a => a.progressRate < 50 && a.total > 0);
    if (lowPerformers.length > 0) {
      message += `📞 **관리 필요**: ${lowPerformers.map(a => a.assigneeName).join(', ')}님의 업무 진행 상황을 확인해주세요.\n`;
    }
    
    message += `\n📱 각 담당자에게는 개별 상세 알림이 발송되었습니다.\n`;
    message += `💼 프로젝트 관리 시스템에서 실시간 현황을 확인하세요!\n\n`;
    message += `🤖 ${format(new Date(), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })} 프로젝트 관리 시스템 자동 발송`;
    
    return message;
  }
  
  // 개별 담당자용 메시지 생성
  generatePersonalMessage(assigneeInfo: TaskAssigneeInfo, project: Project): string {
    const today = new Date();
    
    let message = `👋 안녕하세요, ${assigneeInfo.assigneeName}님!\n\n`;
    message += `📁 **${project.name}** 프로젝트의 귀하 담당 업무 상세 현황을 알려드립니다.\n\n`;
    
    // 개인 업무 통계
    const completed = assigneeInfo.tasks.filter(t => t.status === '완료 100%' || t.progress === 100);
    const inProgress = assigneeInfo.tasks.filter(t => t.status !== '완료 100%' && t.progress !== 100 && t.progress > 0);
    const notStarted = assigneeInfo.tasks.filter(t => t.progress === 0);
    const overdue = assigneeInfo.tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < today && 
      t.status !== '완료 100%' && 
      t.progress !== 100
    );
    
    message += `📊 **업무 요약**\n`;
    message += `• 전체 담당 업무: ${assigneeInfo.tasks.length}개\n`;
    message += `• ✅ 완료: ${completed.length}개\n`;
    message += `• 🔄 진행중: ${inProgress.length}개\n`;
    message += `• ⭕ 시작 전: ${notStarted.length}개\n`;
    if (overdue.length > 0) {
      message += `• ⚠️ 지연: ${overdue.length}개\n`;
    }
    message += `\n═══════════════════════\n\n`;
    
    // 전체 업무 상세 목록 (카테고리별로 구분)
    
    // 1. 지연 업무
    if (overdue.length > 0) {
      message += `🚨 **지연 업무 (${overdue.length}개) - 즉시 조치 필요**\n`;
      overdue.forEach((task, index) => {
        const daysOverdue = Math.abs(differenceInDays(parseISO(task.dueDate!), today));
        const progressBar = this.generateProgressBar(task.progress);
        
        message += `\n${index + 1}. 📋 **${task.title}**\n`;
        message += `   🕐 마감일: ${format(parseISO(task.dueDate!), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}\n`;
        message += `   ⏰ 지연: **${daysOverdue}일 지연** 🔴\n`;
        message += `   📊 진행률: ${progressBar} ${task.progress}%\n`;
        message += `   📝 상태: ${task.status}\n`;
        if (task.description) {
          message += `   📄 설명: ${task.description.length > 50 ? task.description.substring(0, 50) + '...' : task.description}\n`;
        }
      });
      message += `\n═══════════════════════\n\n`;
    }
    
    // 2. 임박한 업무 (7일 이내)
    const upcoming = assigneeInfo.tasks.filter(t => 
      t.dueDate && 
      differenceInDays(parseISO(t.dueDate), today) <= 7 &&
      differenceInDays(parseISO(t.dueDate), today) >= 0 &&
      t.status !== '완료 100%' && 
      t.progress !== 100 &&
      !overdue.some(o => o.id === t.id) // 지연 업무는 제외
    );
    
    if (upcoming.length > 0) {
      message += `⏰ **마감 임박 업무 (${upcoming.length}개) - 7일 이내**\n`;
      upcoming.forEach((task, index) => {
        const daysLeft = differenceInDays(parseISO(task.dueDate!), today);
        const dueText = daysLeft === 0 ? '**오늘 마감** 🔴' : 
                       daysLeft === 1 ? '**내일 마감** 🟡' : 
                       daysLeft <= 3 ? `**${daysLeft}일 후 마감** 🟡` :
                       `${daysLeft}일 후 마감`;
        const progressBar = this.generateProgressBar(task.progress);
        
        message += `\n${index + 1}. 📋 **${task.title}**\n`;
        message += `   🕐 마감일: ${format(parseISO(task.dueDate!), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}\n`;
        message += `   ⏰ 남은 기간: ${dueText}\n`;
        message += `   📊 진행률: ${progressBar} ${task.progress}%\n`;
        message += `   📝 상태: ${task.status}\n`;
        if (task.description) {
          message += `   📄 설명: ${task.description.length > 50 ? task.description.substring(0, 50) + '...' : task.description}\n`;
        }
      });
      message += `\n═══════════════════════\n\n`;
    }
    
    // 3. 진행중인 업무 (지연/임박 제외)
    const normalInProgress = inProgress.filter(task => 
      !overdue.some(o => o.id === task.id) && 
      !upcoming.some(u => u.id === task.id)
    );
    
    if (normalInProgress.length > 0) {
      message += `🔄 **진행중인 업무 (${normalInProgress.length}개)**\n`;
      normalInProgress.forEach((task, index) => {
        const progressBar = this.generateProgressBar(task.progress);
        
        message += `\n${index + 1}. 📋 **${task.title}**\n`;
        if (task.dueDate) {
          const daysLeft = differenceInDays(parseISO(task.dueDate), today);
          message += `   🕐 마감일: ${format(parseISO(task.dueDate), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}\n`;
          message += `   ⏰ 남은 기간: ${daysLeft > 0 ? `${daysLeft}일` : '마감일 확인 필요'}\n`;
        } else {
          message += `   🕐 마감일: 설정되지 않음\n`;
        }
        message += `   📊 진행률: ${progressBar} ${task.progress}%\n`;
        message += `   📝 상태: ${task.status}\n`;
        if (task.description) {
          message += `   📄 설명: ${task.description.length > 50 ? task.description.substring(0, 50) + '...' : task.description}\n`;
        }
      });
      message += `\n═══════════════════════\n\n`;
    }
    
    // 4. 시작 전 업무
    if (notStarted.length > 0) {
      message += `⭕ **시작 전 업무 (${notStarted.length}개)**\n`;
      notStarted.forEach((task, index) => {
        message += `\n${index + 1}. 📋 **${task.title}**\n`;
        if (task.dueDate) {
          const daysLeft = differenceInDays(parseISO(task.dueDate), today);
          message += `   🕐 마감일: ${format(parseISO(task.dueDate), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}\n`;
          message += `   ⏰ 남은 기간: ${daysLeft > 0 ? `${daysLeft}일` : '마감일 지남'}\n`;
        } else {
          message += `   🕐 마감일: 설정되지 않음\n`;
        }
        message += `   📊 진행률: ⬜⬜⬜⬜⬜ 0% (시작 필요)\n`;
        message += `   📝 상태: ${task.status}\n`;
        if (task.description) {
          message += `   📄 설명: ${task.description.length > 50 ? task.description.substring(0, 50) + '...' : task.description}\n`;
        }
      });
      message += `\n═══════════════════════\n\n`;
    }
    
    // 5. 완료된 업무 (간단히)
    if (completed.length > 0) {
      message += `✅ **완료된 업무 (${completed.length}개)**\n`;
      completed.slice(0, 3).forEach((task, index) => {
        message += `${index + 1}. ${task.title} ✅\n`;
      });
      if (completed.length > 3) {
        message += `   ... 외 ${completed.length - 3}개 완료\n`;
      }
      message += `\n═══════════════════════\n\n`;
    }
    
    // 마무리
    message += `💡 **추천 행동**\n`;
    if (overdue.length > 0) {
      message += `• 🚨 지연 업무 ${overdue.length}개를 우선적으로 처리해주세요\n`;
    }
    if (upcoming.length > 0) {
      message += `• ⏰ 임박한 업무 ${upcoming.length}개의 진행률을 확인해주세요\n`;
    }
    if (notStarted.length > 0) {
      message += `• 🏁 시작하지 않은 업무 ${notStarted.length}개의 계획을 세워주세요\n`;
    }
    
    message += `\n📱 업무 관리 시스템에서 더 자세한 내용을 확인하고 업데이트하세요!\n`;
    message += `🤖 ${format(new Date(), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })} 프로젝트 관리 시스템 자동 발송`;
    
    return message;
  }

  // 진행률 바 생성 (시각적 표현)
  generateProgressBar(progress: number): string {
    const totalBars = 5;
    const filledBars = Math.round((progress / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    
    let bar = '';
    for (let i = 0; i < filledBars; i++) {
      bar += '🟩';
    }
    for (let i = 0; i < emptyBars; i++) {
      bar += '⬜';
    }
    return bar;
  }
  
  // 텔레그램 메시지 발송
  async sendTelegramNotification(
    chatId: string,
    message: string,
    botToken: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('텔레그램 메시지 발송 오류:', error);
      return false;
    }
  }
  
  // 프로젝트 업무 알림 발송 (담당자별 개별 발송)
  async sendProjectTaskNotifications(
    project: Project,
    tasks: Task[],
    userNameGetter: (id: string) => string,
    getTelegramChatId: (userId: string) => string | null,
    botToken: string,
    groupChatId?: string
  ): Promise<{
    success: boolean;
    results: Array<{
      assigneeId: string;
      assigneeName: string;
      success: boolean;
      error?: string;
    }>;
    groupMessageSent?: boolean;
  }> {
    const notificationData = this.generateProjectNotificationData(project, tasks, userNameGetter);
    const results: Array<{
      assigneeId: string;
      assigneeName: string;
      success: boolean;
      error?: string;
    }> = [];
    
    // 개별 담당자에게 발송
    for (const assigneeInfo of notificationData.assigneeGroups) {
      if (assigneeInfo.assigneeId === 'unassigned') continue;
      
      const chatId = getTelegramChatId(assigneeInfo.assigneeId);
      if (!chatId) {
        results.push({
          assigneeId: assigneeInfo.assigneeId,
          assigneeName: assigneeInfo.assigneeName,
          success: false,
          error: '텔레그램 채팅 ID가 설정되지 않음'
        });
        continue;
      }
      
      const personalMessage = this.generatePersonalMessage(assigneeInfo, project);
      const success = await this.sendTelegramNotification(chatId, personalMessage, botToken);
      
      results.push({
        assigneeId: assigneeInfo.assigneeId,
        assigneeName: assigneeInfo.assigneeName,
        success,
        error: success ? undefined : '메시지 발송 실패'
      });
    }
    
    // 그룹 채팅에 요약 메시지 발송 (옵션)
    let groupMessageSent = false;
    if (groupChatId) {
      const summaryMessage = this.generateProjectSummaryMessage(notificationData);
      groupMessageSent = await this.sendTelegramNotification(groupChatId, summaryMessage, botToken);
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return {
      success: successCount > 0,
      results,
      groupMessageSent
    };
  }
}

export const projectTaskNotificationService = new ProjectTaskNotificationService();
export default projectTaskNotificationService; 