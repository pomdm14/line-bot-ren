const axios = require('axios');

// แก้ใน handler หลักของคุณ
if (event.type === 'message' && event.message.type === 'text') {
  const userMessage = event.message.text;

  // ส่งไปยัง OpenAI
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
      },
    }
  );

  const replyText = gptResponse.data.choices[0].message.content;

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyText,
  });
}
