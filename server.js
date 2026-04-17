import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3001

// Parse large JSON bodies (base64 images can be several MB)
app.use(express.json({ limit: '50mb' }))
app.use(cors())

// ---------------------------------------------------------------------------
// OpenAI client (lazy init)
// ---------------------------------------------------------------------------
let openai = null

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    openai = new OpenAI({ apiKey })
  }
  return openai
}

// ---------------------------------------------------------------------------
// POST /api/generate — Generate captions via GPT-4o Vision
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a social media copywriter for a professional roofing company based in England, UK.
CRITICAL: You must use strict British English spelling and grammar (e.g., labour, bespoke).

Given the attached photo(s) of our recent roofing work, analyze the image for materials, scope, and craftsmanship, and generate 4 platform-specific captions.

RULES PER PLATFORM:

facebook: Casual, conversational, maximum 3 sentences, ends with a question to boost engagement. No hashtags.

instagram: Punchy opening line, 2 descriptive sentences about the work, a blank line, then 20 relevant hashtags (e.g., #roofingUK, #localtrades).

linkedin: Professional tone, opens with a business insight about the work shown, 3 short bullet points highlighting quality/expertise, ends with a call to action. Max 2-3 hashtags.

google_business: Maximum 2 sentences, plain factual language. Must naturally include the word "roofing" and reference {{Region}} for local SEO.

RESPONSE FORMAT:
Respond ONLY with valid JSON in the exact shape below. Use \n for line breaks within the strings. Do not use raw unescaped newlines. Return ONLY the raw JSON object.
{
"facebook": "...",
"instagram": "...",
"linkedin": "...",
"google_business": "..."
}`

const VIDEO_FALLBACK_PROMPT = `The customer uploaded video files of a roofing job but I cannot show you the video. Generate captions for a general roofing project showcase. Focus on quality craftsmanship, weather protection, professional service, and the value of hiring experienced roofers in England, UK.

Respond ONLY with valid JSON in this exact shape:
{
  "facebook": "...",
  "instagram": "...",
  "linkedin": "...",
  "google_business": "..."
}

Do not include any preamble, explanation, or markdown code fences. Return ONLY the JSON object.`

function parseAIResponse(text) {
  // Direct parse
  try { return JSON.parse(text) } catch { }
  // Extract from code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()) } catch { }
  }
  // Find JSON object in text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]) } catch { }
  }
  throw new Error('Failed to parse AI response')
}

app.post('/api/generate', async (req, res) => {
  try {
    const { images, hasOnlyVideos, customPrompt } = req.body
    // images: Array<{ base64: string, mediaType: string }>

    const client = getOpenAI()
    const content = []

    const extraInstruction = customPrompt
      ? `\n\nAdditional instructions from the user: ${customPrompt}`
      : ''

    if (hasOnlyVideos || !images || images.length === 0) {
      content.push({ type: 'text', text: VIDEO_FALLBACK_PROMPT + extraInstruction })
    } else {
      for (const img of images) {
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${img.mediaType};base64,${img.base64}`,
            detail: 'low',
          },
        })
      }
      content.push({
        type: 'text',
        text: `Analyze the image(s) above and generate 4 platform-specific captions following your rules.${extraInstruction}`,
      })
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    })

    const text = response.choices[0]?.message?.content
    if (!text) {
      return res.status(500).json({ error: 'No response from AI' })
    }

    const captions = parseAIResponse(text)
    res.json({ captions })
  } catch (err) {
    console.error('Generate error:', err.message)
    const status = err.status || 500
    res.status(status).json({ error: err.message })
  }
})

// ---------------------------------------------------------------------------
// POST /api/revise — Revise a single platform caption based on user instruction
// ---------------------------------------------------------------------------
const PLATFORM_RULES = {
  facebook: 'Casual, conversational, maximum 3 sentences, ends with a question. No hashtags.',
  instagram: 'Punchy opening line, 2 descriptive sentences, a blank line, then 20 relevant hashtags (e.g. #roofingUK).',
  linkedin: 'Professional tone, 3 short bullet points highlighting quality/expertise, ends with a CTA. Max 2-3 hashtags.',
  google_business: 'Maximum 2 sentences, plain factual language. Must naturally include the word "roofing" and reference a region in England for local SEO.',
}

app.post('/api/revise', async (req, res) => {
  try {
    const { platform, currentCaption, instruction } = req.body
    if (!platform || !currentCaption || !instruction) {
      return res.status(400).json({ error: 'platform, currentCaption, and instruction are required' })
    }
    const rules = PLATFORM_RULES[platform] || 'Follow standard social media best practices.'
    const client = getOpenAI()
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a social media copywriter for a professional roofing company in England, UK. Use strict British English spelling and grammar.\n\nPlatform rules for ${platform}: ${rules}\n\nRevise captions to follow these rules exactly while applying the user's instruction.`,
        },
        {
          role: 'user',
          content: `Current caption:\n${currentCaption}\n\nRevision instruction: ${instruction}\n\nReturn ONLY the revised caption text. No JSON, no preamble, no explanation.`,
        },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    })
    const caption = response.choices[0]?.message?.content?.trim()
    if (!caption) return res.status(500).json({ error: 'No response from AI' })
    res.json({ caption })
  } catch (err) {
    console.error('Revise error:', err.message)
    res.status(err.status || 500).json({ error: err.message })
  }
})

// ---------------------------------------------------------------------------
// POST /api/upload — Upload image to GHL Media Library, return public URL
// ---------------------------------------------------------------------------
app.post('/api/upload', async (req, res) => {
  try {
    const { base64, fileName, mediaType } = req.body

    const ghlApiKey = process.env.GHL_API_KEY
    const ghlLocationId = process.env.GHL_LOCATION_ID

    if (!ghlApiKey || !ghlLocationId) {
      return res.status(500).json({
        error: 'GHL_API_KEY and GHL_LOCATION_ID environment variables are required',
      })
    }

    if (!base64) {
      return res.status(400).json({ error: 'No image data provided' })
    }

    // Convert base64 back to a binary buffer
    const buffer = Buffer.from(base64, 'base64')
    const mimeType = mediaType || 'image/jpeg'
    const name = fileName || `roofpost-${Date.now()}.jpg`

    // GHL Media Library upload uses multipart/form-data
    // Node 22+ has FormData and Blob built-in
    const form = new FormData()
    form.append('file', new Blob([buffer], { type: mimeType }), name)
    form.append('locationId', ghlLocationId)
    form.append('name', name)

    const ghlRes = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ghlApiKey}`,
        Version: '2021-07-28',
      },
      body: form,
    })

    if (!ghlRes.ok) {
      const errText = await ghlRes.text()
      console.error('GHL upload error:', ghlRes.status, errText)
      return res.status(ghlRes.status).json({
        error: `GHL Media Library upload failed (${ghlRes.status})`,
        details: errText,
      })
    }

    const ghlData = await ghlRes.json()
    console.log('GHL upload response shape:', JSON.stringify(ghlData, null, 2))

    // GHL returns the file URL in the response
    const fileUrl = ghlData?.data?.url || ghlData?.url || ghlData?.fileUrl

    if (!fileUrl) {
      console.error('GHL upload response (no URL found):', JSON.stringify(ghlData))
      return res.status(500).json({ error: 'GHL upload succeeded but no URL returned', raw: ghlData })
    }

    res.json({ url: fileUrl })
  } catch (err) {
    console.error('Upload error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ---------------------------------------------------------------------------
// POST /api/schedule — Schedule post directly via GHL Social Planner API
// ---------------------------------------------------------------------------
// App platform id → GHL platform key
const GHL_PLATFORM = {
  facebook: 'facebook',
  instagram: 'instagram',
  linkedin: 'linkedin',
  google_business: 'google',
}

let accountsCache = null
let accountsCacheTime = 0
const ACCOUNTS_TTL_MS = 5 * 60 * 1000

async function getSocialAccounts() {
  if (accountsCache && Date.now() - accountsCacheTime < ACCOUNTS_TTL_MS) {
    return accountsCache
  }
  const ghlApiKey = process.env.GHL_API_KEY
  const ghlLocationId = process.env.GHL_LOCATION_ID
  const res = await fetch(
    `https://services.leadconnectorhq.com/social-media-posting/${ghlLocationId}/accounts`,
    { headers: { Authorization: `Bearer ${ghlApiKey}`, Version: '2021-07-28' } }
  )
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to fetch GHL accounts (${res.status}): ${txt}`)
  }
  const data = await res.json()
  accountsCache = data.results?.accounts || []
  accountsCacheTime = Date.now()
  return accountsCache
}

app.post('/api/schedule', async (req, res) => {
  try {
    const { platform, caption, scheduleDate, imageUrl, imageType } = req.body

    const ghlApiKey = process.env.GHL_API_KEY
    const ghlLocationId = process.env.GHL_LOCATION_ID
    const ghlUserId = process.env.GHL_USER_ID
    if (!ghlApiKey || !ghlLocationId || !ghlUserId) {
      return res.status(500).json({
        error: 'GHL_API_KEY, GHL_LOCATION_ID and GHL_USER_ID environment variables are required',
      })
    }

    const ghlPlatform = GHL_PLATFORM[platform]
    if (!ghlPlatform) {
      return res.status(400).json({ error: `Unknown platform: ${platform}` })
    }

    const accounts = await getSocialAccounts()
    const account = accounts.find((a) => a.platform === ghlPlatform)
    if (!account) {
      return res.status(400).json({ error: `No connected ${ghlPlatform} account in this location` })
    }

    const body = {
      type: 'post',
      status: 'scheduled',
      accountIds: [account.id],
      summary: caption,
      scheduleDate: new Date(scheduleDate).toISOString(),
      userId: ghlUserId,
      media: imageUrl ? [{ url: imageUrl, type: imageType || 'image/jpeg' }] : [],
    }

    const ghlRes = await fetch(
      `https://services.leadconnectorhq.com/social-media-posting/${ghlLocationId}/posts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ghlApiKey}`,
          Version: '2021-07-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    const respText = await ghlRes.text()
    if (!ghlRes.ok) {
      console.error('GHL schedule error:', ghlRes.status, respText)
      return res.status(ghlRes.status).json({
        error: `GHL rejected post (${ghlRes.status})`,
        details: respText,
      })
    }

    const respData = JSON.parse(respText)
    const postId = respData?.post?._id || respData?.results?._id || respData?._id
    res.json({ ok: true, postId })
  } catch (err) {
    console.error('Schedule error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    openai: !!process.env.OPENAI_API_KEY,
    ghl: !!process.env.GHL_API_KEY,
    ghlLocation: !!process.env.GHL_LOCATION_ID,
    ghlUser: !!process.env.GHL_USER_ID,
  })
})

// ---------------------------------------------------------------------------
// Serve built frontend in production
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')))
  app.get('*', (_req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`  OpenAI key:      ${process.env.OPENAI_API_KEY ? '✓ configured' : '✗ MISSING'}`)
  console.log(`  GHL API key:     ${process.env.GHL_API_KEY ? '✓ configured' : '✗ MISSING'}`)
  console.log(`  GHL Location ID: ${process.env.GHL_LOCATION_ID ? '✓ configured' : '✗ MISSING'}`)
  console.log(`  GHL User ID:     ${process.env.GHL_USER_ID ? '✓ configured' : '✗ MISSING'}`)
})
