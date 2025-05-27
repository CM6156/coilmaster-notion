import { useState, useEffect, useCallback } from 'react';
import { TaskLog, Notification } from '@/types';

interface UseJournalProps {
  initialLogs: TaskLog[];
  initialNotifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

export const useJournal = ({ initialLogs, initialNotifications, setNotifications }: UseJournalProps) => {
  const [logs, setLogs] = useState<TaskLog[]>(initialLogs);
  const [notifications, setLocalNotifications] = useState<Notification[]>(initialNotifications);

  useEffect(() => {
    setLocalNotifications(initialNotifications);
  }, [initialNotifications]);

  const addLog = (log: TaskLog) => {
    setLogs(prevLogs => [log, ...prevLogs]);
  };

  const addSystemJournalEntry = (message: string, type = 'system', relatedId = '') => {
    const newNotification: Omit<Notification, 'id'> = {
      message,
      type,
      relatedId,
      read: false,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleString()
    };
    
    // Add to notifications
    const newId = Date.now().toString();
    setNotifications(prev => [{...newNotification, id: newId }, ...prev]);
  };

  const addUserJournalEntry = (userId: string, message: string, type = 'user', relatedId = '') => {
    const newNotification: Omit<Notification, 'id'> = {
      userId,
      message,
      type,
      relatedId,
      read: false,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleString()
    };
    
    // Add to notifications
    const newId = Date.now().toString();
    setNotifications(prev => [{...newNotification, id: newId }, ...prev]);
  };

  const logTaskEvent = useCallback((taskId: string, userId: string, action: string, details: string) => {
    const newLog: TaskLog = {
      id: Date.now().toString(),
      taskId,
      userId,
      action,
      details,
      createdAt: new Date().toISOString(),
    };

    addLog(newLog);
  }, [addLog]);

  return {
    logs,
    addLog,
    logTaskEvent,
    addSystemJournalEntry,
    addUserJournalEntry,
    notifications: localNotifications,
  };
};
