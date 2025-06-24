-- =====================================================
-- Supabase 프로필 이미지 완전 설정 스크립트
-- =====================================================

-- 1. employees 테이블에 avatar 컬럼 추가
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS avatar TEXT;

COMMENT ON COLUMN employees.avatar IS '직원 프로필 이미지 URL';

-- 2. profile-images Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'profile-images', 
  'profile-images', 
  true,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  5242880  -- 5MB
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  file_size_limit = 5242880;

-- 3. Storage 정책 삭제 (기존 정책이 있다면)
DROP POLICY IF EXISTS "Public read access for profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their profile images" ON storage.objects;

-- 4. 공개 읽기 정책 (모든 사용자가 프로필 이미지를 볼 수 있음)
CREATE POLICY "Public read access for profile images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-images');

-- 5. 인증된 사용자 업로드 정책
CREATE POLICY "Authenticated users can upload profile images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

-- 6. 인증된 사용자 업데이트 정책
CREATE POLICY "Authenticated users can update profile images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

-- 7. 인증된 사용자 삭제 정책
CREATE POLICY "Authenticated users can delete profile images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

-- 8. RLS 활성화 확인 (이미 활성화되어 있어야 함)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 9. 설정 확인 쿼리들
-- employees 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- Storage 버킷 확인
SELECT id, name, public, allowed_mime_types, file_size_limit, created_at
FROM storage.buckets 
WHERE id = 'profile-images';

-- Storage 정책 확인
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
AND policyname LIKE '%profile%';

-- 현재 직원 데이터와 avatar 상태 확인
SELECT id, name, avatar, created_at 
FROM employees 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- 테스트용: 샘플 이미지 URL로 기존 직원 업데이트
-- =====================================================
-- 실제 환경에서는 주석 해제하여 사용
/*
UPDATE employees 
SET avatar = 'https://via.placeholder.com/150/0066cc/ffffff?text=' || SUBSTRING(name, 1, 1)
WHERE avatar IS NULL 
LIMIT 3;
*/ 