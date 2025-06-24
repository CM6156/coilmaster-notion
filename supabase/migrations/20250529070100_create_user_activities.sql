-- 사용자 활동 추적 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'login', 'logout', 'page_visit', 'task_create', 'task_update', etc.
    activity_description TEXT,
    page_url TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    related_id UUID, -- 관련 엔티티 ID (task_id, project_id 등)
    related_type TEXT, -- 관련 엔티티 타입 ('task', 'project', 'client' 등)
    metadata JSONB, -- 추가 메타데이터
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON public.user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_related_id ON public.user_activities(related_id);

-- RLS(Row Level Security) 활성화
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (모든 사용자가 읽기/쓰기 가능)
CREATE POLICY "Enable read access for all users" ON public.user_activities
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.user_activities
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.user_activities
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.user_activities
    FOR DELETE USING (true); 