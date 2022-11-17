const Andon = require("../models/Andon");
const { checkLoginAndAdmin ,checkLogin} = require("./userMidelWare");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const router = require("express").Router();


router.get("/", async (req, res) => {
   
    try {
      const andons =  await Andon.find();
  
      res.status(200).json(andons);
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
