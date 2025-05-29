-- Fix tasks table structure and add missing features for Notion-style task management
-- Migration: fix_tasks_structure.sql

-- Add missing columns to tasks table if they don't exist
DO $$ 
BEGIN
    -- Add parent_task_id for hierarchical tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='parent_task_id') THEN
        ALTER TABLE public.tasks ADD COLUMN parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;
    END IF;
    
    -- Add task_phase for stage management
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='task_phase') THEN
        ALTER TABLE public.tasks ADD COLUMN task_phase UUID REFERENCES public.task_phases(id) ON DELETE SET NULL;
    END IF;
    
    -- Update status values to Korean
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='status') THEN
        -- Add constraint for Korean status values
        ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
        CHECK (status IN ('할 일', '진행중', '검토중', '완료', '지연', '보류'));
    END IF;
    
    -- Fix department column to reference departments table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='department' AND data_type='text') THEN
        -- Create a backup column first
        ALTER TABLE public.tasks ADD COLUMN department_temp UUID;
        
        -- Try to match department names to UUIDs
        UPDATE public.tasks 
        SET department_temp = d.id 
        FROM public.departments d 
        WHERE public.tasks.department = d.name OR public.tasks.department = d.code;
        
        -- Drop old column and rename new one
        ALTER TABLE public.tasks DROP COLUMN department;
        ALTER TABLE public.tasks RENAME COLUMN department_temp TO department;
        
        -- Add foreign key constraint
        ALTER TABLE public.tasks ADD CONSTRAINT fk_tasks_department 
        FOREIGN KEY (department) REFERENCES public.departments(id) ON DELETE SET NULL;
    END IF;
    
    -- Ensure project_id is properly named (not projectId)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='projectId') THEN
        ALTER TABLE public.tasks RENAME COLUMN "projectId" TO project_id;
    END IF;
    
    -- Ensure assigned_to is properly named (not assignedTo)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assignedTo') THEN
        ALTER TABLE public.tasks RENAME COLUMN "assignedTo" TO assigned_to;
    END IF;
END $$;

-- Create task_phases table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6', -- hex color
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(order_index)
);

-- Insert default task phases
INSERT INTO public.task_phases (name, description, color, order_index) VALUES
    ('영업 접촉', '고객과의 초기 접촉 및 요구사항 파악', '#ef4444', 1),
    ('견적서 및 입수', '견적서 작성 및 제출', '#f97316', 2),
    ('계약서 통지', '계약 체결 및 통지', '#22c55e', 3),
    ('설계서 수성환경', '설계 문서 작성 및 검토', '#3b82f6', 4),
    ('5차 채점', '중간 검토 및 평가', '#8b5cf6', 5),
    ('생산 수성환경', '생산 환경 설정', '#06b6d4', 6),
    ('양만 검증', '품질 검증 및 테스트', '#10b981', 7),
    ('E.Service Content', '서비스 콘텐츠 준비', '#f59e0b', 8),
    ('E.Service 영양', '서비스 제공', '#84cc16', 9),
    ('LINE 그러기', '생산 라인 설정', '#6366f1', 10),
    ('원가 산출', '원가 계산 및 분석', '#ec4899', 11),
    ('PP', '생산 준비', '#14b8a6', 12),
    ('충돌 Review', '최종 검토', '#f97316', 13),
    ('직돌 개선', '프로세스 개선', '#22c55e', 14),
    ('수주', '주문 접수', '#3b82f6', 15)
ON CONFLICT (order_index) DO NOTHING;

-- Create task_files table for file management
CREATE TABLE IF NOT EXISTS public.task_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    file_url TEXT,
    is_image BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create task_links table for link management
CREATE TABLE IF NOT EXISTS public.task_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    title VARCHAR(255),
    url TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_phase ON public.tasks(task_phase);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON public.tasks(department);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON public.task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON public.task_links(task_id);
CREATE INDEX IF NOT EXISTS idx_task_phases_order_index ON public.task_phases(order_index);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_phases_updated_at
    BEFORE UPDATE ON public.task_phases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_files_updated_at
    BEFORE UPDATE ON public.task_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_links_updated_at
    BEFORE UPDATE ON public.task_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE public.task_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all task phases" 
    ON public.task_phases FOR SELECT 
    USING (true);

CREATE POLICY "Users can view all task files" 
    ON public.task_files FOR SELECT 
    USING (true);

CREATE POLICY "Users can manage task files" 
    ON public.task_files FOR ALL 
    USING (true);

CREATE POLICY "Users can view all task links" 
    ON public.task_links FOR SELECT 
    USING (true);

CREATE POLICY "Users can manage task links" 
    ON public.task_links FOR ALL 
    USING (true);

-- Update existing tasks to have default status in Korean
UPDATE public.tasks 
SET status = CASE 
    WHEN status = 'not-started' OR status = 'todo' THEN '할 일'
    WHEN status = 'in-progress' OR status = 'doing' THEN '진행중'
    WHEN status = 'review' THEN '검토중'
    WHEN status = 'completed' OR status = 'done' THEN '완료'
    WHEN status = 'delayed' THEN '지연'
    WHEN status = 'on-hold' THEN '보류'
    ELSE '할 일'
END
WHERE status NOT IN ('할 일', '진행중', '검토중', '완료', '지연', '보류'); 