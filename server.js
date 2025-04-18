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
            },
          }
        );

        const replyText = gptResponse.data.choices[0].message.content.trim();

        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: replyText,
        });

      } catch (error) {
        console.error('GPT error:', error.message);

        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'ขอโทษครับ ตอนนี้ระบบกำลังมีปัญหา ลองใหม่อีกครั้งนะครับ 🙏',
        });
      }
    }
  }));

  res.json(results);
});
