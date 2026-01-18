import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Types
export interface TicketLog {
  id: string;
  ticket_id: string;
  actor_id: string | null;
  action: string;
  old_value: any;
  new_value: any;
  metadata: any;
  created_at: string;
}

export interface TicketTag {
  id: string;
  ticket_id: string;
  tag: string;
  confidence: number;
  source: string;
  created_at: string;
}

export interface SLAConfig {
  id: string;
  name: string;
  priority: string;
  user_type: string;
  first_response_minutes: number;
  resolution_minutes: number;
  escalation_minutes: number;
}

export interface TicketCSAT {
  id: string;
  ticket_id: string;
  rating: number;
  feedback?: string;
  resolution_quality?: number;
  response_speed?: number;
  created_at: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  keywords: string[];
  usage_count: number;
}

export interface SLADeadlines {
  first_response_deadline: string;
  resolution_deadline: string;
  escalation_deadline: string;
  sla_name?: string;
  first_response_minutes?: number;
  resolution_minutes?: number;
}

// Hook: Ticket Logs (Audit Trail)
export const useTicketLogs = (ticketId: string) => {
  return useQuery({
    queryKey: ['ticket-logs', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_logs')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TicketLog[];
    },
    enabled: !!ticketId
  });
};

// Hook: Ticket Tags
export const useTicketTags = (ticketId: string) => {
  return useQuery({
    queryKey: ['ticket-tags', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_tags')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('confidence', { ascending: false });

      if (error) throw error;
      return data as TicketTag[];
    },
    enabled: !!ticketId
  });
};

// Hook: Add Tag
export const useAddTicketTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, tag }: { ticketId: string; tag: string }) => {
      const { data, error } = await supabase
        .from('ticket_tags')
        .upsert({
          ticket_id: ticketId,
          tag,
          source: 'manual',
          confidence: 1.0
        }, { onConflict: 'ticket_id,tag' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-tags', ticketId] });
    }
  });
};

// Hook: Remove Tag
export const useRemoveTicketTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, tag }: { ticketId: string; tag: string }) => {
      const { error } = await supabase
        .from('ticket_tags')
        .delete()
        .eq('ticket_id', ticketId)
        .eq('tag', tag);

      if (error) throw error;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-tags', ticketId] });
    }
  });
};

// Hook: SLA Deadlines
export const useSLADeadlines = (ticketId: string) => {
  return useQuery({
    queryKey: ['sla-deadlines', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('calculate_sla_deadline', { p_ticket_id: ticketId });

      if (error) throw error;
      return data as unknown as SLADeadlines;
    },
    enabled: !!ticketId,
    refetchInterval: 60000 // Refresh every minute
  });
};

// Hook: CSAT
export const useTicketCSAT = (ticketId: string) => {
  return useQuery({
    queryKey: ['ticket-csat', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_csat')
        .select('*')
        .eq('ticket_id', ticketId)
        .maybeSingle();

      if (error) throw error;
      return data as TicketCSAT | null;
    },
    enabled: !!ticketId
  });
};

// Hook: Submit CSAT
export const useSubmitCSAT = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      rating,
      feedback,
      resolutionQuality,
      responseSpeed
    }: {
      ticketId: string;
      rating: number;
      feedback?: string;
      resolutionQuality?: number;
      responseSpeed?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get ticket to find agent
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('assigned_to')
        .eq('id', ticketId)
        .single();

      const { data, error } = await supabase
        .from('ticket_csat')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          rating,
          feedback,
          resolution_quality: resolutionQuality,
          response_speed: responseSpeed,
          agent_id: ticket?.assigned_to
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-csat', ticketId] });
    }
  });
};

// Hook: Knowledge Base Articles
export const useKnowledgeBase = (category?: string) => {
  return useQuery({
    queryKey: ['knowledge-base', category],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_base')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KnowledgeArticle[];
    }
  });
};

// Hook: AI Suggestions
export const useAISuggestions = (ticketId: string, category: string, content: string) => {
  return useQuery({
    queryKey: ['ai-suggestions', ticketId, category],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('support-ai', {
        body: { ticketId, category, content }
      });

      if (error) throw error;
      return data?.suggestions || [];
    },
    enabled: !!ticketId && !!content && content.length > 10,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Hook: AI Analyze Ticket
export const useAnalyzeTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      subject,
      description,
      category
    }: {
      ticketId: string;
      subject: string;
      description: string;
      category: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('support-ai?action=analyze', {
        body: { ticketId, subject, description, category }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-tags', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
    }
  });
};

// Hook: Escalate Ticket
export const useEscalateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      reason
    }: {
      ticketId: string;
      reason: string;
    }) => {
      // Get super admin
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'SUPER_ADMIN')
        .limit(1);

      const adminId = admins?.[0]?.user_id;

      const { error } = await supabase
        .from('support_tickets')
        .update({
          escalated_at: new Date().toISOString(),
          escalated_to: adminId,
          escalation_reason: reason,
          priority: 'urgent'
        })
        .eq('id', ticketId);

      if (error) throw error;

      // Create notification
      if (adminId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: adminId,
            title: '🚨 Ticket escaladé manuellement',
            message: `Raison: ${reason}`,
            type: 'escalation',
            action_url: `/dashboard/admin/support/${ticketId}`
          });
      }
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-logs', ticketId] });
    }
  });
};

// Hook: Real-time ticket updates
export const useTicketRealtime = (ticketId: string, onUpdate: () => void) => {
  useEffect(() => {
    if (!ticketId) return;

    let channel: RealtimeChannel;

    const setupRealtime = () => {
      channel = supabase
        .channel(`ticket-${ticketId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'support_tickets',
            filter: `id=eq.${ticketId}`
          },
          () => onUpdate()
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ticket_messages',
            filter: `ticket_id=eq.${ticketId}`
          },
          () => onUpdate()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ticket_tags',
            filter: `ticket_id=eq.${ticketId}`
          },
          () => onUpdate()
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [ticketId, onUpdate]);
};

// Hook: CSAT Stats
export const useCSATStats = () => {
  return useQuery({
    queryKey: ['csat-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_csat')
        .select('rating, resolution_quality, response_speed');

      if (error) throw error;

      const ratings = data || [];
      const count = ratings.length;

      if (count === 0) {
        return {
          averageRating: 0,
          averageResolution: 0,
          averageSpeed: 0,
          count: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRating = 0;
      let totalResolution = 0;
      let resolutionCount = 0;
      let totalSpeed = 0;
      let speedCount = 0;

      for (const r of ratings) {
        totalRating += r.rating;
        distribution[r.rating as keyof typeof distribution]++;
        if (r.resolution_quality) {
          totalResolution += r.resolution_quality;
          resolutionCount++;
        }
        if (r.response_speed) {
          totalSpeed += r.response_speed;
          speedCount++;
        }
      }

      return {
        averageRating: Math.round((totalRating / count) * 10) / 10,
        averageResolution: resolutionCount ? Math.round((totalResolution / resolutionCount) * 10) / 10 : 0,
        averageSpeed: speedCount ? Math.round((totalSpeed / speedCount) * 10) / 10 : 0,
        count,
        distribution
      };
    }
  });
};
