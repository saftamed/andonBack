const router = require("express").Router();
const User = require("../models/User");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const { checkLogin,checkLoginAndAdmin } = require("./userMidelWare");


//REGISTER
router.post("/check", checkLogin,async (req, res) => {
  res.status(201).json(req.user);
}
);

router.post("/register", async (req, res) => {
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
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

//LOGIN

router.post("/login", async (req, res) => {
  console.log("ddddd");
  try {
    const user = await User.findOne({ email: req.body.email });
    if(!user) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }


    const hashedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.PASS_SEC_KEY
    );
    const OriginalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

    if(OriginalPassword !== req.body.password) {
      return res.status(401).json({ msg: "Invalid email or password" }); 
    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
        username: user.username,
      },
      process.env.JWT_SEC_KEY,
      {expiresIn:"3d"}
    );

    const { password, ...others } = user._doc;

    res.status(200).json({...others, accessToken});
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;