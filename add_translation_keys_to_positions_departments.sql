-- ========================================
-- 직책 및 부서 테이블에 번역키 추가
-- ========================================

-- positions 테이블에 번역키 컬럼 추가
ALTER TABLE public.positions 
ADD COLUMN IF NOT EXISTS translation_key VARCHAR(100),
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_zh VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_th VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT;

-- departments 테이블에 번역키 컬럼 추가
ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS translation_key VARCHAR(100),
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_zh VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_th VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT;

-- 현재 시스템에 등록된 직책들에 번역키 및 다국어 이름 업데이트
UPDATE public.positions SET 
    translation_key = 'position_production_staff',
    name_en = 'Production Staff',
    name_zh = '生产员工',
    name_th = 'พนักงานผลิต'
WHERE name = '생산 직원';

UPDATE public.positions SET 
    translation_key = 'position_sau',
    name_en = 'Staff',
    name_zh = '员工',
    name_th = 'พนักงาน'
WHERE name = '사우';

UPDATE public.positions SET 
    translation_key = 'position_staff',
    name_en = 'Senior Staff',
    name_zh = '高级员工',
    name_th = 'พนักงานอาวุโส'
WHERE name = '사원';

UPDATE public.positions SET 
    translation_key = 'position_pro',
    name_en = 'Professional',
    name_zh = '专业人员',
    name_th = 'ผู้เชี่ยวชาญ'
WHERE name = '프로';

UPDATE public.positions SET 
    translation_key = 'position_leader',
    name_en = 'Leader',
    name_zh = '领导',
    name_th = 'ผู้นำ'
WHERE name = '리더';

UPDATE public.positions SET 
    translation_key = 'position_mentor',
    name_en = 'Mentor',
    name_zh = '导师',
    name_th = 'ที่ปรึกษา'
WHERE name = '멘토';

UPDATE public.positions SET 
    translation_key = 'position_md',
    name_en = 'Managing Director',
    name_zh = '董事总经理',
    name_th = 'กรรมการผู้จัดการ'
WHERE name = '법인장';

UPDATE public.positions SET 
    translation_key = 'position_ceo',
    name_en = 'CEO',
    name_zh = '首席执行官',
    name_th = 'ซีอีโอ'
WHERE name = '대표';

UPDATE public.positions SET 
    translation_key = 'position_founder',
    name_en = 'Founder',
    name_zh = '创始人',
    name_th = 'ผู้ก่อตั้ง'
WHERE name = '창립자';

-- 현재 시스템에 등록된 부서들에 번역키 및 다국어 이름 업데이트
UPDATE public.departments SET 
    translation_key = 'department_digital_m',
    name_en = 'Digital M',
    name_zh = '数字M部',
    name_th = 'ฝ่ายดิจิทัล M'
WHERE name = '디지털 M';

UPDATE public.departments SET 
    translation_key = 'department_purchasing',
    name_en = 'Purchasing',
    name_zh = '采购部',
    name_th = 'ฝ่ายจัดซื้อ'
WHERE name = '구매';

UPDATE public.departments SET 
    translation_key = 'department_server_management',
    name_en = 'Server Management',
    name_zh = '服务器管理部',
    name_th = 'ฝ่ายจัดการเซิร์ฟเวอร์'
WHERE name = '서버 관리';

UPDATE public.departments SET 
    translation_key = 'department_management',
    name_en = 'Management',
    name_zh = '管理部',
    name_th = 'ฝ่ายบริหาร'
WHERE name = '경영';

UPDATE public.departments SET 
    translation_key = 'department_it',
    name_en = 'IT',
    name_zh = 'IT部',
    name_th = 'ฝ่ายไอที'
WHERE name = '전산';

UPDATE public.departments SET 
    translation_key = 'department_development',
    name_en = 'Development',
    name_zh = '开发部',
    name_th = 'ฝ่ายพัฒนา'
WHERE name = '개발';

UPDATE public.departments SET 
    translation_key = 'department_sales',
    name_en = 'Sales',
    name_zh = '销售部',
    name_th = 'ฝ่ายขาย'
WHERE name = '영업';

UPDATE public.departments SET 
    translation_key = 'department_quality',
    name_en = 'Quality',
    name_zh = '质量部',
    name_th = 'ฝ่ายคุณภาพ'
WHERE name = '품질';

UPDATE public.departments SET 
    translation_key = 'department_production',
    name_en = 'Production',
    name_zh = '生产部',
    name_th = 'ฝ่ายผลิต'
WHERE name = '생산';

UPDATE public.departments SET 
    translation_key = 'department_administration',
    name_en = 'Administration',
    name_zh = '管理部',
    name_th = 'ฝ่ายบริหาร'
WHERE name = '관리';

-- 새로 추가되는 직책들을 위한 기본 번역키 설정 함수
CREATE OR REPLACE FUNCTION set_default_position_translations()
RETURNS TRIGGER AS $$
BEGIN
    -- 번역키가 없는 경우 기본값 설정
    IF NEW.translation_key IS NULL THEN
        NEW.translation_key := 'position_' || LOWER(REPLACE(REPLACE(NEW.name, ' ', '_'), '/', '_'));
    END IF;
    
    -- 영어 이름이 없는 경우 기본값 설정
    IF NEW.name_en IS NULL THEN
        NEW.name_en := NEW.name;
    END IF;
    
    -- 중국어 이름이 없는 경우 기본값 설정
    IF NEW.name_zh IS NULL THEN
        NEW.name_zh := NEW.name;
    END IF;
    
    -- 태국어 이름이 없는 경우 기본값 설정
    IF NEW.name_th IS NULL THEN
        NEW.name_th := NEW.name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 새로 추가되는 부서들을 위한 기본 번역키 설정 함수
CREATE OR REPLACE FUNCTION set_default_department_translations()
RETURNS TRIGGER AS $$
BEGIN
    -- 번역키가 없는 경우 기본값 설정
    IF NEW.translation_key IS NULL THEN
        NEW.translation_key := 'department_' || LOWER(REPLACE(REPLACE(NEW.name, ' ', '_'), '/', '_'));
    END IF;
    
    -- 영어 이름이 없는 경우 기본값 설정
    IF NEW.name_en IS NULL THEN
        NEW.name_en := NEW.name;
    END IF;
    
    -- 중국어 이름이 없는 경우 기본값 설정
    IF NEW.name_zh IS NULL THEN
        NEW.name_zh := NEW.name;
    END IF;
    
    -- 태국어 이름이 없는 경우 기본값 설정
    IF NEW.name_th IS NULL THEN
        NEW.name_th := NEW.name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS position_translation_trigger ON public.positions;
CREATE TRIGGER position_translation_trigger
    BEFORE INSERT OR UPDATE ON public.positions
    FOR EACH ROW
    EXECUTE FUNCTION set_default_position_translations();

DROP TRIGGER IF EXISTS department_translation_trigger ON public.departments;
CREATE TRIGGER department_translation_trigger
    BEFORE INSERT OR UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION set_default_department_translations();

-- 기존 데이터 중 번역키가 없는 것들 업데이트
UPDATE public.positions 
SET 
    translation_key = 'position_' || LOWER(REPLACE(REPLACE(name, ' ', '_'), '/', '_')),
    name_en = name,
    name_zh = name,
    name_th = name
WHERE translation_key IS NULL;

UPDATE public.departments 
SET 
    translation_key = 'department_' || LOWER(REPLACE(REPLACE(name, ' ', '_'), '/', '_')),
    name_en = name,
    name_zh = name,
    name_th = name
WHERE translation_key IS NULL;

-- 결과 확인
SELECT '✅ 직책 번역키 추가 완료!' as message;
SELECT '📋 직책 번역 정보:' as positions_title;
SELECT name, translation_key, name_en, name_zh, name_th FROM public.positions ORDER BY name;

SELECT '🏢 부서 번역 정보:' as departments_title;
SELECT name, translation_key, name_en, name_zh, name_th FROM public.departments ORDER BY name;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_positions_translation_key ON public.positions(translation_key);
CREATE INDEX IF NOT EXISTS idx_departments_translation_key ON public.departments(translation_key); 