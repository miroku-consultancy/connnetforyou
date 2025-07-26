// utils/whatsappService.js
const fetch = require('node-fetch');

async function sendWhatsappMessage(to, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_ID;

  const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

module.exports = { sendWhatsappMessage };
