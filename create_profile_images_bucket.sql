-- profile-images 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 버킷 정책 설정 - 모든 사용자가 읽기 가능
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');

-- 인증된 사용자가 업로드 가능
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND auth.role() = 'authenticated'
);

-- 인증된 사용자가 자신의 파일 업데이트 가능
CREATE POLICY "Users can update their own files" ON storage.objects FOR UPDATE USING (
  bucket_id = 'profile-images' AND auth.role() = 'authenticated'
);

-- 인증된 사용자가 자신의 파일 삭제 가능
CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE USING (
  bucket_id = 'profile-images' AND auth.role() = 'authenticated'
); 