-- UUID 확장 활성화 (이미 있다면 무시)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 댓글 첨부파일 테이블 생성
CREATE TABLE IF NOT EXISTS public.task_comment_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.task_comments(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment_id ON public.task_comment_attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_attachments_uploaded_by ON public.task_comment_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_comment_attachments_created_at ON public.task_comment_attachments(created_at);

-- 업데이트 트리거 설정
DROP TRIGGER IF EXISTS update_comment_attachments_updated_at ON public.task_comment_attachments;
CREATE TRIGGER update_comment_attachments_updated_at 
    BEFORE UPDATE ON public.task_comment_attachments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 설정
ALTER TABLE public.task_comment_attachments ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.task_comment_attachments;
CREATE POLICY "Allow authenticated users full access" 
ON public.task_comment_attachments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 테이블 댓글 추가
COMMENT ON TABLE public.task_comment_attachments IS '댓글 첨부파일 관리 테이블';
COMMENT ON COLUMN public.task_comment_attachments.id IS '첨부파일 고유 식별자';
COMMENT ON COLUMN public.task_comment_attachments.comment_id IS '댓글 ID (외래키)';
COMMENT ON COLUMN public.task_comment_attachments.file_name IS '원본 파일명';
COMMENT ON COLUMN public.task_comment_attachments.file_type IS '파일 MIME 타입';
COMMENT ON COLUMN public.task_comment_attachments.file_size IS '파일 크기 (바이트)';
COMMENT ON COLUMN public.task_comment_attachments.storage_path IS 'Supabase Storage 경로';
COMMENT ON COLUMN public.task_comment_attachments.public_url IS '공개 URL';
COMMENT ON COLUMN public.task_comment_attachments.uploaded_by IS '업로드한 사용자 ID';

-- 완료 메시지
SELECT '✅ 댓글 첨부파일 테이블이 성공적으로 생성되었습니다!' as message; 