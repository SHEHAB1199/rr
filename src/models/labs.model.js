const mongoose = require("mongoose");

const labsSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    buildNo: {
      type: String,
      required: true,
    },
    floorNo: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: ""
    },
    address: {
      type: String,
    },
    profileImage: {
      type: String,
      default: ""
    },
    password: {
      type: String,
      required: true,
    },
    favouritePosts: {
      type: [mongoose.Schema.Types.ObjectId], 
      default: [],
    },
    posts: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    subscribeDelivery: {
      type: Boolean,
      default: false,
    },

    contracts: {
      type: [
        {
          doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "doctors", 
          },
          teethTypes: {
            type: Map, 
            of: Number, 
            required: true,
          },
        },
      ],
      default: [], // Default to an empty array
    },
      doctors: {
        type: [mongoose.Schema.Types.ObjectId],
          ref: "doctors",
      },
      otp: { type: String },
      otpExpiresAt: { type: Date },
      isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const labsModel = mongoose.model('labs', labsSchema);

module.exports = labsModel;