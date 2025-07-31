import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MailerLiteSubscriber {
  email: string
  fields?: {
    name?: string
    last_name?: string
  }
  groups?: string[]
  status?: 'active' | 'unsubscribed' | 'unconfirmed' | 'bounced' | 'junk'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, full_name } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare subscriber data
    const subscriberData: MailerLiteSubscriber = {
      email,
      status: 'active',
      groups: ['157027513577506029'] // Your group ID
    }

    // Add name fields if provided
    if (full_name) {
      const nameParts = full_name.trim().split(' ')
      subscriberData.fields = {
        name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || ''
      }
    }

    // Make request to MailerLite API
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiYWVmN2RlNmU0ZjhkZGVjOTg5OGYxMDZhNjdlYTIxYzM0MjhjZWM4MTliYTBlZTY1Y2ZjNGU4OWVjYWI1ZGU1NTE3OThkZmFhNWEzMGFlMzQiLCJpYXQiOjE3NDk4MDIwODMuOTAwMjksIm5iZiI6MTc0OTgwMjA4My45MDAyOTQsImV4cCI6NDkwNTQ3NTY4My44OTU0NDQsInN1YiI6IjE1NjUyNTkiLCJzY29wZXMiOltdfQ.F1FpRpmmrohSjlsz9XuD7RwG4_fHyUHxDDA7r9531Q0qnD88xRa61ssx8aabnxtwybdQNjtEIjOnduEttIcsb65mIvG9Ny47SqLpTk7qFrYN3eGq1L3KNgHcSbLgxGV6TOA3JaLOVxi0qnnXOGifLMwO1-BSX4jiEKPqmRgNqpzL5Zt1FQ9cYvjAbgFLDIP-QQb6NULKMRtKTQ23VvbcMOfC-Yk2E9E44Vz3DumYS_cfL3K0mB0aBs9tShImfOBOU-4vbrkraCTdZfUUe1EdMHxdqoPEvlZQWl4-X_FbV628Gv8PIO20IERBIuGZpa8HN0BdcYsgtVB-_ZVPX00_XPIU5MXjBGdp30Z9th_gv9AsDN8f-TRAV6ddqn0eOlAEcWsyxNDnmyjqZjslWoQBaTKFWM4RK-segc27IuZGgbMsQLYyz-yZD8IEokA6ia2T_jZD6v5zVaRpfKlb5ByoMDfggG749TanCvvKKSsUcZzyMGG_yp1mp4u0YVpv9F-25nKVKPnyCa0XV6fqr1FCh7p-Iy9270xfPnMEQdFcXgt6QQ3q2H9_MyIZHIJ4M_VEkI8Y0Twos0hZIC3xuhKV-MZxz2UPV6DfWnWTIMNskJQdn2sGzQjoEc4HyimZV40mQmXivlZPe85MsW8LyjoKNBFrt-Y4xCkRiZV3p8tw4cc'
      },
      body: JSON.stringify(subscriberData)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('MailerLite API error:', result)
      
      // Handle specific MailerLite errors gracefully
      if (result.message && result.message.includes('already exists')) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User already subscribed',
            data: result 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to add subscriber to MailerLite',
          details: result 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Successfully added to MailerLite',
        data: result 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})