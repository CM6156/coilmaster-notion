// 템플릿 관리 유틸리티 함수들

import { supabase } from '@/lib/supabase';

// 템플릿 타입 정의
export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  order_index: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 프로젝트 업무 생성 결과 타입
export interface TaskCreationResult {
  success: boolean;
  created_tasks_count: number;
  message: string;
  error?: string;
}

/**
 * 모든 활성화된 업무 템플릿 조회
 */
export async function getActiveTaskTemplates(): Promise<TaskTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('task_phases')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('템플릿 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('템플릿 조회 실패:', error);
    return [];
  }
}

/**
 * 새 템플릿 추가
 */
export async function addTaskTemplate(template: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<TaskTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('task_phases')
      .insert([template])
      .select()
      .single();

    if (error) {
      console.error('템플릿 추가 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('템플릿 추가 실패:', error);
    return null;
  }
}

/**
 * 템플릿 업데이트
 */
export async function updateTaskTemplate(id: string, updates: Partial<TaskTemplate>): Promise<TaskTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('task_phases')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('템플릿 업데이트 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('템플릿 업데이트 실패:', error);
    return null;
  }
}

/**
 * 템플릿 삭제 (비활성화)
 */
export async function deactivateTaskTemplate(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('task_phases')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('템플릿 비활성화 오류:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('템플릿 비활성화 실패:', error);
    return false;
  }
}

/**
 * Supabase Function을 사용하여 프로젝트에 템플릿 기반 업무 생성
 */
export async function createProjectTasksFromTemplate(projectId: string, projectName: string): Promise<TaskCreationResult> {
  try {
    const { data, error } = await supabase.rpc('create_project_with_default_tasks', {
      project_data: {
        name: projectName,
        id: projectId
      }
    });

    if (error) {
      console.error('Function 호출 오류:', error);
      return {
        success: false,
        created_tasks_count: 0,
        message: '템플릿 기반 업무 생성에 실패했습니다.',
        error: error.message
      };
    }

    return data || {
      success: false,
      created_tasks_count: 0,
      message: '알 수 없는 오류가 발생했습니다.'
    };
  } catch (error) {
    console.error('Function 호출 실패:', error);
    return {
      success: false,
      created_tasks_count: 0,
      message: '템플릿 기반 업무 생성에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * 기존 프로젝트에 누락된 템플릿 업무 추가
 */
export async function addMissingTemplateTasksToProject(projectId: string, projectName?: string): Promise<TaskCreationResult> {
  try {
    const { data, error } = await supabase.rpc('add_template_tasks_to_project', {
      target_project_id: projectId,
      project_name: projectName
    });

    if (error) {
      console.error('Function 호출 오류:', error);
      return {
        success: false,
        created_tasks_count: 0,
        message: '템플릿 업무 추가에 실패했습니다.',
        error: error.message
      };
    }

    return data || {
      success: false,
      created_tasks_count: 0,
      message: '알 수 없는 오류가 발생했습니다.'
    };
  } catch (error) {
    console.error('Function 호출 실패:', error);
    return {
      success: false,
      created_tasks_count: 0,
      message: '템플릿 업무 추가에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * 모든 프로젝트에 템플릿 변경사항 동기화
 */
export async function syncTemplateChangesToAllProjects(): Promise<TaskCreationResult> {
  try {
    const { data, error } = await supabase.rpc('sync_template_changes_to_projects');

    if (error) {
      console.error('동기화 Function 호출 오류:', error);
      return {
        success: false,
        created_tasks_count: 0,
        message: '템플릿 동기화에 실패했습니다.',
        error: error.message
      };
    }

    return data || {
      success: false,
      created_tasks_count: 0,
      message: '알 수 없는 오류가 발생했습니다.'
    };
  } catch (error) {
    console.error('동기화 Function 호출 실패:', error);
    return {
      success: false,
      created_tasks_count: 0,
      message: '템플릿 동기화에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * 기본 템플릿 데이터 (하드코딩된 백업)
 */
export const DEFAULT_TASK_TEMPLATES = [
  { name: '영업정보', description: '영업 정보 수집 및 분석', order: 1, color: '#ef4444' },
  { name: '견적서 및 접수', description: '견적서 작성 및 접수 처리', order: 2, color: '#f97316' },
  { name: '견적서 분석', description: '견적서 내용 분석 및 검토', order: 3, color: '#f59e0b' },
  { name: '원자재 소싱전략', description: '원자재 소싱 전략 수립', order: 4, color: '#eab308' },
  { name: 'SPL 접수', description: 'SPL(Supplier Part List) 접수', order: 5, color: '#84cc16' },
  { name: '원재 소싱전략', description: '원재료 소싱 전략 최종 결정', order: 6, color: '#22c55e' },
  { name: '원재 결정', description: '원재료 최종 결정 및 확정', order: 7, color: '#10b981' },
  { name: 'E-Service Content', description: 'E-Service 컨텐츠 개발', order: 8, color: '#14b8a6' },
  { name: 'E-Service 완성', description: 'E-Service 개발 완료', order: 9, color: '#06b6d4' },
  { name: 'LINE 그래디', description: 'LINE 그래디 진행', order: 10, color: '#0ea5e9' },
  { name: '결과 산출', description: '최종 결과 산출 및 보고', order: 11, color: '#3b82f6' },
  { name: 'PP', description: 'PP(Production Part) 진행', order: 12, color: '#6366f1' },
  { name: '품질 Review', description: '품질 검토 및 승인', order: 13, color: '#8b5cf6' },
  { name: '최종 개선', description: '최종 개선사항 반영', order: 14, color: '#a855f7' },
  { name: '수주', description: '최종 수주 완료', order: 15, color: '#ec4899' }
] as const; 