import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2, Plus } from "lucide-react";
import { CompetitorInfo } from "@/types";

const CompetitorManagement = () => {
  const { toast } = useToast();
  const [competitors, setCompetitors] = useState<CompetitorInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorInfo | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    product: "",
    price: "",
    marketShare: "",
    strengths: "",
    weaknesses: "",
  });

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    try {
      const { data, error } = await supabase
        .from("competitors")
        .select("*")
        .order("name");

      if (error) throw error;
      setCompetitors(data || []);
    } catch (error) {
      console.error("Error fetching competitors:", error);
      toast({
        title: "에러",
        description: "경쟁사 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const competitorData = {
        name: formData.name,
        country: formData.country,
        product: formData.product,
        price: formData.price ? parseFloat(formData.price) : null,
        market_share: formData.marketShare ? parseFloat(formData.marketShare) : null,
        strengths: formData.strengths.split(",").map(s => s.trim()),
        weaknesses: formData.weaknesses.split(",").map(s => s.trim()),
      };

      if (isEditMode && selectedCompetitor) {
        const { error } = await supabase
          .from("competitors")
          .update(competitorData)
          .eq("id", selectedCompetitor.id);

        if (error) throw error;

        toast({
          title: "성공",
          description: "경쟁사 정보가 수정되었습니다.",
        });
      } else {
        const { error } = await supabase
          .from("competitors")
          .insert([competitorData]);

        if (error) throw error;

        toast({
          title: "성공",
          description: "새로운 경쟁사가 등록되었습니다.",
        });
      }

      setIsModalOpen(false);
      resetForm();
      fetchCompetitors();
    } catch (error) {
      console.error("Error saving competitor:", error);
      toast({
        title: "에러",
        description: "경쟁사 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (competitor: CompetitorInfo) => {
    setSelectedCompetitor(competitor);
    setFormData({
      name: competitor.name,
      country: competitor.country,
      product: competitor.product,
      price: competitor.price?.toString() || "",
      marketShare: competitor.marketShare?.toString() || "",
      strengths: competitor.strengths?.join(", ") || "",
      weaknesses: competitor.weaknesses?.join(", ") || "",
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("competitors")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "경쟁사가 삭제되었습니다.",
      });

      fetchCompetitors();
    } catch (error) {
      console.error("Error deleting competitor:", error);
      toast({
        title: "에러",
        description: "경쟁사 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      country: "",
      product: "",
      price: "",
      marketShare: "",
      strengths: "",
      weaknesses: "",
    });
    setSelectedCompetitor(null);
    setIsEditMode(false);
  };

  const handleModalOpen = () => {
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">경쟁사 관리</h2>
        <Button onClick={handleModalOpen}>
          <Plus className="w-4 h-4 mr-2" />
          새 경쟁사 등록
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>경쟁사명</TableHead>
            <TableHead>국가</TableHead>
            <TableHead>제품</TableHead>
            <TableHead>가격</TableHead>
            <TableHead>시장 점유율</TableHead>
            <TableHead>강점</TableHead>
            <TableHead>약점</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {competitors.map((competitor) => (
            <TableRow key={competitor.id}>
              <TableCell>{competitor.name}</TableCell>
              <TableCell>{competitor.country}</TableCell>
              <TableCell>{competitor.product}</TableCell>
              <TableCell>{competitor.price ? `${competitor.price.toLocaleString()}원` : "-"}</TableCell>
              <TableCell>{competitor.marketShare ? `${competitor.marketShare}%` : "-"}</TableCell>
              <TableCell>{competitor.strengths?.join(", ")}</TableCell>
              <TableCell>{competitor.weaknesses?.join(", ")}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(competitor)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(competitor.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "경쟁사 정보 수정" : "새 경쟁사 등록"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">경쟁사명 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">국가 *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product">제품 *</Label>
                <Input
                  id="product"
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">가격</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketShare">시장 점유율 (%)</Label>
                <Input
                  id="marketShare"
                  type="number"
                  value={formData.marketShare}
                  onChange={(e) => setFormData({ ...formData, marketShare: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strengths">강점 (쉼표로 구분)</Label>
              <Input
                id="strengths"
                value={formData.strengths}
                onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                placeholder="예: 기술력, 가격경쟁력, 브랜드인지도"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weaknesses">약점 (쉼표로 구분)</Label>
              <Input
                id="weaknesses"
                value={formData.weaknesses}
                onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                placeholder="예: 납기지연, 품질문제, AS대응"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                취소
              </Button>
              <Button type="submit">
                {isEditMode ? "수정" : "등록"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompetitorManagement; 