const mongoose = require("mongoose");

const AndonHisSchema = new mongoose.Schema(
  {
    name: { type: String, required: true},
    data: { type: Object,require: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AndonHis", AndonHisSchema);