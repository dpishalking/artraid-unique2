import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildProjectContextWithAi,
  getProjectById,
  touchProjectActivity,
} from "@/lib/projects/projectApi";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectWithContext } from "@/lib/projects/types";

export default function ProjectContextPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [data, setData] = useState<ProjectWithContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);

  const [website, setWebsite] = useState("");
  const [offer, setOffer] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!projectId) return;
    getProjectById(projectId)
      .then((p) => {
        setData(p);
        if (p?.project) {
          setWebsite(p.project.current_website_url ?? "");
          setOffer(p.project.current_offer ?? "");
          setNotes(p.project.additional_context ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const saveBasics = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          current_website_url: website.trim() || null,
          current_offer: offer.trim() || null,
          additional_context: notes.trim() || null,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", projectId);
      if (error) throw error;
      await supabase
        .from("project_contexts")
        .update({
          current_website_url: website.trim() || null,
          current_offer: offer.trim() || null,
          important_notes: notes.trim() || null,
        })
        .eq("project_id", projectId);
      await touchProjectActivity(projectId);
      toast.success("Сохранено");
      const refreshed = await getProjectById(projectId);
      setData(refreshed);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const rebuildAi = async () => {
    if (!projectId) return;
    setRebuilding(true);
    try {
      await buildProjectContextWithAi(projectId);
      toast.success("Карта обновлена");
      setData(await getProjectById(projectId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка AI");
    } finally {
      setRebuilding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-destructive text-sm">Проект не найден</p>;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Контекст проекта</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Базовые поля и пересборка маркетинговой карты.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Основное</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site">Сайт</Label>
            <Input id="site" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer">Текущий оффер</Label>
            <Textarea id="offer" value={offer} onChange={(e) => setOffer(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Заметки</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveBasics} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
            </Button>
            <Button variant="secondary" onClick={rebuildAi} disabled={rebuilding}>
              {rebuilding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Обновить карту AI"}
            </Button>
            <Button variant="ghost" asChild>
              <Link to={`/projects/${projectId}`}>К обзору</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
