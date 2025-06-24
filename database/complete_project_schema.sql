-- ========================================
-- 프로젝트 생성을 위한 완전한 스키마 설정
-- ========================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. managers 테이블 생성 (담당자 관리와 연동)
CREATE TABLE IF NOT EXISTS public.managers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    department_id UUID,
    corporation_id UUID,
    position_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. departments 테이블 생성
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. positions 테이블 생성
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. corporations 테이블 생성
CREATE TABLE IF NOT EXISTS public.corporations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. phases 테이블 생성 (프로모션 단계 관리)
CREATE TABLE IF NOT EXISTS public.phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. projects 테이블 생성 (완전한 버전)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planned',
    promotion_status VARCHAR(50) DEFAULT 'planned',
    current_phase_id UUID REFERENCES public.phases(id) ON DELETE SET NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    due_date DATE,
    end_date DATE,
    manager_id UUID REFERENCES public.managers(id) ON DELETE SET NULL,
    pic_name VARCHAR(255), -- 담당자 이름 (백업용)
    project_type VARCHAR(100) DEFAULT '일반',
    request_date DATE,
    target_sop_date DATE,
    completed BOOLEAN DEFAULT false,
    team JSONB DEFAULT '[]',
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6-1. 기존 projects 테이블에 누락된 컬럼들 추가 (기존 테이블이 있는 경우)
DO $$ 
BEGIN
    -- current_phase_id 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'current_phase_id') THEN
        ALTER TABLE public.projects ADD COLUMN current_phase_id UUID REFERENCES public.phases(id) ON DELETE SET NULL;
    END IF;
    
    -- manager_id 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'manager_id') THEN
        ALTER TABLE public.projects ADD COLUMN manager_id UUID REFERENCES public.managers(id) ON DELETE SET NULL;
    END IF;
    
    -- pic_name 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'pic_name') THEN
        ALTER TABLE public.projects ADD COLUMN pic_name VARCHAR(255);
    END IF;
    
    -- start_date 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'start_date') THEN
        ALTER TABLE public.projects ADD COLUMN start_date DATE;
    END IF;
    
    -- due_date 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'due_date') THEN
        ALTER TABLE public.projects ADD COLUMN due_date DATE;
    END IF;
    
    -- end_date 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'end_date') THEN
        ALTER TABLE public.projects ADD COLUMN end_date DATE;
    END IF;
    
    -- progress 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'progress') THEN
        ALTER TABLE public.projects ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
    END IF;
    
    -- request_date 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'request_date') THEN
        ALTER TABLE public.projects ADD COLUMN request_date DATE;
    END IF;
    
    -- target_sop_date 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'target_sop_date') THEN
        ALTER TABLE public.projects ADD COLUMN target_sop_date DATE;
    END IF;
    
    -- team 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'team') THEN
        ALTER TABLE public.projects ADD COLUMN team JSONB DEFAULT '[]';
    END IF;
    
    -- image 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'image') THEN
        ALTER TABLE public.projects ADD COLUMN image TEXT;
    END IF;
    
    -- project_type 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'project_type') THEN
        ALTER TABLE public.projects ADD COLUMN project_type VARCHAR(100) DEFAULT '일반';
    END IF;
    
    -- promotion_status 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'promotion_status') THEN
        ALTER TABLE public.projects ADD COLUMN promotion_status VARCHAR(50) DEFAULT 'planned';
    END IF;
    
    -- completed 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'completed') THEN
        ALTER TABLE public.projects ADD COLUMN completed BOOLEAN DEFAULT false;
    END IF;
    
    -- status 컬럼 추가 (기본값 설정)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'status') THEN
        ALTER TABLE public.projects ADD COLUMN status VARCHAR(50) DEFAULT 'planned';
    END IF;
END $$;

-- 7. 외래키 제약조건 추가
ALTER TABLE public.managers 
ADD CONSTRAINT fk_managers_department 
FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.managers 
ADD CONSTRAINT fk_managers_corporation 
FOREIGN KEY (corporation_id) REFERENCES public.corporations(id) ON DELETE SET NULL;

ALTER TABLE public.managers 
ADD CONSTRAINT fk_managers_position 
FOREIGN KEY (position_id) REFERENCES public.positions(id) ON DELETE SET NULL;

-- 8. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON public.projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_promotion_stage ON public.projects(current_phase_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON public.projects(due_date);
CREATE INDEX IF NOT EXISTS idx_managers_email ON public.managers(email);
CREATE INDEX IF NOT EXISTS idx_managers_name ON public.managers(name);

-- 9. 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. 트리거 설정
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON public.projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_managers_updated_at ON public.managers;
CREATE TRIGGER update_managers_updated_at 
    BEFORE UPDATE ON public.managers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 11. RLS (Row Level Security) 설정
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;

-- 12. 기본 RLS 정책 (모든 인증된 사용자 접근 가능)
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.projects;
CREATE POLICY "Allow authenticated users full access" 
ON public.projects 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.managers;
CREATE POLICY "Allow authenticated users full access" 
ON public.managers 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.departments;
CREATE POLICY "Allow authenticated users full access" 
ON public.departments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.positions;
CREATE POLICY "Allow authenticated users full access" 
ON public.positions 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.corporations;
CREATE POLICY "Allow authenticated users full access" 
ON public.corporations 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.phases;
CREATE POLICY "Allow authenticated users full access" 
ON public.phases 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 완료 메시지
SELECT '✅ 프로젝트 생성을 위한 완전한 스키마가 설정되었습니다!' as message;
SELECT '📋 담당자 관리와 프로모션 단계가 연동되어 있습니다!' as integration_status; 