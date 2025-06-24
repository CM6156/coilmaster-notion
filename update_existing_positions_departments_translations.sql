-- ========================================
-- 현재 등록된 직책 및 부서에 번역키 추가
-- ========================================

-- 번역키 컬럼이 없는 경우 추가
ALTER TABLE public.positions 
ADD COLUMN IF NOT EXISTS translation_key VARCHAR(100),
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_zh VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_th VARCHAR(255);

ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS translation_key VARCHAR(100),
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_zh VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_th VARCHAR(255);

-- 현재 등록된 직책들에 번역키 및 다국어 이름 업데이트
UPDATE public.positions SET 
    translation_key = 'position_employee',
    name_en = 'Production Employee',
    name_zh = '生产员工',
    name_th = 'พนักงานผลิต'
WHERE name = '생산 직원';

UPDATE public.positions SET 
    translation_key = 'position_staff',
    name_en = 'Staff',
    name_zh = '员工',
    name_th = 'พนักงาน'
WHERE name = '사우';

UPDATE public.positions SET 
    translation_key = 'position_senior_staff',
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
    name_zh = '总经理',
    name_th = 'กรรมการผู้จัดการ'
WHERE name = '법인장';

UPDATE public.positions SET 
    translation_key = 'position_ceo',
    name_en = 'Chief Executive Officer',
    name_zh = '首席执行官',
    name_th = 'ประธานเจ้าหน้าที่บริหาร'
WHERE name = '대표';

UPDATE public.positions SET 
    translation_key = 'position_founder',
    name_en = 'Founder',
    name_zh = '创始人',
    name_th = 'ผู้ก่อตั้ง'
WHERE name = '창립자';

-- 현재 등록된 부서들에 번역키 및 다국어 이름 업데이트
UPDATE public.departments SET 
    translation_key = 'department_digital_m',
    name_en = 'Digital Marketing',
    name_zh = '数字营销部',
    name_th = 'ฝ่ายการตลาดดิจิทัล'
WHERE name = '디지털 M';

UPDATE public.departments SET 
    translation_key = 'department_procurement',
    name_en = 'Procurement',
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
    name_th = 'ฝ่ายจัดการ'
WHERE name = '경영';

UPDATE public.departments SET 
    translation_key = 'department_it',
    name_en = 'Information Technology',
    name_zh = '信息技术部',
    name_th = 'ฝ่ายเทคโนโลยีสารสนเทศ'
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
    name_en = 'Quality Control',
    name_zh = '质量控制部',
    name_th = 'ฝ่ายควบคุมคุณภาพ'
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
    name_zh = '行政管理部',
    name_th = 'ฝ่ายบริหารงาน'
WHERE name = '관리';

-- 기존 데이터 중 번역키가 없는 것들에 대한 기본값 설정
UPDATE public.positions 
SET 
    translation_key = 'position_' || LOWER(REPLACE(REPLACE(name, ' ', '_'), '/', '_')),
    name_en = name,
    name_zh = name,
    name_th = name
WHERE translation_key IS NULL OR translation_key = '';

UPDATE public.departments 
SET 
    translation_key = 'department_' || LOWER(REPLACE(REPLACE(name, ' ', '_'), '/', '_')),
    name_en = name,
    name_zh = name,
    name_th = name
WHERE translation_key IS NULL OR translation_key = '';

-- 자동 번역키 설정 함수 (새로 추가되는 데이터용)
CREATE OR REPLACE FUNCTION set_position_translation_defaults()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.translation_key IS NULL OR NEW.translation_key = '' THEN
        NEW.translation_key := 'position_' || LOWER(REPLACE(REPLACE(NEW.name, ' ', '_'), '/', '_'));
    END IF;
    
    IF NEW.name_en IS NULL OR NEW.name_en = '' THEN NEW.name_en := NEW.name; END IF;
    IF NEW.name_zh IS NULL OR NEW.name_zh = '' THEN NEW.name_zh := NEW.name; END IF;
    IF NEW.name_th IS NULL OR NEW.name_th = '' THEN NEW.name_th := NEW.name; END IF;
    
    NEW.updated_at := TIMEZONE('utc', NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_department_translation_defaults()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.translation_key IS NULL OR NEW.translation_key = '' THEN
        NEW.translation_key := 'department_' || LOWER(REPLACE(REPLACE(NEW.name, ' ', '_'), '/', '_'));
    END IF;
    
    IF NEW.name_en IS NULL OR NEW.name_en = '' THEN NEW.name_en := NEW.name; END IF;
    IF NEW.name_zh IS NULL OR NEW.name_zh = '' THEN NEW.name_zh := NEW.name; END IF;
    IF NEW.name_th IS NULL OR NEW.name_th = '' THEN NEW.name_th := NEW.name; END IF;
    
    NEW.updated_at := TIMEZONE('utc', NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성/재생성
DROP TRIGGER IF EXISTS position_translation_defaults_trigger ON public.positions;
CREATE TRIGGER position_translation_defaults_trigger
    BEFORE INSERT OR UPDATE ON public.positions
    FOR EACH ROW
    EXECUTE FUNCTION set_position_translation_defaults();

DROP TRIGGER IF EXISTS department_translation_defaults_trigger ON public.departments;
CREATE TRIGGER department_translation_defaults_trigger
    BEFORE INSERT OR UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION set_department_translation_defaults();

-- 결과 확인
SELECT '✅ 직책 및 부서 번역키 업데이트 완료!' as message;

SELECT '📋 직책 번역 정보:' as positions_title;
SELECT name, translation_key, name_en, name_zh, name_th 
FROM public.positions 
ORDER BY 
    CASE 
        WHEN name = '생산 직원' THEN 1
        WHEN name = '사우' THEN 2
        WHEN name = '사원' THEN 3
        WHEN name = '프로' THEN 4
        WHEN name = '리더' THEN 5
        WHEN name = '멘토' THEN 6
        WHEN name = '법인장' THEN 7
        WHEN name = '대표' THEN 8
        WHEN name = '창립자' THEN 9
        ELSE 10
    END;

SELECT '🏢 부서 번역 정보:' as departments_title;
SELECT name, translation_key, name_en, name_zh, name_th 
FROM public.departments 
ORDER BY name; 