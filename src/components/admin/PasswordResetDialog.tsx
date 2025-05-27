
import { useState } from "react";
import { User } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

export const PasswordResetDialog = ({ open, onOpenChange, user }: PasswordResetDialogProps) => {
  const [newPassword, setNewPassword] = useState("");

  // 비밀번호 재설정 저장
  const handleSaveNewPassword = () => {
    if (newPassword) {
      // 실제 애플리케이션에서는 API 호출로 저장
      console.log("비밀번호가 재설정된 사용자:", user.name, "새 비밀번호:", newPassword);
      toast.success(`${user.name} 사용자의 비밀번호가 성공적으로 재설정되었습니다.`);
      onOpenChange(false);
      setNewPassword("");
    } else {
      toast.error("비밀번호를 입력해주세요.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>비밀번호 재설정</DialogTitle>
          <DialogDescription>
            {user.name} 사용자의 비밀번호를 재설정합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-password" className="text-right">
              새 비밀번호
            </Label>
            <Input
              id="new-password"
              type="password"
              className="col-span-3"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSaveNewPassword}>
            비밀번호 변경
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
