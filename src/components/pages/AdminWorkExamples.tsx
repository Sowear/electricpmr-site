import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useWorkExamples,
  useCreateWorkExample,
  useUpdateWorkExample,
  useDeleteWorkExample,
  uploadWorkExampleImage,
  deleteWorkExampleImage,
  WorkExample,
} from "@/hooks/useWorkExamples";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  title: string;
  description: string;
  category: string;
  city: string;
  is_published: boolean;
  display_order: number;
  before_image_url: string;
  after_image_url: string;
}

const initialFormData: FormData = {
  title: "",
  description: "",
  category: "",
  city: "",
  is_published: true,
  display_order: 0,
  before_image_url: "",
  after_image_url: "",
};

const AdminWorkExamples = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: examples, isLoading } = useWorkExamples(false);
  const createExample = useCreateWorkExample();
  const updateExample = useUpdateWorkExample();
  const deleteExample = useDeleteWorkExample();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingExample, setEditingExample] = useState<WorkExample | null>(null);
  const [exampleToDelete, setExampleToDelete] = useState<WorkExample | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string>("");
  const [afterPreview, setAfterPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roles) {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
    };

    checkAdmin();
  }, [navigate]);

  const handleFileChange = (type: "before" | "after") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Неподдерживаемый формат",
        description: "Разрешены только JPG, PNG, WebP",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Файл слишком большой",
        description: "Максимальный размер: 5 МБ",
        variant: "destructive",
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    if (type === "before") {
      setBeforeFile(file);
      setBeforePreview(preview);
    } else {
      setAfterFile(file);
      setAfterPreview(preview);
    }
  };

  const openCreateDialog = () => {
    setEditingExample(null);
    setFormData(initialFormData);
    setBeforeFile(null);
    setAfterFile(null);
    setBeforePreview("");
    setAfterPreview("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (example: WorkExample) => {
    setEditingExample(example);
    setFormData({
      title: example.title,
      description: example.description || "",
      category: example.category || "",
      city: example.city || "",
      is_published: example.is_published,
      display_order: example.display_order,
      before_image_url: example.before_image_url,
      after_image_url: example.after_image_url,
    });
    setBeforePreview(example.before_image_url);
    setAfterPreview(example.after_image_url);
    setBeforeFile(null);
    setAfterFile(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({ title: "Введите название", variant: "destructive" });
      return;
    }

    if (!editingExample && (!beforeFile || !afterFile)) {
      toast({ title: "Загрузите оба изображения", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      let beforeUrl = formData.before_image_url;
      let afterUrl = formData.after_image_url;

      // Upload new images if provided
      if (beforeFile) {
        beforeUrl = await uploadWorkExampleImage(beforeFile, "before");
      }
      if (afterFile) {
        afterUrl = await uploadWorkExampleImage(afterFile, "after");
      }

      const data = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category || null,
        city: formData.city || null,
        is_published: formData.is_published,
        display_order: formData.display_order,
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        tags: null,
      };

      if (editingExample) {
        // Delete old images if replaced
        if (beforeFile && editingExample.before_image_url !== beforeUrl) {
          await deleteWorkExampleImage(editingExample.before_image_url);
        }
        if (afterFile && editingExample.after_image_url !== afterUrl) {
          await deleteWorkExampleImage(editingExample.after_image_url);
        }

        await updateExample.mutateAsync({ id: editingExample.id, ...data });
      } else {
        await createExample.mutateAsync(data);
      }

      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!exampleToDelete) return;

    try {
      // Delete images from storage
      await deleteWorkExampleImage(exampleToDelete.before_image_url);
      await deleteWorkExampleImage(exampleToDelete.after_image_url);

      await deleteExample.mutateAsync(exampleToDelete.id);
      setIsDeleteDialogOpen(false);
      setExampleToDelete(null);
    } catch (error: any) {
      toast({
        title: "Ошибка удаления",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isAdmin === null) {
    return (
      <Layout>
        <div className="container-main py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Примеры работ</h1>
              <p className="text-muted-foreground">Управление портфолио</p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить пример
          </Button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : examples && examples.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {examples.map((example) => (
              <Card key={example.id} className="overflow-hidden">
                <div className="relative aspect-video">
                  <img
                    src={example.after_image_url}
                    alt={example.title}
                    className="w-full h-full object-cover"
                  />
                  {!example.is_published && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2 bg-black/60 text-white"
                    >
                      <EyeOff className="h-3 w-3 mr-1" />
                      Скрыт
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{example.title}</h3>
                  <div className="flex gap-2 mb-3">
                    {example.category && (
                      <Badge variant="outline" className="text-xs">
                        {example.category}
                      </Badge>
                    )}
                    {example.city && (
                      <Badge variant="outline" className="text-xs">
                        📍 {example.city}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(example)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Изменить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setExampleToDelete(example);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Нет примеров работ</h3>
            <p className="text-muted-foreground mb-4">
              Добавьте первый пример, чтобы показать клиентам ваши работы
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить пример
            </Button>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExample ? "Редактировать пример" : "Добавить пример работы"}
              </DialogTitle>
              <DialogDescription>
                Загрузите фотографии до и после выполнения работ
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Images */}
              <div className="grid grid-cols-2 gap-4">
                {/* Before */}
                <div>
                  <Label className="mb-2 block">Фото «До»</Label>
                  <div
                    className="relative aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
                    onClick={() => document.getElementById("before-input")?.click()}
                  >
                    {beforePreview ? (
                      <img
                        src={beforePreview}
                        alt="До"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                        <Upload className="h-8 w-8 mb-2" />
                        <span className="text-sm">Загрузить</span>
                      </div>
                    )}
                  </div>
                  <input
                    id="before-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange("before")}
                  />
                </div>

                {/* After */}
                <div>
                  <Label className="mb-2 block">Фото «После»</Label>
                  <div
                    className="relative aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
                    onClick={() => document.getElementById("after-input")?.click()}
                  >
                    {afterPreview ? (
                      <img
                        src={afterPreview}
                        alt="После"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                        <Upload className="h-8 w-8 mb-2" />
                        <span className="text-sm">Загрузить</span>
                      </div>
                    )}
                  </div>
                  <input
                    id="after-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange("after")}
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <Label>Название *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Например: Электромонтаж квартиры 80 м²"
                />
              </div>

              {/* Description */}
              <div>
                <Label>Описание</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Краткое описание выполненных работ"
                  rows={2}
                />
              </div>

              {/* Category and City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Категория</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Квартира, Офис, Дом..."
                  />
                </div>
                <div>
                  <Label>Город</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Тирасполь, Бендеры..."
                  />
                </div>
              </div>

              {/* Order and Published */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <Label>Порядок</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                      }
                      className="w-20"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_published: checked })
                    }
                  />
                  <Label className="cursor-pointer">
                    {formData.is_published ? (
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" /> Опубликовано
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <EyeOff className="h-4 w-4" /> Скрыто
                      </span>
                    )}
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSubmit} disabled={isUploading}>
                {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingExample ? "Сохранить" : "Добавить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить пример работы?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Пример "{exampleToDelete?.title}" и все связанные
                изображения будут удалены навсегда.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default AdminWorkExamples;
