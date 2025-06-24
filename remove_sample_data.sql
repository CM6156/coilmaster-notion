-- ���� ������ ���� ��ũ��Ʈ
-- PT-01�� ���õ� ���� �����͵��� �����մϴ�

-- ���� ���� �������� ����
DELETE FROM public.tasks WHERE title LIKE '%PT-01%' OR project_id IN (
    SELECT id FROM public.projects WHERE name LIKE '%���൵ ������Ʈ%' OR name LIKE '%OLED%' OR name LIKE '%����Ʈ ����%'
);

-- ���� ������Ʈ���� ����
DELETE FROM public.projects WHERE name LIKE '%���൵ ������Ʈ%' OR name LIKE '%OLED%' OR name LIKE '%����Ʈ ����%';

-- Ư�� ID�� �� ���� �����Ͱ� �ִٸ� ����
DELETE FROM public.tasks WHERE id IN ('task-1', 'task-2', 'task-3', 'task-4', 'task-5');
DELETE FROM public.projects WHERE id IN ('project-1', 'project-2');

-- �Ϸ� �޽���
SELECT ' ���� �����Ͱ� ���������� �����Ǿ����ϴ�!' as message;
