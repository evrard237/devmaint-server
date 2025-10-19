import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      length: 255,
      unique: true,
    },
    designation: {
      type: String,
      required: true,
    },
    phone_number: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: [true, "please enter an email"],
      lowercase: true,
      unique: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },
    photo: String,
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
    },
    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: 8,
      select: false,
    },
    isOnRotation: {
        type: Boolean,
        default: false,
    },
    // --- THIS FIELD IS ADDED FOR CUSTOM SORTING ---
    rotationOrder: {
        type: Number,
        default: 99, // Default to a high number so unsorted users appear last
    },
    role: {
      type: String,
      enum: ["admin", "user", "guest", "technician"],
      default: "user",
    },
    status: {
      type: String,
      default: "offline",
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExp: Date,
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12); // Using a fixed salt factor is common
  next();
});

UserSchema.methods.comparePasswordsInDb = async function (pwd, pwdDB) {
  return await bcrypt.compare(pwd, pwdDB);
};

UserSchema.methods.isPasswordChanged = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const passwordChangedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < passwordChangedTimestamp;
  }
  return false;
};

UserSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetTokenExp = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", UserSchema);

export default User;