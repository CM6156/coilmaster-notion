-- =====================================================
-- Supabase Storage 설정 (정책 제외)
-- =====================================================

-- 1. employees 테이블에 avatar 컬럼 추가
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS avatar TEXT;

COMMENT ON COLUMN employees.avatar IS '직원 프로필 이미지 URL';

-- 2. profile-images Storage 버킷 생성 (간단한 방법)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. 설정 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' AND column_name = 'avatar';

SELECT id, name, public, created_at
FROM storage.buckets 
WHERE id = 'profile-images';

-- 4. 임시 아바타 할당 (테스트용)
UPDATE employees 
SET avatar = 'https://via.placeholder.com/150/0066cc/ffffff?text=' || SUBSTRING(name, 1, 1)
WHERE avatar IS NULL OR avatar = '';

-- 5. 업데이트 결과 확인
SELECT id, name, avatar FROM employees ORDER BY created_at DESC LIMIT 5; 