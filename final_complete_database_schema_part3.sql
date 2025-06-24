-- ========================================
-- Coilmaster Corporate System - 완전한 데이터베이스 스키마 Part 3
-- 인덱스, 트리거, 함수들 및 기본 데이터
-- ========================================

-- ========================================
-- 인덱스 생성 (성능 최적화)
-- ========================================

-- Users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_position_id ON public.users(position_id);
CREATE INDEX IF NOT EXISTS idx_users_corporation_id ON public.users(corporation_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON public.users(is_online);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON public.users(last_seen);
CREATE INDEX IF NOT EXISTS idx_users_country ON public.users(country);

-- Departments 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_departments_corporation_id ON public.departments(corporation_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON public.departments(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_translation_key ON public.departments(translation_key);
CREATE INDEX IF NOT EXISTS idx_departments_code ON public.departments(code);

-- Positions 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_positions_is_active ON public.positions(is_active);
CREATE INDEX IF NOT EXISTS idx_positions_level ON public.positions(level);
CREATE INDEX IF NOT EXISTS idx_positions_translation_key ON public.positions(translation_key);
CREATE INDEX IF NOT EXISTS idx_positions_code ON public.positions(code);

-- Corporations 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_corporations_code ON public.corporations(code);
CREATE INDEX IF NOT EXISTS idx_corporations_is_active ON public.corporations(is_active);

-- Projects 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON public.projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_department_id ON public.projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_current_phase_id ON public.projects(current_phase_id);
CREATE INDEX IF NOT EXISTS idx_projects_promotion_stage ON public.projects(promotion_stage);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);

-- Tasks 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_task_phase ON public.tasks(task_phase);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);

-- Task Assignees 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON public.task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_primary ON public.task_assignees(task_id, is_primary);

-- Files 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_files_bucket_id ON public.files(bucket_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_file_path ON public.files(file_path);

-- Project Attachments 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id ON public.project_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_file_id ON public.project_attachments(file_id);

-- Task Files 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON public.task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_files_uploaded_by ON public.task_files(uploaded_by);

-- Task Links 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON public.task_links(task_id);

-- Work Journals 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_work_journals_user_id ON public.work_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_author_id ON public.work_journals(author_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_project_id ON public.work_journals(project_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_task_id ON public.work_journals(task_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_date ON public.work_journals(date);
CREATE INDEX IF NOT EXISTS idx_work_journals_status ON public.work_journals(status);

-- Todos 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_employee_id ON public.todos(employee_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_status ON public.todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON public.todos(priority);

-- Personal Journals 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_personal_journals_user_id ON public.personal_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_journals_date ON public.personal_journals(date);

-- Notifications 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Popup 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_popup_settings_active ON public.popup_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_popup_display_logs_user_popup ON public.popup_display_logs(user_id, popup_id);

-- System 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);

-- Telegram 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON public.telegram_users(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON public.telegram_users(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_chat_id ON public.telegram_message_logs(chat_id);

-- LINE 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_line_users_matched_user_id ON public.line_users(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_line_users_line_user_id ON public.line_users(line_user_id);

-- WeChat 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_wechat_users_matched_user_id ON public.wechat_users(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_wechat_users_openid ON public.wechat_users(openid);

-- Messaging 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_messaging_logs_platform ON public.messaging_logs(platform);
CREATE INDEX IF NOT EXISTS idx_messaging_logs_created_at ON public.messaging_logs(created_at);

-- ========================================
-- 트리거 함수들
-- ========================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 번역키 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_translation_key()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.translation_key IS NULL THEN
        NEW.translation_key := TG_TABLE_NAME || '.' || lower(regexp_replace(NEW.name, '[^a-zA-Z0-9가-힣]', '_', 'g'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 직책 기본값 설정 함수
CREATE OR REPLACE FUNCTION set_position_defaults()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.translation_key IS NULL THEN
        NEW.translation_key := 'position_' || LOWER(REPLACE(REPLACE(NEW.name, ' ', '_'), '/', '_'));
    END IF;
    
    IF NEW.name_en IS NULL THEN NEW.name_en := NEW.name; END IF;
    IF NEW.name_zh IS NULL THEN NEW.name_zh := NEW.name; END IF;
    IF NEW.name_th IS NULL THEN NEW.name_th := NEW.name; END IF;
    
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 부서 기본값 설정 함수
CREATE OR REPLACE FUNCTION set_department_defaults()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.translation_key IS NULL THEN
        NEW.translation_key := 'department_' || LOWER(REPLACE(REPLACE(NEW.name, ' ', '_'), '/', '_'));
    END IF;
    
    IF NEW.name_en IS NULL THEN NEW.name_en := NEW.name; END IF;
    IF NEW.name_zh IS NULL THEN NEW.name_zh := NEW.name; END IF;
    IF NEW.name_th IS NULL THEN NEW.name_th := NEW.name; END IF;
    
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 트리거 생성
-- ========================================

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_corporations_updated_at BEFORE UPDATE ON public.corporations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_assignees_updated_at BEFORE UPDATE ON public.task_assignees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON public.files 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_journals_updated_at BEFORE UPDATE ON public.work_journals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_journals_updated_at BEFORE UPDATE ON public.personal_journals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_popup_settings_updated_at BEFORE UPDATE ON public.popup_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_telegram_settings_updated_at BEFORE UPDATE ON public.telegram_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_telegram_users_updated_at BEFORE UPDATE ON public.telegram_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON public.message_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_line_settings_updated_at BEFORE UPDATE ON public.line_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_line_users_updated_at BEFORE UPDATE ON public.line_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wechat_settings_updated_at BEFORE UPDATE ON public.wechat_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wechat_users_updated_at BEFORE UPDATE ON public.wechat_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 번역키 자동 생성 트리거
CREATE TRIGGER auto_generate_translation_key_departments BEFORE INSERT ON public.departments
    FOR EACH ROW EXECUTE FUNCTION generate_translation_key();
CREATE TRIGGER auto_generate_translation_key_positions BEFORE INSERT ON public.positions
    FOR EACH ROW EXECUTE FUNCTION generate_translation_key();
CREATE TRIGGER auto_generate_translation_key_corporations BEFORE INSERT ON public.corporations
    FOR EACH ROW EXECUTE FUNCTION generate_translation_key();

-- 직책/부서 기본값 설정 트리거
CREATE TRIGGER position_defaults_trigger BEFORE INSERT OR UPDATE ON public.positions
    FOR EACH ROW EXECUTE FUNCTION set_position_defaults();
CREATE TRIGGER department_defaults_trigger BEFORE INSERT OR UPDATE ON public.departments
    FOR EACH ROW EXECUTE FUNCTION set_department_defaults();

-- ========================================
-- 헬퍼 함수들
-- ========================================

-- 팝업 활성화 가져오기 함수
CREATE OR REPLACE FUNCTION public.get_active_popup()
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    content TEXT,
    image_url TEXT,
    image_alt VARCHAR(255),
    button_text VARCHAR(100),
    background_gradient VARCHAR(255),
    show_dont_show_today BOOLEAN
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        ps.id,
        ps.title,
        ps.subtitle,
        ps.content,
        ps.image_url,
        ps.image_alt,
        ps.button_text,
        ps.background_gradient,
        ps.show_dont_show_today
    FROM public.popup_settings ps
    WHERE ps.is_active = true
    ORDER BY ps.updated_at DESC
    LIMIT 1;
$$;

-- 팝업 액션 로그 함수
CREATE OR REPLACE FUNCTION public.log_popup_action(
    popup_uuid UUID,
    action_type VARCHAR(50),
    session_uuid VARCHAR(255) DEFAULT NULL
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
    INSERT INTO public.popup_display_logs (popup_id, user_id, action, session_id)
    VALUES (popup_uuid, NULL, action_type, session_uuid);
$$;

-- 업무 담당자 수 계산 함수
CREATE OR REPLACE FUNCTION public.get_task_assignee_count(task_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM public.task_assignees 
        WHERE task_id = task_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 주 담당자 설정 함수
CREATE OR REPLACE FUNCTION public.set_primary_assignee(task_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- 기존 주 담당자 해제
    UPDATE public.task_assignees 
    SET is_primary = false 
    WHERE task_id = task_uuid;
    
    -- 새 주 담당자 설정
    UPDATE public.task_assignees 
    SET is_primary = true 
    WHERE task_id = task_uuid AND user_id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 자동 매칭 함수 (메시징 플랫폼용)
CREATE OR REPLACE FUNCTION auto_match_messaging_user(
    p_platform VARCHAR,
    p_user_name VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_matched_user_id UUID;
BEGIN
    -- users 테이블에서 이름으로 매칭
    SELECT id INTO v_matched_user_id
    FROM public.users
    WHERE LOWER(name) = LOWER(p_user_name)
    LIMIT 1;
    
    RETURN v_matched_user_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- RLS 정책 설정 (단순화된 정책)
-- ========================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_display_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_manager_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wechat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wechat_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_logs ENABLE ROW LEVEL SECURITY;

-- 단순한 RLS 정책 생성 (모든 인증된 사용자에게 전체 권한)
DO $$
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY[
        'users', 'departments', 'positions', 'corporations', 'projects', 'project_members',
        'tasks', 'task_assignees', 'task_files', 'task_links', 'files', 'project_attachments',
        'work_journals', 'todos', 'personal_journals', 'notifications', 'popup_settings',
        'popup_display_logs', 'system_settings', 'system_logs', 'user_manager_sync_status',
        'telegram_settings', 'telegram_users', 'message_templates', 'telegram_message_logs',
        'line_settings', 'line_users', 'wechat_settings', 'wechat_users', 'messaging_logs'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        EXECUTE format('CREATE POLICY "authenticated_users_all_%s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', table_name, table_name);
        EXECUTE format('CREATE POLICY "anon_read_%s" ON public.%I FOR SELECT TO anon USING (true)', table_name, table_name);
    END LOOP;
END $$;

-- 계속... 