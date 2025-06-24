-- =============================================
-- 긴급 첨부파일 시스템 수정 스크립트
-- =============================================

-- 1. 먼저 현재 상황 확인
SELECT 
  'Step 1: 현재 댓글 상황' as check_step,
  COUNT(*) as total_comments
FROM task_comments 
WHERE created_at >= '2024-06-23';

SELECT 
  'Step 2: 첨부파일 테이블 존재 여부' as check_step,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comment_attachments') 
    THEN 'YES - 테이블 존재함'
    ELSE 'NO - 테이블 없음'
  END as table_exists;

SELECT 
  'Step 3: 스토리지 버킷 존재 여부' as check_step,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'task-files') 
    THEN 'YES - 버킷 존재함'
    ELSE 'NO - 버킷 없음'
  END as bucket_exists;

-- 2. task_comment_attachments 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS public.task_comment_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.task_comments(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment_id ON public.task_comment_attachments(comment_id);

-- 4. RLS 설정
ALTER TABLE public.task_comment_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.task_comment_attachments;
CREATE POLICY "Enable all for authenticated users" 
ON public.task_comment_attachments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 5. task-files 스토리지 버킷 강제 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-files',
  'task-files',
  true,
  52428800,
  ARRAY['image/*', 'application/*', 'text/*']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/*', 'application/*', 'text/*'];

-- 6. 스토리지 정책 강제 생성
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'task-files');

CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'task-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update" ON storage.objects 
FOR UPDATE USING (bucket_id = 'task-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete" ON storage.objects 
FOR DELETE USING (bucket_id = 'task-files' AND auth.role() = 'authenticated');

-- 7. 최종 상태 확인
SELECT 
  'Final Check: 설정 완료 상태' as final_step,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'task_comment_attachments') as table_exists,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'task-files') as bucket_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE policyname LIKE '%task%' AND schemaname = 'storage') as policies_count;

-- 8. 테스트용 메시지
SELECT 
  '🎯 긴급 수정 완료!' as status,
  '이제 새로운 댓글에 파일을 첨부해보세요.' as instruction,
  '기존 댓글의 첨부파일은 다시 업로드해야 할 수 있습니다.' as note; 