require("dotenv").config();

const say = require('say')
let serialportgsm = require('serialport-gsm')

const twilio = require('twilio')(process.env.accountSid, process.env.authToken);
var exec = require('child_process').execFile;

var fun =function(){
   console.log("run exec");
   exec('C:\\Users\\safta\\AppData\\Local\\checklist\\app-1.0.0\\CheckList.exe', function(err, data) {  
        console.log(err)
        console.log(data.toString());                       
    });  
}




let mongoose = require("mongoose");
const User2 = require("./models/User2");
const bodyParser = require('body-parser')

const userRoute = require("./routes/user");
const userRoute2 = require("./routes/user2");
const authRouter = require("./routes/auth")
const andonRouter = require("./routes/andon")
const andonHisRouter = require("./routes/his")
const mqtt = require('mqtt')

const host = 'broker.emqx.io'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `mqtt://${host}:${port}`

var cors = require('cors')

const express = require("express");
const Andon = require("./models/Andon");
const AndonHis = require("./models/AndonHis");



var waitingCalls = [];

var isInCall = false;


let modem = serialportgsm.Modem()
let options = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    rtscts: false,
    xon: false,
    xoff: false,
    xany: false,
    autoDeleteOnReceive: true,
    enableConcatenation: true,
    incomingCallIndication: true,
    incomingSMSIndication: true,
    pin: '',
    customInitCommand: '',
    cnmiCommand: 'AT+CNMI=2,1,0,2,1',
    logger: {
      debug: function(aa) {
        // console.log("safta");
        // console.log(aa);
        if(aa.includes("NO CARRIER")){
          endCall()
        }
      }
    }
}
var refreshIntervalId = null;
var connected = false;
function openGsm(){
  clearInterval(refreshIntervalId);
  refreshIntervalId = setInterval(() => {
    try {
      serialportgsm.list((err, result) => {
        // console.log(result);
        if (result.length > 0) {
          if(!connected){
            clearInterval(refreshIntervalId);
            modem.open('COM3', options)
          }
        }

      })
    
    }catch (e) {
      console.log("not connected");
    }
  }, 1000);
}

modem.on('close', result => { 
  console.log("closed") 
  connected = false;
  openGsm()
})

function endCall(){
  say.stop()
  isInCall = false
  console.log("stoped");
  callNumber()
}

function call(data){
  console.log("try to call ...");
  waitingCalls.push(data);
  if(!isInCall){
    callNumber()
  }
}
var calll = null;
function callNumber(){
  if (waitingCalls.length <= 0) return;
  calll = waitingCalls.shift();
  console.log(calll);
  if (!calll) return;
  isInCall = true;
  client.publish("/safta/c2i/mqtt/notif",  JSON.stringify(calll), { qos: 2, retain: false }, (error) => {
    if (error) {
      console.error(error)
    }
  })
  const commandParser = modem.executeCommand(`ATD${calll.tel};`,res => {
    if(res?.status === 'success') {
      console.log("up");
      calll = null;
    } else{
      endCall()
    }

  })

  commandParser.logic = (dataLine) => {
    // console.log(dataLine);
    if(dataLine.includes("OK")){
      console.log("okkki");
        var c =say.speak(`Alarme ${calll.type} ligne ${calll.ligne}   Alarme ${calll.type} ligne ${calll.ligne}` , null, 0.7,(err) => {
          if (err) {
            return console.error(err)
          }
         
          console.log('Text has been spoken.')
          modem.hangupCall(res => {
            console.log("hangupCall");
            endCall()
          })
        })


        return {
          resultData: {
            status: 'success',
            request: 'executeCommand',
            data: { 'result': "hiii" }
          },
          returnResult: true
        }

    }else if(dataLine.includes("BUSY")){
      console.log("buuuuusyii");
      endCall()
    }else if(dataLine.includes("NO CARRIER")){
      say.stop()
      endCall()
    }
  };
}
modem.on('open', data => {
  // modem.initializeModem(callback[optional])
  connected = true;
  isInCall = false;
  if(calll){
    waitingCalls.unshift(calll)
  }
  setTimeout(() => {
    callNumber()
  }, 5000);
  console.log("Gsm connection successful");
  // call1()
  
})

openGsm()


//var u = await getUser("5", 1,a,3);
async function getUser(type, level,postt,lType) {
  try {
    var h = new Date().getHours();
    var ssd = null
    if(level == 1){
      // if(h >= 8 && h <= 17){
      //   ssd = await User2.findOne({ level: "5", post: type,p:postt,lType: lType })
      // }else{
        ssd = await User2.findOne({ level: "1", post: type,p:postt,lType: lType })
      // }
    }else if(level >= 2){
      // check time for call
      if(h >= 8 && h <= 17){
        ssd = await User2.findOne({ level: level, post: type})
      }
    }
    // else{
    //   if(h >= 8 && h <= 17){
    //    ssd = await User2.findOne({ level: level, post: type,p:postt,lType: lType})
    //   }
    // }

   
  
    // console.log(ssd);
    return ssd
  } catch (err) {
    return null;
  }
}

// function call() {
//   console.log(data);

//   //  twilio.calls
//   //      .create({
//   //        twiml:`<Response><Say language="fr" voice="Polly.Joanna" loop="3" rate="20%">Alarme ${data.type} Ligne ${data.ligne} </Say></Response>`,
//   //        to: `+216${data.tel}`,
//   //         from: '+19388883642'
//   //       })
//   //      .then(call => console.log(call.sid)).catch(err => console.log(err));
// }


function diff(msg,old){
  if(msg.AQ !== old.AQ && msg.AQ > 0) return "AQ"
  if(msg.AP !== old.AP && msg.AP > 0) return "AP"
  if(msg.AL !== old.AL && msg.AL > 0) return "AL"
  if(msg.AM !== old.AM && msg.AM > 0) return "AM"
}
function getChainType(name2){
  return name2.startsWith("MR")?"1":name2.startsWith("VI")?"3":name2.startsWith("AR")?"4":"2";
}
async function getInfo(msg,old) {
  // console.log(msg.APU,old?.APU);
  // console.log("info");
  try {
    if (msg.AP !== old?.AP && msg.AP > 0 ) {
      console.log("Prüftechnik");
      var ll = getChainType(msg.name);
      var u = await getUser("3", msg.AP,msg.post,ll);
      if (!u) return
      call({
        type: "Prüftechnik",
        ligne: msg.name,
        tel: u.tel,
        name:u.name
      });

    } else if (msg.AM !== old?.AM && msg.AM > 0) {
      console.log("Maintenance");
      var ll = getChainType(msg.name);
      var u = await getUser("2", msg.AM,msg.post,ll);
      if (!u) return
      call({
        type: "Maintenance",
        ligne: msg.name,
        tel: u.tel,
        name:u.name
      });
    } else if (msg.AL !== old?.AL && msg.AL > 0) {
      console.log("Logistique");
      var ll = getChainType(msg.name);
      var u = await getUser("4", msg.AL,msg.post,ll);
      
      if (!u) return
      call({
        type: "Logistique",
        ligne: msg.name,
        tel: u.tel,
        name:u.name
      });
    } else if (msg.AQ !== old?.AQ && msg.AQ > 0) {
      console.log("Qualite");
      var ll = getChainType(msg.name);
      var u = await getUser("1", msg.AQ,msg.post,ll);
      if (!u) return
      call({
        type: "Qualite",
        ligne: msg.name,
        tel: u.tel,
        name:u.name
      });
    }else if (msg.APU !== old?.APU && msg.APU > 0) {
      // Prüftechnik
      console.log("Production");
      var ll = getChainType(msg.name);
      // console.log(msg.APU);
      // console.log(msg.post);
      // console.log(ll);
      var u = await getUser("5", msg.APU,msg.post,ll);
      if (!u) return
      call({
        type: "Production",
        ligne: msg.name,
        tel: u.tel,
        name:u.name
      });
    }else{
      console.log("noo");
    }
  } catch (err) {
    console.log(err);
  }

}


const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'emqx',
  password: 'public',
  reconnectPeriod: 1000,
})

const topic = '/safta/mqtt'
client.on('connect', () => {
  console.log('Connected')
  client.subscribe(["/safta/c2i/mqtt", "/safta/c2i/mqtt/data"], () => {
    // fun();
    console.log(`Subscribe to topic /safta/c2i/mqtt2 and subscribe to "/safta/c2i/mqtt/data2"`)
  })
  // client.publish(topic, 'safta mqtt test', { qos: 0, retain: false }, (error) => {
  //   if (error) {
  //     console.error(error)
  //   }
  // })
})

client.on('message', async (topic, payload) => {
  if (topic === "/safta/c2i/mqtt/data") {
    console.log("msg received data2");
    try {
      const andons = await Andon.find().select('data -_id');
      client.publish("/safta/c2i/mqtt/all", JSON.stringify(andons), { qos: 2, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      })
      console.log("msg sended to all");
    } catch (err) {
      console.log(err);
    }
  } else {
    console.log("msg received mqtt");
    var b = JSON.parse(payload.toString());
    try {
      const newUser = await Andon.findOne({ name: b.name });
      const an = {...newUser?._doc}
      if (b.rst === 0) {
        console.log("not rst");
        if (newUser) {
          newUser.data = b;
          const savedUser = await newUser.save();
        } else {
          const newUser2 = new Andon({
            name: b.name,
            data: b
          });
          const savedUser = await newUser2.save();

        }
        // console.log(newUser);
        getInfo(b,an.data)
      } else {
        console.log("msg rst");
        if (newUser) {
          const his = new AndonHis({
            name: newUser.name,
            data: newUser.data
          })

          const savedHis = await his.save();
          newUser.data = b;
          const savedUser = await newUser.save();

        } else {
          const newUser2 = new Andon({
            name: b.name,
            data: b
          });
          const savedUser = await newUser2.save();
          console.log("msg saved");
        }

      }
      
    } catch (err) {
      console.log(err);
    }

  }
})



const app = express();
app.use(cors())

app.use('/', express.static('public'));
// Connect To DataBase
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((err) => {
    console.error("Database connection error");
  });


// parse application/x-www-form-urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));


app.use("/api/v1/user", userRoute)
app.use("/api/v1/user2", userRoute2)
app.use("/api/v1/auth", authRouter)
app.use("/api/v1/andon", andonRouter)
app.use("/api/v1/his", andonHisRouter)

function getLocalIp() {
  const os = require('os');

  for (let addresses of Object.values(os.networkInterfaces())) {
    for (let add of addresses) {
      if (add.address.startsWith('192.168.')) {
        return add.address;
      }
    }
  }
}

// getUser("1","1","A","1").then(function(response){
//   console.log(response);
// })
app.listen(process.env.PORT || 3000, function () {
  console.log(`server Started on ${getLocalIp()} port ${process.env.PORT || 3000} `);
});