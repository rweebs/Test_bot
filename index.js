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

const dateCommand = "tanggal";
const Help='help' || 'Help';
async function parseCommand(event) {
  if(event.message.text.includes(dateCommand)) {
    const dateKeyword = event.message.text.replace(dateCommand, '').trim();
    return (await handledateCommand(dateKeyword));
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

async function handledateCommand(dateKeyword) {
  const dateResponse = await fetchdateData(dateKeyword);
  
  if(dateResponse.status === okStatus) {
    return createTextResponse(dateResponse.hijri.day+' '+dateResponse.hijri.month.en+' '+dateResponse.hijri.year)
  }
  return createTextResponse(dateResponse.message)
}

Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('-');
};

const  errorStatus = "Bad Request";
const okStatus = "OK";
async function fetchdateData(dateKeyword) {
    
  const dateResponse = await fetch(` http://api.aladhan.com/v1/gToH?date=${dateKeyword}`)
    .then(response => {return response.json()})
    .then(result => {
      if(result.status === okStatus){
        // if there is more than one date found, return the first one
        return result
      }
      throw new Error("Kota tidak valid");
    })
    .catch(error => {
      return {
        status: errorStatus,
        message: error.message
      }
    });
    
  return dateResponse;
}

app.listen(PORT, () => {
  let date = new Date().toString();
  console.log(`Deployed on ${date}`);
  console.log(`Listening on port: ${PORT}`);
});