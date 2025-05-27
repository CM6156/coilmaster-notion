
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          department: string | null;
          position: string | null;
          corporation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          department?: string | null;
          position?: string | null;
          corporation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          department?: string | null;
          position?: string | null;
          corporation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          due_date: string | null;
          created_at: string;
          updated_at: string;
          project_id: string | null;
          assignee_id: string | null;
          progress: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          project_id?: string | null;
          assignee_id?: string | null;
          progress?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          project_id?: string | null;
          assignee_id?: string | null;
          progress?: number;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: string;
          start_date: string | null;
          end_date: string | null;
          client_id: string | null;
          created_at: string;
          updated_at: string;
          progress: number;
          owner_id: string;
          corporation_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status: string;
          start_date?: string | null;
          end_date?: string | null;
          client_id?: string | null;
          created_at?: string;
          updated_at?: string;
          progress?: number;
          owner_id: string;
          corporation_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          client_id?: string | null;
          created_at?: string;
          updated_at?: string;
          progress?: number;
          owner_id?: string;
          corporation_id?: string | null;
        };
      };
      task_journals: {
        Row: {
          id: string;
          user_id: string;
          task_id: string | null;
          content: string;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id?: string | null;
          content: string;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string | null;
          content?: string;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_logs: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          message?: string;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          name: string;
          url: string;
          task_id: string | null;
          project_id: string | null;
          user_id: string;
          created_at: string;
          file_type: string;
          file_size: number;
        };
        Insert: {
          id?: string;
          name: string;
          url: string;
          task_id?: string | null;
          project_id?: string | null;
          user_id: string;
          created_at?: string;
          file_type: string;
          file_size: number;
        };
        Update: {
          id?: string;
          name?: string;
          url?: string;
          task_id?: string | null;
          project_id?: string | null;
          user_id?: string;
          created_at?: string;
          file_type?: string;
          file_size?: number;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      corporations: {
        Row: {
          id: string;
          name: string;
          code: string;
          country: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          corporation_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          corporation_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          corporation_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          start_date: string;
          end_date: string | null;
          all_day: boolean;
          corporation_id: string | null;
          department_id: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
          color: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_date: string;
          end_date?: string | null;
          all_day: boolean;
          corporation_id?: string | null;
          department_id?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          color?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string | null;
          all_day?: boolean;
          corporation_id?: string | null;
          department_id?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          color?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          type: string;
          read: boolean;
          related_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          type: string;
          read?: boolean;
          related_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          message?: string;
          type?: string;
          read?: boolean;
          related_id?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
