import { useState } from "react";
import { Position } from "@/types";
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

const positionFormSchema = z.object({
  name: z.string().min(2, "직책명은 2자 이상이어야 합니다."),
  code: z.string().min(2, "코드는 2자 이상이어야 합니다."),
  level: z.number().min(1, "레벨은 1 이상이어야 합니다."),
});

interface PositionManagementProps {
  positions: Position[];
  onPositionChange: (positions: Position[]) => void;
}

export const PositionManagement = ({ positions, onPositionChange }: PositionManagementProps) => {
  const { translations } = useLanguage();
  const t = translations.admin;
  const g = translations.global;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const form = useForm<z.infer<typeof positionFormSchema>>({
    resolver: zodResolver(positionFormSchema),
  });

  const handleEdit = (position: Position) => {
    setSelectedPosition(position);
    form.reset({
      name: position.name,
      code: position.code,
      level: position.level,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (position: Position) => {
    setSelectedPosition(position);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPosition) {
      // 실제 환경에서는 API 호출이 필요합니다
      const updatedPositions = positions.filter(p => p.id !== selectedPosition.id);
      onPositionChange(updatedPositions);
      toast.success("직책이 삭제되었습니다.");
      setIsDeleteModalOpen(false);
      setSelectedPosition(null);
    }
  };

  const onSubmit = (values: z.infer<typeof positionFormSchema>) => {
    if (selectedPosition) {
      // 수정
      const updatedPositions = positions.map(position =>
        position.id === selectedPosition.id
          ? { 
              ...position, 
              ...values,
              updatedAt: new Date().toISOString()
            }
          : position
      );
      onPositionChange(updatedPositions);
      toast.success("직책 정보가 수정되었습니다.");
    } else {
      // 새로 추가
      const newPosition: Position = {
        id: Date.now().toString(),
        name: values.name,
        code: values.code,
        level: values.level,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      onPositionChange([...positions, newPosition]);
      toast.success("새로운 직책이 추가되었습니다.");
    }
    setIsModalOpen(false);
    setSelectedPosition(null);
    form.reset();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t?.positions || "직책 관리"}</h2>
        <Button onClick={() => {
          setSelectedPosition(null);
          form.reset();
          setIsModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          {t?.addPosition || "직책 추가"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>직책명</TableHead>
            <TableHead>코드</TableHead>
            <TableHead>레벨</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>{g?.actions || "작업"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => (
            <TableRow key={position.id}>
              <TableCell>{position.name}</TableCell>
              <TableCell>{position.code}</TableCell>
              <TableCell>{position.level}</TableCell>
              <TableCell>
                <Badge variant={position.isActive ? 'default' : 'secondary'}>
                  {position.isActive ? "활성" : "비활성"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title={g?.edit || "수정"}
                    onClick={() => handleEdit(position)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title={g?.delete || "삭제"}
                    onClick={() => handleDelete(position)}
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
              {selectedPosition ? (t?.editPosition || "직책 수정") : (t?.addPosition || "직책 추가")}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>직책명</FormLabel>
                    <FormControl>
                      <Input placeholder="사원" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>코드</FormLabel>
                    <FormControl>
                      <Input placeholder="staff" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>레벨</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        placeholder="1" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">
                  {selectedPosition ? (g?.save || "저장") : (t?.addPosition || "추가")}
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
            <DialogTitle>{t?.deletePosition || "직책 삭제"}</DialogTitle>
            <DialogDescription>
              {selectedPosition?.name} 직책을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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