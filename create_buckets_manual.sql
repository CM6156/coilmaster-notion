-- Supabase SQL Editor에서 실행할 Storage 버킷 생성 및 디버깅 SQL
-- 이 SQL을 복사해서 Supabase 대시보드 > SQL Editor에서 실행하세요.

-- =============================================
-- 1. 기존 버킷 확인
-- =============================================
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
ORDER BY created_at;

-- =============================================
-- 2. project-files 버킷 생성
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files', 
  true,
  52428800, -- 50MB
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip', 'application/x-rar-compressed']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================
-- 3. task-files 버킷 생성 (업무 첨부파일용)
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-files',
  'task-files',
  true,
  52428800, -- 50MB
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip', 'application/x-rar-compressed']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================
-- 4. documents 버킷 생성
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800, -- 50MB
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip', 'application/x-rar-compressed']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================
-- 5. avatars 버킷 생성
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================
-- 6. Storage 정책 삭제 (기존 정책 정리)
-- =============================================
DROP POLICY IF EXISTS "Anyone can view project files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view project files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload project files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update project files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete project files" ON storage.objects;

-- =============================================
-- 7. Storage 정책 생성 (project-files)
-- =============================================
CREATE POLICY "project_files_select_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-files');

CREATE POLICY "project_files_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-files' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "project_files_update_policy" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'project-files' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "project_files_delete_policy" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-files' 
    AND auth.role() = 'authenticated'
  );

-- =============================================
-- 8. Storage 정책 생성 (task-files)
-- =============================================
CREATE POLICY "task_files_select_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'task-files');

CREATE POLICY "task_files_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-files' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "task_files_update_policy" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'task-files' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "task_files_delete_policy" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-files' 
    AND auth.role() = 'authenticated'
  );

-- =============================================
-- 9. Storage 정책 생성 (documents)
-- =============================================
CREATE POLICY "documents_select_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "documents_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
  );

-- =============================================
-- 10. Storage 정책 생성 (avatars)
-- =============================================
CREATE POLICY "avatars_select_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

-- =============================================
-- 11. 생성된 버킷 확인
-- =============================================
SELECT 
  '✅ 버킷 생성 완료' as status,
  id,
  name,
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_types_count,
  created_at
FROM storage.buckets 
WHERE id IN ('project-files', 'task-files', 'documents', 'avatars')
ORDER BY created_at;

-- =============================================
-- 12. Storage 정책 확인
-- =============================================
SELECT 
  '✅ Storage 정책 확인' as status,
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '🔍 조회'
    WHEN cmd = 'INSERT' THEN '📤 업로드'
    WHEN cmd = 'UPDATE' THEN '✏️ 수정'
    WHEN cmd = 'DELETE' THEN '🗑️ 삭제'
    ELSE cmd
  END as operation
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%project_files%' 
     OR policyname LIKE '%task_files%' 
     OR policyname LIKE '%documents%' 
     OR policyname LIKE '%avatars%'
ORDER BY policyname, cmd;

-- =============================================
-- 13. 테스트 쿼리 (옵션)
-- =============================================
-- 이 쿼리로 현재 업로드된 파일들을 확인할 수 있습니다
SELECT 
  '📁 현재 업로드된 파일들' as info,
  bucket_id,
  name,
  metadata->>'size' as size,
  created_at
FROM storage.objects 
WHERE bucket_id IN ('project-files', 'task-files', 'documents')
ORDER BY created_at DESC
LIMIT 10; 