-- Supabase schema for Coilmaster Notion application

-- User Profiles Table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  corporation TEXT,
  country TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view all profiles" 
  ON user_profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Projects Table
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients,
  request_date TIMESTAMP WITH TIME ZONE,
  target_sop_date TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  current_phase TEXT,
  description TEXT,
  manager_id UUID REFERENCES user_profiles,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policies for projects
CREATE POLICY "Users can view all projects" 
  ON projects FOR SELECT 
  USING (true);

CREATE POLICY "Managers can update their projects" 
  ON projects FOR UPDATE 
  USING (auth.uid() = manager_id);

-- Clients Table
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  contact_person TEXT,
  contact_email TEXT,
  sales_rep_id UUID REFERENCES user_profiles,
  requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policies for clients
CREATE POLICY "Users can view all clients" 
  ON clients FOR SELECT 
  USING (true);

-- Tasks Table
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT,
  assigned_to UUID REFERENCES user_profiles,
  start_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'not-started',
  progress INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  dependencies TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policies for tasks
CREATE POLICY "Users can view all tasks" 
  ON tasks FOR SELECT 
  USING (true);

CREATE POLICY "Assigned users can update tasks" 
  ON tasks FOR UPDATE 
  USING (auth.uid() = assigned_to);

-- Documents Table
CREATE TABLE documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  uploaded_by UUID REFERENCES user_profiles,
  url TEXT,
  size INTEGER,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policies for documents
CREATE POLICY "Users can view all documents" 
  ON documents FOR SELECT 
  USING (true);

-- Task Logs Table
CREATE TABLE task_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES user_profiles NOT NULL,
  content TEXT NOT NULL,
  hours_spent NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on task_logs
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;

-- Policies for task_logs
CREATE POLICY "Users can view all task logs" 
  ON task_logs FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own task logs" 
  ON task_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Journals Table
CREATE TABLE journals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on journals
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- Policies for journals
CREATE POLICY "Users can view all journals" 
  ON journals FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own journals" 
  ON journals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journals" 
  ON journals FOR UPDATE 
  USING (auth.uid() = user_id);

-- Calendar Events Table
CREATE TABLE calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  corporation TEXT,
  user_id UUID REFERENCES user_profiles,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policies for calendar_events
CREATE POLICY "Users can view all calendar events" 
  ON calendar_events FOR SELECT 
  USING (true);

CREATE POLICY "Users can create calendar events" 
  ON calendar_events FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Reports Configuration Table
CREATE TABLE report_configurations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  filters JSONB,
  user_id UUID REFERENCES user_profiles NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on report_configurations
ALTER TABLE report_configurations ENABLE ROW LEVEL SECURITY;

-- Policies for report_configurations
CREATE POLICY "Users can view their own report configurations" 
  ON report_configurations FOR SELECT 
  USING (auth.uid() = user_id);

-- System Settings Table
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES user_profiles,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policies for system_settings
CREATE POLICY "Only admins can modify system settings" 
  ON system_settings FOR ALL 
  USING (auth.uid() IN (SELECT id FROM user_profiles WHERE position = 'admin'));

-- Notifications Table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

-- Competitors Table
CREATE TABLE competitors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  product TEXT NOT NULL,
  price DECIMAL,
  market_share DECIMAL,
  strengths TEXT[],
  weaknesses TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on competitors
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

-- Policies for competitors
CREATE POLICY "Users can view all competitors" 
  ON competitors FOR SELECT 
  USING (true);

CREATE POLICY "Admins can insert competitors" 
  ON competitors FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can update competitors" 
  ON competitors FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can delete competitors" 
  ON competitors FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'admin'
    )
  );

-- Create functions to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
