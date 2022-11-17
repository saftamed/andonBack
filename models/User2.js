const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tel: { type: String,require: true },
    level: { type :String, required: true },
    post: { type: String, default: "tec", }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User2", UserSchema);