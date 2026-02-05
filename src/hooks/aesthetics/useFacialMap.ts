 import { useState, useCallback } from 'react';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useClinicData } from '@/hooks/useClinicData';
 import { toast } from 'sonner';
 import type { FacialMapApplication, ProcedureType, ViewType, SideType } from '@/components/prontuario/aesthetics/types';
 
 export function useFacialMap(patientId: string | null, appointmentId?: string | null) {
   const { clinic } = useClinicData();
   const queryClient = useQueryClient();
 
   const queryKey = ['facial-map', patientId, appointmentId];
 
   // Fetch applications
   const { data: applications = [], isLoading } = useQuery({
     queryKey,
     queryFn: async () => {
       if (!patientId || !clinic?.id) return [];
 
       let query = supabase
         .from('facial_map_applications')
         .select('*')
         .eq('clinic_id', clinic.id)
         .eq('patient_id', patientId)
         .order('created_at', { ascending: false });
 
       // Filter by appointment if provided
       if (appointmentId) {
         query = query.eq('appointment_id', appointmentId);
       }
 
       const { data, error } = await query;
 
       if (error) {
         console.error('Error fetching facial map:', error);
         throw error;
       }
 
       return data as FacialMapApplication[];
     },
     enabled: !!patientId && !!clinic?.id,
   });
 
   // Add application point
   const addApplicationMutation = useMutation({
     mutationFn: async (data: Partial<FacialMapApplication>) => {
       if (!patientId || !clinic?.id) throw new Error('Missing required data');
 
       const { data: userData } = await supabase.auth.getUser();
 
       const { data: result, error } = await supabase
         .from('facial_map_applications')
         .insert({
           clinic_id: clinic.id,
           patient_id: patientId,
           appointment_id: appointmentId || null,
           procedure_type: data.procedure_type as ProcedureType,
           view_type: data.view_type as ViewType,
           position_x: data.position_x!,
           position_y: data.position_y!,
           muscle: data.muscle || null,
           product_name: data.product_name!,
           quantity: data.quantity!,
           unit: data.unit || 'UI',
           side: data.side as SideType || null,
           notes: data.notes || null,
           created_by: userData.user?.id,
         })
         .select()
         .single();
 
       if (error) throw error;
       return result;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey });
       toast.success('Ponto de aplicação adicionado');
     },
     onError: (error) => {
       console.error('Error adding application:', error);
       toast.error('Erro ao adicionar ponto');
     },
   });
 
   // Update application point
   const updateApplicationMutation = useMutation({
     mutationFn: async ({ id, data }: { id: string; data: Partial<FacialMapApplication> }) => {
       const { error } = await supabase
         .from('facial_map_applications')
         .update({
           procedure_type: data.procedure_type as ProcedureType,
           muscle: data.muscle || null,
           product_name: data.product_name,
           quantity: data.quantity,
           unit: data.unit,
           side: data.side as SideType || null,
           notes: data.notes || null,
         })
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey });
       toast.success('Ponto atualizado');
     },
     onError: (error) => {
       console.error('Error updating application:', error);
       toast.error('Erro ao atualizar ponto');
     },
   });
 
   // Delete application point
   const deleteApplicationMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('facial_map_applications')
         .delete()
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey });
       toast.success('Ponto removido');
     },
     onError: (error) => {
       console.error('Error deleting application:', error);
       toast.error('Erro ao remover ponto');
     },
   });
 
   // Get all applications for history (all appointments)
   const { data: allApplications = [], isLoading: historyLoading } = useQuery({
     queryKey: ['facial-map-history', patientId],
     queryFn: async () => {
       if (!patientId || !clinic?.id) return [];
 
       const { data, error } = await supabase
         .from('facial_map_applications')
         .select('*')
         .eq('clinic_id', clinic.id)
         .eq('patient_id', patientId)
         .order('created_at', { ascending: false });
 
       if (error) {
         console.error('Error fetching facial map history:', error);
         throw error;
       }
 
       return data as FacialMapApplication[];
     },
     enabled: !!patientId && !!clinic?.id,
   });
 
   return {
     applications,
     allApplications,
     isLoading,
     historyLoading,
     addApplication: addApplicationMutation.mutateAsync,
     updateApplication: updateApplicationMutation.mutateAsync,
     deleteApplication: deleteApplicationMutation.mutateAsync,
     isAdding: addApplicationMutation.isPending,
     isUpdating: updateApplicationMutation.isPending,
     isDeleting: deleteApplicationMutation.isPending,
   };
 }