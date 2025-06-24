-- 업무 파일 테이블 생성
CREATE TABLE IF NOT EXISTS public.task_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    file_type TEXT,
    file_url TEXT NOT NULL,
    is_image BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 업무 링크 테이블 생성
CREATE TABLE IF NOT EXISTS public.task_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON public.task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON public.task_links(task_id);

-- 업데이트 시간 자동 갱신 트리거 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_task_files_updated_at 
    BEFORE UPDATE ON public.task_files 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_task_links_updated_at 
    BEFORE UPDATE ON public.task_links 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS(Row Level Security) 활성화
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_links ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (모든 사용자가 읽기/쓰기 가능)
CREATE POLICY "Enable read access for all users" ON public.task_files
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.task_files
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.task_files
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.task_files
    FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.task_links
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.task_links
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.task_links
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.task_links
    FOR DELETE USING (true); 