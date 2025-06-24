-- 최종 해결책: 모든 시나리오를 고려한 안전한 task_phases 설정

-- 1. task_phases 테이블 상태 확인 및 생성
DO $$
BEGIN
    -- 테이블이 존재하지 않으면 생성
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'task_phases') THEN
        CREATE TABLE task_phases (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            order_index INTEGER NOT NULL,
            color VARCHAR(7) DEFAULT '#6366f1',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'task_phases 테이블이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'task_phases 테이블이 이미 존재합니다.';
    END IF;
END $$;

-- 2. 기존 tasks의 task_phase 참조를 안전하게 NULL로 설정
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
        UPDATE tasks SET task_phase = NULL WHERE task_phase IS NOT NULL;
        RAISE NOTICE 'tasks 테이블의 task_phase 참조를 NULL로 설정했습니다.';
    END IF;
END $$;

-- 3. 기존 task_phases 데이터를 안전하게 삭제
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'task_phases') THEN
        DELETE FROM task_phases;
        RAISE NOTICE 'task_phases 테이블의 기존 데이터를 삭제했습니다.';
    END IF;
END $$;

-- 4. 시퀀스가 존재하면 리셋 (존재하지 않으면 무시)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.sequences WHERE sequence_name = 'task_phases_id_seq') THEN
        ALTER SEQUENCE task_phases_id_seq RESTART WITH 1;
        RAISE NOTICE '시퀀스를 1로 리셋했습니다.';
    ELSE
        RAISE NOTICE '시퀀스가 존재하지 않습니다. (정상)';
    END IF;
END $$;

-- 5. 15개 프로모션 단계 데이터 입력
INSERT INTO task_phases (name, description, order_index, color, is_active) VALUES
('영업정보', '영업 정보 수집 및 분석', 1, '#ef4444', true),
('견적서 및 접수', '견적서 작성 및 접수 처리', 2, '#f97316', true),
('견적서 분석', '견적서 내용 분석 및 검토', 3, '#f59e0b', true),
('원자재 소싱전략', '원자재 소싱 전략 수립', 4, '#eab308', true),
('SPL 접수', 'SPL(Supplier Part List) 접수', 5, '#84cc16', true),
('원재 소싱전략', '원재료 소싱 전략 최종 결정', 6, '#22c55e', true),
('원재 결정', '원재료 최종 결정 및 확정', 7, '#10b981', true),
('E-Service Content', 'E-Service 컨텐츠 개발', 8, '#14b8a6', true),
('E-Service 완성', 'E-Service 개발 완료', 9, '#06b6d4', true),
('LINE 그래디', 'LINE 그래디 진행', 10, '#0ea5e9', true),
('결과 산출', '최종 결과 산출 및 보고', 11, '#3b82f6', true),
('PP', 'PP(Production Part) 진행', 12, '#6366f1', true),
('품질 Review', '품질 검토 및 승인', 13, '#8b5cf6', true),
('최종 개선', '최종 개선사항 반영', 14, '#a855f7', true),
('수주', '최종 수주 완료', 15, '#ec4899', true);

-- 6. 기존 tasks를 새로운 task_phases와 매핑 (tasks 테이블이 존재하는 경우)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
        -- 업무명으로 매핑
        UPDATE tasks SET task_phase = 1 WHERE title LIKE '%영업정보%' OR title = '영업정보';
        UPDATE tasks SET task_phase = 2 WHERE title LIKE '%견적서 및 접수%' OR title = '견적서 및 접수';
        UPDATE tasks SET task_phase = 3 WHERE title LIKE '%견적서 분석%' OR title = '견적서 분석';
        UPDATE tasks SET task_phase = 4 WHERE title LIKE '%원자재 소싱전략%' OR title = '원자재 소싱전략';
        UPDATE tasks SET task_phase = 5 WHERE title LIKE '%SPL 접수%' OR title = 'SPL 접수';
        UPDATE tasks SET task_phase = 6 WHERE title LIKE '%원재 소싱전략%' OR title = '원재 소싱전략';
        UPDATE tasks SET task_phase = 7 WHERE title LIKE '%원재 결정%' OR title = '원재 결정';
        UPDATE tasks SET task_phase = 8 WHERE title LIKE '%E-Service Content%' OR title = 'E-Service Content';
        UPDATE tasks SET task_phase = 9 WHERE title LIKE '%E-Service 완성%' OR title = 'E-Service 완성';
        UPDATE tasks SET task_phase = 10 WHERE title LIKE '%LINE 그래디%' OR title = 'LINE 그래디';
        UPDATE tasks SET task_phase = 11 WHERE title LIKE '%결과 산출%' OR title = '결과 산출';
        UPDATE tasks SET task_phase = 12 WHERE title LIKE '%PP%' OR title = 'PP';
        UPDATE tasks SET task_phase = 13 WHERE title LIKE '%품질 Review%' OR title = '품질 Review';
        UPDATE tasks SET task_phase = 14 WHERE title LIKE '%최종 개선%' OR title = '최종 개선';
        UPDATE tasks SET task_phase = 15 WHERE title LIKE '%수주%' OR title = '수주';
        
        RAISE NOTICE 'tasks 테이블 매핑을 완료했습니다.';
    END IF;
END $$;

-- 7. 최종 결과 확인
SELECT 
    '✅ 설정 완료' as 상태,
    'task_phases 테이블 상태' as 구분,
    COUNT(*) as 개수
FROM task_phases
WHERE is_active = true

UNION ALL

SELECT 
    '✅ 설정 완료' as 상태,
    'task_phase가 할당된 tasks' as 구분,
    COALESCE((SELECT COUNT(*) FROM tasks WHERE task_phase IS NOT NULL), 0) as 개수

UNION ALL

SELECT 
    '✅ 설정 완료' as 상태,
    'task_phase가 NULL인 tasks' as 구분,
    COALESCE((SELECT COUNT(*) FROM tasks WHERE task_phase IS NULL), 0) as 개수;

-- 8. 단계별 상세 확인
SELECT 
    '📋 단계별 현황' as 구분,
    tp.order_index as 순서,
    tp.name as 단계명,
    tp.color as 색상,
    COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.task_phase = tp.id), 0) as 업무수
FROM task_phases tp
WHERE tp.is_active = true
ORDER BY tp.order_index; 