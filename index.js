const line = require('@line/bot-sdk');
const express = require('express');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const { response } = require('express');

dotenv.config();
const PORT=process.env.PORT;
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const CHANNEL_SECRET = process.env.CHANNEL_SECRET;

const config = {
  channelAccessToken: CHANNEL_ACCESS_TOKEN,
  channelSecret: CHANNEL_SECRET
};

const app = express();

// app.use(express.static('public'));

app.get('/', () => {
  console.log("Hello world!");
})

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(error => console.log("middleware error:", error));
});

const client = new line.Client(config);
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const parsedResponse = await parseCommand(event);

  return client.replyMessage(event.replyToken, parsedResponse)
};

const shalatCommand = "sholat";
const Help='help';
async function parseCommand(event) {
  if(event.message.text.includes(shalatCommand)) {
    const cityKeyword = event.message.text.replace(shalatCommand, '').trim();
    return (await handleShalatCommand(cityKeyword));
  }
  else if(event.message.text.includes(Help)){
    return createTextResponse("Cara menggunakannya adalah dengan mengetik 'sholat (lokasi)'.\n\n Contoh : sholat Bekasi");
  }
  else {
  return createTextResponse("Keyword Tidak Valid. Ketik 'help' untuk menunjukkan cara penggunaan");}
}


const createTextResponse = (textContent) => {
  return {
    type: 'text',
    text: textContent
  }
}

async function handleShalatCommand(cityKeyword) {
  const shalatResponse = await fetchShalatData(cityKeyword);
  
  if(shalatResponse.status === okStatus) {
    return createTextResponse(shalatResponse.test)
  }
  return createTextResponse(shalatResponse.message)
}

const  errorStatus = "error";
const okStatus = "ok";
async function fetchShalatData(cityKeyword) {
    
  const shalatResponse = await fetch(`https://api.banghasan.com/sholat/format/json/kota/nama/${cityKeyword}`)
    .then(result => {
      if(result.status === okStatus){
        // if there is more than one city found, return the first one
        const fetchedCityCode = result.kota[0].id;
        
        return {test: fetchedCityCode}
      }
      throw new Error("Kota tidak valid");
    })
    .catch(error => {
      return {
        status: errorStatus,
        message: error.message
      }
    });
    
  return shalatResponse;
}



app.listen(PORT, () => {
  let date = new Date().toString();
  console.log(`Deployed on ${date}`);
  console.log(`Listening on port: ${PORT}`);
});