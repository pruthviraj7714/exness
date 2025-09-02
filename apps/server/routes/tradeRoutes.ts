import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";

const tradeRouter = Router();

tradeRouter.post('/create', authMiddleware, async (req, res) => {

})

tradeRouter.post('/close', authMiddleware, async (req, res) => {

})


export default tradeRouter; 