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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Employee {
  id: string;
  employee_number: string;
  name: string;
  english_name: string;
  corporation_id: string;
  department_id: string;
  position_id: string;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
}

interface Corporation {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
}

const EmployeesManagement = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_number: '',
    name: '',
    english_name: '',
    corporation_id: '',
    department_id: '',
    position_id: '',
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchCorporations();
    fetchPositions();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "에러",
        description: "직원 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 실시간 데이터 구독 설정
  useEffect(() => {
    const subscription = supabase
      .channel('employees_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employees'
      }, () => {
        fetchEmployees();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    if (!error) setDepartments(data || []);
  };

  const fetchCorporations = async () => {
    const { data, error } = await supabase
      .from('corporations')
      .select('*')
      .order('name');
    if (!error) setCorporations(data || []);
  };

  const fetchPositions = async () => {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .order('name');
    if (!error) setPositions(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          employee_number: formData.employee_number,
          name: formData.name,
          english_name: formData.english_name,
          corporation_id: formData.corporation_id,
          department_id: formData.department_id,
          position_id: formData.position_id,
        }])
        .select();

      if (error) throw error;

      toast({
        title: "성공",
        description: "직원이 성공적으로 등록되었습니다.",
      });

      setIsModalOpen(false);
      fetchEmployees();
      setFormData({
        employee_number: '',
        name: '',
        english_name: '',
        corporation_id: '',
        department_id: '',
        position_id: '',
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      toast({
        title: "에러",
        description: "직원 등록에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-white">직원 관리</h2>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-green-600 hover:bg-green-50"
        >
          새 직원 등록
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-green-50">
              <TableHead className="text-green-600">사원번호</TableHead>
              <TableHead className="text-green-600">이름</TableHead>
              <TableHead className="text-green-600">영문 이름</TableHead>
              <TableHead className="text-green-600">법인</TableHead>
              <TableHead className="text-green-600">부서</TableHead>
              <TableHead className="text-green-600">직책</TableHead>
              <TableHead className="text-green-600">등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id} className="hover:bg-green-50 transition-colors">
                <TableCell>{employee.employee_number}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.english_name}</TableCell>
                <TableCell>
                  {corporations.find(c => c.id === employee.corporation_id)?.name}
                </TableCell>
                <TableCell>
                  {departments.find(d => d.id === employee.department_id)?.name}
                </TableCell>
                <TableCell>
                  {positions.find(p => p.id === employee.position_id)?.name}
                </TableCell>
                <TableCell>
                  {new Date(employee.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 직원 등록</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee_number">사원번호</Label>
              <Input
                id="employee_number"
                value={formData.employee_number}
                onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="english_name">영문 이름</Label>
              <Input
                id="english_name"
                value={formData.english_name}
                onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="corporation">법인</Label>
              <Select
                value={formData.corporation_id}
                onValueChange={(value) => setFormData({ ...formData, corporation_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="법인 선택" />
                </SelectTrigger>
                <SelectContent>
                  {corporations.map((corporation) => (
                    <SelectItem key={corporation.id} value={corporation.id}>
                      {corporation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">부서</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
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

            <div className="space-y-2">
              <Label htmlFor="position">직책</Label>
              <Select
                value={formData.position_id}
                onValueChange={(value) => setFormData({ ...formData, position_id: value })}
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "처리중..." : "등록"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesManagement; 