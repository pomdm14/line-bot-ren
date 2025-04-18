require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');

const app = express();
const port = process.env.PORT || 3000;

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.Client(config);

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `คุณพิมพ์ว่า: ${event.message.text}`
  });
}

app.get('/', (req, res) => {
  res.send('LINE Bot is running!');
});

app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});
