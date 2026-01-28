import { useState, useEffect } from 'react';
import { GripVertical, Eye, EyeOff, Plus, Save, RotateCcw, LayoutDashboard, FileText, Activity, Stethoscope, Pill, Image, FolderOpen, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTabs, type TabConfig } from '@/hooks/prontuario';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, FileText, Activity, Stethoscope, Pill, Image, FolderOpen, History,
};

export function TabsSection() {
  const { tabs, loading, saving, initializeDefaults, toggleActive, reorder } = useTabs();
  const [localTabs, setLocalTabs] = useState<TabConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && tabs.length > 0) {
      setLocalTabs(tabs);
      setHasChanges(false);
    }
  }, [loading, tabs]);

  const handleToggle = (id: string, current: boolean) => {
    setLocalTabs(prev => prev.map(t => t.id === id ? { ...t, is_active: !current } : t));
    setHasChanges(true);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newTabs = [...localTabs];
    const [dragged] = newTabs.splice(dragIdx, 1);
    newTabs.splice(idx, 0, dragged);
    setLocalTabs(newTabs.map((t, i) => ({ ...t, display_order: i + 1 })));
    setDragIdx(idx);
    setHasChanges(true);
  };

  const handleDragEnd = () => setDragIdx(null);

  const handleSave = async () => {
    const reorderData = localTabs.map(t => ({ id: t.id, display_order: t.display_order }));
    await reorder(reorderData);
    
    for (const local of localTabs) {
      const orig = tabs.find(t => t.id === local.id);
      if (orig && orig.is_active !== local.is_active) {
        await toggleActive(local.id, local.is_active);
      }
    }
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalTabs(tabs);
    setHasChanges(false);
  };

  const getIcon = (name: string | null) => ICON_MAP[name || ''] || LayoutDashboard;

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (tabs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Abas</CardTitle>
          <CardDescription>Configure quais abas aparecem no prontuário</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">Nenhuma aba configurada.</p>
          <Button onClick={initializeDefaults} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Abas Padrão
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Abas do Prontuário</CardTitle>
            <CardDescription>Arraste para reordenar. Ative ou desative conforme necessário.</CardDescription>
          </div>
          {hasChanges && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />Desfazer
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {localTabs.map((tab, idx) => {
          const Icon = getIcon(tab.icon);
          return (
            <div
              key={tab.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-4 p-4 rounded-lg border cursor-move transition-all ${
                dragIdx === idx ? 'opacity-50 border-primary' : 'hover:bg-muted/50'
              } ${!tab.is_active ? 'opacity-60 bg-muted/30' : 'bg-card'}`}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              <div className={`p-2 rounded-md ${tab.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                <Icon className={`h-4 w-4 ${tab.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium">{tab.name}</p>
                <p className="text-xs text-muted-foreground">Chave: {tab.key}</p>
              </div>
              <div className="flex items-center gap-4">
                {tab.is_system && <Badge variant="secondary" className="text-xs">Sistema</Badge>}
                <div className="flex items-center gap-2">
                  {tab.is_active ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  <Switch
                    checked={tab.is_active}
                    onCheckedChange={() => handleToggle(tab.id, tab.is_active)}
                    disabled={tab.is_system && tab.key === 'resumo'}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
