
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, File, Link as LinkIcon, User, Upload } from "lucide-react";
import { useAppContext } from '@/context/AppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type JournalFormData = {
  title: string;
  content: string;
  taskId?: string;
  assignedTo?: string;
  collaborators?: string[];
  fileUrls?: string[];
  files?: File[];
  linkUrls?: string[];
};

interface JournalFormDialogProps {
  onSubmit: (journalData: JournalFormData) => void;
}

export default function JournalFormDialog({ onSubmit }: JournalFormDialogProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { tasks, users } = useAppContext();
  
  const [formData, setFormData] = useState<JournalFormData>({
    title: "",
    content: "",
    taskId: "",
    collaborators: [],
    fileUrls: [],
    files: [],
    linkUrls: []
  });
  
  const [fileUrl, setFileUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  // Update task assignment when task is selected
  useEffect(() => {
    if (formData.taskId) {
      const selectedTask = tasks.find(task => task.id === formData.taskId);
      if (selectedTask && selectedTask.assignedTo) {
        setFormData(prev => ({
          ...prev,
          assignedTo: selectedTask.assignedTo
        }));
      }
    }
  }, [formData.taskId, tasks]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value
    });
  };
  
  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Add to files array
      setFormData(prev => ({
        ...prev,
        files: [...(prev.files || []), ...Array.from(files)]
      }));
      
      // Reset the input value so the same file can be selected again if needed
      e.target.value = '';
    }
  };
  
  // Remove uploaded file
  const removeFile = (index: number) => {
    if (formData.files) {
      const newFiles = [...formData.files];
      newFiles.splice(index, 1);
      setFormData({
        ...formData,
        files: newFiles
      });
    }
  };
  
  // Add file URL to list
  const addFileUrl = () => {
    if (fileUrl.trim() && formData.fileUrls) {
      setFormData({
        ...formData,
        fileUrls: [...formData.fileUrls, fileUrl]
      });
      setFileUrl("");
    }
  };
  
  // Add link URL to list
  const addLinkUrl = () => {
    if (linkUrl.trim() && formData.linkUrls) {
      setFormData({
        ...formData,
        linkUrls: [...formData.linkUrls, linkUrl]
      });
      setLinkUrl("");
    }
  };
  
  // Add collaborator
  const addCollaborator = () => {
    if (selectedUser && formData.collaborators && !formData.collaborators.includes(selectedUser)) {
      setFormData({
        ...formData,
        collaborators: [...formData.collaborators, selectedUser]
      });
      setSelectedUser("");
    }
  };
  
  // Remove file URL
  const removeFileUrl = (index: number) => {
    if (formData.fileUrls) {
      const newFileUrls = [...formData.fileUrls];
      newFileUrls.splice(index, 1);
      setFormData({
        ...formData,
        fileUrls: newFileUrls
      });
    }
  };
  
  // Remove link URL
  const removeLinkUrl = (index: number) => {
    if (formData.linkUrls) {
      const newLinkUrls = [...formData.linkUrls];
      newLinkUrls.splice(index, 1);
      setFormData({
        ...formData,
        linkUrls: newLinkUrls
      });
    }
  };
  
  // Remove collaborator
  const removeCollaborator = (userId: string) => {
    if (formData.collaborators) {
      setFormData({
        ...formData,
        collaborators: formData.collaborators.filter(id => id !== userId)
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ 
      title: "", 
      content: "",
      taskId: "",
      collaborators: [],
      fileUrls: [],
      files: [],
      linkUrls: []
    });
    setShowDialog(false);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 새 업무일지 작성
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>업무일지 작성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="taskId">관련 업무</Label>
              <Select 
                value={formData.taskId} 
                onValueChange={(value) => setFormData({...formData, taskId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="관련 업무 선택" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="title">제목</Label>
              <Input 
                id="title" 
                placeholder="업무일지 제목" 
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">내용</Label>
              <Textarea 
                id="content" 
                placeholder="오늘 진행한 업무 내용을 작성하세요" 
                rows={6}
                value={formData.content}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label>파일 업로드</Label>
              <div className="flex flex-col gap-2">
                <label 
                  htmlFor="file-upload" 
                  className="flex items-center gap-2 cursor-pointer p-2 border border-dashed border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>컴퓨터에서 파일 선택</span>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                
                {formData.files && formData.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-1 bg-muted p-2 rounded">
                        <File className="h-4 w-4" />
                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        <Badge variant="secondary" className="text-xs">{(file.size / 1024).toFixed(1)}KB</Badge>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 p-0"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>파일 첨부 (URL)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="파일 URL 입력"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
                <Button type="button" size="icon" onClick={addFileUrl}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.fileUrls && formData.fileUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.fileUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted p-2 rounded">
                      <File className="h-4 w-4" />
                      <span className="text-sm truncate max-w-[200px]">{url}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 p-0"
                        onClick={() => removeFileUrl(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label>링크 첨부</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="링크 URL 입력"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <Button type="button" size="icon" onClick={addLinkUrl}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.linkUrls && formData.linkUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.linkUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted p-2 rounded">
                      <LinkIcon className="h-4 w-4" />
                      <span className="text-sm truncate max-w-[200px]">{url}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 p-0"
                        onClick={() => removeLinkUrl(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label>협업 인원</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedUser}
                  onValueChange={setSelectedUser}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="협업 인원 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addCollaborator} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.collaborators && formData.collaborators.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.collaborators.map((userId) => {
                    const user = users.find(u => u.id === userId);
                    return (
                      <Badge key={userId} variant="secondary" className="flex items-center gap-1 py-1.5">
                        <User className="h-3 w-3" />
                        <span>{user?.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removeCollaborator(userId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
              취소
            </Button>
            <Button type="submit">등록</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
