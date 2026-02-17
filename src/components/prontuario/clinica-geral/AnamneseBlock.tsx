import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { AnamnesisTemplateBuilderDialog } from "@/components/configuracoes/AnamnesisTemplateBuilderDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  FileText,
  Edit3,
  Save,
  X,
  Clock,
  User,
  History,
  AlertTriangle,
  Pill,
  Heart,
  Activity,
  Users,
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  BookOpen,
  Baby,
  LayoutList,
  Ruler,
  UserCircle,
  Calculator,
  Lock,
  Settings,
  Check,
  Circle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  calculateIMC, 
  mapStructuredToLegacy,
  type SecaoAnamnese 
} from "@/hooks/prontuario/clinica-geral/anamneseTemplates";
import { useAnamnesisTemplatesV2, type AnamnesisTemplateV2, type TemplateSection } from "@/hooks/useAnamnesisTemplatesV2";
import { useInstitutionalPdf } from "@/hooks/useInstitutionalPdf";
import { FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────

export interface AnamneseData {
  id: string;
  patient_id: string;
  version: number;
  queixa_principal: string;
  historia_doenca_atual: string;
  antecedentes_pessoais: string;
  antecedentes_familiares: string;
  habitos_vida: string;
  medicamentos_uso_continuo: string;
  alergias: string;
  comorbidades: string;
  historia_ginecologica?: string;
  revisao_sistemas?: string;
  structured_data?: Record<string, unknown>;
  template_id?: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

interface PatientHeaderData {
  full_name?: string;
  birth_date?: string | null;
  gender?: 'M' | 'F' | 'O' | null;
  cpf?: string | null;
  phone?: string | null;
  email?: string | null;
  insurance_name?: string | null;
}

interface AnamneseBlockProps {
  currentAnamnese: AnamneseData | null;
  anamneseHistory: AnamneseData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: Omit<AnamneseData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
  patientName?: string;
  patientCpf?: string;
  patientData?: PatientHeaderData;
  specialtyId?: string | null;
  specialtyName?: string | null;
}

// ─── Icon resolver ───────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  UserCircle, MessageSquare, Clock, BookOpen, Users, Pill, AlertTriangle,
  Activity, Baby, LayoutList, Ruler, Stethoscope, Heart, User,
};

function SectionIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Stethoscope;
  return <Icon className={className} />;
}

// ─── Multi-select badge component ────────────────────────────────────

function MultiSelectField({
  options, value, onChange, readOnly
}: { options: string[]; value: string[]; onChange: (v: string[]) => void; readOnly?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const selected = value.includes(opt);
        return (
          <Badge
            key={opt}
            variant={selected ? 'default' : 'outline'}
            className={!readOnly ? 'cursor-pointer transition-colors' : ''}
            onClick={() => {
              if (readOnly) return;
              onChange(selected ? value.filter(v => v !== opt) : [...value, opt]);
            }}
          >
            {selected ? '✓ ' : ''}{opt}
          </Badge>
        );
      })}
    </div>
  );
}

// ─── Unified template type ───────────────────────────────────────

interface UnifiedTemplate {
  id: string;
  nome: string;
  descricao: string;
  icon: string;
  is_system: boolean;
  secoes: SecaoAnamnese[];
}

/** Convert a V2 template to the unified format */
function v2TemplateToUnified(t: AnamnesisTemplateV2): UnifiedTemplate {
  return {
    id: t.id,
    nome: t.name,
    descricao: t.description || '',
    icon: t.icon || 'Stethoscope',
    is_system: t.is_system,
    secoes: t.structure.map(section => ({
      id: section.id,
      titulo: section.title,
      icon: 'Stethoscope',
      campos: section.fields.map(f => ({
        id: f.id,
        label: f.label,
        type: f.type as any,
        placeholder: f.placeholder,
        options: f.options,
        required: f.required,
        section: section.title,
      })),
    })),
  };
}

// ─── Main component ──────────────────────────────────────────────────

export function AnamneseBlock({
  currentAnamnese,
  anamneseHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
  patientName,
  patientCpf,
  patientData,
  specialtyId,
  specialtyName,
}: AnamneseBlockProps) {
  const navigate = useNavigate();
  const { generateAnamnesisPdf, generating } = useInstitutionalPdf();

  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AnamneseData | null>(null);
  const [structuredData, setStructuredData] = useState<Record<string, unknown>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingV2Template, setEditingV2Template] = useState<AnamnesisTemplateV2 | null>(null);
  const [creatingDefault, setCreatingDefault] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Auto-save refs
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedData = useRef<string>('');

  // ─── Fetch clinic templates from DB (V2) ──────────────────────────
  const { templates: v2Templates, isLoading: loadingTemplates, createTemplate } = useAnamnesisTemplatesV2({ 
    specialtyId: specialtyId,
    activeOnly: true 
  });

  const allTemplates: UnifiedTemplate[] = useMemo(() => {
    return v2Templates.map(v2TemplateToUnified);
  }, [v2Templates]);

  const activeTemplate = useMemo(() => {
    if (!allTemplates.length) return null;
    if (selectedTemplateId) {
      const found = allTemplates.find(t => t.id === selectedTemplateId);
      if (found) return found;
    }
    const defaultTpl = allTemplates.find(t => allTemplates.length === 1 || t.is_system);
    return defaultTpl || allTemplates[0];
  }, [allTemplates, selectedTemplateId]);

  useEffect(() => {
    if (activeTemplate && !selectedTemplateId) {
      setSelectedTemplateId(activeTemplate.id);
    }
  }, [activeTemplate, selectedTemplateId]);

  // ─── Progress calculation ──────────────────────────────────────────
  const progressInfo = useMemo(() => {
    if (!activeTemplate) return { percent: 0, filled: 0, total: 0 };
    const allFields = activeTemplate.secoes.flatMap(s => s.campos);
    const total = allFields.length;
    const filled = allFields.filter(f => {
      const v = structuredData[f.id];
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    }).length;
    return { percent: total > 0 ? Math.round((filled / total) * 100) : 0, filled, total };
  }, [activeTemplate, structuredData]);

  // ─── Section completion status ─────────────────────────────────────
  const sectionStatus = useMemo(() => {
    if (!activeTemplate) return [];
    return activeTemplate.secoes.map(secao => {
      const total = secao.campos.length;
      const filled = secao.campos.filter(c => {
        const v = structuredData[c.id];
        if (Array.isArray(v)) return v.length > 0;
        return v !== undefined && v !== null && v !== '';
      }).length;
      return { id: secao.id, filled, total, complete: filled === total && total > 0, hasData: filled > 0 };
    });
  }, [activeTemplate, structuredData]);

  // ─── Auto-save ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditing) return;
    const currentDataStr = JSON.stringify(structuredData);
    if (currentDataStr === lastSavedData.current || currentDataStr === '{}') return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      lastSavedData.current = currentDataStr;
      toast.info('Rascunho salvo automaticamente', { duration: 1500 });
    }, 3000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [structuredData, isEditing]);

  // ─── Check if form has data ─────────────────────────────────────
  const hasFilledData = useCallback(() => {
    return Object.values(structuredData).some(v => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    });
  }, [structuredData]);

  // ─── Template switch handler ────────────────────────────────────
  const handleTemplateSwitch = useCallback((newTemplateId: string) => {
    if (newTemplateId === selectedTemplateId) return;
    if (hasFilledData()) {
      setPendingTemplateId(newTemplateId);
      setShowSwitchConfirm(true);
    } else {
      setSelectedTemplateId(newTemplateId);
      setStructuredData({});
    }
  }, [selectedTemplateId, hasFilledData]);

  const confirmTemplateSwitch = useCallback(() => {
    if (pendingTemplateId) {
      setSelectedTemplateId(pendingTemplateId);
      setStructuredData({});
      setPendingTemplateId(null);
    }
    setShowSwitchConfirm(false);
  }, [pendingTemplateId]);

  // ─── Open template editor (V2 Builder) ──────────────────────────
  const handleOpenTemplateEditor = useCallback(() => {
    if (!activeTemplate || activeTemplate.is_system) {
      setEditingV2Template(null);
    } else {
      const v2Tpl = v2Templates.find(t => t.id === activeTemplate.id);
      setEditingV2Template(v2Tpl || null);
    }
    setShowTemplateEditor(true);
  }, [activeTemplate, v2Templates]);

  // ─── Create default YesClin template ─────────────────────────────
  const handleCreateDefaultTemplate = useCallback(async () => {
    if (!specialtyId || creatingDefault) return;
    setCreatingDefault(true);
    try {
      const defaultStructure: TemplateSection[] = [
        {
          id: 'queixa_principal', type: 'section', title: '1. Queixa Principal (QP)',
          fields: [
            { id: 'qp_descricao', type: 'textarea', label: 'Motivo da consulta (nas palavras do paciente)', required: true, placeholder: 'Ex: "Dor no peito há 2 dias"' },
          ],
        },
        {
          id: 'historia_doenca_atual', type: 'section', title: '2. História da Doença Atual (HDA)',
          fields: [
            { id: 'hda_evolucao', type: 'textarea', label: 'Evolução', placeholder: 'Como evoluiu desde o início?' },
            { id: 'hda_sintomas_associados', type: 'textarea', label: 'Sintomas associados', placeholder: 'Outros sintomas relacionados' },
          ],
        },
        {
          id: 'antecedentes_pessoais', type: 'section', title: '3. Antecedentes Pessoais (HPP)',
          fields: [
            { id: 'hpp_doencas_previas', type: 'textarea', label: 'Doenças prévias', placeholder: 'HAS, DM, dislipidemia, etc.' },
            { id: 'hpp_cirurgias', type: 'textarea', label: 'Cirurgias', placeholder: 'Procedimentos cirúrgicos realizados' },
          ],
        },
        {
          id: 'antecedentes_familiares', type: 'section', title: '4. História Familiar (HF)',
          fields: [
            { id: 'hf_detalhes', type: 'textarea', label: 'Antecedentes familiares', placeholder: 'Doenças hereditárias na família' },
          ],
        },
        {
          id: 'medicamentos', type: 'section', title: '5. Medicamentos em Uso',
          fields: [
            { id: 'med_lista', type: 'textarea', label: 'Medicamentos', placeholder: 'Nome / Dose / Frequência', required: true },
          ],
        },
        {
          id: 'alergias', type: 'section', title: '6. Alergias',
          fields: [
            { id: 'alergias_medicamentosas', type: 'textarea', label: 'Alergias', placeholder: 'Medicamentosas, alimentares, ambientais' },
          ],
        },
        {
          id: 'habitos_vida', type: 'section', title: '7. Hábitos de Vida',
          fields: [
            { id: 'hab_tabagismo', type: 'text', label: 'Tabagismo', placeholder: 'Ex: nunca fumou' },
            { id: 'hab_etilismo', type: 'text', label: 'Etilismo', placeholder: 'Frequência/quantidade' },
            { id: 'hab_atividade_fisica', type: 'textarea', label: 'Atividade física', placeholder: 'Tipo, frequência' },
          ],
        },
      ];
      
      const name = `Anamnese Padrão - ${specialtyName || 'Geral'} (YesClin)`;
      await createTemplate({
        name,
        description: 'Modelo padrão criado automaticamente pelo YesClin',
        specialty_id: specialtyId,
        icon: 'Stethoscope',
        is_default: true,
        structure: defaultStructure,
      });
    } catch (err) {
      console.error('Erro ao criar modelo padrão:', err);
    } finally {
      setCreatingDefault(false);
    }
  }, [specialtyId, specialtyName, createTemplate, creatingDefault]);

  // ─── IMC calculation ────────────────────────────────────────────
  const imcResult = useMemo(() => {
    const peso = structuredData.peso_kg as number | null;
    const altura = structuredData.altura_cm as number | null;
    return calculateIMC(peso ?? null, altura ?? null);
  }, [structuredData.peso_kg, structuredData.altura_cm]);

  // ─── Handlers ───────────────────────────────────────────────────
  const handleStartEdit = () => {
    if (currentAnamnese?.template_id) {
      setSelectedTemplateId(currentAnamnese.template_id);
    }
    if (currentAnamnese?.structured_data && Object.keys(currentAnamnese.structured_data).length > 0) {
      setStructuredData({ ...currentAnamnese.structured_data });
    } else if (currentAnamnese) {
      setStructuredData({
        qp_descricao: currentAnamnese.queixa_principal || '',
        hda_evolucao: currentAnamnese.historia_doenca_atual || '',
        hpp_doencas_obs: currentAnamnese.antecedentes_pessoais || '',
        hf_detalhes: currentAnamnese.antecedentes_familiares || '',
        med_lista: currentAnamnese.medicamentos_uso_continuo || '',
        alergias_medicamentosas: currentAnamnese.alergias || '',
        hab_alimentacao: currentAnamnese.habitos_vida || '',
      });
    }
    setActiveStep(0);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setStructuredData({});
    setActiveStep(0);
  };

  const handleSave = async () => {
    const legacy = mapStructuredToLegacy(structuredData);
    await onSave({
      queixa_principal: legacy.queixa_principal || '',
      historia_doenca_atual: legacy.historia_doenca_atual || '',
      antecedentes_pessoais: legacy.antecedentes_pessoais || '',
      antecedentes_familiares: legacy.antecedentes_familiares || '',
      habitos_vida: legacy.habitos_vida || '',
      medicamentos_uso_continuo: legacy.medicamentos_uso_continuo || '',
      alergias: legacy.alergias || '',
      comorbidades: currentAnamnese?.comorbidades || '',
      structured_data: structuredData,
      template_id: activeTemplate?.id || '',
    });
    setIsEditing(false);
    setStructuredData({});
    setActiveStep(0);
  };

  const updateField = (fieldId: string, value: unknown) => {
    setStructuredData(prev => ({ ...prev, [fieldId]: value }));
  };

  // ─── Field renderer ─────────────────────────────────────────────
  const renderField = (campo: { id: string; label: string; type: string; placeholder?: string; options?: string[]; required?: boolean }) => {
    const value = structuredData[campo.id];

    switch (campo.type) {
      case 'text':
        return (
          <Input
            value={(value as string) || ''}
            onChange={e => updateField(campo.id, e.target.value)}
            placeholder={campo.placeholder}
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={e => updateField(campo.id, e.target.value)}
            placeholder={campo.placeholder}
            rows={3}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={(value as number) ?? ''}
            onChange={e => updateField(campo.id, e.target.value ? parseFloat(e.target.value) : null)}
            placeholder={campo.placeholder}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={e => updateField(campo.id, e.target.value)}
          />
        );
      case 'select':
        return (
          <Select value={(value as string) || ''} onValueChange={v => updateField(campo.id, v)}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {campo.options?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'radio':
        return (
          <RadioGroup value={(value as string) || ''} onValueChange={v => updateField(campo.id, v)} className="flex flex-wrap gap-4">
            {campo.options?.map(opt => (
              <div key={opt} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`${campo.id}-${opt}`} />
                <Label htmlFor={`${campo.id}-${opt}`} className="text-sm font-normal">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'multiselect':
        return (
          <MultiSelectField
            options={campo.options || []}
            value={(value as string[]) || []}
            onChange={v => updateField(campo.id, v)}
          />
        );
      default:
        return (
          <Input
            value={(value as string) || ''}
            onChange={e => updateField(campo.id, e.target.value)}
            placeholder={campo.placeholder}
          />
        );
    }
  };

  // ─── Render section in view mode ────────────────────────────────
  const renderViewSection = (secao: SecaoAnamnese, data: Record<string, unknown>) => {
    const filledFields = secao.campos.filter(c => {
      const v = data[c.id];
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    });
    if (filledFields.length === 0) return null;

    return (
      <div key={secao.id} className="space-y-3 p-4">
        <div className="flex items-center gap-2 mb-3">
          <SectionIcon name={secao.icon} className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">{secao.titulo}</h4>
          <Badge variant="outline" className="text-[10px] ml-1">{filledFields.length} campos</Badge>
        </div>
        <div className="grid gap-3">
          {filledFields.map(campo => {
            const val = data[campo.id];
            const display = Array.isArray(val) ? val.join(', ') : String(val);
            return (
              <div key={campo.id} className="bg-muted/30 rounded-lg p-3">
                <Label className="text-xs text-muted-foreground">{campo.label}</Label>
                <p className="text-sm whitespace-pre-wrap mt-0.5">{display}</p>
              </div>
            );
          })}
          {secao.id === 'dados_antropometricos' && data.peso_kg && data.altura_cm && (() => {
            const imc = calculateIMC(data.peso_kg as number, data.altura_cm as number);
            if (!imc) return null;
            return (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">IMC: {imc.value} — {imc.classification}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  // ─── Legacy view ─────────────────────────────────────────────────
  const renderLegacyView = (anamnese: AnamneseData) => {
    const sections = [
      { key: 'queixa_principal', label: 'Queixa Principal', icon: 'Stethoscope', value: anamnese.queixa_principal },
      { key: 'historia_doenca_atual', label: 'HDA', icon: 'Clock', value: anamnese.historia_doenca_atual },
      { key: 'antecedentes_pessoais', label: 'Antecedentes Pessoais', icon: 'User', value: anamnese.antecedentes_pessoais },
      { key: 'antecedentes_familiares', label: 'Antecedentes Familiares', icon: 'Users', value: anamnese.antecedentes_familiares },
      { key: 'habitos_vida', label: 'Hábitos de Vida', icon: 'Activity', value: anamnese.habitos_vida },
      { key: 'medicamentos', label: 'Medicamentos', icon: 'Pill', value: anamnese.medicamentos_uso_continuo },
      { key: 'alergias', label: 'Alergias', icon: 'AlertTriangle', value: anamnese.alergias },
      { key: 'comorbidades', label: 'Comorbidades', icon: 'Heart', value: anamnese.comorbidades },
    ].filter(s => s.value);

    return (
      <div className="divide-y">
        {sections.map(s => (
          <div key={s.key} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <SectionIcon name={s.icon} className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">{s.label}</h4>
            </div>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{s.value}</p>
          </div>
        ))}
      </div>
    );
  };

  // ─── Loading ────────────────────────────────────────────────────
  if (loading || loadingTemplates) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ─── No templates exist ─────────────────────────────────────────
  if (allTemplates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-10 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold mb-2">
            Nenhum modelo de anamnese cadastrado para esta especialidade.
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Para registrar anamneses, é necessário ter pelo menos um modelo ativo configurado.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button 
              onClick={() => {
                if (!specialtyId) return;
                navigate(`/app/config/prontuario?especialidade_id=${specialtyId}&tipo=anamnese&action=create_default&return=prontuario`);
              }} 
              disabled={!specialtyId}
              size="lg"
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              Criar modelo padrão do YesClin
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                if (!specialtyId) return;
                navigate(`/app/config/prontuario?especialidade_id=${specialtyId}&tipo=anamnese&action=create&return=prontuario`);
              }}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Criar modelo do zero
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Template exists but no structure ───────────────────────────
  if (activeTemplate && activeTemplate.secoes.length === 0 && !currentAnamnese) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-10 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold mb-2">
            Este modelo não possui estrutura configurada.
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            O modelo "{activeTemplate.nome}" não possui abas e campos definidos. Edite o modelo para adicionar a estrutura.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => {
                if (!specialtyId) return;
                navigate(`/app/config/prontuario?especialidade_id=${specialtyId}&tipo=anamnese`);
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Editar modelo
            </Button>
            <Button
              variant="outline"
              onClick={handleCreateDefaultTemplate}
              disabled={creatingDefault}
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              {creatingDefault ? 'Criando...' : 'Criar modelo padrão YesClin'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Template selector ──────────────────────────────────────────
  const renderTemplateSelector = (size: 'sm' | 'lg' = 'sm') => (
    <div className={`flex items-center gap-2 ${size === 'lg' ? 'w-full max-w-md mx-auto' : ''}`}>
      <div className={size === 'lg' ? 'flex-1' : 'w-64'}>
        <Select value={selectedTemplateId || ''} onValueChange={handleTemplateSwitch}>
          <SelectTrigger className={`bg-background ${size === 'lg' ? 'h-10' : 'h-8 text-xs'}`}>
            <div className="flex items-center gap-1.5 truncate">
              <Stethoscope className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <SelectValue placeholder="Selecionar modelo..." />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {allTemplates.map(t => (
              <SelectItem key={t.id} value={t.id}>
                <div className="flex items-center gap-2">
                  <span className="truncate">{t.nome}</span>
                  {t.is_system && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="outline"
        size={size === 'lg' ? 'default' : 'sm'}
        onClick={handleOpenTemplateEditor}
        title={activeTemplate?.is_system ? 'Criar modelo personalizado' : 'Editar campos do modelo'}
        className={size === 'lg' ? '' : 'h-8 px-2'}
      >
        <Settings className={`h-4 w-4 ${size === 'lg' ? 'mr-2' : ''}`} />
        {size === 'lg' && (activeTemplate?.is_system ? 'Personalizar' : 'Editar Campos')}
      </Button>
    </div>
  );

  // ─── Switch confirmation dialog ─────────────────────────────────
  const renderSwitchConfirmDialog = () => (
    <AlertDialog open={showSwitchConfirm} onOpenChange={setShowSwitchConfirm}>
      <AlertDialogContent className="bg-background">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Trocar modelo de anamnese?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Trocar o modelo irá apagar os dados atuais preenchidos. Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingTemplateId(null)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmTemplateSwitch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Trocar modelo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ─── Stepper component ─────────────────────────────────────────
  const sections = activeTemplate?.secoes || [];
  const currentSection = sections[activeStep];
  const totalSteps = sections.length;

  const renderStepper = () => (
    <div className="w-full">
      {/* Stepper horizontal */}
      <div className="flex items-center justify-between mb-1 overflow-x-auto pb-1">
        {sections.map((secao, index) => {
          const status = sectionStatus[index];
          const isActive = index === activeStep;
          const isPast = index < activeStep;
          
          return (
            <button
              key={secao.id}
              onClick={() => setActiveStep(index)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all min-w-0 flex-1 group",
                isActive && "bg-primary/10",
                !isActive && "hover:bg-muted/50"
              )}
            >
              {/* Step indicator */}
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                isActive && "bg-primary text-primary-foreground",
                !isActive && status?.complete && "bg-emerald-500 text-white",
                !isActive && status?.hasData && !status?.complete && "bg-amber-500 text-white",
                !isActive && !status?.hasData && "bg-muted text-muted-foreground"
              )}>
                {status?.complete ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  index + 1
                )}
              </div>
              {/* Step label */}
              <span className={cn(
                "text-[10px] leading-tight text-center line-clamp-2 max-w-[80px]",
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              )}>
                {secao.titulo.replace(/^\d+\.\s*/, '')}
              </span>
            </button>
          );
        })}
      </div>
      {/* Connection line */}
      <div className="relative h-0.5 bg-muted mx-4 mb-4 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${totalSteps > 1 ? (activeStep / (totalSteps - 1)) * 100 : 0}%` }}
        />
      </div>
    </div>
  );

  // ─── Empty state (templates exist but no anamnese) ──────────────
  if (!currentAnamnese && !isEditing) {
    return (
      <>
        {renderSwitchConfirmDialog()}
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-1">Nenhuma anamnese registrada</h3>
            <div className="flex flex-col items-center gap-3 mb-4">
              <p className="text-sm text-muted-foreground">Selecione o modelo:</p>
              {renderTemplateSelector('lg')}
              <p className="text-xs text-muted-foreground">
                {activeTemplate?.descricao || ''}
              </p>
            </div>
            {canEdit && activeTemplate && (
              <Button onClick={() => { setActiveStep(0); setIsEditing(true); }}>
                <Edit3 className="h-4 w-4 mr-2" />
                Registrar Anamnese
              </Button>
            )}
          </CardContent>
        </Card>
        <AnamnesisTemplateBuilderDialog
          open={showTemplateEditor}
          onOpenChange={setShowTemplateEditor}
          template={editingV2Template}
        />
      </>
    );
  }

  // ─── Compact anamnese header ────────────────────────────────────
  const renderCompactHeader = () => (
    <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        <Stethoscope className="h-4 w-4 text-primary flex-shrink-0" />
        <h3 className="font-semibold text-sm truncate">
          {activeTemplate?.nome || 'Anamnese'}
        </h3>
        <Badge variant="outline" className="text-[10px] flex-shrink-0">
          v{currentAnamnese?.version || 1}
        </Badge>
        {isEditing ? (
          <Badge className="text-[10px] bg-amber-500 text-white flex-shrink-0">Rascunho</Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] flex-shrink-0">
            <Check className="h-2.5 w-2.5 mr-0.5" />
            Finalizado
          </Badge>
        )}
      </div>
      {currentAnamnese && !isEditing && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {format(parseISO(currentAnamnese.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            {currentAnamnese.created_by_name && ` • ${currentAnamnese.created_by_name}`}
          </span>
        </div>
      )}
    </div>
  );

  // ─── Editing mode with stepper ──────────────────────────────────
  if (isEditing) {
    return (
      <>
        {renderSwitchConfirmDialog()}
        <div className="space-y-3">
          {/* Compact Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">
                {currentAnamnese ? 'Atualizar Anamnese' : 'Nova Anamnese'}
              </h3>
              <Badge className="text-[10px] bg-amber-500 text-white">Rascunho</Badge>
            </div>
            <div className="flex items-center gap-2">
              {renderTemplateSelector()}
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <Progress value={progressInfo.percent} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {progressInfo.filled}/{progressInfo.total} campos ({progressInfo.percent}%)
            </span>
          </div>

          <Card>
            <CardContent className="p-4">
              {/* Stepper navigation */}
              {renderStepper()}

              {/* Current section content */}
              {currentSection && (
                <div className="min-h-[400px]">
                  <div className="flex items-center gap-2 mb-4">
                    <SectionIcon name={currentSection.icon} className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">{currentSection.titulo}</h4>
                    {sectionStatus[activeStep] && (
                      <Badge variant="outline" className="text-[10px]">
                        {sectionStatus[activeStep].filled}/{sectionStatus[activeStep].total}
                      </Badge>
                    )}
                  </div>
                  {currentSection.descricao && (
                    <p className="text-xs text-muted-foreground mb-4">{currentSection.descricao}</p>
                  )}
                  <div className="space-y-4">
                    {currentSection.campos.map(campo => (
                      <div key={campo.id} className="space-y-1.5">
                        <Label className={`text-sm ${campo.required ? 'after:content-["*"] after:text-destructive after:ml-0.5' : ''}`}>
                          {campo.label}
                        </Label>
                        {renderField(campo)}
                      </div>
                    ))}
                    {/* Auto IMC display */}
                    {currentSection.id === 'dados_antropometricos' && imcResult && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold">IMC: {imcResult.value}</span>
                          <Badge variant={
                            imcResult.value < 18.5 || imcResult.value >= 30 ? 'destructive' :
                            imcResult.value >= 25 ? 'secondary' : 'default'
                          }>
                            {imcResult.classification}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(prev => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  {activeStep + 1} de {totalSteps}
                </span>
                {activeStep < totalSteps - 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveStep(prev => prev + 1)}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? 'Salvando...' : 'Finalizar'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <AnamnesisTemplateBuilderDialog
          open={showTemplateEditor}
          onOpenChange={setShowTemplateEditor}
          template={editingV2Template}
        />
      </>
    );
  }

  // ─── View mode ──────────────────────────────────────────────────
  const hasStructuredData = currentAnamnese?.structured_data && Object.keys(currentAnamnese.structured_data).length > 0;

  return (
    <div className="space-y-3">
      {/* Compact header */}
      {renderCompactHeader()}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        {currentAnamnese && (
          <Button
            variant="outline"
            size="sm"
            disabled={generating}
            onClick={() => {
              generateAnamnesisPdf(
                { name: patientName || 'Paciente', cpf: patientCpf },
                currentAnamnese,
                activeTemplate?.secoes || [],
              );
            }}
          >
            <FileDown className="h-4 w-4 mr-1" />
            {generating ? 'Gerando...' : 'PDF'}
          </Button>
        )}
        {canEdit && (
          <Button variant="outline" size="sm" onClick={handleOpenTemplateEditor} title="Editar campos do modelo">
            <Settings className="h-4 w-4 mr-1" /> Campos
          </Button>
        )}
        {anamneseHistory.length > 1 && (
          <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4 mr-1" />
            Histórico ({anamneseHistory.length})
          </Button>
        )}
        {canEdit && (
          <Button size="sm" onClick={handleStartEdit}>
            <Edit3 className="h-4 w-4 mr-1" /> Atualizar
          </Button>
        )}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-0 divide-y">
          {hasStructuredData ? (
            (activeTemplate?.secoes || []).map(secao => 
              renderViewSection(secao, currentAnamnese!.structured_data!)
            )
          ) : (
            currentAnamnese && renderLegacyView(currentAnamnese)
          )}
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Anamneses
            </DialogTitle>
            <DialogDescription>
              Visualize as versões anteriores da anamnese do paciente
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {anamneseHistory.map((anamnese) => (
                <div
                  key={anamnese.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                    anamnese.is_current && "border-primary bg-primary/5"
                  )}
                  onClick={() => setSelectedVersion(anamnese)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={anamnese.is_current ? 'default' : 'outline'}>
                        v{anamnese.version}
                      </Badge>
                      {anamnese.is_current && (
                        <Badge variant="secondary" className="text-xs">Atual</Badge>
                      )}
                      {anamnese.template_id && (
                        <Badge variant="outline" className="text-[10px]">
                          {allTemplates.find(t => t.id === anamnese.template_id)?.nome || 'Modelo'}
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(parseISO(anamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {anamnese.created_by_name && ` • ${anamnese.created_by_name}`}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version Detail Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Anamnese - Versão {selectedVersion?.version}
            </DialogTitle>
            <DialogDescription>
              {selectedVersion && format(parseISO(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {selectedVersion?.created_by_name && ` • ${selectedVersion.created_by_name}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            {selectedVersion && (
              selectedVersion.structured_data && Object.keys(selectedVersion.structured_data).length > 0 ? (
                <div className="space-y-4 pr-4">
                  {(activeTemplate?.secoes || []).map(secao => {
                    const filledFields = secao.campos.filter(c => {
                      const v = selectedVersion.structured_data?.[c.id];
                      if (Array.isArray(v)) return v.length > 0;
                      return v !== undefined && v !== null && v !== '';
                    });
                    if (filledFields.length === 0) return null;
                    return (
                      <div key={secao.id}>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                          <SectionIcon name={secao.icon} className="h-3.5 w-3.5" />
                          {secao.titulo}
                        </h4>
                        {filledFields.map(campo => {
                          const val = selectedVersion.structured_data?.[campo.id];
                          const display = Array.isArray(val) ? val.join(', ') : String(val);
                          return (
                            <div key={campo.id} className="mb-2">
                              <Label className="text-xs text-muted-foreground">{campo.label}</Label>
                              <p className="text-sm whitespace-pre-wrap">{display}</p>
                            </div>
                          );
                        })}
                        <Separator className="my-3" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4 pr-4">
                  {[
                    { label: 'Queixa Principal', value: selectedVersion.queixa_principal },
                    { label: 'HDA', value: selectedVersion.historia_doenca_atual },
                    { label: 'Antecedentes Pessoais', value: selectedVersion.antecedentes_pessoais },
                    { label: 'Antecedentes Familiares', value: selectedVersion.antecedentes_familiares },
                    { label: 'Hábitos de Vida', value: selectedVersion.habitos_vida },
                    { label: 'Medicamentos', value: selectedVersion.medicamentos_uso_continuo },
                    { label: 'Alergias', value: selectedVersion.alergias },
                    { label: 'Comorbidades', value: selectedVersion.comorbidades },
                  ].filter(s => s.value).map(s => (
                    <div key={s.label}>
                      <Label className="text-muted-foreground">{s.label}</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{s.value}</p>
                      <Separator className="mt-3" />
                    </div>
                  ))}
                </div>
              )
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVersion(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Editor Dialog */}
      <AnamnesisTemplateBuilderDialog
        open={showTemplateEditor}
        onOpenChange={setShowTemplateEditor}
        template={editingV2Template}
      />
    </div>
  );
}
