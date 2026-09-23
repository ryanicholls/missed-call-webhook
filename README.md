# Missed-Call WhatsApp Webhook

Twilio missed-call webhook that sends a WhatsApp utility template via Kapso API.

## Setup

### 1. Deploy to Vercel

```bash
vercel deploy
```

You'll get a URL like: `https://your-project.vercel.app`

### 2. Add Environment Variables

In Vercel dashboard, go to **Settings > Environment Variables** and add:

- `KAPSO_API_KEY` — Your Kapso API key
- `KAPSO_PHONE_NUMBER_ID` — Your Kapso phone number ID
- `TWILIO_AUTH_TOKEN` — Your Twilio auth token (optional, for signature verification)

### 3. Configure Twilio

In Twilio console:

1. Go to your phone number
2. Under **Voice & Fax**:
   - **When a call comes in:** (no-op)
   - **When a call ends:** POST to `https://your-project.vercel.app/webhook/missed-call`
3. Save

### 4. Update Webhook Template Name

In `missed-call-webhook.js`, line ~67, set your actual template name:

```javascript
template: {
  name: 'your_template_name_here', // ← Update this
  language: { code: 'en_US' }
}
```

If your template takes parameters (e.g., customer name, job type), uncomment and populate:

```javascript
parameters: {
  body: {
    parameters: ['param1', 'param2']
  }
}
```

## Test

**Health check:**

```bash
curl https://your-project.vercel.app/health
```

**Simulate missed call** (from Twilio console):

1. Call your Twilio number and let it ring
2. Check webhook logs in Vercel dashboard
3. Check if WhatsApp arrives at recipient

## Logs

View real-time logs:

```bash
vercel logs
```

Or in Vercel dashboard: **Functions > Logs**

## Troubleshooting

- **No WhatsApp sent:** Check Kapso credentials and template name
- **Webhook not firing:** Verify URL in Twilio console matches your deployment
- **Signature error:** Auth token may be wrong; check Twilio account details
