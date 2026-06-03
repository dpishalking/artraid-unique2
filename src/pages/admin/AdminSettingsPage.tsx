import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Раздел в разработке. Настройки AI, лимитов и биллинга появятся в следующем релизе.
      </CardContent>
    </Card>
  );
}
