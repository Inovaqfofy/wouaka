import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI-powered ticket analysis
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // ACTION: Analyze ticket (auto-tagging, priority, frustration score)
    if (action === 'analyze') {
      const { ticketId, subject, description, category } = await req.json();
      
      const analysis = analyzeTicket(subject, description, category);
      
      // Update ticket with AI analysis
      await supabase
        .from('support_tickets')
        .update({
          frustration_score: analysis.frustrationScore,
          ai_priority_reason: analysis.priorityReason,
          ai_suggested_category: analysis.suggestedCategory,
          priority: analysis.suggestedPriority
        })
        .eq('id', ticketId);

      // Insert AI tags
      if (analysis.tags.length > 0) {
        const tagInserts = analysis.tags.map(tag => ({
          ticket_id: ticketId,
          tag: tag.name,
          confidence: tag.confidence,
          source: 'ai'
        }));

        await supabase
          .from('ticket_tags')
          .upsert(tagInserts, { onConflict: 'ticket_id,tag' });
      }

      // Log the AI analysis
      await supabase
        .from('ticket_logs')
        .insert({
          ticket_id: ticketId,
          actor_id: null,
          action: 'ai_analyzed',
          new_value: analysis,
          metadata: { source: 'support-ai' }
        });

      return new Response(JSON.stringify({ success: true, analysis }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ACTION: Get suggested responses
    if (action === 'suggest') {
      const { ticketId, category, content } = await req.json();

      // Get relevant knowledge base articles
      const { data: articles } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(5);

      // Simple keyword matching for suggestions
      const keywords = extractKeywords(content);
      
      const suggestions = (articles || [])
        .map(article => {
          const matchScore = calculateMatchScore(keywords, article.keywords || [], article.content);
          return {
            id: article.id,
            title: article.title,
            content: article.content,
            matchScore,
            category: article.category
          };
        })
        .filter(s => s.matchScore > 0.2)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ACTION: Check SLA and escalate if needed
    if (action === 'check-escalation') {
      const now = new Date();
      
      // Find tickets that need escalation
      const { data: ticketsToEscalate } = await supabase
        .from('support_tickets')
        .select(`
          id, 
          ticket_number,
          subject,
          priority,
          created_at,
          user_id,
          assigned_to,
          escalated_at
        `)
        .in('status', ['new', 'open'])
        .in('priority', ['high', 'urgent'])
        .is('escalated_at', null);

      const escalatedTickets = [];

      for (const ticket of ticketsToEscalate || []) {
        // Calculate SLA deadline
        const { data: slaData } = await supabase
          .rpc('calculate_sla_deadline', { p_ticket_id: ticket.id });
        
        if (slaData?.escalation_deadline) {
          const escalationDeadline = new Date(slaData.escalation_deadline);
          
          if (now > escalationDeadline) {
            // Find super admin to escalate to
            const { data: admins } = await supabase
              .from('user_roles')
              .select('user_id')
              .eq('role', 'SUPER_ADMIN')
              .limit(1);

            const adminId = admins?.[0]?.user_id;

            // Escalate the ticket
            await supabase
              .from('support_tickets')
              .update({
                escalated_at: now.toISOString(),
                escalated_to: adminId,
                escalation_reason: `SLA dépassé: ${slaData.sla_name || 'Default'}. Délai d'escalade: ${slaData.escalation_deadline}`,
                priority: 'urgent'
              })
              .eq('id', ticket.id);

            // Create notification
            if (adminId) {
              await supabase
                .from('notifications')
                .insert({
                  user_id: adminId,
                  title: `🚨 Ticket escaladé: ${ticket.ticket_number}`,
                  message: `Le ticket "${ticket.subject}" a été escaladé automatiquement (SLA dépassé).`,
                  type: 'escalation',
                  action_url: `/dashboard/admin/support/${ticket.id}`,
                  metadata: { ticket_id: ticket.id }
                });
            }

            escalatedTickets.push(ticket.id);
          }
        }
      }

      return new Response(JSON.stringify({ 
        escalated: escalatedTickets.length,
        tickets: escalatedTickets 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ACTION: Send CSAT survey
    if (action === 'send-csat') {
      const { ticketId } = await req.json();

      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('id, user_id, ticket_number, subject, csat_sent_at')
        .eq('id', ticketId)
        .single();

      if (!ticket || ticket.csat_sent_at) {
        return new Response(JSON.stringify({ 
          success: false, 
          reason: ticket?.csat_sent_at ? 'Already sent' : 'Ticket not found' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update ticket to mark CSAT as sent
      await supabase
        .from('support_tickets')
        .update({ csat_sent_at: new Date().toISOString() })
        .eq('id', ticketId);

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: ticket.user_id,
          title: '⭐ Donnez votre avis!',
          message: `Comment s'est passée la résolution de votre ticket "${ticket.subject}"?`,
          type: 'csat_request',
          action_url: `/dashboard/borrower/support/${ticketId}?csat=true`,
          metadata: { ticket_id: ticketId }
        });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Support AI error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ===== AI Analysis Functions =====

interface TagResult {
  name: string;
  confidence: number;
}

interface AnalysisResult {
  frustrationScore: number;
  suggestedPriority: string;
  priorityReason: string;
  suggestedCategory: string;
  tags: TagResult[];
  sentiment: string;
}

function analyzeTicket(subject: string, description: string, category: string): AnalysisResult {
  const text = `${subject} ${description}`.toLowerCase();
  
  // Frustration keywords with weights
  const frustrationKeywords = {
    'urgent': 0.3, 'urgence': 0.3, 'immédiat': 0.3,
    'bloqué': 0.4, 'impossible': 0.4, 'ne fonctionne pas': 0.4,
    'attends depuis': 0.5, 'plusieurs jours': 0.4, 'semaines': 0.5,
    'scandaleux': 0.8, 'inacceptable': 0.7, 'honteux': 0.8,
    'arnaque': 0.9, 'voleur': 0.9, 'escroquerie': 0.9,
    'en colère': 0.6, 'furieux': 0.7, 'marre': 0.5,
    'crédit refusé': 0.6, 'refus': 0.4, 'rejeté': 0.5,
    'score injuste': 0.6, 'erreur': 0.3, 'bug': 0.3,
    'aide': 0.1, 'question': 0.0, 'merci': -0.2
  };

  let frustrationScore = 0.3; // Base score
  let matchedFrustration: string[] = [];

  for (const [keyword, weight] of Object.entries(frustrationKeywords)) {
    if (text.includes(keyword)) {
      frustrationScore += weight;
      if (weight > 0.3) matchedFrustration.push(keyword);
    }
  }

  frustrationScore = Math.min(1, Math.max(0, frustrationScore));

  // Priority determination
  let suggestedPriority = 'medium';
  let priorityReason = 'Priorité standard basée sur le contenu.';

  if (frustrationScore >= 0.7) {
    suggestedPriority = 'urgent';
    priorityReason = `Frustration élevée détectée: ${matchedFrustration.join(', ')}`;
  } else if (frustrationScore >= 0.5) {
    suggestedPriority = 'high';
    priorityReason = `Signes de frustration: ${matchedFrustration.join(', ')}`;
  } else if (text.includes('question') || text.includes('comment')) {
    suggestedPriority = 'low';
    priorityReason = 'Question simple ou demande d\'information.';
  }

  // Tag extraction
  const tags: TagResult[] = [];
  
  const tagPatterns = {
    '#ScoringIssue': ['score', 'scoring', 'note', 'évaluation', 'notation', 'certificat'],
    '#KycProblem': ['kyc', 'identité', 'document', 'vérification', 'cni', 'passeport'],
    '#PaymentIssue': ['paiement', 'facturation', 'mobile money', 'transaction', 'argent'],
    '#TechnicalBug': ['bug', 'erreur', 'ne fonctionne pas', 'problème technique', 'plantage'],
    '#AccessIssue': ['connexion', 'mot de passe', 'accès', 'compte bloqué', 'login'],
    '#Urgent': ['urgent', 'urgence', 'immédiat', 'critique'],
    '#NewUser': ['nouveau', 'première fois', 'inscription', 'débuter'],
    '#DataDispute': ['données incorrectes', 'information fausse', 'erreur', 'contester']
  };

  for (const [tag, keywords] of Object.entries(tagPatterns)) {
    const matchCount = keywords.filter(kw => text.includes(kw)).length;
    if (matchCount > 0) {
      tags.push({
        name: tag,
        confidence: Math.min(1, matchCount * 0.3 + 0.4)
      });
    }
  }

  // Category suggestion
  let suggestedCategory = category;
  if (text.includes('score') || text.includes('scoring') || text.includes('certificat')) {
    suggestedCategory = 'score_dispute';
  } else if (text.includes('kyc') || text.includes('identité') || text.includes('document')) {
    suggestedCategory = 'identity';
  } else if (text.includes('paiement') || text.includes('facture') || text.includes('argent')) {
    suggestedCategory = 'billing';
  } else if (text.includes('bug') || text.includes('erreur') || text.includes('technique')) {
    suggestedCategory = 'technical';
  }

  // Sentiment
  let sentiment = 'neutral';
  if (frustrationScore >= 0.6) sentiment = 'negative';
  else if (frustrationScore <= 0.2) sentiment = 'positive';

  return {
    frustrationScore: Math.round(frustrationScore * 100) / 100,
    suggestedPriority,
    priorityReason,
    suggestedCategory,
    tags,
    sentiment
  };
}

function extractKeywords(text: string): string[] {
  const stopWords = ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou', 'je', 'mon', 'ma', 'mes', 'pour', 'dans', 'sur', 'avec', 'pas', 'ne', 'que', 'qui', 'est', 'sont', 'ai', 'a', 'avons', 'avoir', 'été'];
  
  return text.toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôùûüç]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
}

function calculateMatchScore(queryKeywords: string[], articleKeywords: string[], content: string): number {
  let score = 0;
  const contentLower = content.toLowerCase();
  
  // Match against article keywords
  for (const kw of queryKeywords) {
    if (articleKeywords.some(ak => ak.includes(kw) || kw.includes(ak))) {
      score += 0.3;
    }
    if (contentLower.includes(kw)) {
      score += 0.1;
    }
  }
  
  return Math.min(1, score);
}
