-- 프로필 이미지 Storage 버킷 및 정책 설정
-- Supabase Dashboard > Storage에서 실행하거나 SQL Editor에서 실행

-- 1. profile-images 버킷 생성 (이미 존재한다면 무시됨)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 모든 사용자가 프로필 이미지를 업로드할 수 있도록 정책 설정
CREATE POLICY "Anyone can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-images');

-- 3. 모든 사용자가 프로필 이미지를 조회할 수 있도록 정책 설정
CREATE POLICY "Anyone can view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

-- 4. 사용자가 자신의 프로필 이미지를 업데이트할 수 있도록 정책 설정
CREATE POLICY "Users can update their profile images" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-images');

-- 5. 사용자가 자신의 프로필 이미지를 삭제할 수 있도록 정책 설정
CREATE POLICY "Users can delete their profile images" ON storage.objects
FOR DELETE USING (bucket_id = 'profile-images');

-- 6. employees 테이블에 avatar 컬럼이 없다면 추가
ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar TEXT;

-- 확인용 쿼리
SELECT 
  id, 
  name, 
  public,
  created_at 
FROM storage.buckets 
WHERE id = 'profile-images'; 