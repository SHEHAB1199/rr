const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    UID: {
      type: String,
      required: true,
      maxLength: 255,
    },
    doctorId: {
      type: String,
      required: true,
        ref: "doctors"
    },
    patientName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 255,
    },
    age: {
      type: Number,
      required: false,
    },
    teethNo: {
      type: Number,
      required: true,
    },
    sex: {
      type: String,
      required: false,
    },
    color: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: true,
      maxLength: 255,
    },
    description: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: false,
    },
    paid: {
      type: Number,
        default: 0,
      required: false,
    },
    rest: {
        type: Number,
        default: 0
    },
    labId: {
      type: mongoose.Schema.ObjectId,
      ref: "labs",
      required: true,
    },
    doc_id: {
      type: mongoose.Schema.ObjectId,
      ref: "doctor",
      required: true,
    },
    deadline: {
        type: String
    },
    date: {
      type: Date,
      default: Date.now(),
      required: false,
    },
    prova: {
      type: Boolean,
      required: false,
      default: true,
    },

    media: {
        type: [],
        default: []
    },
    delivery: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "delivery",
        // required: true
    },
      taked:{
        type: Boolean,
          default: false
      },
      prova:{
        type: Boolean,
          required: true,
      }
  },
  { timestamps: true }
);

const ordersModel = mongoose.model("orders", orderSchema);
module.exports = ordersModel;