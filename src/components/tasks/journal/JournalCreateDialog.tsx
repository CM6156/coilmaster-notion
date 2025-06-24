import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/context/AppContext";
import { format } from "date-fns";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileText, User, AtSign } from "lucide-react";
import { Task, Project } from "@/types";
import { supabase } from "@/lib/supabase";

type JournalStatus = "not-started" | "in-progress" | "delayed" | "completed";

type JournalFormData = {
  project_id: string;
  task_id: string;
  content: string;
  status: JournalStatus;
  files: File[];
  collaborators: string[];
  author_id: string;
  author_name: string;
};

interface JournalCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: JournalFormData) => void;
}

// 업무 단계 타입 정의
interface TaskPhase {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function JournalCreateDialog({ open, onOpenChange, onCreate }: JournalCreateDialogProps) {
  const { users, managers, currentUser, projects, tasks } = useAppContext();
  
  const [formData, setFormData] = useState<JournalFormData>({
    project_id: "",
    task_id: "",
    content: "",
    status: "not-started",
    files: [],
    collaborators: [],
    author_id: "",
    author_name: ""
  });

  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  
  // 업무 단계 상태 추가
  const [taskPhases, setTaskPhases] = useState<TaskPhase[]>([]);

  // 프로젝트에 따른 업무 필터링 및 정렬
  const filteredTasks = tasks
    .filter(task => task.projectId === formData.project_id)
    .sort((a, b) => {
      const phaseA = taskPhases.find(p => p.id === a.taskPhase);
      const phaseB = taskPhases.find(p => p.id === b.taskPhase);
      
      // 업무 단계의 order_index로 정렬
      const orderA = phaseA?.order_index || 999;
      const orderB = phaseB?.order_index || 999;
      
      return orderA - orderB;
    });
  
  // 업무 단계 로드
  const loadTaskPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('task_phases')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        console.error('업무 단계 로드 오류:', error);
        return;
      }
      
      setTaskPhases(data || []);
    } catch (error) {
      console.error('업무 단계 로드 중 오류:', error);
    }
  };

  // 업무 단계 번호 가져오기
  const getTaskPhaseNumber = (taskPhaseId?: string): string => {
    if (!taskPhaseId || !taskPhases.length) return "";
    const phase = taskPhases.find(p => p.id === taskPhaseId);
    return phase ? String(phase.order_index).padStart(2, '0') : "";
  };

  // 업무 표시 형식 생성 (01.단계명 형태)
  const getTaskDisplayText = (task: Task): string => {
    const phaseNumber = getTaskPhaseNumber(task.taskPhase);
    const phase = taskPhases.find(p => p.id === task.taskPhase);
    const phaseName = phase?.name || "단계 미지정";
    
    if (phaseNumber && phaseName) {
      // phaseName에 이미 번호가 포함되어 있는지 확인 (예: "02.경영사 spi 입수")
      const numberPattern = /^\d{2}\./;
      if (numberPattern.test(phaseName)) {
        // 이미 번호가 있으면 그대로 사용
        return phaseName;
      } else {
        // 번호가 없으면 앞에 번호 추가
        return `${phaseNumber}.${phaseName}`;
      }
    }
    return task.title || phaseName;
  };

  // 모든 사용자 목록 생성 (users + managers)
  const allUsers = React.useMemo(() => {
    const usersList = Array.isArray(users) ? users : [];
    const managersList = Array.isArray(managers) ? managers : [];
    
    // 중복 제거를 위해 Map 사용
    const userMap = new Map();
    
    // users 추가
    usersList.forEach(user => {
      if (user.id && user.name) {
        userMap.set(user.id, {
          id: user.id,
          name: user.name,
          email: user.email || '',
          department: user.department || '미분류',
          type: 'user'
        });
      }
    });
    
    // managers 추가 (중복 시 덮어쓰기)
    managersList.forEach(manager => {
      if (manager.id && manager.name) {
        userMap.set(manager.id, {
          id: manager.id,
          name: manager.name,
          email: manager.email || '',
          department: manager.department?.name || '미분류',
          type: 'manager'
        });
      }
    });
    
    return Array.from(userMap.values());
  }, [users, managers]);

  // 협업자 입력 필터링
  useEffect(() => {
    console.log('🔍 협업자 검색 - 입력값:', collaboratorInput);
    console.log('🔍 전체 사용자 목록:', allUsers);
    
    if (collaboratorInput.startsWith("@")) {
      const searchTerm = collaboratorInput.slice(1).toLowerCase().trim();
      console.log('🔍 검색어:', searchTerm);
      
      let filtered;
      if (searchTerm === "") {
        // @만 입력한 경우 모든 사용자 표시 (현재 사용자와 이미 선택된 사용자 제외)
        filtered = allUsers.filter(user => 
          user.id !== currentUser?.id &&
          !formData.collaborators.includes(user.id)
        );
      } else {
        // 검색어가 있는 경우 이름이나 이메일로 필터링
        filtered = allUsers.filter(user => 
          (user.name.toLowerCase().includes(searchTerm) || 
           user.email.toLowerCase().includes(searchTerm)) &&
          user.id !== currentUser?.id &&
          !formData.collaborators.includes(user.id)
        );
      }
      
      console.log('🔍 필터링된 사용자:', filtered);
      setFilteredUsers(filtered.slice(0, 10)); // 최대 10명까지만 표시
    } else {
      setFilteredUsers([]);
    }
  }, [collaboratorInput, allUsers, currentUser, formData.collaborators]);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      project_id: "",
      task_id: "",
      content: "",
      status: "not-started",
      files: [],
      collaborators: [],
      author_id: currentUser?.id || "",
      author_name: currentUser?.name || ""
    });
    setCollaboratorInput("");
  };

  // 프로젝트 변경 시 업무 초기화
  const handleProjectChange = (project_id: string) => {
    setFormData(prev => ({
      ...prev,
      project_id,
      task_id: "" // 프로젝트 변경 시 업무 선택 초기화
    }));
  };

  // 파일 업로드
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...Array.from(files)]
      }));
      e.target.value = ''; // 같은 파일 재선택 가능하도록
    }
  };

  // 파일 제거
  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  // 협업자 추가
  const addCollaborator = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      collaborators: [...prev.collaborators, userId]
    }));
    setCollaboratorInput("");
  };

  // 협업자 제거
  const removeCollaborator = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(id => id !== userId)
    }));
  };

  // 협업자 입력 키 처리
  const handleCollaboratorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredUsers.length > 0) {
      e.preventDefault();
      addCollaborator(filteredUsers[0].id);
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id || !formData.task_id || !formData.content.trim()) {
      alert("프로젝트, 업무, 내용을 모두 입력해주세요.");
      return;
    }

    if (!currentUser) {
      alert("사용자 정보가 없습니다.");
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        author_id: currentUser.id,
        author_name: currentUser.name
      };

      // AppContext의 createWorkJournal 함수 사용
      await onCreate(dataToSubmit);
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("업무 일지 등록 실패:", error);
      alert("업무 일지 등록에 실패했습니다.");
    }
  };

  // 모달 열림/닫힘 처리
  useEffect(() => {
    if (open) {
      resetForm();
      loadTaskPhases(); // 모달이 열릴 때 업무 단계 로드
    }
  }, [open]);

  const getStatusText = (status: JournalStatus) => {
    switch (status) {
      case "not-started": return "시작전";
      case "in-progress": return "진행중";
      case "delayed": return "연기";
      case "completed": return "완료";
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            업무 일지 작성
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 프로젝트 선택 */}
          <div className="space-y-2">
            <Label htmlFor="project">프로젝트 *</Label>
            <Select value={formData.project_id} onValueChange={handleProjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="프로젝트를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 업무 선택 */}
          <div className="space-y-2">
            <Label htmlFor="task">관련 업무 *</Label>
            <Select 
              value={formData.task_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, task_id: value }))}
              disabled={!formData.project_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="업무를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {filteredTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    <div className="flex items-center gap-2">
                      <span 
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ 
                          backgroundColor: taskPhases.find(p => p.id === task.taskPhase)?.color || '#6b7280' 
                        }}
                      />
                      {getTaskDisplayText(task)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 작성일 (자동) */}
          <div className="space-y-2">
            <Label>작성일</Label>
            <Input 
              value={format(new Date(), "yyyy-MM-dd")} 
              disabled 
              className="bg-gray-50"
            />
          </div>

          {/* 업무 내용 */}
          <div className="space-y-2">
            <Label htmlFor="content">업무 내용 *</Label>
            <RichTextEditor
              value={formData.content}
              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              placeholder="오늘 수행한 업무 내용을 상세히 작성해주세요..."
              height={250}
            />
          </div>

          {/* 파일 업로드 */}
          <div className="space-y-2">
            <Label>파일 및 미디어</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label 
                htmlFor="file-upload" 
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">파일을 선택하거나 드래그하여 업로드</span>
                <span className="text-xs text-gray-400 mt-1">
                  이미지, 동영상, 문서 파일 지원
                </span>
              </label>
            </div>
            
            {/* 업로드된 파일 목록 */}
            {formData.files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">업로드된 파일 ({formData.files.length})</p>
                <div className="space-y-1">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 상태 선택 */}
          <div className="space-y-2">
            <Label htmlFor="status">상태</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as JournalStatus }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-started">시작전</SelectItem>
                <SelectItem value="in-progress">진행중</SelectItem>
                <SelectItem value="delayed">연기</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 작성인 (자동) */}
          <div className="space-y-2">
            <Label>작성인</Label>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <User className="w-4 h-4" />
              <span>{currentUser?.name || "사용자 로딩 중..."}</span>
              {!currentUser && (
                <span className="text-xs text-red-500 ml-2">
                  (사용자 정보 로딩 중)
                </span>
              )}
            </div>
          </div>

          {/* 협업인원 */}
          <div className="space-y-2">
            <Label htmlFor="collaborators">협업인원</Label>
            <div className="relative">
              <Input
                value={collaboratorInput}
                onChange={(e) => setCollaboratorInput(e.target.value)}
                onKeyDown={handleCollaboratorKeyDown}
                placeholder="@사용자명으로 협업인원을 태그하세요"
                className="pr-8"
              />
              <AtSign className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              
              {/* 사용자 제안 목록 */}
              {collaboratorInput.startsWith("@") && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => addCollaborator(user.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-gray-500">
                              {user.email} • {user.department} • {user.type === 'manager' ? '관리자' : '사용자'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : collaboratorInput.length > 1 ? (
                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                      검색 결과가 없습니다
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                      사용자명 또는 이메일을 입력하세요
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 선택된 협업인원 */}
            {formData.collaborators.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">협업인원 ({formData.collaborators.length})</p>
                <div className="flex flex-wrap gap-2">
                  {formData.collaborators.map((userId) => {
                    const user = allUsers.find(u => u.id === userId);
                    return user ? (
                      <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {user.name}
                        <span className="text-xs opacity-75">({user.type === 'manager' ? '관리자' : '사용자'})</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => removeCollaborator(userId)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit">
              업무 일지 등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
