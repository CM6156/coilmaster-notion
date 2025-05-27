import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { CreateManagerInput } from "@/types";
import { toast } from "@/hooks/use-toast";

interface CreateManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateManagerDialog({
  open,
  onOpenChange,
}: CreateManagerDialogProps) {
  const { departments, positions, createManager } = useAppContext();
  const [formData, setFormData] = useState<any>({
    name: "",
    email: "",
    department: { id: "", name: "" },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createManager(formData);
      toast({
        title: "담당자 생성 완료",
        description: "새 담당자가 성공적으로 등록되었습니다.",
      });
      onOpenChange(false);
      setFormData({
        name: "",
        email: "",
        department: { id: "", name: "" },
      });
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "담당자 생성 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>새 담당자 등록</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="이름을 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="이메일을 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="department">부서</Label>
              <Select
                value={formData.department.id}
                onValueChange={(value) => {
                  const selectedDept = departments.find(d => d.id === value);
                  setFormData({ 
                    ...formData, 
                    department: { 
                      id: value, 
                      name: selectedDept?.name || "" 
                    } 
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="position">직책</Label>
              <Select
                value={formData.positionId}
                onValueChange={(value) =>
                  setFormData({ ...formData, positionId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="직책 선택" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit">등록</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 