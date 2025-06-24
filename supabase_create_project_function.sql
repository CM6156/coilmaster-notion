-- Supabase Function: 프로젝트 생성 시 템플릿 기반 업무 자동 생성

-- 1. 프로젝트 생성과 동시에 템플릿 기반 업무를 생성하는 함수
CREATE OR REPLACE FUNCTION create_project_with_default_tasks(
    project_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_project_id TEXT;
    task_template RECORD;
    created_tasks_count INTEGER := 0;
    result JSONB;
BEGIN
    -- 프로젝트 ID 생성
    new_project_id := 'p' || extract(epoch from now())::bigint;
    
    -- 로그 시작
    RAISE NOTICE '🚀 프로젝트 생성 및 템플릿 기반 업무 생성 시작: %', new_project_id;
    
    -- 프로젝트 생성 (projects 테이블에 직접 삽입하지 않고 클라이언트에서 처리)
    -- 여기서는 업무 생성에만 집중
    
    -- task_phases 템플릿에서 활성화된 모든 단계 가져오기
    FOR task_template IN 
        SELECT * FROM task_phases 
        WHERE is_active = true 
        ORDER BY order_index
    LOOP
        -- 각 템플릿을 기반으로 프로젝트 업무 생성
        INSERT INTO tasks (
            title,
            description,
            project_id,
            task_phase,
            status,
            priority,
            progress,
            start_date,
            due_date,
            assigned_to,
            department,
            stage_number,
            stage_label,
            color,
            created_at,
            updated_at
        ) VALUES (
            task_template.name,
            (project_data->>'name') || ' - ' || COALESCE(task_template.description, task_template.name),
            new_project_id,
            task_template.id,
            '시작전',
            'medium',
            0,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '30 days' + (task_template.order_index * INTERVAL '7 days'),
            NULL,
            NULL,
            task_template.order_index,
            task_template.name,
            task_template.color,
            NOW(),
            NOW()
        );
        
        created_tasks_count := created_tasks_count + 1;
        
        RAISE NOTICE '📝 템플릿 기반 업무 생성: % (단계: %)', task_template.name, task_template.order_index;
    END LOOP;
    
    -- 결과 반환
    result := jsonb_build_object(
        'success', true,
        'project_id', new_project_id,
        'created_tasks_count', created_tasks_count,
        'message', format('%s개의 템플릿 기반 업무가 생성되었습니다.', created_tasks_count)
    );
    
    RAISE NOTICE '✅ 프로젝트 업무 생성 완료: % (총 %개)', new_project_id, created_tasks_count;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ 프로젝트 업무 생성 실패: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', '템플릿 기반 업무 생성에 실패했습니다.'
        );
END;
$$;

-- 2. 기존 프로젝트에 템플릿 기반 업무를 추가하는 함수
CREATE OR REPLACE FUNCTION add_template_tasks_to_project(
    target_project_id TEXT,
    project_name TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    task_template RECORD;
    created_tasks_count INTEGER := 0;
    result JSONB;
    final_project_name TEXT;
BEGIN
    -- 프로젝트명이 제공되지 않으면 프로젝트 ID 사용
    final_project_name := COALESCE(project_name, target_project_id);
    
    RAISE NOTICE '🔄 기존 프로젝트에 템플릿 업무 추가: %', target_project_id;
    
    -- 기존 업무 삭제 (선택사항 - 필요에 따라 주석 해제)
    -- DELETE FROM tasks WHERE project_id = target_project_id;
    
    -- task_phases 템플릿에서 활성화된 모든 단계 가져오기
    FOR task_template IN 
        SELECT * FROM task_phases 
        WHERE is_active = true 
        ORDER BY order_index
    LOOP
        -- 중복 방지: 같은 단계의 업무가 이미 있는지 확인
        IF NOT EXISTS (
            SELECT 1 FROM tasks 
            WHERE project_id = target_project_id 
            AND task_phase = task_template.id
        ) THEN
            -- 템플릿 기반 업무 생성
            INSERT INTO tasks (
                title,
                description,
                project_id,
                task_phase,
                status,
                priority,
                progress,
                start_date,
                due_date,
                assigned_to,
                department,
                stage_number,
                stage_label,
                color,
                created_at,
                updated_at
            ) VALUES (
                task_template.name,
                final_project_name || ' - ' || COALESCE(task_template.description, task_template.name),
                target_project_id,
                task_template.id,
                '시작전',
                'medium',
                0,
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '30 days' + (task_template.order_index * INTERVAL '7 days'),
                NULL,
                NULL,
                task_template.order_index,
                task_template.name,
                task_template.color,
                NOW(),
                NOW()
            );
            
            created_tasks_count := created_tasks_count + 1;
            
            RAISE NOTICE '📝 업무 추가: % (단계: %)', task_template.name, task_template.order_index;
        ELSE
            RAISE NOTICE '⏭️ 업무 건너뛰기 (이미 존재): %', task_template.name;
        END IF;
    END LOOP;
    
    -- 결과 반환
    result := jsonb_build_object(
        'success', true,
        'project_id', target_project_id,
        'created_tasks_count', created_tasks_count,
        'message', format('%s개의 새로운 템플릿 업무가 추가되었습니다.', created_tasks_count)
    );
    
    RAISE NOTICE '✅ 프로젝트 업무 추가 완료: % (총 %개)', target_project_id, created_tasks_count;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ 프로젝트 업무 추가 실패: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', '템플릿 기반 업무 추가에 실패했습니다.'
        );
END;
$$;

-- 3. 템플릿 업데이트 시 기존 프로젝트들에 새 업무를 추가하는 함수
CREATE OR REPLACE FUNCTION sync_template_changes_to_projects()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_record RECORD;
    sync_result JSONB;
    total_updated_projects INTEGER := 0;
    total_created_tasks INTEGER := 0;
BEGIN
    RAISE NOTICE '🔄 모든 프로젝트에 템플릿 변경사항 동기화 시작';
    
    -- 모든 활성 프로젝트에 대해 템플릿 업무 추가
    FOR project_record IN 
        SELECT DISTINCT project_id 
        FROM tasks 
        WHERE project_id IS NOT NULL
    LOOP
        -- 각 프로젝트에 누락된 템플릿 업무 추가
        SELECT * INTO sync_result 
        FROM add_template_tasks_to_project(project_record.project_id);
        
        IF (sync_result->>'success')::boolean THEN
            total_updated_projects := total_updated_projects + 1;
            total_created_tasks := total_created_tasks + (sync_result->>'created_tasks_count')::integer;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ 템플릿 동기화 완료: %개 프로젝트, %개 업무 추가', total_updated_projects, total_created_tasks;
    
    RETURN jsonb_build_object(
        'success', true,
        'updated_projects', total_updated_projects,
        'created_tasks', total_created_tasks,
        'message', format('%s개 프로젝트에 %s개의 새로운 업무가 추가되었습니다.', total_updated_projects, total_created_tasks)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ 템플릿 동기화 실패: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', '템플릿 동기화에 실패했습니다.'
        );
END;
$$;

-- 4. 함수 사용 예시 및 테스트
-- 새 프로젝트 생성 시 사용:
-- SELECT create_project_with_default_tasks('{"name": "테스트 프로젝트", "description": "테스트용"}');

-- 기존 프로젝트에 템플릿 업무 추가:
-- SELECT add_template_tasks_to_project('existing_project_id', '기존 프로젝트명');

-- 모든 프로젝트에 템플릿 변경사항 동기화:
-- SELECT sync_template_changes_to_projects();

-- 5. 함수 권한 설정 (필요시)
-- GRANT EXECUTE ON FUNCTION create_project_with_default_tasks TO authenticated;
-- GRANT EXECUTE ON FUNCTION add_template_tasks_to_project TO authenticated;
-- GRANT EXECUTE ON FUNCTION sync_template_changes_to_projects TO authenticated; 