import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { forgeApi } from "@/lib/forge/api";
import { slugify, isValidSlug } from "@/lib/forge/slug";

export default function LabProductNewPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  async function submit() {
    if (!name.trim()) return toast.error("Укажите название");
    const finalSlug = effectiveSlug.trim();
    if (!isValidSlug(finalSlug)) {
      return toast.error("Slug должен быть латиницей: a-z, 0-9, дефис");
    }
    setLoading(true);
    try {
      const product = await forgeApi.products.create({
        slug: finalSlug,
        name: name.trim(),
        description: description.trim() || null,
      });
      toast.success("Продукт создан");
      nav(`/admin/lab/products/${product.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Не удалось создать продукт");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          to="/admin/lab"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Все продукты
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Новый продукт</h1>
        <p className="text-sm text-muted-foreground mt-1">
          После создания заполните базу знаний и сможете генерировать прототипы.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Название</Label>
          <Input
            id="name"
            placeholder="Например: Артрейд — компрессионный трикотаж"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            placeholder="artraid"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Используется во внутренних URL. Только латиница, цифры и дефис.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">Описание (опционально)</Label>
          <Textarea
            id="desc"
            placeholder="Коротко: что за продукт, ключевая категория, для кого"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => nav("/admin/lab")}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Создать
          </Button>
        </div>
      </div>
    </div>
  );
}
