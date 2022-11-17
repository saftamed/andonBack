const AndonHis = require("../models/AndonHis");
const { checkLoginAndAdmin ,checkLogin} = require("./userMidelWare");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const router = require("express").Router();


//GET USER STATS
router.get("/search/:s", async (req, res) => {  
  try {
    const savedMachine = await AndonHis.find({ name: { $regex: new RegExp(req.params.s, "i") } }).limit(10);  
    res.status(200).json(savedMachine);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/", async (req, res) => {
  const query = req.query.new;
  try {
    const users =  await AndonHis.find().limit(5).sort({createdAt: -1})

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});


  // router.get("/add", async (req, res) => {
  //   const query = req.query.new;
  //   try {
  //     const users =  new Andon({
  //       name :"mr23",
  //       data : {
  //           name :"3"
  //       }
  //     })

  //       const savedUser = await users.save();
    

  //     res.status(200).json(savedUser);
  //   } catch (err) {
  //     res.status(500).json(err);
  //   }
  // });

  module.exports = router;

  // const query = req.query.new;
  // try {
  //   const users =  await Andon.aggregate([
  //     { "$sort": { "name": 1, "createdAt": 1 } },
  //     { "$group": {
  //         "_id": "$name",
  //         "createdAt": { "$last": "$createdAt" },
  //         "data": { "$last": "$data" }
  //     }}
  // ])
