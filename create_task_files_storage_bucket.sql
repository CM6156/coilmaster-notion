-- =============================================
-- task-files Storage 버킷 생성 및 설정
-- =============================================

-- 1. task-files 버킷 생성 (댓글 첨부파일용)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-files',
  'task-files',
  true,  -- 공개 접근 허용
  52428800, -- 50MB
  ARRAY[
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed',
    'application/json',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "task_files_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "task_files_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "task_files_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "task_files_delete_policy" ON storage.objects;

-- 3. Storage 정책 생성 (task-files)
-- 모든 사용자가 읽기 가능 (공개 접근)
CREATE POLICY "task_files_select_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'task-files');

-- 인증된 사용자가 업로드 가능
CREATE POLICY "task_files_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-files' 
    AND auth.role() = 'authenticated'
  );

-- 인증된 사용자가 수정 가능
CREATE POLICY "task_files_update_policy" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'task-files' 
    AND auth.role() = 'authenticated'
  );

-- 인증된 사용자가 삭제 가능
CREATE POLICY "task_files_delete_policy" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-files' 
    AND auth.role() = 'authenticated'
  );

-- 4. 설정 확인 쿼리
SELECT 
  '✅ task-files 버킷 설정 완료' as status,
  id,
  name,
  public as is_public,
  file_size_limit / 1024 / 1024 as size_limit_mb,
  array_length(allowed_mime_types, 1) as allowed_types_count,
  created_at
FROM storage.buckets 
WHERE id = 'task-files';

-- 5. Storage 정책 확인
SELECT 
  '📋 Storage 정책 확인' as info,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '🔍 조회 허용'
    WHEN cmd = 'INSERT' THEN '📤 업로드 허용'
    WHEN cmd = 'UPDATE' THEN '✏️ 수정 허용'
    WHEN cmd = 'DELETE' THEN '🗑️ 삭제 허용'
    ELSE cmd
  END as description
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%task_files%'
ORDER BY policyname, cmd;

-- 완료 메시지
SELECT '🎉 task-files Storage 버킷이 성공적으로 설정되었습니다!' as message; 