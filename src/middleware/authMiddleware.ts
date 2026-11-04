
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import LoggedOutToken from "../models/LoggedOutToken";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Please log in to access this resource",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication token is missing",
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({
        success: false,
        message: "Authentication configuration error",
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const blacklistedToken = await LoggedOutToken.findOne({
      tokenHash,
    });

    if (blacklistedToken) {
      res.status(401).json({
        success: false,
        message: "Your session has ended. Please log in again.",
      });
      return;
    }

    // Attach the authenticated user ID and role to request headers
    res.locals.userId = decoded.userId;
    res.locals.userRole = decoded.role;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};
