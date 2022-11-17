const mongoose = require("mongoose");

const AndonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true,unique: true},
    data: { type: Object,require: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Andon", AndonSchema);