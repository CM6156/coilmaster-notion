-- managers 테이블에 profile_image 컬럼 추가
ALTER TABLE managers 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- profile_image 컬럼에 대한 설명 추가
COMMENT ON COLUMN managers.profile_image IS '담당자 프로필 이미지 URL';

-- 기존 데이터 확인을 위한 쿼리 (선택사항)
-- SELECT id, name, email, profile_image FROM managers LIMIT 5;

COMMIT; 