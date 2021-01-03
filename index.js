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
// function compare(monthResponse){
//   const eventlist=[];
//   const dayFirst=parseInt(monthResponse.data[0].hijri.day);
//   const dayLast=parseInt(monthResponse.data[monthResponse.length-1].hijri.day);
//   const month=monthResponse.data[0].hijri.month.number;
//   const month2=parseInt(month);
//   const shaumMonth1= fetch(`https://database-mstei-rahmat-test-202.herokuapp.com/api/${month2}`).json();
//   const shaumMonth2= fetch(`https://database-mstei-rahmat-test-202.herokuapp.com/api/${month2+1}`).json()
//   shaumMonth1.date.forEach(element => {
//     for(let i=0;i++;i<monthResponse.length){
//       if(monthResponse.data[i].hijri.month.number===month){
//         if(monthResponse.data[i].hijri.day===element.day){
//           eventlist.push({
//             date:monthResponse.data[i].gregorian.date,event:element.event
//           })
//         }
//       }
//     }
    
    
//   });
//   shaumMonth2.date.forEach(element => {
//     for(let i=0;i++;i<monthResponse.length){
//       if(monthResponse.data[i].hijri.month.number===month){
//         if(monthResponse.data[i].hijri.day===element.day){
//           eventlist.push({
//             date:monthResponse.data[i].gregorian.date,event:element.event
//           })
//         }
//       }
//     }
    
    
//   });
//   return eventlist
// }
const dateCommand = "tanggal";
const shaumCommand="puasa";
const Help='help' || 'Help';
async function parseCommand(event) {
  if(event.message.text.includes(dateCommand)) {
    const dateKeyword = event.message.text.replace(dateCommand, '').trim();
    return (await handledateCommand(dateKeyword));
  }
  else if(event.message.text.includes(shaumCommand)) {
    const monthKeyword = event.message.text.split(' ');
    return (await handleShaumCommand(monthKeyword));
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
    return createTextResponse(dateResponse.data.hijri.day+' '+dateResponse.data.hijri.month.en+' '+dateResponse.data.hijri.year)
  }
  return createTextResponse(dateResponse.message)
}
async function handleShaumCommand(dateKeyword) {
  const dateResponse = await fetchShaumData(dateKeyword);
  
  if(dateResponse.status === okStatus) {
    return createTextResponse(dateResponse.data[0].hijri.date)
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
async function fetchShaumData (dateKeyword) {
    let bulan = new Map();
    bulan.set('januari',1);
    bulan.set('februari',2);
    bulan.set('maret',3);
    bulan.set('april',4);
    bulan.set('mei',5);
    bulan.set('juni',6);
    bulan.set('juli',7);
    bulan.set('agustus',8);
    bulan.set('september',9);
    bulan.set('oktober',10);
    bulan.set('november',11);
    bulan.set('desember',12);
    const month=bulan.get(dateKeyword[1].toLowerCase());
    const year=dateKeyword[2];
  
  const dateResponse = await fetch(`http://api.aladhan.com/v1/gToHCalendar/${month}/${year}`)
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