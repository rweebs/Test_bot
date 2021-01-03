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
String.prototype.toProperCase = function () {
  return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};
function generate(monthResponse){
  const eventlist=[];
  monthResponse.data.forEach(item =>{
    if(item.hijri.month.number===10 && item.hijri.day==="01"){
      eventlist.push({date : item.gregorian.day, event : 'Idul Fitri (Haram Berpuasa)'})}
    else if(item.hijri.month.number===12 && item.hijri.day==='09'){
      eventlist.push({date : item.gregorian.day, event : 'Arafah'})}
    else if(item.hijri.month.number===12 && item.hijri.day==='10'){
      eventlist.push({date : item.gregorian.day, event : 'Idul Adha (Haram Berpuasa)'})}
    else if(item.hijri.month.number===12 && (item.hijri.day==='11' || item.hijri.day==='12' || item.hijri.day==='13')){
      eventlist.push({date : item.gregorian.day, event : 'Tasyrik (Haram Berpuasa)'})}
    else if(item.hijri.month.number===9){
      eventlist.push({date : item.gregorian.day, event : 'Ramadhan'})}
    else if(item.hijri.month.number===1 && item.hijri.day==="10"){
      eventlist.push({date : item.gregorian.day, event : 'Asyura'})}
    else if(item.hijri.month.number===1 && item.hijri.day==='09'){
      eventlist.push({date : item.gregorian.day, event : 'Tasu\'ah'})}
    else if(item.hijri.day==="13"||item.hijri.day==="14"||item.hijri.day==="15"){
      eventlist.push({date : item.gregorian.day, event : 'Ayyamul Bidh'})
    }
    else if(item.gregorian.weekday.en==="Monday"||item.gregorian.weekday.en==="Thursday"){
      eventlist.push({date : item.gregorian.day, event : 'Senin-Kamis'})
    }
  })
  return eventlist
}
const dateCommand = "tanggal";
const shaumCommand="puasa";
const Help='help' || 'Help';
let monthKeyword2;
async function parseCommand(event) {
  if(event.message.text.includes(dateCommand) || event.message.text.includes(dateCommand.toProperCase())) {
    const dateKeyword = event.message.text.replace(dateCommand, '').trim();
    return (await handledateCommand(dateKeyword));
  }
  else if(event.message.text.includes(shaumCommand) || event.message.text.includes(shaumCommand.toProperCase())) {
    const monthKeyword = event.message.text.split(' ');
    monthKeyword2=monthKeyword;
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
const createFlexResponse = (flexContent, context) => {
  return {
    type: 'flex',
    altText: context,
    contents: flexContent
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
    return createFlexResponse(
      createShaumDatesContainer(generate(dateResponse)),'Jadwal Puasa')
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

// const generateShaum = (eventlist) =>{
//   listevent="";
//   eventlist.forEach(data =>{
//     listevent+=data.date+' '+data.event+'\n';
//   })
//   return listevent
// }
const createShaumDatesContainer = (fetchResult) =>{
  let containerJSON = {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "Jadwal Puasa ",
          "margin": "none",
          "size": "lg",
          "weight": "bold",
          "style": "italic",
          "position": "relative",
          "align": "center",
          "color": "#FFFFFF",
          "gravity": "center",
          "wrap": true
        }
      ],
      "position": "relative",
      "backgroundColor": "#0f4c81"
    },
    "hero": {
      "type": "image",
      "url": "https://1.bp.blogspot.com/-wrIFRMhqtUg/V82Jl90z8kI/AAAAAAAADas/p7dClIfCXQs_CMhIsiEBnz88YidqkOtFQCLcB/s1600/MSTEI%2BITB.jpg",
      "size": "full",
      "aspectRatio": "20:13",
      "aspectMode": "cover"
    },
    "body":
        {
          "type": "box",
          "layout": "vertical",
          "margin": "lg",
          "spacing": "sm",
          "contents": []
      ,
      "position": "relative"
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "contents": [
        {
          "type": "button",
          "style": "link",
          "height": "sm",
          "action": {
            "type": "uri",
            "label": "INSTAGRAM",
            "uri": "https://www.instagram.com/muslimstei/"
          }
        },
        {
          "type": "spacer",
          "size": "sm"
        }
      ],
      "flex": 0
    }
  }

  const isipuasa = (item) =>{
    return {
      "type": "box",
      "layout": "baseline",
      "spacing": "sm",
      "contents": [
        {
          "type": "text",
          "text": `${item.date}`,
          "color": "#666666",
          "size": "sm",
          "flex": 2,
          "align": "center"
        },
        {
          "type": "text",
          "text": `${item.event}`,
          "wrap": true,
          "color": "#666666",
          "size": "sm",
          "flex": 5
        }
      ]
    }

  }
  const containerPuasa=[{
    "type": "box",
    "layout": "baseline",
    "spacing": "sm",
    "contents": [
      {
        "type": "text",
        "text": "Tanggal",
        "size": "sm",
        "flex": 2,
        "weight": "bold",
        "decoration": "none",
        "position": "relative",
        "align": "center",
        "gravity": "center",
        "wrap": true
      },
      {
        "type": "text",
        "text": "Puasa",
        "wrap": true,
        "size": "sm",
        "flex": 5,
        "weight": "bold",
        "style": "normal"
      }
    ]
  }]
  fetchResult.forEach(item =>{
    containerPuasa.push(isipuasa(item));
  });
  containerJSON['body']['contents']=containerPuasa;
  return containerJSON;
}
app.listen(PORT, () => {
  let date = new Date().toString();
  console.log(`Deployed on ${date}`);
  console.log(`Listening on port: ${PORT}`);
});