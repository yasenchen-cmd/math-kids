/**
 * 支付 API Worker
 *
 * 环境变量（wrangler.toml 中配置）：
 * - UNLOCK_KV: KV namespace
 * - HUOPIJAO_APP_ID: 虎皮椒 AppID
 * - HUOPIJAO_APP_SECRET: 虎皮椒密钥
 * - CALLBACK_URL: 本 Worker 的回调地址
 * - PRICE: 金额（分），默认 990 = ¥9.9
 * - ADMIN_KEY: 管理员密钥，用于人工解锁
 */

const CALLBACK_TOKEN = 'mn_math_2024'
const DEFAULT_ADMIN_KEY = 'mn_unlock_2024'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      if (path === '/api/create-order' && method === 'POST') {
        return await handleCreateOrder(request, env, corsHeaders)
      }
      if (path === '/api/check-order' && method === 'GET') {
        return await handleCheckOrder(request, env, corsHeaders)
      }
      if (path === '/api/check-unlock' && method === 'GET') {
        return await handleCheckUnlock(request, env, corsHeaders)
      }
      // 管理员人工解锁
      if (path === '/api/admin-unlock' && method === 'GET') {
        return await handleAdminUnlock(request, env, corsHeaders)
      }
      if (path === '/api/hupijiao-callback' && method === 'POST') {
        return await handleCallback(request, env, corsHeaders)
      }
      if (path === '/api/health') {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      return new Response('Not Found', { status: 404 })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
  },
}

async function handleCreateOrder(request, env, corsHeaders) {
  const { device_id } = await request.json()
  if (!device_id) {
    return new Response(JSON.stringify({ error: 'device_id required' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const existing = await env.UNLOCK_KV.get(`unlock:${device_id}`)
  if (existing) {
    return new Response(JSON.stringify({ unlocked: true, message: '已解锁' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const order_id = `MN${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const price = env.PRICE || '990'

  await env.UNLOCK_KV.put(
    `order:${order_id}`,
    JSON.stringify({ device_id, status: 'pending', created_at: Date.now() }),
    { expirationTtl: 86400 }
  )

  let qr_url = null
  let order_url = null

  if (env.HUOPIJAO_APP_ID && env.HUOPIJAO_APP_SECRET) {
    try {
      const hpRes = await fetch('https://api.xorpay.com/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          appid: env.HUOPIJAO_APP_ID,
          appsecret: env.HUOPIJAO_APP_SECRET,
          price: price,
          orderid: order_id,
          orderuid: device_id.slice(0, 32),
          notify_url: `${env.CALLBACK_URL}?token=${CALLBACK_TOKEN}`,
          return_url: '',
        }),
      })
      const hpData = await hpRes.json()
      if (hpData.status === 1) {
        qr_url = hpData.qr
        order_url = hpData.url
        await env.UNLOCK_KV.put(
          `order:${order_id}`,
          JSON.stringify({ device_id, status: 'submitted', hp_order_id: hpData.order_id, created_at: Date.now() }),
          { expirationTtl: 86400 }
        )
      }
    } catch (e) {}
  }

  return new Response(JSON.stringify({
    order_id,
    price: parseInt(price),
    qr_url,
    order_url,
    demo_mode: !qr_url,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

async function handleCheckOrder(request, env, corsHeaders) {
  const order_id = new URL(request.url).searchParams.get('order_id')
  if (!order_id) {
    return new Response(JSON.stringify({ error: 'order_id required' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
  const data = await env.UNLOCK_KV.get(`order:${order_id}`)
  if (!data) {
    return new Response(JSON.stringify({ status: 'not_found' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
  const order = JSON.parse(data)
  return new Response(JSON.stringify({
    status: order.status,
    device_id: order.device_id,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

async function handleCheckUnlock(request, env, corsHeaders) {
  const device_id = new URL(request.url).searchParams.get('device_id')
  if (!device_id) {
    return new Response(JSON.stringify({ error: 'device_id required' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
  const data = await env.UNLOCK_KV.get(`unlock:${device_id}`)
  return new Response(JSON.stringify({ unlocked: !!data }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

// ===== 管理员人工解锁（收到微信转账后调用）=====
// 用法：GET /api/admin-unlock?device_id=xxx&key=你的密钥
async function handleAdminUnlock(request, env, corsHeaders) {
  const params = new URL(request.url).searchParams
  const device_id = params.get('device_id')
  const key = params.get('key')
  const adminKey = env.ADMIN_KEY || DEFAULT_ADMIN_KEY

  if (!device_id || key !== adminKey) {
    return new Response(JSON.stringify({ error: 'invalid key or device_id' }), {
      status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  await env.UNLOCK_KV.put(`unlock:${device_id}`, JSON.stringify({
    device_id,
    paid_at: Date.now(),
    expires_at: Date.now() + 365 * 24 * 60 * 60 * 1000,
    method: 'manual',
  }))

  return new Response(JSON.stringify({ unlocked: true, device_id }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

async function handleCallback(request, env, corsHeaders) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  if (token !== CALLBACK_TOKEN) return new Response('forbidden', { status: 403 })

  const formData = await request.formData()
  const order_id = formData.get('orderid')
  const status = formData.get('status')
  const hp_order_id = formData.get('api_orderid')
  if (!order_id || status !== '1') return new Response('fail')

  const data = await env.UNLOCK_KV.get(`order:${order_id}`)
  if (!data) return new Response('order_not_found')
  const order = JSON.parse(data)
  const device_id = order.device_id

  await env.UNLOCK_KV.put(`order:${order_id}`,
    JSON.stringify({ ...order, status: 'paid', hp_order_id }),
    { expirationTtl: 86400 }
  )
  await env.UNLOCK_KV.put(`unlock:${device_id}`, JSON.stringify({
    device_id, order_id,
    paid_at: Date.now(),
    expires_at: Date.now() + 365 * 24 * 60 * 60 * 1000,
  }))
  return new Response('success')
}
