const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();

// LINE config
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// LINE ต้องใช้ raw body เพื่อ verify signature
app.post(
  '/webhook',
  bodyParser.raw({ type: '*/*' }),
  line.middleware(config),
  async (req, res) => {
    const events = req.body.events || JSON.parse(req.body.toString()).events;

    const results = await Promise.all(events.map(async (event) => {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;

        try {
          const gptResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-3.5-turbo-0125',
              messages: [
                {
                  role: 'system',
                  content: 'คุณเป็นผู้ช่วยที่ให้ข้อมูลในเรื่องทั่วไป เช่น อาหาร ออกกำลังกาย การใช้ชีวิต พูดไทยสุภาพ และตอบให้เข้าใจง่าย',
                },
                {
                  role: 'user',
                  content: userMessage,
                },
              ],
              max_tokens: 200,
            },
            {
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Project': process.env.OPENAI_PROJECT_ID,
                'OpenAI-Organization': process.env.OPENAI_ORG_ID,
              },
            }
          );

          const replyRaw = gptResponse.data.choices[0].message.content;
          const replyText = typeof replyRaw === 'string'
            ? replyRaw.trim()
            : 'ขออภัย ระบบขัดข้อง ตอบกลับผิดพลาด';

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
  }
);

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ LINE bot is running on port ${PORT}`);
});
