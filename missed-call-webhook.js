import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.urlencoded({ extended: false }));

const KAPSO_API_KEY = process.env.KAPSO_API_KEY;
const KAPSO_PHONE_NUMBER_ID = process.env.KAPSO_PHONE_NUMBER_ID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

/**
 * POST /webhook/missed-call
 * 
 * Receives Twilio missed call webhook.
 * Sends WhatsApp utility template via Kapso to the caller.
 */
app.post('/webhook/missed-call', async (req, res) => {
  try {
    // Verify Twilio signature (optional but recommended)
    const signature = req.get('X-Twilio-Signature') || '';
    if (TWILIO_AUTH_TOKEN && !verifyTwilioRequest(signature, req)) {
      console.warn('Invalid Twilio signature');
      return res.status(403).send('Forbidden');
    }

    const { From, To, CallSid, CallStatus } = req.body;

    if (!From) {
      console.error('Missing caller number (From)');
      return res.status(400).json({ error: 'Missing caller number' });
    }

    console.log(`Missed call from ${From} to ${To} (${CallSid})`);

    // Send WhatsApp utility template via Kapso
    const result = await sendWhatsAppTemplate(From);
    
    console.log(`WhatsApp sent to ${From}:`, result);
    return res.status(200).json({ success: true, messageId: result.messageId });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Send WhatsApp utility template via Kapso API
 */
async function sendWhatsAppTemplate(recipientPhoneNumber) {
  if (!KAPSO_API_KEY || !KAPSO_PHONE_NUMBER_ID) {
    throw new Error('Kapso credentials not configured. Set KAPSO_API_KEY and KAPSO_PHONE_NUMBER_ID.');
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: recipientPhoneNumber,
    type: 'template',
    template: {
      name: 'missed_call', // Update this to your actual template name
      language: {
        code: 'en_US'
      }
      // Add parameters if your template uses variables
      // parameters: {
      //   body: {
      //     parameters: ['value1', 'value2']
      //   }
      // }
    }
  };

  const response = await fetch(`https://api.kapso.ai/v1/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KAPSO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kapso API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return {
    messageId: data.messages?.[0]?.id || 'unknown',
    status: data.messages?.[0]?.message_status || 'sent'
  };
}

/**
 * Verify Twilio request signature
 * (Optional: use twilio-node SDK's validateRequest helper in production)
 */
function verifyTwilioRequest(signature, req) {
  // Simplified check; for production, use Twilio's SDK
  // This is a placeholder. Real verification requires computing HMAC.
  return true; // Skip for now; Twilio console can test without it
}

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Missed-call webhook listening on port ${PORT}`);
  });
}

export default app;
