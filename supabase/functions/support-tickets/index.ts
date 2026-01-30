import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
}

// ============================================
// AI SENTIMENT ANALYSIS FOR PRIORITY
// ============================================

const URGENT_KEYWORDS = [
  'urgent', 'urgence', 'immédiat', 'bloqué', 'impossible', 'fraude',
  'volé', 'arnaque', 'erreur grave', 'compte bloqué', 'argent perdu',
  'deadline', 'panique', 'aide', 'au secours', 'catastrophe'
]

const HIGH_PRIORITY_KEYWORDS = [
  'problème', 'erreur', 'bug', 'ne fonctionne pas', 'incorrect',
  'refusé', 'rejeté', 'contestation', 'plainte', 'réclamation',
  'remboursement', 'échec', 'échoué'
]

const LOW_PRIORITY_KEYWORDS = [
  'question', 'information', 'renseignement', 'comment', 'pourquoi',
  'suggestion', 'amélioration', 'fonctionnalité', 'feedback'
]

interface PriorityResult {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reason: string
  sentimentScore: number
}

function analyzePriority(subject: string, description: string): PriorityResult {
  const text = `${subject} ${description}`.toLowerCase()
  
  // Check for urgent keywords
  for (const keyword of URGENT_KEYWORDS) {
    if (text.includes(keyword)) {
      return {
        priority: 'urgent',
        reason: `Mot-clé urgent détecté: "${keyword}"`,
        sentimentScore: 0.9
      }
    }
  }
  
  // Check for high priority keywords
  for (const keyword of HIGH_PRIORITY_KEYWORDS) {
    if (text.includes(keyword)) {
      return {
        priority: 'high',
        reason: `Problème signalé: "${keyword}"`,
        sentimentScore: 0.7
      }
    }
  }
  
  // Check for low priority keywords
  for (const keyword of LOW_PRIORITY_KEYWORDS) {
    if (text.includes(keyword)) {
      return {
        priority: 'low',
        reason: `Demande d'information`,
        sentimentScore: 0.3
      }
    }
  }
  
  // Default to medium
  return {
    priority: 'medium',
    reason: 'Priorité standard',
    sentimentScore: 0.5
  }
}

// ============================================
// TYPES
// ============================================

interface CreateTicketRequest {
  subject: string
  description: string
  category: 'technical' | 'billing' | 'score_dispute' | 'identity' | 'general'
  attachments?: any[]
  related_certificate_id?: string
  related_kyc_id?: string
}

interface AddMessageRequest {
  ticket_id: string
  content: string
  attachments?: any[]
  is_internal?: boolean
}

interface UpdateTicketRequest {
  ticket_id: string
  status?: string
  priority?: string
  assigned_to?: string
  internal_notes?: string
  tags?: string[]
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Verify auth
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authorization required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get user role
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = userRole?.role || 'EMPRUNTEUR'
  const isAdmin = role === 'SUPER_ADMIN'
  const isPartner = role === 'PARTENAIRE'

  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  try {
    // ============================================
    // CREATE TICKET
    // ============================================
    if (req.method === 'POST' && action === 'create') {
      const body: CreateTicketRequest = await req.json()
      
      if (!body.subject || !body.description) {
        return new Response(
          JSON.stringify({ error: 'Subject and description required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // AI Priority Analysis
      const priorityResult = analyzePriority(body.subject, body.description)

      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: body.subject,
          description: body.description,
          category: body.category || 'general',
          priority: priorityResult.priority,
          ai_priority_reason: priorityResult.reason,
          ai_sentiment_score: priorityResult.sentimentScore,
          attachments: body.attachments || [],
          related_certificate_id: body.related_certificate_id,
          related_kyc_id: body.related_kyc_id
        })
        .select('*')
        .single()

      if (error) {
        console.error('[SUPPORT] Create ticket error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create ticket', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create initial message
      await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        author_id: user.id,
        author_role: 'user',
        content: body.description,
        attachments: body.attachments || []
      })

      // Send notification to admins
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Ticket créé',
        message: `Votre ticket #${ticket.ticket_number} a été créé avec succès.`,
        type: 'success',
        link: `/dashboard/borrower/support/${ticket.id}`
      })

      console.log(`[SUPPORT] Ticket created: ${ticket.ticket_number} by ${user.id}`)

      return new Response(
        JSON.stringify({ success: true, data: ticket }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============================================
    // ADD MESSAGE TO TICKET
    // ============================================
    if (req.method === 'POST' && action === 'message') {
      const body: AddMessageRequest = await req.json()
      
      if (!body.ticket_id || !body.content) {
        return new Response(
          JSON.stringify({ error: 'ticket_id and content required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify access to ticket
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', body.ticket_id)
        .single()

      if (!ticket) {
        return new Response(
          JSON.stringify({ error: 'Ticket not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check access
      const canAccess = isAdmin || 
        ticket.user_id === user.id || 
        ticket.assigned_to === user.id ||
        ticket.partner_id === user.id

      if (!canAccess) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Determine author role
      let authorRole = 'user'
      if (isAdmin || ticket.assigned_to === user.id) {
        authorRole = 'agent'
      } else if (isPartner) {
        authorRole = 'partner'
      }

      const { data: message, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: body.ticket_id,
          author_id: user.id,
          author_role: authorRole,
          content: body.content,
          attachments: body.attachments || [],
          is_internal: body.is_internal && (isAdmin || isPartner)
        })
        .select('*')
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to add message' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update ticket status and first_response_at
      const updates: any = { updated_at: new Date().toISOString() }
      
      if (authorRole === 'agent' && !ticket.first_response_at) {
        updates.first_response_at = new Date().toISOString()
      }
      
      if (authorRole === 'agent' && ticket.status === 'new') {
        updates.status = 'in_progress'
      } else if (authorRole === 'user' && ticket.status === 'waiting_user') {
        updates.status = 'in_progress'
      }

      await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', body.ticket_id)

      // Send notification
      const notifyUserId = authorRole === 'agent' ? ticket.user_id : ticket.assigned_to
      if (notifyUserId && notifyUserId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: notifyUserId,
          title: 'Nouvelle réponse',
          message: `Nouvelle réponse sur le ticket #${ticket.ticket_number}`,
          type: 'info',
          link: isAdmin 
            ? `/dashboard/admin/support/${ticket.id}` 
            : `/dashboard/borrower/support/${ticket.id}`
        })
      }

      return new Response(
        JSON.stringify({ success: true, data: message }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============================================
    // UPDATE TICKET (Admin/Agent only)
    // Accept PATCH (recommended) and POST (backward compatibility)
    // ============================================
    if ((req.method === 'PATCH' || req.method === 'POST') && action === 'update') {
      const body: UpdateTicketRequest = await req.json()
      
      if (!body.ticket_id) {
        return new Response(
          JSON.stringify({ error: 'ticket_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get ticket
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', body.ticket_id)
        .single()

      if (!ticket) {
        return new Response(
          JSON.stringify({ error: 'Ticket not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Only admins and assigned agents can update
      if (!isAdmin && ticket.assigned_to !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Only admins can update tickets' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updates: any = { updated_at: new Date().toISOString() }
      
      if (body.status) {
        updates.status = body.status
        if (body.status === 'resolved') updates.resolved_at = new Date().toISOString()
        if (body.status === 'closed') updates.closed_at = new Date().toISOString()
      }
      if (body.priority) updates.priority = body.priority
      if (body.assigned_to) updates.assigned_to = body.assigned_to
      if (body.internal_notes) updates.internal_notes = body.internal_notes
      if (body.tags) updates.tags = body.tags

      const { data: updated, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', body.ticket_id)
        .select('*')
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to update ticket' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Notify user of status change
      if (body.status && body.status !== ticket.status) {
        await supabase.from('notifications').insert({
          user_id: ticket.user_id,
          title: 'Ticket mis à jour',
          message: `Le statut de votre ticket #${ticket.ticket_number} a changé: ${body.status}`,
          type: 'info'
        })
      }

      return new Response(
        JSON.stringify({ success: true, data: updated }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============================================
    // GET STATISTICS (Admin only)
    // Accept GET (recommended) and POST (backward compatibility)
    // ============================================
    if ((req.method === 'GET' || req.method === 'POST') && action === 'stats') {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Total tickets by status
      const { data: statusCounts } = await supabase
        .from('support_tickets')
        .select('status')

      const byStatus: Record<string, number> = {}
      statusCounts?.forEach(t => {
        byStatus[t.status] = (byStatus[t.status] || 0) + 1
      })

      // Tickets this week
      const { count: weeklyCount } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())

      // Average response time
      const { data: responseData } = await supabase
        .from('support_tickets')
        .select('created_at, first_response_at')
        .not('first_response_at', 'is', null)
        .limit(100)

      let avgResponseMinutes = 0
      if (responseData && responseData.length > 0) {
        const totalMinutes = responseData.reduce((sum, t) => {
          const created = new Date(t.created_at).getTime()
          const responded = new Date(t.first_response_at!).getTime()
          return sum + (responded - created) / (1000 * 60)
        }, 0)
        avgResponseMinutes = Math.round(totalMinutes / responseData.length)
      }

      // Priority distribution
      const { data: priorityData } = await supabase
        .from('support_tickets')
        .select('priority')
        .in('status', ['new', 'in_progress', 'waiting_user'])

      const byPriority: Record<string, number> = {}
      priorityData?.forEach(t => {
        byPriority[t.priority] = (byPriority[t.priority] || 0) + 1
      })

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            total: statusCounts?.length || 0,
            open: (byStatus.new || 0) + (byStatus.in_progress || 0) + (byStatus.waiting_user || 0),
            byStatus,
            byPriority,
            weeklyCount: weeklyCount || 0,
            avgResponseMinutes
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (e: any) {
    console.error('[SUPPORT] Error:', e)
    return new Response(
      JSON.stringify({ error: 'Internal error', details: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
