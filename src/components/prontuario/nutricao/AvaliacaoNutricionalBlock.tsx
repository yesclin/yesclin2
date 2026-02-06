/**
 * NUTRIÇÃO - Avaliação Nutricional
 * 
 * Bloco para registro de avaliação nutricional completa.
 * Inclui antropometria, circunferências, composição corporal e dobras cutâneas.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Scale, 
  Ruler, 
  Plus, 
  ChevronDown,
  Calendar,
  Save,
  History,
  Activity,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AvaliacaoNutricional, AvaliacaoNutricionalFormData } from '@/hooks/prontuario/nutricao';
import { AvaliacaoEvolutionChart } from './AvaliacaoEvolutionChart';

interface AvaliacaoNutricionalBlockProps {
  avaliacoes: AvaliacaoNutricional[];
  currentAvaliacao: AvaliacaoNutricional | null;
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  onSave: (data: AvaliacaoNutricionalFormData) => Promise<unknown>;
}

const initialFormData: AvaliacaoNutricionalFormData = {
  measurement_date: new Date().toISOString().split('T')[0],
  weight_kg: null,
  height_cm: null,
  waist_cm: null,
  hip_cm: null,
  chest_cm: null,
  arm_left_cm: null,
  arm_right_cm: null,
  thigh_left_cm: null,
  thigh_right_cm: null,
  calf_left_cm: null,
  calf_right_cm: null,
  body_fat_percent: null,
  muscle_mass_kg: null,
  dobra_tricipital_mm: null,
  dobra_subescapular_mm: null,
  dobra_bicipital_mm: null,
  dobra_suprailiaca_mm: null,
  dobra_abdominal_mm: null,
  dobra_coxa_mm: null,
  dobra_peitoral_mm: null,
  agua_corporal_percent: null,
  massa_ossea_kg: null,
  taxa_metabolica_basal: null,
  idade_metabolica: null,
  gordura_visceral: null,
  notes: null,
};

export function AvaliacaoNutricionalBlock({
  avaliacoes,
  currentAvaliacao,
  loading,
  saving,
  canEdit,
  onSave,
}: AvaliacaoNutricionalBlockProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AvaliacaoNutricionalFormData>(initialFormData);
  const [showHistory, setShowHistory] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    circunferencias: true,
    dobras: false,
    bioimpedancia: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSave(formData);
    if (result) {
      setFormData(initialFormData);
      setShowForm(false);
    }
  };

  const updateField = (field: keyof AvaliacaoNutricionalFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Calcular IMC em tempo real
  const calculatedBMI = formData.weight_kg && formData.height_cm 
    ? (formData.weight_kg / Math.pow(formData.height_cm / 100, 2)).toFixed(1)
    : null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">Avaliação Antropométrica</h2>
        </div>
        <div className="flex gap-2">
          {avaliacoes.length >= 2 && (
            <Button 
              variant={showEvolution ? "default" : "outline"}
              size="sm"
              onClick={() => setShowEvolution(!showEvolution)}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Evolução
            </Button>
          )}
          {avaliacoes.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              Histórico ({avaliacoes.length})
            </Button>
          )}
          {canEdit && !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          )}
        </div>
      </div>

      {/* Gráficos de Evolução */}
      {showEvolution && avaliacoes.length >= 2 && (
        <AvaliacaoEvolutionChart avaliacoes={avaliacoes} />
      )}

      {/* Formulário de Nova Avaliação */}
      {showForm && canEdit && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Avaliação Nutricional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Data e Dados Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="measurement_date">Data da Avaliação</Label>
                  <Input
                    id="measurement_date"
                    type="date"
                    value={formData.measurement_date}
                    onChange={(e) => updateField('measurement_date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="weight_kg">Peso (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 75.5"
                    value={formData.weight_kg ?? ''}
                    onChange={(e) => updateField('weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="height_cm">Altura (cm)</Label>
                  <Input
                    id="height_cm"
                    type="number"
                    placeholder="Ex: 175"
                    value={formData.height_cm ?? ''}
                    onChange={(e) => updateField('height_cm', e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
                <div>
                  <Label>IMC Calculado</Label>
                  <div className="h-10 flex items-center px-3 bg-muted rounded-md">
                    <span className="font-medium">
                      {calculatedBMI ? `${calculatedBMI} kg/m²` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Circunferências */}
              <Collapsible open={expandedSections.circunferencias} onOpenChange={() => toggleSection('circunferencias')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Ruler className="h-4 w-4" />
                      Circunferências (cm)
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.circunferencias ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="waist_cm">Cintura</Label>
                      <Input
                        id="waist_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.waist_cm ?? ''}
                        onChange={(e) => updateField('waist_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hip_cm">Quadril</Label>
                      <Input
                        id="hip_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.hip_cm ?? ''}
                        onChange={(e) => updateField('hip_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="chest_cm">Tórax</Label>
                      <Input
                        id="chest_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.chest_cm ?? ''}
                        onChange={(e) => updateField('chest_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="arm_right_cm">Braço D</Label>
                      <Input
                        id="arm_right_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.arm_right_cm ?? ''}
                        onChange={(e) => updateField('arm_right_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="arm_left_cm">Braço E</Label>
                      <Input
                        id="arm_left_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.arm_left_cm ?? ''}
                        onChange={(e) => updateField('arm_left_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="thigh_right_cm">Coxa D</Label>
                      <Input
                        id="thigh_right_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.thigh_right_cm ?? ''}
                        onChange={(e) => updateField('thigh_right_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="thigh_left_cm">Coxa E</Label>
                      <Input
                        id="thigh_left_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.thigh_left_cm ?? ''}
                        onChange={(e) => updateField('thigh_left_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="calf_right_cm">Panturrilha D</Label>
                      <Input
                        id="calf_right_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.calf_right_cm ?? ''}
                        onChange={(e) => updateField('calf_right_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Composição Corporal */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="body_fat_percent">Gordura Corporal (%)</Label>
                  <Input
                    id="body_fat_percent"
                    type="number"
                    step="0.1"
                    placeholder="%"
                    value={formData.body_fat_percent ?? ''}
                    onChange={(e) => updateField('body_fat_percent', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="muscle_mass_kg">Massa Muscular (kg)</Label>
                  <Input
                    id="muscle_mass_kg"
                    type="number"
                    step="0.1"
                    placeholder="kg"
                    value={formData.muscle_mass_kg ?? ''}
                    onChange={(e) => updateField('muscle_mass_kg', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações sobre a avaliação..."
                  value={formData.notes ?? ''}
                  onChange={(e) => updateField('notes', e.target.value || null)}
                  rows={3}
                />
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Avaliação'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Última Avaliação */}
      {currentAvaliacao && !showForm && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Última Avaliação</CardTitle>
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(currentAvaliacao.measurement_date), "dd/MM/yyyy", { locale: ptBR })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
              {currentAvaliacao.weight_kg && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Peso</p>
                  <p className="font-semibold text-lg">{currentAvaliacao.weight_kg} kg</p>
                </div>
              )}
              {currentAvaliacao.height_cm && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Altura</p>
                  <p className="font-semibold text-lg">{(currentAvaliacao.height_cm / 100).toFixed(2)} m</p>
                </div>
              )}
              {currentAvaliacao.bmi && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">IMC</p>
                  <p className="font-semibold text-lg">{currentAvaliacao.bmi.toFixed(1)}</p>
                </div>
              )}
              {currentAvaliacao.body_fat_percent && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Gordura</p>
                  <p className="font-semibold text-lg">{currentAvaliacao.body_fat_percent}%</p>
                </div>
              )}
              {currentAvaliacao.waist_cm && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Cintura</p>
                  <p className="font-semibold text-lg">{currentAvaliacao.waist_cm} cm</p>
                </div>
              )}
              {currentAvaliacao.hip_cm && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Quadril</p>
                  <p className="font-semibold text-lg">{currentAvaliacao.hip_cm} cm</p>
                </div>
              )}
            </div>
            {currentAvaliacao.notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{currentAvaliacao.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {showHistory && avaliacoes.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {avaliacoes.slice(1).map((avaliacao) => (
                <div 
                  key={avaliacao.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      {format(new Date(avaliacao.measurement_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {avaliacao.weight_kg && (
                      <span className="font-medium">{avaliacao.weight_kg} kg</span>
                    )}
                    {avaliacao.bmi && (
                      <Badge variant="outline">IMC: {avaliacao.bmi.toFixed(1)}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {avaliacoes.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma avaliação nutricional registrada.</p>
            {canEdit && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira Avaliação
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
