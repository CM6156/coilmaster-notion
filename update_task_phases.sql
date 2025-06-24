-- 업무 단계 테이블 업데이트 - 실제 업무 단계들로 변경
-- Supabase SQL 에디터에서 실행하세요

-- 기존 데이터 삭제
DELETE FROM public.task_phases;

-- 실제 업무 단계 데이터 삽입 (이미지에 표시된 15개 단계)
INSERT INTO public.task_phases (name, description, color, order_index, is_active) VALUES
('영업정보', '영업 관련 정보 수집 및 분석', '#ef4444', 1, true),
('견적서 및 접수', '견적서 작성 및 고객 접수', '#f97316', 2, true),
('견적서 분석', '견적서 상세 분석 및 검토', '#f59e0b', 3, true),
('원자재 소싱전략', '원자재 소싱 전략 수립', '#eab308', 4, true),
('SPL 접수', 'SPL 관련 업무 접수', '#84cc16', 5, true),
('원재 소싱전략', '원재료 소싱 전략 수립', '#22c55e', 6, true),
('원재 결정', '원재료 최종 결정', '#10b981', 7, true),
('E-Service Content', 'E-Service 컨텐츠 관리', '#14b8a6', 8, true),
('E-Service 완성', 'E-Service 시스템 완성', '#06b6d4', 9, true),
('LINE 그래디', 'LINE 관련 그래디 작업', '#0ea5e9', 10, true),
('결과 산출', '결과 데이터 산출 및 정리', '#3b82f6', 11, true),
('PP', 'PP 관련 업무', '#6366f1', 12, true),
('품질 Review', '품질 검토 및 리뷰', '#8b5cf6', 13, true),
('최종 개선', '최종 개선 및 완료', '#a855f7', 14, true),
('수주', '수주 완료', '#ec4899', 15, true);

-- 확인 쿼리
SELECT 
    order_index,
    name,
    color,
    is_active
FROM public.task_phases 
ORDER BY order_index;

-- 기존 업무들의 task_phase를 첫 번째 단계로 설정
UPDATE public.tasks 
SET task_phase = (
    SELECT id 
    FROM public.task_phases 
    WHERE order_index = 1
    LIMIT 1
)
WHERE task_phase IS NULL OR task_phase NOT IN (
    SELECT id FROM public.task_phases
); 