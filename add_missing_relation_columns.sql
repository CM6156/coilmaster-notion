-- users 테이블에 누락된 관계형 컬럼들 추가
-- 오류: Could not find the 'department_id' column of 'users' in the schema cache

-- 1. 부서 관계 컬럼 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department_id UUID;

-- 2. 법인 관계 컬럼 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS corporation_id UUID;

-- 3. 직책 관계 컬럼 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS position_id UUID;

-- 4. 활성화 상태 컬럼 추가 (누락되었을 수 있음)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 외래키 제약 조건 추가 (안전하게)
DO $$
BEGIN
    -- departments 테이블과 외래키 제약 조건 확인 후 추가
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'departments') AND 
       NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_users_department') THEN
        ALTER TABLE public.users ADD CONSTRAINT fk_users_department 
        FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
    END IF;
    
    -- corporations 테이블과 외래키 제약 조건 확인 후 추가
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'corporations') AND 
       NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_users_corporation') THEN
        ALTER TABLE public.users ADD CONSTRAINT fk_users_corporation 
        FOREIGN KEY (corporation_id) REFERENCES public.corporations(id) ON DELETE SET NULL;
    END IF;
    
    -- positions 테이블과 외래키 제약 조건 확인 후 추가
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'positions') AND 
       NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_users_position') THEN
        ALTER TABLE public.users ADD CONSTRAINT fk_users_position 
        FOREIGN KEY (position_id) REFERENCES public.positions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 컬럼 설명 추가
COMMENT ON COLUMN public.users.department_id IS '부서 ID (departments 테이블 참조)';
COMMENT ON COLUMN public.users.corporation_id IS '법인 ID (corporations 테이블 참조)';
COMMENT ON COLUMN public.users.position_id IS '직책 ID (positions 테이블 참조)';
COMMENT ON COLUMN public.users.is_active IS '사용자 활성화 상태';

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_corporation_id ON public.users(corporation_id);
CREATE INDEX IF NOT EXISTS idx_users_position_id ON public.users(position_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- 기존 사용자들의 기본값 설정
UPDATE public.users 
SET 
    is_active = true
WHERE is_active IS NULL;

-- 성공 메시지
SELECT 'users 테이블에 관계형 컬럼들이 성공적으로 추가되었습니다!' as message; 