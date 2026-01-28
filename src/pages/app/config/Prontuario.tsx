import { useState } from 'react';
import { Settings, LayoutList, FileText, Palette, Shield, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TabsSection, TemplatesSection, VisualSection, SecuritySection, PermissionsSection } from '@/components/config/prontuario';

const TABS = [
  { id: 'tabs', label: 'Abas', icon: LayoutList, description: 'Visibilidade e ordem' },
  { id: 'templates', label: 'Modelos', icon: FileText, description: 'Anamnese, evolução, etc.' },
  { id: 'visual', label: 'Visual', icon: Palette, description: 'Cores e layout' },
  { id: 'permissions', label: 'Permissões', icon: Lock, description: 'Acesso por perfil', badge: 'RBAC' },
  { id: 'security', label: 'Segurança', icon: Shield, description: 'LGPD e bloqueios', badge: 'LGPD' },
];

export default function ConfigProntuario() {
  const [activeTab, setActiveTab] = useState('tabs');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Configurações do Prontuário
        </h1>
        <p className="text-muted-foreground mt-1">
          Personalize a estrutura, modelos e comportamento do prontuário eletrônico
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 h-auto gap-2 bg-transparent p-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`flex flex-col items-center gap-1.5 p-3 h-auto border rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card hover:bg-muted border-border'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                  {tab.badge && (
                    <Badge variant={isActive ? 'secondary' : 'outline'} className="text-[10px] px-1 py-0">
                      {tab.badge}
                    </Badge>
                  )}
                </div>
                <span className={`text-[10px] hidden lg:block ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {tab.description}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="tabs" className="m-0">
          <TabsSection />
        </TabsContent>

        <TabsContent value="templates" className="m-0">
          <TemplatesSection />
        </TabsContent>

        <TabsContent value="visual" className="m-0">
          <VisualSection />
        </TabsContent>

        <TabsContent value="permissions" className="m-0">
          <PermissionsSection />
        </TabsContent>

        <TabsContent value="security" className="m-0">
          <SecuritySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
