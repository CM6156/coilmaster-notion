-- Supabase SQL Editor에서 실행할 Storage 버킷 생성 SQL
-- 이 SQL을 복사해서 Supabase 대시보드 > SQL Editor에서 실행하세요.

-- 1. project-files 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files', 
  true,
  52428800, -- 50MB
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip', 'application/x-rar-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- 2. documents 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800, -- 50MB
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip', 'application/x-rar-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- 3. avatars 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 4. temp-files 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-files',
  'temp-files',
  false, -- private
  104857600, -- 100MB
  NULL -- 모든 MIME 타입 허용
)
ON CONFLICT (id) DO NOTHING;

-- 5. RLS 정책 생성 (선택사항)
-- 버킷 조회 허용
DROP POLICY IF EXISTS "Allow authenticated users to list buckets" ON storage.buckets;
CREATE POLICY "Allow authenticated users to list buckets" ON storage.buckets
FOR SELECT TO authenticated
USING (true);

-- project-files 버킷 파일 관리 허용
DROP POLICY IF EXISTS "Allow authenticated users to manage project files" ON storage.objects;
CREATE POLICY "Allow authenticated users to manage project files" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'project-files');

-- documents 버킷 파일 관리 허용
DROP POLICY IF EXISTS "Allow authenticated users to manage documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to manage documents" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'documents');

-- avatars 버킷 파일 관리 허용
DROP POLICY IF EXISTS "Allow authenticated users to manage avatars" ON storage.objects;
CREATE POLICY "Allow authenticated users to manage avatars" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'avatars');

-- 결과 확인
SELECT id, name, public, file_size_limit FROM storage.buckets; 