'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/context/LanguageContext";
import { useAppContext } from "@/context/AppContext";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Move, 
  Loader2, 
  Palette,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  ListTodo,
  Zap,
  Briefcase,
  Flag
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Status } from "@/context/AppContext";

// 아이콘 매핑
const iconMap = {
  // Project
  planning: Clock,
  inProgress: AlertCircle,
  completed: CheckCircle2,
  onHold: Move,
  // Task
  todo: ListTodo,
  doing: AlertCircle,
  reviewing: Target,
  done: CheckCircle2,
  // Priority
  low: Flag,
  normal: Briefcase,
  high: Zap,
  urgent: AlertCircle
};

const StatusManagement = () => {
  const { translations } = useLanguage();
  const { 
    statuses, 
    createStatus, 
    updateStatus, 
    deleteStatus,
    getProjectStatuses,
    getTaskStatuses,
    getPriorityStatuses 
  } = useAppContext();
  
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [currentTab, setCurrentTab] = useState<'project' | 'task' | 'priority'>('project');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    is_active: true
  });

  const colors = [
    { value: '#ef4444', label: 'Red', name: '빨강' },
    { value: '#f59e0b', label: 'Orange', name: '주황' },
    { value: '#eab308', label: 'Yellow', name: '노랑' },
    { value: '#10b981', label: 'Green', name: '초록' },
    { value: '#06b6d4', label: 'Cyan', name: '청록' },
    { value: '#3b82f6', label: 'Blue', name: '파랑' },
    { value: '#8b5cf6', label: 'Purple', name: '보라' },
    { value: '#ec4899', label: 'Pink', name: '분홍' },
    { value: '#6b7280', label: 'Gray', name: '회색' },
  ];

  const getFilteredStatuses = (type: 'project' | 'task' | 'priority') => {
    switch(type) {
      case 'project':
        return getProjectStatuses();
      case 'task':
        return getTaskStatuses();
      case 'priority':
        return getPriorityStatuses();
      default:
        return [];
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(translations.global?.enterStatusName || "Please enter status name");
      return;
    }

    try {
      setLoading(true);
      
      if (editingStatus) {
        // 수정
        await updateStatus(editingStatus.id, {
          name: formData.name,
          description: formData.description,
          color: formData.color,
          is_active: formData.is_active,
        });
        toast.success(translations.global?.statusUpdatedSuccess || "Status updated successfully");
      } else {
        // 추가
        const filteredStatuses = getFilteredStatuses(currentTab);
        const maxOrder = filteredStatuses.length > 0 ? Math.max(...filteredStatuses.map(s => s.order_index)) : 0;

        await createStatus({
          name: formData.name,
          description: formData.description,
          color: formData.color,
          order_index: maxOrder + 1,
          is_active: formData.is_active,
          status_type_id: currentTab === 'project' ? '1' : currentTab === 'task' ? '2' : '3',
          status_type: currentTab,
        });
        toast.success(translations.global?.statusAddedSuccess || "Status added successfully");
      }

      resetForm();
    } catch (error) {
      console.error('Error saving status:', error);
      toast.error(translations.global?.error || "Error saving status");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (status: Status) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      description: status.description,
      color: status.color,
      is_active: status.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(translations.global?.confirmDeleteStatus || "Are you sure you want to delete this status?")) {
      try {
        setLoading(true);
        await deleteStatus(id);
        toast.success(translations.global?.statusDeletedSuccess || "Status deleted successfully");
      } catch (error) {
        console.error('Error deleting status:', error);
        toast.error(translations.global?.error || "Error deleting status");
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      is_active: true
    });
    setEditingStatus(null);
    setIsDialogOpen(false);
  };

  const StatusCard = ({ status }: { status: Status }) => {
    const Icon = AlertCircle;
    
    // 번역된 이름과 설명 가져오기
    const translatedName = status.translationKey && translations.global?.[status.translationKey] 
      ? translations.global[status.translationKey] 
      : status.name;
    
    const translatedDescription = status.descriptionKey && translations.global?.[status.descriptionKey]
      ? translations.global[status.descriptionKey]
      : status.description;
    
    return (
      <Card className={cn(
        "relative overflow-hidden transition-all duration-200 hover:shadow-lg",
        !status.is_active && "opacity-60"
      )}>
        <div 
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: status.color }}
        />
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="p-2 rounded-lg"
                  style={{ 
                    backgroundColor: `${status.color}20`,
                    color: status.color 
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">{translatedName}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {translatedDescription}
              </p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={status.is_active ? "default" : "secondary"}
                  className="text-xs"
                >
                  {status.is_active 
                    ? translations.global?.statusActive || "Active"
                    : translations.global?.statusInactive || "Inactive"
                  }
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {translations.global?.statusOrder || "Order"}: {status.order_index}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(status)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(status.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const StatusGrid = ({ type }: { type: 'project' | 'task' | 'priority' }) => {
    const filteredStatuses = getFilteredStatuses(type);

    if (loading) {
      return (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">{translations.global?.loading || "Loading..."}</span>
        </div>
      );
    }

    if (filteredStatuses.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {translations.global?.noDataAvailable || "No data available"}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStatuses.map((status) => (
          <StatusCard key={status.id} status={status} />
        ))}
      </div>
    );
  };

  const StatusDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingStatus 
              ? translations.global?.editStatus || "Edit Status"
              : translations.global?.addNewStatus || "Add New Status"
            }
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{translations.global?.statusName || "Status Name"}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={translations.global?.enterStatusName || "Enter status name"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{translations.global?.statusDescription || "Description"}</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={translations.global?.enterStatusDescription || "Enter status description"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">{translations.global?.statusColor || "Status Color"}</Label>
            <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={translations.global?.selectStatusColor || "Select status color"}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: formData.color }}
                    />
                    <span>{colors.find(c => c.value === formData.color)?.label}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {colors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: color.value }}
                      />
                      <span>{color.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="active">{translations.global?.statusActive || "Active"}</Label>
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetForm}>
            {translations.global?.cancel || "Cancel"}
          </Button>
          <Button onClick={handleSubmit}>
            {editingStatus 
              ? translations.global?.save || "Save"
              : translations.global?.add || "Add"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const tabIcons = {
    project: Briefcase,
    task: ListTodo,
    priority: Flag
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Palette className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{translations.global?.statusManagement || "Status Management"}</h2>
          <p className="text-muted-foreground">
            {translations.global?.manageProjectStatuses || "Manage project, task, and priority statuses"}
          </p>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'project' | 'task' | 'priority')}>
        <TabsList className="grid w-full grid-cols-3 h-14">
          {['project', 'task', 'priority'].map((tab) => {
            const Icon = tabIcons[tab as keyof typeof tabIcons];
            const count = getFilteredStatuses(tab as 'project' | 'task' | 'priority').length;
            
            return (
              <TabsTrigger 
                key={tab}
                value={tab} 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                <span>
                  {tab === 'project' && (translations.global?.projectStatusManagement || "Project Status")}
                  {tab === 'task' && (translations.global?.taskStatusManagement || "Task Status")}
                  {tab === 'priority' && (translations.global?.priorityManagement || "Priority")}
                </span>
                <Badge
                  variant="secondary" 
                  className="ml-1 h-5 px-1.5 text-xs"
                >
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {['project', 'task', 'priority'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4 mt-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {type === 'project' && (translations.global?.projectStatus || "Project Status")}
                      {type === 'task' && (translations.global?.taskStatus || "Task Status")}
                      {type === 'priority' && (translations.global?.priorityLevel || "Priority Level")}
                    </CardTitle>
                    <CardDescription>
                      {type === 'project' && (translations.global?.manageProjectStatuses || "Manage project statuses")}
                      {type === 'task' && (translations.global?.manageTaskStatuses || "Manage task statuses")}
                      {type === 'priority' && (translations.global?.managePriorities || "Manage priorities")}
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => { 
                      setCurrentTab(type as 'project' | 'task' | 'priority'); 
                      setIsDialogOpen(true); 
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {translations.global?.addNewStatus || "Add New Status"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <StatusGrid type={type as 'project' | 'task' | 'priority'} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <StatusDialog />
    </div>
  );
}; 

export default StatusManagement; 