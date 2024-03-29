const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tel: { type: String,require: true },
    level: { type :String, required: true },
    post: { type: String, required: true },
    p: { type: String,required: true },
    lType: { type: String,default:"1" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User2", UserSchema);