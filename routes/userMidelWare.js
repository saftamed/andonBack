const jwt = require("jsonwebtoken");

const checkLogin = (req, res, next) => {
  console.log(req.headers.token);
  const authHeader = req.headers.token;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    console.log(token);
    jwt.verify(token, process.env.JWT_SEC_KEY, (err, user) => {
      if (err) {
        res.status(401).json("Token is not valid!");
        return
      }

      req.user = user;
      next();
    });
  } else {
    return res.status(401).json("You are not authenticated!");
  }
};

const checkLoginAuthorization = (req, res, next) => {
  console.log("checkLoginAuthorization");
    checkLogin(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      console.log("checkLogin");
      next();
    } else {
      res.status(401).json("You are not alowed to do that!");
    }
  });
};

const checkLoginAndAdmin = (req, res, next) => {
    checkLogin(req, res, () => {
    if (req.user.isAdmin) {
      next();
    } else {
      res.status(401).json("You are not alowed to do that!");
    }
  });
};

module.exports = {
    checkLogin,
    checkLoginAuthorization,
    checkLoginAndAdmin,
};