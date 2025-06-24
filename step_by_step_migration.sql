-- ========================================
-- 단계별 안전한 업무일지 테이블 마이그레이션
-- ========================================

-- STEP 1: 현재 테이블 구조 확인
SELECT '=== 현재 work_journals 테이블 구조 ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'work_journals' 
ORDER BY ordinal_position;

SELECT '=== 현재 데이터 샘플 (최대 3개) ===' as info;

-- 현재 데이터 확인 (안전한 방식으로)
SELECT 
    id,
    user_id,
    date,
    status,
    created_at
FROM work_journals
LIMIT 3;

-- STEP 2: 필수 컬럼들을 하나씩 안전하게 추가

-- 2-1. title 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_journals' AND column_name = 'title'
    ) THEN
        ALTER TABLE work_journals ADD COLUMN title VARCHAR(255);
        -- 기존 데이터에 기본 제목 설정
        UPDATE work_journals SET title = '업무일지' WHERE title IS NULL;
        -- NOT NULL 제약조건 추가
        ALTER TABLE work_journals ALTER COLUMN title SET NOT NULL;
        ALTER TABLE work_journals ALTER COLUMN title SET DEFAULT '업무일지';
        
        RAISE NOTICE '✅ title 컬럼이 성공적으로 추가되었습니다.';
    ELSE
        RAISE NOTICE '⚠️ title 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 2-2. content 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_journals' AND column_name = 'content'
    ) THEN
        ALTER TABLE work_journals ADD COLUMN content TEXT;
        -- 기존 데이터에 기본 내용 설정
        UPDATE work_journals SET content = '업무 내용을 입력해주세요.' WHERE content IS NULL;
        -- NOT NULL 제약조건 추가
        ALTER TABLE work_journals ALTER COLUMN content SET NOT NULL;
        
        RAISE NOTICE '✅ content 컬럼이 성공적으로 추가되었습니다.';
    ELSE
        RAISE NOTICE '⚠️ content 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 2-3. author_name 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_journals' AND column_name = 'author_name'
    ) THEN
        ALTER TABLE work_journals ADD COLUMN author_name VARCHAR(100);
        
        RAISE NOTICE '✅ author_name 컬럼이 성공적으로 추가되었습니다.';
    ELSE
        RAISE NOTICE '⚠️ author_name 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 2-4. author_id 컬럼 확인 및 추가 (필요한 경우)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_journals' AND column_name = 'author_id'
    ) THEN
        ALTER TABLE work_journals ADD COLUMN author_id UUID;
        
        RAISE NOTICE '✅ author_id 컬럼이 성공적으로 추가되었습니다.';
    ELSE
        RAISE NOTICE '⚠️ author_id 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- STEP 3: 업데이트된 테이블 구조 확인
SELECT '=== 업데이트된 테이블 구조 ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'work_journals' 
ORDER BY ordinal_position;

-- STEP 4: 추가 개선 컬럼들 (선택사항)
DO $$
BEGIN
    -- work_hours 컬럼
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_journals' AND column_name = 'work_hours'
    ) THEN
        ALTER TABLE work_journals ADD COLUMN work_hours DECIMAL(4,2) DEFAULT 8.0;
        RAISE NOTICE '✅ work_hours 컬럼이 추가되었습니다.';
    END IF;

    -- overtime_hours 컬럼
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_journals' AND column_name = 'overtime_hours'
    ) THEN
        ALTER TABLE work_journals ADD COLUMN overtime_hours DECIMAL(4,2) DEFAULT 0.0;
        RAISE NOTICE '✅ overtime_hours 컬럼이 추가되었습니다.';
    END IF;

    -- category 컬럼
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_journals' AND column_name = 'category'
    ) THEN
        ALTER TABLE work_journals ADD COLUMN category VARCHAR(100);
        RAISE NOTICE '✅ category 컬럼이 추가되었습니다.';
    END IF;

    -- has_attachments 컬럼
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_journals' AND column_name = 'has_attachments'
    ) THEN
        ALTER TABLE work_journals ADD COLUMN has_attachments BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ has_attachments 컬럼이 추가되었습니다.';
    END IF;

    -- attachment_count 컬럼
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_journals' AND column_name = 'attachment_count'
    ) THEN
        ALTER TABLE work_journals ADD COLUMN attachment_count INTEGER DEFAULT 0;
        RAISE NOTICE '✅ attachment_count 컬럼이 추가되었습니다.';
    END IF;
END $$;

-- STEP 5: status 컬럼 업데이트 (기존 값들을 새로운 enum 형식에 맞게 변환)
UPDATE work_journals 
SET status = CASE 
    WHEN status = 'published' THEN 'completed'
    WHEN status = 'draft' THEN 'in-progress'
    WHEN status = 'pending' THEN 'in-progress'
    WHEN status NOT IN ('not-started', 'in-progress', 'delayed', 'completed', 'on-hold') THEN 'in-progress'
    ELSE status
END;

-- STEP 6: 최종 테이블 구조 확인
SELECT '=== 최종 테이블 구조 ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'work_journals' 
ORDER BY ordinal_position;

-- STEP 7: 샘플 데이터 확인
SELECT '=== 업데이트된 데이터 샘플 ===' as info;

SELECT 
    id,
    title,
    CASE 
        WHEN LENGTH(content) > 50 THEN LEFT(content, 50) || '...'
        ELSE content
    END as content_preview,
    date,
    status,
    author_name,
    work_hours
FROM work_journals
LIMIT 3;

SELECT '✅ 단계별 마이그레이션이 완료되었습니다!' as result; 