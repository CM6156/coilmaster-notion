import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "@/types";
import { useAppContext } from "@/context/AppContext";
import CreateUserDialog from "./dialogs/CreateUserDialog";

export default function UsersManagement() {
  const { users } = useAppContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">사용자 관리</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          새 사용자 등록
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>법인</TableHead>
              <TableHead>국가</TableHead>
              <TableHead>직책</TableHead>
              <TableHead>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.department?.name}</TableCell>
                <TableCell>{user.corporation?.name}</TableCell>
                <TableCell>{user.country}</TableCell>
                <TableCell>{user.position?.name}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    수정
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    삭제
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
} 