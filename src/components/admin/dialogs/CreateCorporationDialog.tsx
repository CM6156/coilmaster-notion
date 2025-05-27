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
import { CreateCorporationInput } from "@/types";
import { toast } from "@/hooks/use-toast";

interface CreateCorporationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCorporationDialog({
  open,
  onOpenChange,
}: CreateCorporationDialogProps) {
  const { createCorporation } = useAppContext();
  const [formData, setFormData] = useState<CreateCorporationInput>({
    name: "",
    code: "",
    country: "",
    type: "headquarters",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createCorporation(formData);
      toast({
        title: "법인 생성 완료",
        description: "새 법인이 성공적으로 등록되었습니다.",
      });
      onOpenChange(false);
      setFormData({
        name: "",
        code: "",
        country: "",
        type: "headquarters",
      });
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "법인 생성 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>새 법인 등록</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">법인명</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="법인명을 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="code">법인코드</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="법인코드를 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="country">국가</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                placeholder="국가를 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">구분</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "headquarters" | "sales" | "factory") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="구분 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="headquarters">본사</SelectItem>
                  <SelectItem value="sales">영업</SelectItem>
                  <SelectItem value="factory">공장</SelectItem>
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