import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import prisma from "@repo/db";

const positionsRouter = Router();

positionsRouter.get("/open", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const positions = await prisma.position.findMany({
      where: {
        userId,
        status : "OPEN"
      },
    });

    res.status(200).json(positions || []);
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

positionsRouter.get("/closed", authMiddleware, async (req, res) => {
    try {
      const userId = req.userId!;
      const positions = await prisma.position.findMany({
        where: {
          userId,
          status : "CLOSE"
        },
      });
  
      res.status(200).json(positions || []);
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  });

export default positionsRouter;
