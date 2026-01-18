import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple PDF generation using raw PDF syntax
function generatePdfContent(invoice: any): Uint8Array {
  const formatAmount = (amount: number) => amount.toLocaleString('fr-FR')
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const planName = invoice.metadata?.plan_name || 'Abonnement Wouaka'
  const customerName = invoice.metadata?.customer_name || 'Client'
  const customerEmail = invoice.metadata?.customer_email || ''
  const companyName = invoice.metadata?.company_name || ''

  // Create PDF content
  const content = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj

4 0 obj
<< /Length 2500 >>
stream
BT
/F2 24 Tf
50 780 Td
(FACTURE) Tj
ET

BT
/F1 10 Tf
400 780 Td
(Wouaka SAS) Tj
0 -14 Td
(Abidjan, Cote d'Ivoire) Tj
0 -14 Td
(contact@wouaka-creditscore.com) Tj
ET

BT
/F2 12 Tf
50 720 Td
(Facture N: ${invoice.invoice_number}) Tj
ET

BT
/F1 10 Tf
50 700 Td
(Date d'emission: ${formatDate(invoice.issued_at)}) Tj
0 -14 Td
(Date de paiement: ${invoice.paid_at ? formatDate(invoice.paid_at) : 'En attente'}) Tj
ET

BT
/F2 11 Tf
50 650 Td
(FACTURE A:) Tj
ET

BT
/F1 10 Tf
50 635 Td
(${customerName}) Tj
0 -14 Td
(${companyName}) Tj
0 -14 Td
(${customerEmail}) Tj
ET

BT
/F2 11 Tf
50 570 Td
(DETAILS DE LA COMMANDE) Tj
ET

BT
/F1 10 Tf
50 550 Td
(Description) Tj
350 550 Td
(Montant) Tj
ET

BT
/F1 10 Tf
50 530 Td
(${planName} - Abonnement mensuel) Tj
350 530 Td
(${formatAmount(invoice.amount)} ${invoice.currency}) Tj
ET

BT
/F1 9 Tf
50 510 Td
(________________________________________________________________________________________________________________) Tj
ET

BT
/F2 11 Tf
280 480 Td
(TOTAL:) Tj
350 480 Td
(${formatAmount(invoice.amount)} ${invoice.currency}) Tj
ET

BT
/F1 10 Tf
50 420 Td
(Statut: ${invoice.status === 'paid' ? 'PAYE' : invoice.status.toUpperCase()}) Tj
ET

BT
/F1 9 Tf
50 380 Td
(Mode de paiement: CinetPay) Tj
0 -14 Td
(Reference transaction: ${invoice.metadata?.transaction_id || 'N/A'}) Tj
ET

BT
/F1 8 Tf
50 50 Td
(Wouaka SAS - Credit Scoring Alternatif pour l'Afrique) Tj
0 -12 Td
(Cette facture a ete generee automatiquement et est valide sans signature.) Tj
ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj

xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000002820 00000 n 
0000002897 00000 n 

trailer
<< /Size 7 /Root 1 0 R >>
startxref
2979
%%EOF
`

  return new TextEncoder().encode(content)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check authorization
    const authHeader = req.headers.get('authorization')
    let userId: string | null = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (!authError && user) {
        userId = user.id
      }
    }

    const { invoice_id, transaction_id } = await req.json()

    if (!invoice_id && !transaction_id) {
      return new Response(
        JSON.stringify({ error: 'invoice_id or transaction_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch invoice
    let query = supabase.from('invoices').select('*')
    
    if (invoice_id) {
      query = query.eq('id', invoice_id)
    } else {
      query = query.eq('transaction_id', transaction_id)
    }

    const { data: invoice, error: fetchError } = await query.single()

    if (fetchError || !invoice) {
      console.error('[Generate Invoice] Invoice not found:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user access (if authenticated as user, not service)
    if (userId && invoice.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[Generate Invoice] Generating PDF for invoice:', invoice.invoice_number)

    // Generate PDF
    const pdfContent = generatePdfContent(invoice)

    // Upload to storage
    const fileName = `${invoice.user_id}/${invoice.invoice_number}.pdf`
    
    const { error: uploadError } = await supabase
      .storage
      .from('invoices')
      .upload(fileName, pdfContent, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('[Generate Invoice] Upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload PDF', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('invoices')
      .createSignedUrl(fileName, 3600)

    if (signedUrlError) {
      console.error('[Generate Invoice] Signed URL error:', signedUrlError)
    }

    // Update invoice with PDF URL
    await supabase
      .from('invoices')
      .update({ pdf_url: fileName })
      .eq('id', invoice.id)

    console.log('[Generate Invoice] PDF generated successfully:', fileName)

    return new Response(
      JSON.stringify({
        success: true,
        invoice_number: invoice.invoice_number,
        pdf_url: signedUrlData?.signedUrl || null,
        file_path: fileName
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Generate Invoice] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
