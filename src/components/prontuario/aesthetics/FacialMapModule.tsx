 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
 import { 
   MapPin, 
   Plus, 
   Download, 
   History,
   Syringe,
   Eye,
   EyeOff,
  FileText,
  Save,
 } from "lucide-react";
 import { format, parseISO } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { FacialMapSVG } from "./FacialMapSVG";
 import { ApplicationPointDialog } from "./ApplicationPointDialog";
 import { useFacialMap } from "@/hooks/aesthetics";
import type { FacialMapApplication, ViewType, ProcedureType } from "./types";
 import { 
   PROCEDURE_TYPE_LABELS, 
   VIEW_TYPE_LABELS, 
   FACIAL_MUSCLES,
   SIDE_LABELS,
  MAP_TYPE_LABELS,
 } from "./types";
 
 interface FacialMapModuleProps {
   patientId: string;
   appointmentId?: string | null;
   canEdit?: boolean;
 }
 
 export function FacialMapModule({ 
   patientId, 
   appointmentId,
   canEdit = false,
 }: FacialMapModuleProps) {
   const [viewType, setViewType] = useState<ViewType>('frontal');
   const [isEditing, setIsEditing] = useState(false);
   const [selectedPoint, setSelectedPoint] = useState<FacialMapApplication | null>(null);
   const [newPointPosition, setNewPointPosition] = useState<{ x: number; y: number } | null>(null);
   const [dialogOpen, setDialogOpen] = useState(false);
   const [showHistory, setShowHistory] = useState(false);
   const [filterType, setFilterType] = useState<string>('all');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
 
   const { 
    facialMap,
     applications, 
     allApplications,
     isLoading, 
     addApplication,
     updateApplication,
     deleteApplication,
    updateMapNotes,
    isCreatingMap,
   } = useFacialMap(patientId, showHistory ? null : appointmentId);
 
   const displayApplications = showHistory ? allApplications : applications;
 
   // Filter by procedure type
   const filteredApplications = filterType === 'all' 
     ? displayApplications 
     : displayApplications.filter(a => a.procedure_type === filterType);

  // Start editing notes
  const handleEditNotes = () => {
    setNotesValue(facialMap?.general_notes || '');
    setEditingNotes(true);
  };

  // Save notes
  const handleSaveNotes = async () => {
    await updateMapNotes(notesValue);
    setEditingNotes(false);
  };
 
   const handleMapClick = (x: number, y: number) => {
     if (!isEditing || !canEdit) return;
     setNewPointPosition({ x, y });
     setSelectedPoint(null);
     setDialogOpen(true);
   };
 
   const handlePointClick = (point: FacialMapApplication) => {
     setSelectedPoint(point);
     setNewPointPosition(null);
     setDialogOpen(true);
   };
 
   const handleSavePoint = async (data: Partial<FacialMapApplication>) => {
     if (selectedPoint) {
       await updateApplication({ id: selectedPoint.id, data });
     } else if (newPointPosition) {
       await addApplication({
         ...data,
         position_x: newPointPosition.x,
         position_y: newPointPosition.y,
         view_type: viewType,
       });
     }
     setSelectedPoint(null);
     setNewPointPosition(null);
   };
 
   const handleDeletePoint = async () => {
     if (selectedPoint) {
       await deleteApplication(selectedPoint.id);
       setSelectedPoint(null);
       setDialogOpen(false);
     }
   };
 
   const getMuscleName = (muscleId: string | null | undefined): string => {
     if (!muscleId) return '-';
     const muscle = FACIAL_MUSCLES.find(m => m.id === muscleId);
     return muscle?.name || muscleId;
   };
 
   // Calculate totals
  const totals = filteredApplications.reduce<Record<string, { count: number; quantity: number }>>((acc, app) => {
     if (!acc[app.procedure_type]) {
       acc[app.procedure_type] = { count: 0, quantity: 0 };
     }
     acc[app.procedure_type].count++;
     acc[app.procedure_type].quantity += app.quantity;
     return acc;
  }, {});
 
   if (isLoading) {
     return (
       <Card>
         <CardHeader>
           <Skeleton className="h-6 w-48" />
         </CardHeader>
         <CardContent>
           <Skeleton className="h-[400px] w-full" />
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="space-y-4">
       <Card>
         <CardHeader className="pb-3">
           <div className="flex items-center justify-between">
             <CardTitle className="flex items-center gap-2">
               <MapPin className="h-5 w-5 text-primary" />
               Mapa Facial
              {facialMap && (
                <Badge variant="outline" className="ml-2">
                  {MAP_TYPE_LABELS[facialMap.map_type as keyof typeof MAP_TYPE_LABELS]}
                </Badge>
              )}
             </CardTitle>
             <div className="flex items-center gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setShowHistory(!showHistory)}
               >
                 {showHistory ? (
                   <>
                     <EyeOff className="h-4 w-4 mr-1" />
                     Atendimento Atual
                   </>
                 ) : (
                   <>
                     <History className="h-4 w-4 mr-1" />
                     Ver Histórico
                   </>
                 )}
               </Button>
               {canEdit && (
                 <Button
                   variant={isEditing ? "secondary" : "default"}
                   size="sm"
                   onClick={() => setIsEditing(!isEditing)}
                 >
                   {isEditing ? (
                     <>
                       <Eye className="h-4 w-4 mr-1" />
                       Visualizar
                     </>
                   ) : (
                     <>
                       <Plus className="h-4 w-4 mr-1" />
                       Editar
                     </>
                   )}
                 </Button>
               )}
               <Button variant="outline" size="sm">
                 <Download className="h-4 w-4 mr-1" />
                 PDF
               </Button>
             </div>
           </div>
         </CardHeader>
         <CardContent>
          {/* General Notes Section */}
          {facialMap && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Observações Gerais
                </div>
                {canEdit && !editingNotes && (
                  <Button variant="ghost" size="sm" onClick={handleEditNotes}>
                    Editar
                  </Button>
                )}
              </div>
              {editingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Adicione observações gerais sobre o mapa facial..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNotes}>
                      <Save className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingNotes(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {facialMap.general_notes || 'Nenhuma observação registrada.'}
                </p>
              )}
            </div>
          )}

           {/* View Type Selector */}
           <Tabs value={viewType} onValueChange={(v) => setViewType(v as ViewType)} className="mb-4">
             <TabsList className="grid grid-cols-3 w-full max-w-md">
               {Object.entries(VIEW_TYPE_LABELS).map(([key, label]) => (
                 <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
               ))}
             </TabsList>
           </Tabs>
 
           {/* Filter by procedure type */}
           <div className="flex gap-2 mb-4">
             <Button 
               variant={filterType === 'all' ? 'default' : 'outline'} 
               size="sm"
               onClick={() => setFilterType('all')}
             >
               Todos ({displayApplications.length})
             </Button>
             {Object.entries(PROCEDURE_TYPE_LABELS).map(([key, label]) => {
               const count = displayApplications.filter(a => a.procedure_type === key).length;
               return (
                 <Button
                   key={key}
                   variant={filterType === key ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => setFilterType(key)}
                 >
                   {label} ({count})
                 </Button>
               );
             })}
           </div>
 
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* SVG Map */}
             <div className="border rounded-lg p-4 bg-muted/20">
               {isEditing && (
                 <p className="text-sm text-muted-foreground mb-2 text-center">
                   Clique no mapa para adicionar um ponto de aplicação
                 </p>
               )}
               <FacialMapSVG
                 viewType={viewType}
                 applications={filteredApplications}
                 selectedPointId={selectedPoint?.id}
                 onPointClick={handlePointClick}
                 onMapClick={handleMapClick}
                 isEditing={isEditing}
               />
             </div>
 
             {/* Applications List */}
             <div className="space-y-4">
               {/* Totals */}
               {Object.keys(totals).length > 0 && (
                 <div className="grid grid-cols-3 gap-2">
                   {Object.entries(totals).map(([type, data]) => (
                     <Card key={type} className="p-3">
                       <div className="text-xs text-muted-foreground">
                          {PROCEDURE_TYPE_LABELS[type as ProcedureType]}
                       </div>
                       <div className="text-lg font-bold">
                         {data.quantity} {type === 'toxin' ? 'UI' : 'ml'}
                       </div>
                       <div className="text-xs text-muted-foreground">
                         {data.count} ponto(s)
                       </div>
                     </Card>
                   ))}
                 </div>
               )}
 
               {/* List */}
               <ScrollArea className="h-[350px] pr-3">
                 <div className="space-y-2">
                   {filteredApplications.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">
                       <Syringe className="h-12 w-12 mx-auto mb-3 opacity-30" />
                       <p>Nenhum ponto de aplicação registrado</p>
                       {canEdit && (
                         <p className="text-sm mt-1">
                           Clique em "Editar" e depois no mapa para adicionar
                         </p>
                       )}
                     </div>
                   ) : (
                     filteredApplications.map((app) => (
                       <Card 
                         key={app.id} 
                         className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                         onClick={() => handlePointClick(app)}
                       >
                         <div className="flex items-start justify-between">
                           <div className="space-y-1">
                             <div className="flex items-center gap-2">
                               <Badge 
                                 variant="secondary"
                                 className={
                                   app.procedure_type === 'toxin' ? 'bg-red-100 text-red-700' :
                                   app.procedure_type === 'filler' ? 'bg-blue-100 text-blue-700' :
                                   'bg-green-100 text-green-700'
                                 }
                               >
                                 {PROCEDURE_TYPE_LABELS[app.procedure_type]}
                               </Badge>
                               <span className="font-medium">{app.product_name}</span>
                             </div>
                             <div className="text-sm text-muted-foreground">
                               {app.quantity} {app.unit}
                               {app.muscle && ` • ${getMuscleName(app.muscle)}`}
                               {app.side && ` • ${SIDE_LABELS[app.side]}`}
                             </div>
                             {showHistory && (
                               <div className="text-xs text-muted-foreground">
                                 {format(parseISO(app.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                               </div>
                             )}
                           </div>
                         </div>
                       </Card>
                     ))
                   )}
                 </div>
               </ScrollArea>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Edit Dialog */}
       <ApplicationPointDialog
         open={dialogOpen}
         onOpenChange={setDialogOpen}
         point={selectedPoint || (newPointPosition ? { 
           position_x: newPointPosition.x, 
           position_y: newPointPosition.y,
           view_type: viewType,
         } : null)}
         onSave={handleSavePoint}
         onDelete={selectedPoint ? handleDeletePoint : undefined}
         isNew={!selectedPoint}
       />
     </div>
   );
 }