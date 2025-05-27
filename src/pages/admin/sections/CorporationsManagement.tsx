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
import { Badge } from "@/components/ui/badge";

interface Corporation {
  id: string;
  name: string;
  code: string;
  country: string;
  type: string;
  created_at: string;
}

const corporationTypes = [
  { value: 'factory', label: '공장' },
  { value: 'sales', label: '영업' },
  { value: 'headquarters', label: '본사' },
];

const CorporationsManagement = () => {
  const { toast } = useToast();
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    country: '',
    type: '',
  });

  useEffect(() => {
    fetchCorporations();
  }, []);

  const fetchCorporations = async () => {
    try {
      const { data, error } = await supabase
        .from('corporations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCorporations(data || []);
    } catch (error) {
      console.error('Error fetching corporations:', error);
      toast({
        title: "에러",
        description: "법인 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('corporations')
        .insert([{
          name: formData.name,
          code: formData.code,
          country: formData.country,
          type: formData.type,
        }])
        .select();

      if (error) throw error;

      toast({
        title: "성공",
        description: "법인이 성공적으로 등록되었습니다.",
      });

      setIsModalOpen(false);
      fetchCorporations();
      setFormData({
        name: '',
        code: '',
        country: '',
        type: '',
      });
    } catch (error) {
      console.error('Error creating corporation:', error);
      toast({
        title: "에러",
        description: "법인 등록에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const typeObj = corporationTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'factory':
        return 'bg-blue-500';
      case 'sales':
        return 'bg-green-500';
      case 'headquarters':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">법인 관리</h2>
        <Button onClick={() => setIsModalOpen(true)}>새 법인 등록</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>법인명</TableHead>
            <TableHead>법인코드</TableHead>
            <TableHead>국가</TableHead>
            <TableHead>구분</TableHead>
            <TableHead>등록일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {corporations.map((corporation) => (
            <TableRow key={corporation.id}>
              <TableCell className="font-medium">{corporation.name}</TableCell>
              <TableCell>{corporation.code}</TableCell>
              <TableCell>{corporation.country}</TableCell>
              <TableCell>
                <Badge className={getTypeBadgeColor(corporation.type)}>
                  {getTypeLabel(corporation.type)}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(corporation.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 법인 등록</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">법인명</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">법인코드</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
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

            <div className="space-y-2">
              <Label htmlFor="type">구분</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="구분 선택" />
                </SelectTrigger>
                <SelectContent>
                  {corporationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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

export default CorporationsManagement; 