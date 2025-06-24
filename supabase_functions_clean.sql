-- Supabase Functions for Template-based Task Creation

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
    new_project_id := 'p' || extract(epoch from now())::bigint;
    
    RAISE NOTICE 'Creating project tasks for: %', new_project_id;
    
    FOR task_template IN 
        SELECT * FROM task_phases 
        WHERE is_active = true 
        ORDER BY order_index
    LOOP
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
        
        RAISE NOTICE 'Created task: % (stage: %)', task_template.name, task_template.order_index;
    END LOOP;
    
    result := jsonb_build_object(
        'success', true,
        'project_id', new_project_id,
        'created_tasks_count', created_tasks_count,
        'message', format('%s개의 템플릿 기반 업무가 생성되었습니다.', created_tasks_count)
    );
    
    RAISE NOTICE 'Project tasks creation completed: % (total: %)', new_project_id, created_tasks_count;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Project tasks creation failed: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', '템플릿 기반 업무 생성에 실패했습니다.'
        );
END;
$$;

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
    final_project_name := COALESCE(project_name, target_project_id);
    
    RAISE NOTICE 'Adding template tasks to project: %', target_project_id;
    
    FOR task_template IN 
        SELECT * FROM task_phases 
        WHERE is_active = true 
        ORDER BY order_index
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM tasks 
            WHERE project_id = target_project_id 
            AND task_phase = task_template.id
        ) THEN
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
            
            RAISE NOTICE 'Added task: % (stage: %)', task_template.name, task_template.order_index;
        ELSE
            RAISE NOTICE 'Skipped existing task: %', task_template.name;
        END IF;
    END LOOP;
    
    result := jsonb_build_object(
        'success', true,
        'project_id', target_project_id,
        'created_tasks_count', created_tasks_count,
        'message', format('%s개의 새로운 템플릿 업무가 추가되었습니다.', created_tasks_count)
    );
    
    RAISE NOTICE 'Template tasks addition completed: % (total: %)', target_project_id, created_tasks_count;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Template tasks addition failed: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', '템플릿 기반 업무 추가에 실패했습니다.'
        );
END;
$$;

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
    RAISE NOTICE 'Starting template synchronization for all projects';
    
    FOR project_record IN 
        SELECT DISTINCT project_id 
        FROM tasks 
        WHERE project_id IS NOT NULL
    LOOP
        SELECT * INTO sync_result 
        FROM add_template_tasks_to_project(project_record.project_id);
        
        IF (sync_result->>'success')::boolean THEN
            total_updated_projects := total_updated_projects + 1;
            total_created_tasks := total_created_tasks + (sync_result->>'created_tasks_count')::integer;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Template synchronization completed: % projects, % tasks added', total_updated_projects, total_created_tasks;
    
    RETURN jsonb_build_object(
        'success', true,
        'updated_projects', total_updated_projects,
        'created_tasks', total_created_tasks,
        'message', format('%s개 프로젝트에 %s개의 새로운 업무가 추가되었습니다.', total_updated_projects, total_created_tasks)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Template synchronization failed: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', '템플릿 동기화에 실패했습니다.'
        );
END;
$$; 