import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2 } from "lucide-react";

interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  corporation_id?: string;
  created_at: string;
}

const DepartmentsManagement = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      console.log('부서 목록 조회 시작...');
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase 에러:', error);
        throw error;
      }
      
      console.log('조회된 부서 데이터:', data);
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "에러",
        description: "부서 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('폼 제출 시작:', { editingDepartment, formData });
      
      if (editingDepartment) {
        // 수정 - 기본 필드만 사용하고 선택적으로 추가 필드 포함
        const updateData: any = {
          name: formData.name,
        };
        
        // code와 description이 있으면 포함 (빈 문자열도 허용)
        if (formData.code !== undefined) updateData.code = formData.code;
        if (formData.description !== undefined) updateData.description = formData.description;

        console.log('부서 수정 데이터:', updateData);
        
        const { error } = await supabase
          .from('departments')
          .update(updateData)
          .eq('id', editingDepartment.id);

        if (error) {
          console.error('수정 에러:', error);
          throw error;
        }

        toast({
          title: "성공",
          description: "부서가 성공적으로 수정되었습니다.",
        });
      } else {
        // 신규 등록 - 기본 필드만 사용하고 선택적으로 추가 필드 포함
        const insertData: any = {
          name: formData.name,
        };
        
        // code와 description이 있으면 포함 (빈 문자열도 허용)
        if (formData.code !== undefined) insertData.code = formData.code;
        if (formData.description !== undefined) insertData.description = formData.description;

        const { data, error } = await supabase
          .from('departments')
          .insert([insertData])
          .select();

        if (error) throw error;

        toast({
          title: "성공",
          description: "부서가 성공적으로 등록되었습니다.",
        });
      }

      setIsModalOpen(false);
      setEditingDepartment(null);
      fetchDepartments();
      setFormData({
        name: '',
        code: '',
        description: '',
      });
    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        title: "에러",
        description: editingDepartment ? "부서 수정에 실패했습니다." : "부서 등록에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (department: Department) => {
    console.log('수정 버튼 클릭됨:', department);
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code || '',
      description: department.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (department: Department) => {
    console.log('삭제 버튼 클릭됨:', department);
    setDepartmentToDelete(department);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!departmentToDelete) return;
    
    try {
      console.log('부서 삭제 시작:', departmentToDelete.id);
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentToDelete.id);

      if (error) {
        console.error('삭제 에러:', error);
        throw error;
      }

      toast({
        title: "성공",
        description: "부서가 성공적으로 삭제되었습니다.",
      });

      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: "에러",
        description: "부서 삭제에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setDepartmentToDelete(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
    setFormData({
      name: '',
      code: '',
      description: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">부서 관리</h2>
        <Button onClick={() => setIsModalOpen(true)}>새 부서 등록</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>부서명</TableHead>
            <TableHead>부서 코드</TableHead>
            <TableHead>설명</TableHead>
            <TableHead>등록일</TableHead>
            <TableHead>관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((department) => (
            <TableRow key={department.id}>
              <TableCell className="font-medium">{department.name}</TableCell>
              <TableCell>{department.code}</TableCell>
              <TableCell className="max-w-md truncate">
                {department.description}
              </TableCell>
              <TableCell>
                {new Date(department.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(department)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(department)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    삭제
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingDepartment ? '부서 수정' : '새 부서 등록'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">부서명</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">부서 코드 (선택사항)</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="예: DEV, MGT, SALES"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">부서 설명 (선택사항)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="부서에 대한 설명을 입력하세요"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleModalClose}>
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "처리중..." : (editingDepartment ? "수정" : "등록")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>부서 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              "{departmentToDelete?.name}" 부서를 정말 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DepartmentsManagement; 