
import { supabase } from './supabase';
import { JournalEntry } from '@/hooks/use-journal';
import { User, Task, Project, Client, Document, TaskLog } from '@/types';

/**
 * User related functions
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return data;
}

export async function updateUserProfile(profile: Partial<User>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'User not authenticated' };
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update(profile)
    .eq('id', user.id);
    
  return { data, error };
}

/**
 * Project related functions
 */
export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      clients(name),
      user_profiles(name)
    `)
    .order('created_at', { ascending: false });
    
  return { data, error };
}

export async function createProject(project: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select();
    
  return { data, error };
}

/**
 * Task related functions
 */
export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      projects(id, name),
      user_profiles(id, name)
    `)
    .order('due_date', { ascending: true });
    
  return { data, error };
}

export async function createTask(task: Partial<Task>) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select();
    
  return { data, error };
}

export async function updateTaskProgress(taskId: string, progress: number) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ progress, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select();
    
  return { data, error };
}

/**
 * Journal related functions
 */
export async function getJournals() {
  const { data, error } = await supabase
    .from('journals')
    .select(`
      *,
      user_profiles(id, name, department)
    `)
    .order('created_at', { ascending: false });
    
  return { data, error };
}

export async function createJournal(journal: Omit<JournalEntry, 'id' | 'userName' | 'department' | 'createdAt' | 'updatedAt'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'User not authenticated' };
  
  const { data, error } = await supabase
    .from('journals')
    .insert({
      user_id: user.id,
      title: journal.title,
      content: journal.content
    })
    .select();
    
  return { data, error };
}

/**
 * Client related functions
 */
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');
    
  return { data, error };
}

export async function createClient(client: Partial<Client>) {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select();
    
  return { data, error };
}

/**
 * Document related functions
 */
export async function getDocuments(taskId?: string) {
  let query = supabase
    .from('documents')
    .select(`
      *,
      user_profiles(name)
    `)
    .order('created_at', { ascending: false });
    
  if (taskId) {
    query = query.eq('task_id', taskId);
  }
    
  const { data, error } = await query;
  return { data, error };
}

export async function uploadDocument(file: File, taskId: string, metadata: Partial<Document>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'User not authenticated' };
  
  // 1. Upload file to storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `documents/${taskId}/${fileName}`;
  
  const { data: storageData, error: storageError } = await supabase
    .storage
    .from('documents')
    .upload(filePath, file);
    
  if (storageError) return { error: storageError };
  
  // 2. Get the URL
  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);
  
  // 3. Create document record
  const { data, error } = await supabase
    .from('documents')
    .insert({
      task_id: taskId,
      name: file.name,
      title: metadata.title || file.name,
      type: file.type,
      size: file.size,
      url: publicUrl,
      uploaded_by: user.id
    })
    .select();
    
  return { data, error };
}

/**
 * Calendar events related functions
 */
export async function getCalendarEvents(corporationFilter?: string) {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .order('start_time');
    
  if (corporationFilter) {
    query = query.eq('corporation', corporationFilter);
  }
    
  const { data, error } = await query;
  return { data, error };
}

export async function createCalendarEvent(event: {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  location?: string;
  corporation?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'User not authenticated' };
  
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      ...event,
      user_id: user.id
    })
    .select();
    
  return { data, error };
}

/**
 * Notification related functions
 */
export async function getNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'User not authenticated' };
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  return { data, error };
}

export async function markNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
    
  return { data, error };
}

export async function markAllNotificationsAsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'User not authenticated' };
  
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);
    
  return { data, error };
}

export async function createNotification(notification: {
  user_id: string;
  message: string;
  type: string;
  related_id?: string;
}) {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select();
    
  return { data, error };
}
