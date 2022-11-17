const User = require("../models/User");
const { checkLoginAndAdmin } = require("./userMidelWare");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

const router = require("express").Router();

//UPDATE
router.put("/:id",checkLoginAndAdmin, async (req, res) => {
  console.log(req.body);
  var u = {...req.body}
  if (req.body.password.length > 5) {
    
    u.password = CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SEC_KEY
    ).toString();
  }else{
    delete u.password
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: u,
      },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});



//DELETE
router.delete("/:id",checkLoginAndAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET USER
router.get("/find/:id",checkLoginAndAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL USER
router.get("/", async (req, res) => {
  const query = req.query.new;
  try {
    const users =  await User.find().limit(5).sort({createdAt: -1})

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});


router.post("/",checkLoginAndAdmin, async (req, res) => {
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    post: req.body.post,
    isAdmin: req.body.isAdmin,
    password: CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SEC_KEY
    ).toString(),
  });

  try {
    const savedUser = await newUser.save();
    const { password, ...others } = savedUser._doc;

    res.status(200).json(others);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET USER STATS
router.get("/search/:s",checkLoginAndAdmin, async (req, res) => {  
  try {
    const savedMachine = await User.find({ username: { $regex: new RegExp(req.params.s, "i") } }).limit(10);  
    res.status(200).json(savedMachine);
  } catch (err) {
    res.status(500).json(err);
  }
});


router.get("/stats",checkLoginAndAdmin, async (req, res) => {
  const date = new Date();
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

  try {
    const data = await User.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;