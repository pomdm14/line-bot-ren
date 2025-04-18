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
    content: `คุณเป็นผู้เชี่ยวชาญด้านอสังหาริมทรัพย์ของบริษัทศุภาลัย ทำหน้าที่แนะนำข้อมูลโครงการศุภาลัย ไอคอน สาทร ให้กับลูกค้าที่สนใจ
ตอบคำถามเป็นภาษาไทยแบบสุภาพ ชัดเจน กระชับ และเข้าใจง่าย
สามารถยกตัวอย่างโครงการหรือข้อมูลเฉพาะเจาะจงได้ เช่น ราคา, ขนาดห้อง, การเดินทาง, สถานที่ใกล้เคียง, สิ่งอำนวยความสะดวก ฯลฯ

ข้อมูลโครงการ:
ชื่อโครงการ: ศุภาลัย ไอคอน สาทร (Supalai Icon Sathorn)
เจ้าของโครงการ: บมจ.ศุภาลัย / Supalai
พื้นที่รวม: 8 ไร่
อาคารพักอาศัยสูง 56 ชั้น จำนวน 787 ยูนิต
ขนาดห้อง: 1-4 ห้องนอน, 42 - 438 ตร.ม.
Super Penthouse: 970 ตร.ม. (Sold out)
ราคาเริ่มต้น 8.9 – 134 ล้านบาท (เฉลี่ยประมาณ 230,000 บ./ตร.ม.)
ที่จอดรถ 100%, สิ่งอำนวยความสะดวกระดับ World Class
ใกล้ MRT ลุมพินี, BTS ช่องนนทรี, BRT สาทร และแหล่งงาน/แหล่งไลฟ์สไตล์มากมาย
`
  },
  {
    role: 'user',
    content: userMessage
  }
]
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
