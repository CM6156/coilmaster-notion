import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface UserActivity {
  id: string;
  name: string;
  avatar?: string;
  currentPage: string;
  currentTab?: string;
  lastActivity: Date;
  isOnline: boolean;
  role?: string;
}

interface UserActivityContextType {
  currentUsers: UserActivity[];
  updateUserActivity: (page: string, tab?: string) => void;
  getUsersOnPage: (page: string) => UserActivity[];
  getUsersOnTab: (tab: string) => UserActivity[];
}

const UserActivityContext = createContext<UserActivityContextType | undefined>(undefined);

export const useUserActivity = () => {
  const context = useContext(UserActivityContext);
  if (!context) {
    throw new Error('useUserActivity must be used within a UserActivityProvider');
  }
  return context;
};

interface UserActivityProviderProps {
  children: React.ReactNode;
}

export const UserActivityProvider: React.FC<UserActivityProviderProps> = ({ children }) => {
  const [currentUsers, setCurrentUsers] = useState<UserActivity[]>([]);
  const location = useLocation();

  // 현재 페이지에서 페이지 이름 추출
  const getPageName = (pathname: string): string => {
    if (pathname === '/' || pathname === '/dashboard') return '대시보드';
    if (pathname.startsWith('/projects')) return '프로젝트';
    if (pathname.startsWith('/clients')) return '고객사';
    if (pathname.startsWith('/tasks')) return '업무관리';
    if (pathname.startsWith('/journals')) return '업무일지';
    if (pathname.startsWith('/admin')) return '관리자';
    if (pathname.startsWith('/profile')) return '프로필';
    return '기타';
  };

  // 사용자 활동 업데이트
  const updateUserActivity = async (page: string, tab?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 사용자 정보 가져오기
      const { data: userData } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', user.id)
        .single();

      if (!userData) return;

      // 현재 사용자 활동 정보 생성
      const userActivity: UserActivity = {
        id: user.id,
        name: userData.name || user.email || 'Unknown',
        currentPage: page,
        currentTab: tab,
        lastActivity: new Date(),
        isOnline: true,
        role: userData.role
      };

      // 로컬 상태 업데이트
      setCurrentUsers(prev => {
        const filtered = prev.filter(u => u.id !== user.id);
        return [...filtered, userActivity];
      });

      // 데이터베이스에 활동 상태 저장 (선택사항)
      await supabase
        .from('user_activities')
        .upsert({
          user_id: user.id,
          current_page: page,
          current_tab: tab,
          last_activity: new Date().toISOString(),
          is_online: true
        });

    } catch (error) {
      console.error('사용자 활동 업데이트 실패:', error);
    }
  };

  // 특정 페이지의 사용자들 가져오기
  const getUsersOnPage = (page: string): UserActivity[] => {
    return currentUsers.filter(user => 
      user.currentPage === page && 
      user.isOnline &&
      new Date().getTime() - user.lastActivity.getTime() < 5 * 60 * 1000 // 5분 이내
    );
  };

  // 특정 탭의 사용자들 가져오기
  const getUsersOnTab = (tab: string): UserActivity[] => {
    return currentUsers.filter(user => 
      user.currentTab === tab && 
      user.isOnline &&
      new Date().getTime() - user.lastActivity.getTime() < 5 * 60 * 1000 // 5분 이내
    );
  };

  // 현재 위치 변경 시 활동 업데이트
  useEffect(() => {
    const pageName = getPageName(location.pathname);
    updateUserActivity(pageName);
  }, [location.pathname]);

  // 주기적으로 온라인 상태 확인 및 정리
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      setCurrentUsers(prev => 
        prev.map(user => ({
          ...user,
          isOnline: now - user.lastActivity.getTime() < 5 * 60 * 1000 // 5분 이내
        })).filter(user => 
          now - user.lastActivity.getTime() < 30 * 60 * 1000 // 30분 이내 데이터만 유지
        )
      );
    }, 60000); // 1분마다 확인

    return () => clearInterval(interval);
  }, []);

  return (
    <UserActivityContext.Provider
      value={{
        currentUsers,
        updateUserActivity,
        getUsersOnPage,
        getUsersOnTab
      }}
    >
      {children}
    </UserActivityContext.Provider>
  );
}; 