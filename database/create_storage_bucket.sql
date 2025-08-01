-- Storage 버킷 생성 및 정책 설정
-- 이 스크립트는 Supabase SQL Editor에서 실행하세요

-- 1. project-files 버킷 생성 (이미 있으면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files', 
  true,  -- 공개 버킷으로 설정
  10485760,  -- 10MB 제한
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ]  -- 허용된 MIME 타입들
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage 정책 설정 (인증된 사용자만 업로드 가능)
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-files');

-- 3. 공개 읽기 권한 설정
CREATE POLICY "Public can read files" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'project-files');

-- 4. 파일 소유자는 삭제 가능
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'project-files' AND auth.uid()::text = owner::text);

-- 5. 파일 소유자는 업데이트 가능
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'project-files' AND auth.uid()::text = owner::text);

-- 완료 메시지
SELECT 'Storage 버킷 및 정책이 성공적으로 설정되었습니다!' as message;
