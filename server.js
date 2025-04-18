const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

const app = express();
app.use(express.json()); // สำคัญมากในการรับ JSON body จาก LINE

// LINE config
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

app.post('/webhook', line.middleware(config), async (req, res) => {
  const events = req.body.events;

  const results = await Promise.all(events.map(async (event) => {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;

      try {
        const gptResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: userMessage }],
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
              'OpenAI-Project': process.env.OPENAI_PROJECT_ID,
              'OpenAI-Organization': process.env.OPENAI_ORG_ID
            },
          }
        );

        const replyText = gptResponse.data.choices[0].message.content.trim();

        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: replyText,
        });

      } catch (error) {
        console.error('❌ GPT error:', error.response?.data || error.message);

        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'ขออภัย ระบบขัดข้อง ลองใหม่อีกครั้งครับ 🙏',
        });
      }
    }
  }));

  res.json(results);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ LINE bot is running on port ${PORT}`);
});
