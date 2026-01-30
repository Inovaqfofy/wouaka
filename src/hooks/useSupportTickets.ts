import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type TicketStatus = "new" | "in_progress" | "waiting_user" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory = "technical" | "billing" | "score_dispute" | "identity" | "general";

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  assigned_to: string | null;
  partner_id: string | null;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  ai_priority_reason: string | null;
  ai_sentiment_score: number | null;
  frustration_score: number | null;
  ai_suggested_category: string | null;
  ai_summary: string | null;
  sla_first_response_at: string | null;
  sla_resolution_at: string | null;
  sla_breached: boolean;
  escalated_at: string | null;
  escalated_to: string | null;
  escalation_reason: string | null;
  related_certificate_id: string | null;
  related_kyc_id: string | null;
  attachments: any[];
  tags: string[];
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  csat_sent_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  // Joined data
  user?: { full_name: string; email: string };
  assigned_agent?: { full_name: string; email: string };
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  author_role: "user" | "agent" | "partner" | "system";
  content: string;
  attachments: any[];
  is_internal: boolean;
  is_automated: boolean;
  created_at: string;
  edited_at: string | null;
  read_at: string | null;
  // Joined
  author?: { full_name: string; email: string };
}

export interface TicketStats {
  total: number;
  open: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  weeklyCount: number;
  avgResponseMinutes: number;
}

export function useSupportTickets(filters?: {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
}) {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ["support-tickets", filters, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select(`
          *,
          user:profiles!support_tickets_user_id_fkey(full_name, email),
          assigned_agent:profiles!support_tickets_assigned_to_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status?.length) {
        query = query.in("status", filters.status);
      }
      if (filters?.priority?.length) {
        query = query.in("priority", filters.priority);
      }
      if (filters?.category?.length) {
        query = query.in("category", filters.category);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as SupportTicket[];
    },
    enabled: !!user
  });
}

export function useSupportTicket(ticketId: string) {
  return useQuery({
    queryKey: ["support-ticket", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`
          *,
          user:profiles!support_tickets_user_id_fkey(full_name, email),
          assigned_agent:profiles!support_tickets_assigned_to_fkey(full_name, email)
        `)
        .eq("id", ticketId)
        .single();

      if (error) throw error;
      return data as unknown as SupportTicket;
    },
    enabled: !!ticketId
  });
}

export function useTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: ["ticket-messages", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select(`
          *,
          author:profiles!ticket_messages_author_id_fkey(full_name, email)
        `)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as unknown as TicketMessage[];
    },
    enabled: !!ticketId
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      subject: string;
      description: string;
      category: TicketCategory;
      attachments?: any[];
      related_certificate_id?: string;
      related_kyc_id?: string;
    }) => {
      const { data: result, error } = await supabase.functions.invoke("support-tickets?action=create", {
        body: data
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });
}

export function useAddTicketMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ticket_id: string;
      content: string;
      attachments?: any[];
      is_internal?: boolean;
    }) => {
      const { data: result, error } = await supabase.functions.invoke("support-tickets?action=message", {
        body: data
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", variables.ticket_id] });
      queryClient.invalidateQueries({ queryKey: ["support-ticket", variables.ticket_id] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ticket_id: string;
      status?: TicketStatus;
      priority?: TicketPriority;
      assigned_to?: string;
      internal_notes?: string;
      tags?: string[];
    }) => {
      const { data: result, error } = await supabase.functions.invoke("support-tickets?action=update", {
        method: 'PATCH',
        body: data
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-ticket", variables.ticket_id] });
      toast.success("Ticket mis à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });
}

export function useTicketStats() {
  return useQuery({
    queryKey: ["ticket-stats"],
    queryFn: async () => {
      const { data: result, error } = await supabase.functions.invoke("support-tickets?action=stats", {
        method: 'GET'
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result.data as TicketStats;
    }
  });
}

// Status labels and colors
export const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; color: string }> = {
  new: { label: "Nouveau", color: "bg-blue-500" },
  in_progress: { label: "En cours", color: "bg-yellow-500" },
  waiting_user: { label: "En attente", color: "bg-orange-500" },
  resolved: { label: "Résolu", color: "bg-green-500" },
  closed: { label: "Fermé", color: "bg-gray-500" }
};

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: "Basse", color: "bg-gray-400" },
  medium: { label: "Moyenne", color: "bg-blue-400" },
  high: { label: "Haute", color: "bg-orange-500" },
  urgent: { label: "Urgente", color: "bg-red-600" }
};

export const TICKET_CATEGORY_CONFIG: Record<TicketCategory, { label: string; icon: string }> = {
  technical: { label: "Technique", icon: "🔧" },
  billing: { label: "Facturation", icon: "💳" },
  score_dispute: { label: "Contestation Score", icon: "📊" },
  identity: { label: "Identité", icon: "🪪" },
  general: { label: "Général", icon: "💬" }
};
