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

interface User {
  id: string;
  name: string;
  email: string;
  department_id: string;
  corporation_id: string;
  position_id: string;
  country: string;
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

const UsersManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department_id: '',
    corporation_id: '',
    position_id: '',
    country: '',
  });

  // 데이터 로드
  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchCorporations();
    fetchPositions();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "에러",
        description: "사용자 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  // 실시간 데이터 구독 설정
  useEffect(() => {
    const subscription = supabase
      .channel('users_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: formData.name,
          email: formData.email,
          password_hash: formData.password, // 실제로는 비밀번호 해싱 필요
          department_id: formData.department_id,
          corporation_id: formData.corporation_id,
          position_id: formData.position_id,
          country: formData.country,
        }])
        .select();

      if (error) throw error;

      toast({
        title: "성공",
        description: "사용자가 성공적으로 등록되었습니다.",
      });

      setIsModalOpen(false);
      fetchUsers();
      setFormData({
        name: '',
        email: '',
        password: '',
        department_id: '',
        corporation_id: '',
        position_id: '',
        country: '',
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "에러",
        description: "사용자 등록에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-white">사용자 관리</h2>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-blue-600 hover:bg-blue-50"
        >
          새 사용자 등록
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-50">
              <TableHead className="text-blue-600">이름</TableHead>
              <TableHead className="text-blue-600">이메일</TableHead>
              <TableHead className="text-blue-600">부서</TableHead>
              <TableHead className="text-blue-600">법인</TableHead>
              <TableHead className="text-blue-600">직책</TableHead>
              <TableHead className="text-blue-600">국가</TableHead>
              <TableHead className="text-blue-600">등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-blue-50 transition-colors">
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {departments.find(d => d.id === user.department_id)?.name}
                </TableCell>
                <TableCell>
                  {corporations.find(c => c.id === user.corporation_id)?.name}
                </TableCell>
                <TableCell>
                  {positions.find(p => p.id === user.position_id)?.name}
                </TableCell>
                <TableCell>{user.country}</TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 사용자 등록</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
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

            <div className="space-y-2">
              <Label htmlFor="country">국가</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
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

export default UsersManagement; 