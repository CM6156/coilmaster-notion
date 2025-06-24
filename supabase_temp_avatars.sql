-- 임시 프로필 이미지 할당 (테스트용)
-- 실제 프로필 이미지 업로드 기능이 작동하기 전까지 사용

-- 기존 직원들에게 임시 아바타 URL 할당
UPDATE employees 
SET avatar = 'https://via.placeholder.com/150/0066cc/ffffff?text=' || SUBSTRING(name, 1, 1)
WHERE avatar IS NULL OR avatar = '';

-- 업데이트 결과 확인
SELECT id, name, avatar FROM employees ORDER BY created_at DESC; 