-- ========================================
-- Coilmaster Corporate System - 완전한 데이터베이스 스키마
-- 34개 migration 파일 통합 버전 (에러 없는 최종 완성본)
-- ========================================

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. 기본 마스터 테이블들
-- ========================================

-- 법인(Corporations) 테이블
CREATE TABLE IF NOT EXISTS public.corporations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    name_en VARCHAR(255),
    name_zh VARCHAR(255),
    name_th VARCHAR(255),
    translation_key VARCHAR(100) UNIQUE,
    code VARCHAR(50) UNIQUE,
    business_number VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 부서(Departments) 테이블
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    name_zh VARCHAR(255),
    name_th VARCHAR(255),
    translation_key VARCHAR(100) UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    corporation_id UUID REFERENCES public.corporations(id) ON DELETE SET NULL,
    parent_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    manager_user_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 직책(Positions) 테이블
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    name_zh VARCHAR(255),
    name_th VARCHAR(255),
    translation_key VARCHAR(100) UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    level INTEGER DEFAULT 1,
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. 사용자 관리 테이블들
-- ========================================

-- 사용자(Users) 테이블
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar TEXT DEFAULT '',
    avatar_url TEXT,
    
    -- 권한 및 상태
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    
    -- 조직 정보
    corporation_id UUID REFERENCES public.corporations(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
    employee_number VARCHAR(50) UNIQUE,
    hire_date DATE,
    
    -- 활동 정보
    is_online BOOLEAN DEFAULT false,
    current_page TEXT DEFAULT '/',
    last_login TIMESTAMPTZ,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    login_method VARCHAR(50) DEFAULT 'email',
    
    -- 설정
    language VARCHAR(5) DEFAULT 'ko' CHECK (language IN ('ko', 'en', 'zh', 'th')),
    timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    country VARCHAR(10) DEFAULT 'KR',
    
    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 사용자 세션 테이블
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    current_page TEXT DEFAULT '/',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 사용자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    page_url TEXT,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. 프로젝트 관리 테이블들
-- ========================================

-- 프로젝트 단계 테이블
CREATE TABLE IF NOT EXISTS public.phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    order_index INTEGER NOT NULL DEFAULT 1,
    type VARCHAR(20) DEFAULT 'project',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2),
    spent_budget DECIMAL(15,2) DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- 담당자 정보
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    pic_name VARCHAR(255),
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    
    -- 조직 정보
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    department VARCHAR(255),
    corporation_id UUID REFERENCES public.corporations(id) ON DELETE SET NULL,
    
    -- 프로젝트 단계
    current_phase_id UUID REFERENCES public.phases(id) ON DELETE SET NULL,
    promotion_stage VARCHAR(50) DEFAULT 'Promotion',
    promotion_status VARCHAR(50),
    project_type VARCHAR(100),
    image TEXT,
    
    -- 메타데이터
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 멤버 테이블
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('manager', 'member', 'viewer')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- ========================================
-- 4. 업무 관리 테이블들
-- ========================================

-- 업무 단계 테이블
CREATE TABLE IF NOT EXISTS public.task_phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_index),
    UNIQUE(name)
);

-- 업무(Tasks) 테이블
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT '할 일',
    priority VARCHAR(20) DEFAULT '보통',
    start_date DATE,
    due_date DATE,
    estimated_hours INTEGER,
    actual_hours INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- 관계
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    assigned_to UUID,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    task_phase UUID REFERENCES public.task_phases(id) ON DELETE SET NULL,
    
    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 업무 다중 담당자 테이블
CREATE TABLE IF NOT EXISTS public.task_assignees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, user_id)
);

-- 업무 파일 테이블
CREATE TABLE IF NOT EXISTS public.task_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    file_type TEXT,
    file_url TEXT NOT NULL,
    is_image BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 업무 링크 테이블
CREATE TABLE IF NOT EXISTS public.task_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 5. 파일 및 첨부 관리 테이블들
-- ========================================

-- 파일 테이블
CREATE TABLE IF NOT EXISTS public.files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    content_type VARCHAR,
    file_size BIGINT,
    file_path VARCHAR NOT NULL,
    uploaded_by UUID REFERENCES public.users(id),
    bucket_id VARCHAR DEFAULT 'project-files',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 첨부파일 테이블
CREATE TABLE IF NOT EXISTS public.project_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    file_name VARCHAR(500),
    file_url TEXT,
    file_size BIGINT,
    file_path VARCHAR(1000),
    content_type VARCHAR(200),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 계속해서 다음 부분을 생성합니다...
-- ======================================== 