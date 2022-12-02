require("dotenv").config();


const twilio = require('twilio')(process.env.accountSid, process.env.authToken);

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

async function getUser(type, level) {
  try {
    const users = await User2.findOne({ level: level, post: type })
    // console.log(users);
    return users
  } catch (err) {
    return err;
  }
}

function call(data) {
  console.log(data);
  //  twilio.calls
  //      .create({
  //        twiml:`<Response><Say language="fr" voice="Polly.Joanna" loop="3" rate="20%">Alarme ${data.type} Ligne ${data.ligne} </Say></Response>`,
  //        to: `+216${data.tel}`,
  //         from: '+19388883642'
  //       })
  //      .then(call => console.log(call.sid)).catch(err => console.log(err));
}
async function getInfo(msg) {
  if (msg.AP > 0) {
    var u = await getUser("3", msg.AP);
    call({
      type: "Production",
      ligne: msg.name,
      tel: u.tel,
    });

  } else if (msg.AM > 0) {
    var u = await getUser("2", msg.AM);
    call({
      type: "Maintenance",
      ligne: msg.name,
      tel: u.tel,
    });
  } else if (msg.AL > 0) {
    var u = await getUser("4", msg.AL);
    call({
      type: "Logistique",
      ligne: msg.name,
      tel: u.tel,
    });
  } else if (msg.AQ > 0) {
    var u = await getUser("1", msg.AQ);
    call({
      type: "Qualite",
      ligne: msg.name,
      tel: u.tel,
    });
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
  client.subscribe(["/safta/c2i/mqtt","/safta/c2i/mqtt/data"], () => {
    console.log(`Subscribe to topic /safta/c2i/mqtt and subscribe to "/safta/c2i/mqtt/data"`)
  })
  // client.publish(topic, 'safta mqtt test', { qos: 0, retain: false }, (error) => {
  //   if (error) {
  //     console.error(error)
  //   }
  // })
})

client.on('message', async (topic, payload) => {
  if(topic === "/safta/c2i/mqtt/data"){
    try {
      const andons =  await Andon.find();
      client.publish("/safta/c2i/mqtt/all", andons.toString(), { qos: 0, retain: false }, (error) => {
          if (error) {
            console.error(error)
          }
        })
    } catch (err) {
      console.log(err);
    }
  }else{
    var b = JSON.parse(payload.toString());
    // console.log(b)
    try {
      const newUser = await Andon.findOne({ name: b.name });
      console.log(newUser);
      if (b.rst === 0) {
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
      } else {
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
        }
  
      }
      getInfo(b)
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
app.listen(process.env.PORT || 3000, function () {
  console.log(`server Started on ${getLocalIp()} port ${process.env.PORT || 3000} `);
});