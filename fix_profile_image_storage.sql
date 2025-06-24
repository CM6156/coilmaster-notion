-- 프로필 이미지 Storage 정책 수정
-- uploads 버킷이 없다면 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Allow public access to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to profile images" ON storage.objects;

-- 새로운 정책 생성
-- 1. 인증된 사용자가 프로필 이미지 업로드 허용
CREATE POLICY "Allow users to upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'profile-images'
);

-- 2. 인증된 사용자가 자신의 프로필 이미지 업데이트 허용
CREATE POLICY "Allow users to update their profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'profile-images'
);

-- 3. 모든 사용자가 프로필 이미지 읽기 허용 (공개 접근)
CREATE POLICY "Allow public read access to profile images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'profile-images'
);

-- 4. 인증된 사용자가 업무일지 이미지 업로드 허용
CREATE POLICY "Allow users to upload work journal images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'work-journals'
);

-- 5. 모든 사용자가 업무일지 이미지 읽기 허용
CREATE POLICY "Allow public read access to work journal images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'work-journals'
);

-- 6. 인증된 사용자가 자신의 이미지 삭제 허용
CREATE POLICY "Allow users to delete their images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);

-- RLS 활성화 확인
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 버킷 공개 설정 확인
UPDATE storage.buckets 
SET public = true 
WHERE id = 'uploads';

COMMIT; 