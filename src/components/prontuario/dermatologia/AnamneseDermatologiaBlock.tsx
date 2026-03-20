/**
 * DERMATOLOGIA - Anamnese Dermatológica Geral (Clínica)
 * 
 * Componente completo para registro de anamnese dermatológica usando
 * o sistema dinâmico de templates (DynamicAnamnesisFormRenderer).
 * Suporta: criação, edição, autosave, histórico e visualização.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Plus,
  History,
  Copy,
  User,
  Calendar,
  FileText,
  Scan,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { useResolvedAnamnesisTemplate } from "@/hooks/prontuario/useResolvedAnamnesisTemplate";
import { useDynamicAnamnesisRecords, type DynamicAnamnesisRecord } from "@/hooks/prontuario/psicologia/useDynamicAnamnesisRecords";
import { DynamicAnamnesisFormRenderer } from "@/components/prontuario/psicologia/DynamicAnamnesisFormRenderer";
import { AnamneseModelSelector } from "@/components/prontuario/AnamneseModelSelector";
import type { Json } from "@/integrations/supabase/types";

interface AnamneseDermatologiaBlockProps {
  patientId: string | null;
  clinicId: string | null;
  appointmentId?: string | null;
  professionalId?: string | null;
  canEdit?: boolean;
  specialtyId?: string | null;
  procedureId?: string | null;
}

export function AnamneseDermatologiaBlock({
  patientId,
  clinicId,
  appointmentId,
  professionalId,
  canEdit = false,
  specialtyId,
  procedureId,
}: AnamneseDermatologiaBlockProps) {
  const { clinic } = useClinicData();
  const dynamicRecords = useDynamicAnamnesisRecords(patientId);

  // Template resolution
  const {
    data: resolvedTemplate,
    allTemplates,
    isLoading: templateLoading,
  } = useResolvedAnamnesisTemplate(specialtyId, procedureId);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<DynamicAnamnesisRecord | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load records on mount
  useEffect(() => {
    dynamicRecords.fetchRecords();
  }, [patientId]);

  // Set initial template
  useEffect(() => {
    if (resolvedTemplate && !selectedTemplateId) {
      setSelectedTemplateId(resolvedTemplate.id);
    }
  }, [resolvedTemplate, selectedTemplateId]);

  // Active template
  const activeTemplate = selectedTemplateId
    ? allTemplates?.find(t => t.id === selectedTemplateId)
    : resolvedTemplate;

  const activeStructure = activeTemplate?.structure || activeTemplate?.campos;

  // Current (latest) record for this specialty
  const currentRecord = dynamicRecords.records.find(
    r => r.template_id === activeTemplate?.id
  ) || dynamicRecords.records[0] || null;

  // Autosave with debounce
  const triggerAutosave = useCallback(() => {
    if (!isEditing || !activeTemplate) return;
    
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    
    autosaveTimer.current = setTimeout(async () => {
      const hasData = Object.values(responses).some(
        v => v !== null && v !== undefined && v !== "" && v !== false
      );
      if (!hasData) return;

      setAutosaveStatus('saving');
      try {
        if (editingRecordId) {
          await dynamicRecords.updateRecord(editingRecordId, responses);
        } else {
          const newId = await dynamicRecords.saveRecord({
            templateId: activeTemplate.id,
            versionId: activeTemplate.current_version_id || activeTemplate.id,
            structure: activeStructure as Json,
            responses,
            specialtyId: specialtyId || null,
            procedureId: procedureId || null,
            appointmentId: appointmentId || null,
          });
          if (newId) setEditingRecordId(newId);
        }
        setAutosaveStatus('saved');
      } catch {
        setAutosaveStatus('error');
      }
    }, 3000);
  }, [isEditing, responses, editingRecordId, activeTemplate, activeStructure, specialtyId, procedureId, appointmentId, dynamicRecords]);

  const handleResponseChange = useCallback((fieldId: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
    setAutosaveStatus('idle');
    triggerAutosave();
  }, [triggerAutosave]);

  // Start new anamnesis
  const handleStartNew = useCallback(() => {
    setResponses({
      data_hora_anamnese: format(new Date(), "dd/MM/yyyy HH:mm"),
    });
    setEditingRecordId(null);
    setIsEditing(true);
    setAutosaveStatus('idle');
  }, []);

  // Edit existing
  const handleStartEdit = useCallback(() => {
    if (currentRecord) {
      setResponses(currentRecord.responses as Record<string, any>);
      setEditingRecordId(currentRecord.id);
      setIsEditing(true);
      setAutosaveStatus('idle');
    }
  }, [currentRecord]);

  // Duplicate
  const handleDuplicate = useCallback(() => {
    if (currentRecord) {
      const duped = { ...(currentRecord.responses as Record<string, any>) };
      duped.data_hora_anamnese = format(new Date(), "dd/MM/yyyy HH:mm");
      setResponses(duped);
      setEditingRecordId(null);
      setIsEditing(true);
      setAutosaveStatus('idle');
      toast.info("Anamnese duplicada. Edite e salve como nova versão.");
    }
  }, [currentRecord]);

  // Save
  const handleSave = useCallback(async () => {
    // Validate required
    const requiredFields = ['queixa_principal', 'descricao_exame_fisico', 'tipo_atendimento'];
    const missing = requiredFields.filter(f => !responses[f]);
    if (missing.length > 0) {
      toast.error("Preencha os campos obrigatórios: " + missing.map(f => {
        if (f === 'queixa_principal') return 'Queixa Principal';
        if (f === 'descricao_exame_fisico') return 'Descrição do Exame Físico';
        if (f === 'tipo_atendimento') return 'Tipo de Atendimento';
        return f;
      }).join(', '));
      return;
    }

    if (!activeTemplate) return;

    try {
      if (editingRecordId) {
        await dynamicRecords.updateRecord(editingRecordId, responses);
      } else {
        await dynamicRecords.saveRecord({
          templateId: activeTemplate.id,
          versionId: activeTemplate.current_version_id || activeTemplate.id,
          structure: activeStructure as Json,
          responses,
          specialtyId: specialtyId || null,
          procedureId: procedureId || null,
          appointmentId: appointmentId || null,
        });
      }
      setIsEditing(false);
      setEditingRecordId(null);
      setAutosaveStatus('idle');
      await dynamicRecords.fetchRecords();
      toast.success("Anamnese dermatológica salva com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar anamnese.");
    }
  }, [responses, editingRecordId, activeTemplate, activeStructure, specialtyId, procedureId, appointmentId, dynamicRecords]);

  // Cancel
  const handleCancel = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setIsEditing(false);
    setEditingRecordId(null);
    setResponses({});
    setAutosaveStatus('idle');
  }, []);

  // Loading
  if (dynamicRecords.loading || templateLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No template found
  if (!activeTemplate || !activeStructure) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Scan className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Modelo de anamnese não encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Nenhum modelo de anamnese dermatológica está disponível para esta especialidade.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Edit mode - use DynamicAnamnesisFormRenderer
  if (isEditing) {
    return (
      <div className="space-y-3">
        {/* Autosave indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Anamnese Dermatológica Geral (Clínica)</h2>
            {autosaveStatus === 'saving' && (
              <Badge variant="outline" className="text-xs animate-pulse">Salvando...</Badge>
            )}
            {autosaveStatus === 'saved' && (
              <Badge variant="outline" className="text-xs text-green-600">Salvo</Badge>
            )}
            {autosaveStatus === 'error' && (
              <Badge variant="destructive" className="text-xs">Erro ao salvar</Badge>
            )}
          </div>
        </div>

        <DynamicAnamnesisFormRenderer
          structure={activeStructure as Json}
          templateName={activeTemplate.name || "Anamnese Dermatológica Geral (Clínica)"}
          responses={responses}
          isEditing={true}
          saving={dynamicRecords.saving}
          canEdit={canEdit}
          onResponseChange={handleResponseChange}
          onSave={handleSave}
          onCancel={handleCancel}
          onStartEdit={handleStartEdit}
        />
      </div>
    );
  }

  // View mode with existing record
  if (currentRecord) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Anamnese Dermatológica</h2>
            <Badge variant="outline" className="text-xs">
              {format(parseISO(currentRecord.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </Badge>
          </div>
          <div className="flex gap-2 flex-wrap">
            {dynamicRecords.records.length > 1 && (
              <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
                <History className="h-4 w-4 mr-1" /> Histórico ({dynamicRecords.records.length})
              </Button>
            )}
            {canEdit && (
              <>
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-1" /> Duplicar
                </Button>
                <Button variant="outline" size="sm" onClick={handleStartNew}>
                  <Plus className="h-4 w-4 mr-1" /> Nova
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Template selector */}
        {allTemplates && allTemplates.length > 1 && (
          <AnamneseModelSelector
            templates={allTemplates}
            selectedId={selectedTemplateId}
            onSelect={setSelectedTemplateId}
          />
        )}

        {/* Record view */}
        <DynamicAnamnesisFormRenderer
          structure={(currentRecord.structure_snapshot || activeStructure) as Json}
          templateName={currentRecord.template_name || "Anamnese Dermatológica Geral (Clínica)"}
          responses={currentRecord.responses as Record<string, any>}
          isEditing={false}
          canEdit={canEdit}
          onResponseChange={() => {}}
          onSave={() => {}}
          onCancel={() => {}}
          onStartEdit={handleStartEdit}
        />

        {/* History dialog */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="shrink-0">
              <DialogTitle>Histórico de Anamneses Dermatológicas</DialogTitle>
              <DialogDescription>
                Versões anteriores da anamnese deste paciente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3">
              {dynamicRecords.records.map((rec) => (
                <Card
                  key={rec.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => {
                    setViewingRecord(rec);
                    setShowHistory(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {format(parseISO(rec.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {rec.created_by_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {rec.created_by_name}
                        </div>
                      )}
                    </div>
                    {(rec.responses as any)?.queixa_principal && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {(rec.responses as any).queixa_principal}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Viewing a specific historical record */}
        <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="shrink-0">
              <DialogTitle>
                Anamnese - {viewingRecord && format(parseISO(viewingRecord.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
              {viewingRecord && (
                <DynamicAnamnesisFormRenderer
                  structure={(viewingRecord.structure_snapshot || activeStructure) as Json}
                  templateName="Anamnese Dermatológica"
                  responses={viewingRecord.responses as Record<string, any>}
                  isEditing={false}
                  canEdit={false}
                  onResponseChange={() => {}}
                  onSave={() => {}}
                  onCancel={() => {}}
                  onStartEdit={() => {}}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Empty state
  return (
    <div className="space-y-4">
      {/* Template selector */}
      {allTemplates && allTemplates.length > 1 && (
        <AnamneseModelSelector
          templates={allTemplates}
          selectedId={selectedTemplateId}
          onSelect={setSelectedTemplateId}
        />
      )}

      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Scan className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhuma anamnese dermatológica registrada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Registre a anamnese dermatológica do paciente para iniciar o acompanhamento clínico.
          </p>
          {canEdit && (
            <Button onClick={handleStartNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Anamnese Dermatológica
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AnamneseDermatologiaBlock;
