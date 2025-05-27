-- =============================================
-- Supabase Storage 버킷 생성 및 정책 설정
-- =============================================

-- 1. 프로젝트 파일 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  true,
  52428800, -- 50MB
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip', 'application/x-rar-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- 2. 문서 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800, -- 50MB
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip', 'application/x-rar-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- 3. 사용자 아바타 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 4. 임시 파일 버킷 생성 (업로드 중 임시 저장용)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-files',
  'temp-files',
  false,
  104857600, -- 100MB
  ARRAY['*/*'] -- 모든 파일 타입 허용
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Storage 정책 설정
-- =============================================

-- project-files 버킷 정책
CREATE POLICY "Anyone can view project files" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-files');

CREATE POLICY "Authenticated users can upload project files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-files' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own project files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'project-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own project files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- documents 버킷 정책
CREATE POLICY "Anyone can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- avatars 버킷 정책
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- temp-files 버킷 정책 (비공개)
CREATE POLICY "Users can manage their own temp files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'temp-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- 버킷 설명 및 메타데이터 업데이트
-- =============================================

-- 버킷 설명 업데이트 (가능한 경우)
COMMENT ON TABLE storage.buckets IS 'Supabase Storage 버킷 설정';

-- 로그 기록
DO $$
BEGIN
  -- 시스템 로그에 버킷 생성 기록 (system_logs 테이블이 있는 경우)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') THEN
    INSERT INTO system_logs (log_level, log_category, message, details)
    VALUES (
      'info', 
      'storage', 
      'Storage buckets created successfully',
      '{"buckets": ["project-files", "documents", "avatars", "temp-files"]}'::jsonb
    );
  END IF;
END $$; 