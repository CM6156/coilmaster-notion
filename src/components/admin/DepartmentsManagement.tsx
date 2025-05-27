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
import { Department } from "@/types";
import { useAppContext } from "@/context/AppContext";
import CreateDepartmentDialog from "./dialogs/CreateDepartmentDialog";

export default function DepartmentsManagement() {
  const { departments } = useAppContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">부서 관리</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          새 부서 등록
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>부서명</TableHead>
              <TableHead>부서코드</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell>{department.name}</TableCell>
                <TableCell>{department.code}</TableCell>
                <TableCell>{department.description}</TableCell>
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

      <CreateDepartmentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
} 