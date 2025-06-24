-- 수동으로 하위 업무 생성 테스트
-- Supabase SQL Editor에서 실행하세요

-- 1. 먼저 최근 생성된 프로젝트 확인 (실제 UUID 형식 확인)
SELECT 
  '📋 최근 생성된 프로젝트들' as info,
  id,
  name,
  created_at,
  '👆 위의 id를 복사해서 아래 변수에 사용하세요' as instruction
FROM public.projects 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. tasks 테이블 스키마 확인
SELECT 
  '📋 Tasks 테이블 컬럼 구조' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 동적으로 최신 프로젝트에 하위업무 생성
DO $$
DECLARE
    target_project_id UUID;
    project_name TEXT;
    promotion_names TEXT[] := ARRAY[
        '영업정보',
        '견적서 및 접수',
        '견적서 분석',
        '원자재 소싱전략',
        'SPL 접수',
        '원재 소싱전략',
        '원재 결정',
        'E-Service Content',
        'E-Service 완성',
        'LINE 그래디',
        '결과 산출',
        'PP',
        '품질 Review',
        '최종 개선',
        '수주'
    ];
    promotion_name TEXT;
    created_count INTEGER := 0;
BEGIN
    -- 가장 최근 생성된 프로젝트 ID 가져오기
    SELECT id, name 
    INTO target_project_id, project_name
    FROM public.projects 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF target_project_id IS NULL THEN
        RAISE NOTICE '❌ 프로젝트를 찾을 수 없습니다. 먼저 프로젝트를 생성해주세요.';
        RETURN;
    END IF;
    
    RAISE NOTICE '🚀 프로젝트에 하위업무 생성 시작: % (ID: %)', project_name, target_project_id;
    
    -- 각 프로모션명으로 업무 생성
    FOREACH promotion_name IN ARRAY promotion_names
    LOOP
        INSERT INTO public.tasks (
            title,
            description,
            project_id,
            status,
            priority,
            progress,
            start_date,
            due_date,
            assigned_to,
            department,
            task_phase,
            parent_task_id,
            created_at,
            updated_at
        ) VALUES (
            promotion_name,
            '',
            target_project_id,
            '시작전',
            'medium',
            0,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NOW(),
            NOW()
        );
        
        created_count := created_count + 1;
        RAISE NOTICE '✅ 업무 생성: %', promotion_name;
    END LOOP;
    
    RAISE NOTICE '🎉 총 %개의 업무가 "%s" 프로젝트에 생성되었습니다', created_count, project_name;
END $$;

-- 4. 생성 결과 확인
SELECT 
  '✅ 최근 생성된 하위업무들' as info,
  p.name as project_name,
  t.title as task_title,
  t.status,
  t.priority,
  t.created_at
FROM public.tasks t
JOIN public.projects p ON t.project_id = p.id
ORDER BY t.created_at DESC
LIMIT 20; 