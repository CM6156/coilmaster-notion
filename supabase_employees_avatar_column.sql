-- employees 테이블에 avatar 컬럼 추가
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS avatar TEXT;

-- avatar 컬럼에 대한 설명 추가
COMMENT ON COLUMN employees.avatar IS '직원 프로필 이미지 URL';

-- 기존 데이터 확인
SELECT id, name, avatar FROM employees LIMIT 5; 