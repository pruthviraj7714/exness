import type { NextFunction, Request, Response } from "express";
import { verify, type JwtPayload } from "jsonwebtoken";
import { AUTH_JWT_SECRET } from "../config";

const authMiddleware = (req : Request, res : Response , next : NextFunction) => {
    try {
        const token = req.cookies.authToken;

        if(!token) {
            res.status(401).json({
                message : "No Token"
            });
            return;
        }

        const decoded = verify(token, AUTH_JWT_SECRET) as JwtPayload;
        req.email = decoded.sub;

        next();
    } catch (error) {
        res.status(401).json({
            message : "Invalid or Expired Token"
        })
    }
}

export default authMiddleware;