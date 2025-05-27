import { useState } from "react";
import { Site } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const siteFormSchema = z.object({
  name: z.string().min(2, "사이트명은 2자 이상이어야 합니다."),
  url: z.string().url("유효한 URL을 입력하세요."),
  description: z.string().optional(),
});

export const SiteManagement = () => {
  const { translations } = useLanguage();
  const t = translations.admin;
  const g = translations.global;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [sites, setSites] = useState<Site[]>([
    { 
      id: '1', 
      name: '메인 사이트', 
      url: 'https://www.example.com', 
      description: '회사 메인 웹사이트',
      isActive: true,
      createdAt: new Date().toISOString()
    },
  ]);

  const form = useForm<z.infer<typeof siteFormSchema>>({
    resolver: zodResolver(siteFormSchema),
  });

  const handleEdit = (site: Site) => {
    setSelectedSite(site);
    form.reset({
      name: site.name,
      url: site.url,
      description: site.description || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (site: Site) => {
    setSelectedSite(site);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSite) {
      // 실제 환경에서는 API 호출이 필요합니다
      setSites(prev => prev.filter(s => s.id !== selectedSite.id));
      toast.success("사이트가 삭제되었습니다.");
      setIsDeleteModalOpen(false);
      setSelectedSite(null);
    }
  };

  const onSubmit = (values: z.infer<typeof siteFormSchema>) => {
    if (selectedSite) {
      // 수정
      setSites(prev =>
        prev.map(site =>
          site.id === selectedSite.id
            ? { ...site, ...values }
            : site
        )
      );
      toast.success("사이트 정보가 수정되었습니다.");
    } else {
      // 새로 추가
      const newSite: Site = {
        id: Date.now().toString(),
        name: values.name,
        url: values.url,
        description: values.description,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      setSites(prev => [...prev, newSite]);
      toast.success("새로운 사이트가 추가되었습니다.");
    }
    setIsModalOpen(false);
    setSelectedSite(null);
    form.reset();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t?.siteManagement || "사이트 관리"}</h2>
        <Button onClick={() => {
          setSelectedSite(null);
          form.reset();
          setIsModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          {t?.addSite || "사이트 추가"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>사이트명</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>설명</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>{g?.actions || "작업"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.map((site) => (
            <TableRow key={site.id}>
              <TableCell>{site.name}</TableCell>
              <TableCell>{site.url}</TableCell>
              <TableCell>{site.description}</TableCell>
              <TableCell>
                <Badge variant={site.isActive ? 'default' : 'secondary'}>
                  {site.isActive ? "활성" : "비활성"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title={g?.edit || "수정"}
                    onClick={() => handleEdit(site)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title={g?.delete || "삭제"}
                    onClick={() => handleDelete(site)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 수정/추가 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSite ? (t?.editSite || "사이트 수정") : (t?.addSite || "사이트 추가")}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>사이트명</FormLabel>
                    <FormControl>
                      <Input placeholder="메인 사이트" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Input placeholder="사이트 설명..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">
                  {selectedSite ? (g?.save || "저장") : (t?.addSite || "추가")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 모달 */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t?.deleteSite || "사이트 삭제"}</DialogTitle>
            <DialogDescription>
              {selectedSite?.name} 사이트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              {g?.cancel || "취소"}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {g?.delete || "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 