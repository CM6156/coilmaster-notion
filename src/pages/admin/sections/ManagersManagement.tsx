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

interface Manager {
  id: string;
  name: string;
  email: string;
  corporation_id: string;
  position_id: string;
  created_at: string;
}

interface Corporation {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
}

const ManagersManagement = () => {
  const { toast } = useToast();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    corporation_id: '',
    position_id: '',
  });

  useEffect(() => {
    fetchManagers();
    fetchCorporations();
    fetchPositions();
  }, []);

  const fetchManagers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('managers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setManagers(data || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast({
        title: "에러",
        description: "담당자 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 실시간 데이터 구독 설정
  useEffect(() => {
    const subscription = supabase
      .channel('managers_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'managers'
      }, () => {
        fetchManagers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
        .from('managers')
        .insert([{
          name: formData.name,
          email: formData.email,
          corporation_id: formData.corporation_id,
          position_id: formData.position_id,
        }])
        .select();

      if (error) throw error;

      toast({
        title: "성공",
        description: "담당자가 성공적으로 등록되었습니다.",
      });

      setIsModalOpen(false);
      fetchManagers();
      setFormData({
        name: '',
        email: '',
        corporation_id: '',
        position_id: '',
      });
    } catch (error) {
      console.error('Error creating manager:', error);
      toast({
        title: "에러",
        description: "담당자 등록에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-white">담당자 관리</h2>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-purple-600 hover:bg-purple-50"
        >
          새 담당자 등록
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-purple-50">
              <TableHead className="text-purple-600">이름</TableHead>
              <TableHead className="text-purple-600">이메일</TableHead>
              <TableHead className="text-purple-600">법인</TableHead>
              <TableHead className="text-purple-600">직책</TableHead>
              <TableHead className="text-purple-600">등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managers.map((manager) => (
              <TableRow key={manager.id} className="hover:bg-purple-50 transition-colors">
                <TableCell className="font-medium">{manager.name}</TableCell>
                <TableCell>{manager.email}</TableCell>
                <TableCell>
                  {corporations.find(c => c.id === manager.corporation_id)?.name}
                </TableCell>
                <TableCell>
                  {positions.find(p => p.id === manager.position_id)?.name}
                </TableCell>
                <TableCell>
                  {new Date(manager.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 담당자 등록</DialogTitle>
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

export default ManagersManagement; 