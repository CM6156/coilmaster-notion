/**
 * 시간대 관련 유틸리티 함수들
 */

/**
 * 주어진 시간대로 날짜를 변환합니다
 * @param date - 변환할 날짜
 * @param timezone - 대상 시간대 (예: 'Asia/Seoul', 'America/New_York')
 * @returns 변환된 날짜 문자열
 */
export const formatDateInTimezone = (date: Date | string, timezone: string = 'Asia/Seoul'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return dateObj.toLocaleString('ko-KR', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('시간대 변환 오류:', error);
    return dateObj.toLocaleString();
  }
};

/**
 * 사용자의 시간대에 맞게 알림 시간을 계산합니다
 * @param notificationTime - 알림을 보낼 시간 (UTC 또는 로컬 시간)
 * @param userTimezone - 사용자의 시간대
 * @returns 사용자 시간대로 변환된 Date 객체
 */
export const convertToUserTimezone = (notificationTime: Date | string, userTimezone: string): Date => {
  const dateObj = typeof notificationTime === 'string' ? new Date(notificationTime) : notificationTime;
  
  // 현재는 간단하게 Date 객체를 반환하지만, 
  // 실제로는 시간대 변환 로직이 필요할 수 있습니다
  return dateObj;
};

/**
 * 시간대 이름을 한국어로 변환합니다
 * @param timezone - 시간대 식별자
 * @returns 한국어 시간대 이름
 */
export const getTimezoneDisplayName = (timezone: string): string => {
  const timezoneNames: { [key: string]: string } = {
    'Asia/Seoul': '한국 표준시 (KST)',
    'America/New_York': '미국 동부 표준시 (EST)',
    'America/Los_Angeles': '미국 서부 표준시 (PST)',
    'Europe/London': '영국 표준시 (GMT)',
    'Asia/Tokyo': '일본 표준시 (JST)',
    'Asia/Shanghai': '중국 표준시 (CST)',
    'Asia/Bangkok': '태국 표준시 (ICT)',
    'UTC': '협정 세계시 (UTC)'
  };
  
  return timezoneNames[timezone] || timezone;
};

/**
 * 현재 시간을 사용자의 시간대로 반환합니다
 * @param userTimezone - 사용자의 시간대
 * @returns 사용자 시간대의 현재 시간
 */
export const getCurrentTimeInUserTimezone = (userTimezone: string = 'Asia/Seoul'): string => {
  return formatDateInTimezone(new Date(), userTimezone);
};

/**
 * 두 시간대 간의 시차를 계산합니다
 * @param timezone1 - 첫 번째 시간대
 * @param timezone2 - 두 번째 시간대
 * @returns 시차 (시간 단위)
 */
export const getTimezoneOffset = (timezone1: string, timezone2: string): number => {
  const now = new Date();
  const date1 = new Date(now.toLocaleString('en-US', { timeZone: timezone1 }));
  const date2 = new Date(now.toLocaleString('en-US', { timeZone: timezone2 }));
  
  return (date1.getTime() - date2.getTime()) / (1000 * 60 * 60);
};

/**
 * 알림을 보낼 최적의 시간인지 확인합니다 (사용자의 활동 시간 고려)
 * @param userTimezone - 사용자의 시간대
 * @param currentTime - 현재 시간 (선택사항)
 * @returns 알림을 보내기 좋은 시간인지 여부
 */
export const isOptimalNotificationTime = (userTimezone: string, currentTime?: Date): boolean => {
  const now = currentTime || new Date();
  const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
  const hour = userTime.getHours();
  
  // 오전 8시부터 오후 10시까지를 최적 시간으로 설정
  return hour >= 8 && hour <= 22;
};

/**
 * 지연된 알림을 위한 스케줄링 시간을 계산합니다
 * @param userTimezone - 사용자의 시간대
 * @param delayMinutes - 지연 시간 (분)
 * @returns 스케줄된 시간
 */
export const scheduleNotification = (userTimezone: string, delayMinutes: number = 0): Date => {
  const now = new Date();
  const scheduledTime = new Date(now.getTime() + delayMinutes * 60 * 1000);
  
  // 최적 시간이 아니라면 다음 최적 시간으로 조정
  if (!isOptimalNotificationTime(userTimezone, scheduledTime)) {
    const nextOptimalTime = getNextOptimalTime(userTimezone, scheduledTime);
    return nextOptimalTime;
  }
  
  return scheduledTime;
};

/**
 * 다음 최적 알림 시간을 찾습니다
 * @param userTimezone - 사용자의 시간대
 * @param fromTime - 기준 시간
 * @returns 다음 최적 알림 시간
 */
export const getNextOptimalTime = (userTimezone: string, fromTime: Date = new Date()): Date => {
  const userTime = new Date(fromTime.toLocaleString('en-US', { timeZone: userTimezone }));
  const hour = userTime.getHours();
  
  if (hour < 8) {
    // 오전 8시로 설정
    userTime.setHours(8, 0, 0, 0);
  } else if (hour >= 22) {
    // 다음날 오전 8시로 설정
    userTime.setDate(userTime.getDate() + 1);
    userTime.setHours(8, 0, 0, 0);
  } else {
    // 현재 시간이 최적 시간 범위 내라면 그대로 반환
    return fromTime;
  }
  
  return userTime;
}; 