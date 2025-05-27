
import { useState } from "react";
import { User, Department } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onUserUpdated?: () => void; // 사용자 업데이트 후 콜백 함수 추가
}

export const UserEditDialog = ({ open, onOpenChange, user, onUserUpdated }: UserEditDialogProps) => {
  const [editedUser, setEditedUser] = useState<any>({...user}); // 타입 문제 해결을 위해 any 사용
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // 사용자 정보 저장
  const handleSaveUser = async () => {
    setIsLoading(true);
    try {
      // Supabase users 테이블 구조에 맞게 데이터 변환
      const updateData: any = {
        name: editedUser.name,
        email: editedUser.email,
      };

      // 부서 ID 변환 (department 문자열을 department_id UUID로)
      if (editedUser.department) {
        // 부서 코드로 부서 ID 찾기 (실제 구현에서는 departments 테이블에서 조회)
        updateData.department_id = null; // 임시로 null 설정
      }

      // 직책 정보 (role 필드 사용)
      if (editedUser.role) {
        updateData.role = editedUser.role;
      }

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", editedUser.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: `${editedUser.name} 사용자 정보가 성공적으로 업데이트되었습니다.`,
      });
      
      // 부모 컴포넌트에 업데이트 알림
      if (onUserUpdated) {
        onUserUpdated();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "에러",
        description: "사용자 정보 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 삭제
  const handleDeleteUser = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", editedUser.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: `${editedUser.name} 사용자가 성공적으로 삭제되었습니다.`,
      });
      
      // 부모 컴포넌트에 업데이트 알림
      if (onUserUpdated) {
        onUserUpdated();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "에러",
        description: "사용자 삭제에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>사용자 정보 편집</DialogTitle>
          <DialogDescription>
            사용자 정보를 수정하거나 계정을 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              이름
            </Label>
            <Input
              id="name"
              className="col-span-3"
              value={editedUser.name}
              onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              이메일
            </Label>
            <Input
              id="email"
              className="col-span-3"
              value={editedUser.email}
              onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">
              부서
            </Label>
            <Select 
              value={editedUser.department || ""} 
              onValueChange={(value) => setEditedUser({...editedUser, department: value})}
            >
              <SelectTrigger id="department" className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">영업</SelectItem>
                <SelectItem value="development">개발</SelectItem>
                <SelectItem value="manufacturing">제조</SelectItem>
                <SelectItem value="quality">품질</SelectItem>
                <SelectItem value="management">경영</SelectItem>
                <SelectItem value="finance">구매/경리</SelectItem>
                <SelectItem value="administration">관리</SelectItem>
                <SelectItem value="engineering">엔지니어링</SelectItem>
                <SelectItem value="rnd">연구개발</SelectItem>
                <SelectItem value="production">생산</SelectItem>
                <SelectItem value="qa">QA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              직책
            </Label>
            <Input
              id="role"
              className="col-span-3"
              value={editedUser.role || ""}
              onChange={(e) => setEditedUser({...editedUser, role: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="country" className="text-right">
              국가
            </Label>
            <Select 
              value={editedUser.country || ""} 
              onValueChange={(value) => setEditedUser({...editedUser, country: value})}
            >
              <SelectTrigger id="country" className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KR">한국</SelectItem>
                <SelectItem value="TH">태국</SelectItem>
                <SelectItem value="CN">중국</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="legalEntity" className="text-right">
              법인
            </Label>
            <Select 
              value={editedUser.legalEntity || ""} 
              onValueChange={(value) => setEditedUser({...editedUser, legalEntity: value})}
            >
              <SelectTrigger id="legalEntity" className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HQ">본사 (HQ)</SelectItem>
                <SelectItem value="ZQ">조경 (ZQ)</SelectItem>
                <SelectItem value="WD">문등 (WD)</SelectItem>
                <SelectItem value="TH">태국 (TH)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="destructive" onClick={handleDeleteUser}>
            <Trash2 className="h-4 w-4 mr-1" />
            삭제
          </Button>
          <Button type="submit" onClick={handleSaveUser}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
