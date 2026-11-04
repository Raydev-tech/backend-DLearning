
import mongoose, { Document, Schema } from "mongoose";

export interface ILoggedOutToken extends Document {
  tokenHash: string;
  expiresAt: Date;
}

const loggedOutTokenSchema = new Schema<ILoggedOutToken>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
  },
  {
    timestamps: true,
  }
);

const LoggedOutToken =
  mongoose.models.LoggedOutToken ||
  mongoose.model<ILoggedOutToken>(
    "LoggedOutToken",
    loggedOutTokenSchema
  );

export default LoggedOutToken;
