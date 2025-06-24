-- ========================================
-- Coilmaster Corporate System - 완전한 데이터베이스 스키마 Part 2
-- 관리 시스템 테이블들
-- ========================================

-- ========================================
-- 6. 업무 일지 및 개인 관리 테이블들
-- ========================================

-- 업무 일지 테이블
CREATE TABLE IF NOT EXISTS public.work_journals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    author_id UUID,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    plans TEXT,
    completed TEXT,
    notes TEXT,
    next_day_plans TEXT,
    issues TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    mood VARCHAR(20),
    productivity_score INTEGER CHECK (productivity_score >= 1 AND productivity_score <= 10),
    total_hours DECIMAL(4,2) DEFAULT 8,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 할일 관리 테이블
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
    completed BOOLEAN DEFAULT false,
    due_date DATE,
    completion_date TIMESTAMPTZ,
    
    -- 소유자 정보
    user_id UUID,
    employee_id UUID,
    
    -- 연관 정보
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    
    -- 메타데이터
    tags TEXT[],
    notes TEXT,
    estimated_hours DECIMAL(4,2),
    actual_hours DECIMAL(4,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 개인 업무 일지 테이블
CREATE TABLE IF NOT EXISTS public.personal_journals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    
    -- 일지 내용
    plans TEXT,
    completed TEXT,
    notes TEXT,
    next_day_plans TEXT,
    
    -- 소유자 정보
    user_id UUID,
    employee_id UUID,
    author_name VARCHAR(255),
    
    -- 메타데이터
    mood VARCHAR(20),
    productivity_score INTEGER CHECK (productivity_score >= 1 AND productivity_score <= 10),
    total_hours DECIMAL(4,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- ========================================
-- 7. 알림 및 팝업 관리 테이블들
-- ========================================

-- 알림 테이블
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    entity_type VARCHAR(50),
    entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 팝업 설정 테이블
CREATE TABLE IF NOT EXISTS public.popup_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    content TEXT,
    image_url TEXT,
    image_alt VARCHAR(255),
    button_text VARCHAR(100) DEFAULT '확인',
    is_active BOOLEAN DEFAULT true,
    show_dont_show_today BOOLEAN DEFAULT true,
    background_gradient VARCHAR(255) DEFAULT 'from-blue-600 via-purple-600 to-blue-600',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- 팝업 표시 로그 테이블
CREATE TABLE IF NOT EXISTS public.popup_display_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    popup_id UUID REFERENCES public.popup_settings(id) ON DELETE CASCADE,
    user_id UUID,
    displayed_at TIMESTAMPTZ DEFAULT NOW(),
    action VARCHAR(50),
    session_id VARCHAR(255)
);

-- ========================================
-- 8. 시스템 관리 테이블들
-- ========================================

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시스템 로그 테이블
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES public.users(id),
    entity_type VARCHAR(50),
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    log_level VARCHAR(20) DEFAULT 'info',
    log_category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자-매니저 동기화 상태 테이블
CREATE TABLE IF NOT EXISTS public.user_manager_sync_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    sync_status VARCHAR(50) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    azure_user_id VARCHAR(255),
    manager_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 9. 텔레그램 알림 시스템 테이블들
-- ========================================

-- 텔레그램 설정 테이블
CREATE TABLE IF NOT EXISTS public.telegram_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bot_token VARCHAR(255) NOT NULL,
    webhook_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    default_chat_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 텔레그램 사용자 테이블
CREATE TABLE IF NOT EXISTS public.telegram_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    telegram_chat_id VARCHAR(50) NOT NULL,
    telegram_username VARCHAR(100),
    telegram_first_name VARCHAR(100),
    telegram_last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(telegram_chat_id)
);

-- 메시지 템플릿 테이블
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('task_assigned', 'project_update', 'deadline_reminder', 'system_alert', 'custom')),
    template_text TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 텔레그램 메시지 로그 테이블
CREATE TABLE IF NOT EXISTS public.telegram_message_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chat_id VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'info',
    sent_by UUID REFERENCES public.users(id),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    telegram_message_id INTEGER
);

-- ========================================
-- 10. 메시징 플랫폼 테이블들 (LINE, WeChat)
-- ========================================

-- LINE 설정 테이블
CREATE TABLE IF NOT EXISTS public.line_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_access_token TEXT,
    channel_secret TEXT,
    is_active BOOLEAN DEFAULT false,
    webhook_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LINE 사용자 테이블
CREATE TABLE IF NOT EXISTS public.line_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    line_user_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    picture_url TEXT,
    status_message TEXT,
    language VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    matched_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    matched_user_name VARCHAR(255),
    last_interaction TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WeChat 설정 테이블
CREATE TABLE IF NOT EXISTS public.wechat_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    app_id VARCHAR(255),
    app_secret TEXT,
    token TEXT,
    encoding_aes_key TEXT,
    is_active BOOLEAN DEFAULT false,
    webhook_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WeChat 사용자 테이블
CREATE TABLE IF NOT EXISTS public.wechat_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    openid VARCHAR(255) UNIQUE NOT NULL,
    unionid VARCHAR(255),
    nickname VARCHAR(255),
    sex INTEGER,
    province VARCHAR(100),
    city VARCHAR(100),
    country VARCHAR(100),
    headimgurl TEXT,
    language VARCHAR(10),
    subscribe BOOLEAN DEFAULT true,
    subscribe_time TIMESTAMPTZ,
    remark VARCHAR(255),
    groupid INTEGER,
    tagid_list INTEGER[],
    is_active BOOLEAN DEFAULT true,
    matched_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    matched_user_name VARCHAR(255),
    last_interaction TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 통합 메시지 로그 테이블
CREATE TABLE IF NOT EXISTS public.messaging_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('telegram', 'line', 'wechat')),
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    message_type VARCHAR(50),
    message_content TEXT,
    status VARCHAR(50) DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 계속... 