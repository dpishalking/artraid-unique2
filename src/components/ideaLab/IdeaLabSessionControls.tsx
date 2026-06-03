import { useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { IdeaLabRolePicker } from "./IdeaLabRolePicker";
import { il } from "@/lib/ideaLab/uiClasses";
import { cn } from "@/lib/utils";
import type { IdeaLabCoachRole } from "@/lib/ideaLab/types";

type Props = {
  coachRole: IdeaLabCoachRole;
  onRoleChange: (role: IdeaLabCoachRole) => void;
  onResetDialog: () => void;
  onNewProject: () => void;
  resetting?: boolean;
  showNewProject?: boolean;
  hasDialogHistory?: boolean;
  canCreateMoreProject?: boolean;
};

export function IdeaLabSessionControls({
  coachRole,
  onRoleChange,
  onResetDialog,
  onNewProject,
  resetting,
  showNewProject = true,
  hasDialogHistory = false,
  canCreateMoreProject = true,
}: Props) {
  const [pendingRole, setPendingRole] = useState<IdeaLabCoachRole | null>(null);

  const requestRoleChange = (role: IdeaLabCoachRole) => {
    if (role === coachRole) return;
    if (hasDialogHistory) {
      setPendingRole(role);
      return;
    }
    onRoleChange(role);
  };

  return (
    <div className={cn(il.glass, "p-4 space-y-4")}>
      <IdeaLabRolePicker
        value={coachRole}
        onChange={requestRoleChange}
        disabled={resetting}
        compact
      />

      <AlertDialog open={pendingRole !== null} onOpenChange={(open) => !open && setPendingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сменить формат общения?</AlertDialogTitle>
            <AlertDialogDescription>
              Диалог начнётся заново с новой роли — история сообщений и карточка обнулятся.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRole) onRoleChange(pendingRole);
                setPendingRole(null);
              }}
            >
              Сменить роль
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start" disabled={resetting}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Новый диалог
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Начать диалог заново?</AlertDialogTitle>
              <AlertDialogDescription>
                История чата и карточка прояснения обнулятся. Текущий проект сохранится — начнёте с чистого
                листа в выбранной роли.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={onResetDialog}>Начать заново</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {showNewProject && canCreateMoreProject && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Новый проект с нуля
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Закрыть и создать новый проект?</AlertDialogTitle>
                <AlertDialogDescription>
                  Текущий диалог останется в этом проекте. Откроется выбор ситуации и роли для нового
                  проекта.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={onNewProject}>Создать новый проект</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
