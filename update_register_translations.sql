-- ========================================
-- 회원가입 페이지 부서/직책 다국어 번역 업데이트
-- ========================================

-- 부서 테이블에 다국어 컬럼 추가 (없는 경우)
ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_zh VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_th VARCHAR(255);

-- 직책 테이블에 다국어 컬럼 추가 (없는 경우)
ALTER TABLE public.positions 
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_zh VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_th VARCHAR(255);

-- 현재 등록된 부서들에 다국어 번역 추가
UPDATE public.departments SET 
    name_en = 'Digital Marketing',
    name_zh = '数字营销部',
    name_th = 'ฝ่ายการตลาดดิจิทัล'
WHERE name = '디지털 M';

UPDATE public.departments SET 
    name_en = 'Procurement',
    name_zh = '采购部',
    name_th = 'ฝ่ายจัดซื้อ'
WHERE name = '구매';

UPDATE public.departments SET 
    name_en = 'Server Management',
    name_zh = '服务器管理部',
    name_th = 'ฝ่ายจัดการเซิร์ฟเวอร์'
WHERE name = '서버 관리';

UPDATE public.departments SET 
    name_en = 'Management',
    name_zh = '管理部',
    name_th = 'ฝ่ายจัดการ'
WHERE name = '경영';

UPDATE public.departments SET 
    name_en = 'IT',
    name_zh = 'IT部',
    name_th = 'ฝ่ายไอที'
WHERE name = '전산';

UPDATE public.departments SET 
    name_en = 'Development',
    name_zh = '开发部',
    name_th = 'ฝ่ายพัฒนา'
WHERE name = '개발';

UPDATE public.departments SET 
    name_en = 'Sales',
    name_zh = '销售部',
    name_th = 'ฝ่ายขาย'
WHERE name = '영업';

UPDATE public.departments SET 
    name_en = 'Quality',
    name_zh = '质量部',
    name_th = 'ฝ่ายคุณภาพ'
WHERE name = '품질';

UPDATE public.departments SET 
    name_en = 'Production',
    name_zh = '生产部',
    name_th = 'ฝ่ายผลิต'
WHERE name = '생산';

UPDATE public.departments SET 
    name_en = 'Administration',
    name_zh = '行政部',
    name_th = 'ฝ่ายบริหาร'
WHERE name = '관리';

-- 현재 등록된 직책들에 다국어 번역 추가
UPDATE public.positions SET 
    name_en = 'Production Staff',
    name_zh = '生产员工',
    name_th = 'พนักงานผลิต'
WHERE name = '생산 직원';

UPDATE public.positions SET 
    name_en = 'Staff',
    name_zh = '员工',
    name_th = 'พนักงาน'
WHERE name = '사우';

UPDATE public.positions SET 
    name_en = 'Employee',
    name_zh = '职员',
    name_th = 'พนักงาน'
WHERE name = '사원';

UPDATE public.positions SET 
    name_en = 'Professional',
    name_zh = '专业人员',
    name_th = 'ผู้เชี่ยวชาญ'
WHERE name = '프로';

UPDATE public.positions SET 
    name_en = 'Leader',
    name_zh = '领导',
    name_th = 'ผู้นำ'
WHERE name = '리더';

UPDATE public.positions SET 
    name_en = 'Mentor',
    name_zh = '导师',
    name_th = 'ที่ปรึกษา'
WHERE name = '멘토';

UPDATE public.positions SET 
    name_en = 'Managing Director',
    name_zh = '董事总经理',
    name_th = 'กรรมการผู้จัดการ'
WHERE name = '법인장';

UPDATE public.positions SET 
    name_en = 'CEO',
    name_zh = '首席执行官',
    name_th = 'ซีอีโอ'
WHERE name = '대표';

UPDATE public.positions SET 
    name_en = 'Founder',
    name_zh = '创始人',
    name_th = 'ผู้ก่อตั้ง'
WHERE name = '창립자';

-- 기존 데이터 중 번역이 없는 것들에 대한 기본값 설정
UPDATE public.departments 
SET 
    name_en = name,
    name_zh = name,
    name_th = name
WHERE name_en IS NULL OR name_en = '';

UPDATE public.positions 
SET 
    name_en = name,
    name_zh = name,
    name_th = name
WHERE name_en IS NULL OR name_en = '';

-- 결과 확인
SELECT '=== 부서 번역 정보 ===' as title;
SELECT name as 한국어, name_en as English, name_zh as 中文, name_th as ไทย 
FROM public.departments 
ORDER BY name;

SELECT '=== 직책 번역 정보 ===' as title;
SELECT name as 한국어, name_en as English, name_zh as 中文, name_th as ไทย 
FROM public.positions 
ORDER BY name; 