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
import { useAppContext } from "@/context/AppContext";
import { CreatePositionInput } from "@/types";
import { toast } from "@/hooks/use-toast";

interface CreatePositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreatePositionDialog({
  open,
  onOpenChange,
}: CreatePositionDialogProps) {
  const { createPosition } = useAppContext();
  const [formData, setFormData] = useState<CreatePositionInput>({
    name: "",
    code: "",
    level: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createPosition(formData);
      toast({
        title: "직책 생성 완료",
        description: "새 직책이 성공적으로 등록되었습니다.",
      });
      onOpenChange(false);
      setFormData({
        name: "",
        code: "",
        level: 1,
      });
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "직책 생성 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>새 직책 등록</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">직책명</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="직책명을 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="code">직책코드</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="직책코드를 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="level">레벨</Label>
              <Input
                id="level"
                type="number"
                min={1}
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: parseInt(e.target.value) })
                }
                placeholder="레벨을 입력하세요"
                required
              />
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