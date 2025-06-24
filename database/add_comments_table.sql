-- 댓글 테이블 생성
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    author_id UUID,
    author_name VARCHAR(255),
    content TEXT NOT NULL,
    attachments JSON DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author_id ON public.task_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.task_comments(created_at);

-- 트리거 설정
DROP TRIGGER IF EXISTS update_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER update_task_comments_updated_at 
    BEFORE UPDATE ON public.task_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 설정
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (모든 인증된 사용자 접근 가능)
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.task_comments;
CREATE POLICY "Allow authenticated users full access" 
ON public.task_comments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 완료 메시지
SELECT '✅ 댓글 테이블이 성공적으로 생성되었습니다!' as message; 