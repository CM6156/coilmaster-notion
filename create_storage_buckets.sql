-- Supabase Storage 버킷 생성 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. uploads 버킷 생성 (기본 파일 업로드용)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('uploads', 'uploads', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. work-journal-images 버킷 생성 (업무일지 이미지용)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('work-journal-images', 'work-journal-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. project-files 버킷 생성 (프로젝트 파일용)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('project-files', 'project-files', true, 104857600, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. avatars 버킷 생성 (프로필 이미지용)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Storage 정책 설정 (모든 사용자가 읽기 가능)
DO $$
BEGIN
  -- uploads 버킷 정책
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'uploads' AND name = 'Public read access'
  ) THEN
    INSERT INTO storage.policies (bucket_id, name, definition, check_definition, command)
    VALUES ('uploads', 'Public read access', 'true', 'true', 'SELECT');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'uploads' AND name = 'Authenticated users can upload'
  ) THEN
    INSERT INTO storage.policies (bucket_id, name, definition, check_definition, command)
    VALUES ('uploads', 'Authenticated users can upload', 'auth.role() = ''authenticated''', 'auth.role() = ''authenticated''', 'INSERT');
  END IF;

  -- work-journal-images 버킷 정책
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'work-journal-images' AND name = 'Public read access'
  ) THEN
    INSERT INTO storage.policies (bucket_id, name, definition, check_definition, command)
    VALUES ('work-journal-images', 'Public read access', 'true', 'true', 'SELECT');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'work-journal-images' AND name = 'Authenticated users can upload'
  ) THEN
    INSERT INTO storage.policies (bucket_id, name, definition, check_definition, command)
    VALUES ('work-journal-images', 'Authenticated users can upload', 'auth.role() = ''authenticated''', 'auth.role() = ''authenticated''', 'INSERT');
  END IF;

  -- project-files 버킷 정책
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'project-files' AND name = 'Public read access'
  ) THEN
    INSERT INTO storage.policies (bucket_id, name, definition, check_definition, command)
    VALUES ('project-files', 'Public read access', 'true', 'true', 'SELECT');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'project-files' AND name = 'Authenticated users can upload'
  ) THEN
    INSERT INTO storage.policies (bucket_id, name, definition, check_definition, command)
    VALUES ('project-files', 'Authenticated users can upload', 'auth.role() = ''authenticated''', 'auth.role() = ''authenticated''', 'INSERT');
  END IF;

  -- avatars 버킷 정책
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'avatars' AND name = 'Public read access'
  ) THEN
    INSERT INTO storage.policies (bucket_id, name, definition, check_definition, command)
    VALUES ('avatars', 'Public read access', 'true', 'true', 'SELECT');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'avatars' AND name = 'Authenticated users can upload'
  ) THEN
    INSERT INTO storage.policies (bucket_id, name, definition, check_definition, command)
    VALUES ('avatars', 'Authenticated users can upload', 'auth.role() = ''authenticated''', 'auth.role() = ''authenticated''', 'INSERT');
  END IF;
END
$$;

-- 6. 버킷 생성 확인
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id IN ('uploads', 'work-journal-images', 'project-files', 'avatars')
ORDER BY created_at;

-- 7. 정책 확인
SELECT 
  bucket_id,
  name,
  command,
  definition
FROM storage.policies 
WHERE bucket_id IN ('uploads', 'work-journal-images', 'project-files', 'avatars')
ORDER BY bucket_id, command; 