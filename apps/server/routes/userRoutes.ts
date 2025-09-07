import { Router } from "express";
import prisma from "@repo/db";
import jwt, { type JwtPayload } from "jsonwebtoken";
import {
  AUTH_JWT_SECRET,
  BACKEND_URL,
  EMAIL_JWT_SECRET,
  FRONTEND_URL,
} from "../config";
import transporter from "../mail/transporter";
import authMiddleware from "../middleware/authMiddleware";
import { DecimalsMap } from "@repo/common";

const userRouter = Router();

userRouter.post("/signup", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        message: "email is missing",
      });
      return;
    }

    const existedUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existedUser) {
      res.status(400).json({
        message: "User with given email already exists",
      });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email,
      },
    });

    const token = jwt.sign(
      {
        sub: user.email,
      },
      EMAIL_JWT_SECRET
    );

    if (process.env.NODE_ENV === "production") {
      transporter.sendMail({
        from: "bridentony45@gmail.com",
        to: email,
        html: `
              <a href='${BACKEND_URL}/api/v1/signin/post?token=${token}'>
              Click to Go to dashboard
              <a>
          `,
      });
    } else {
      console.log(
        `click here to login : ${BACKEND_URL}/api/v1/user/signin/post?token=${token}`
      );
    }

    res.status(200).json({
      message: "Email sent",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

userRouter.post("/signin", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        message: "missing email",
      });
      return;
    }

    const existedUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!existedUser) {
      res.status(400).json({
        message: "User with given email not found! Please sign in first",
      });
      return;
    }

    const token = jwt.sign(
      {
        sub: existedUser.email,
      },
      EMAIL_JWT_SECRET
    );

    if (process.env.NODE_ENV === "production") {
      transporter.sendMail({
        from: "bridentony45@gmail.com",
        to: email,
        html: `
              <a href='${BACKEND_URL}/api/v1/signin/post?token=${token}'>
                Click to Go to dashboard
              <a>
          `,
      });
    } else {
      console.log(
        `click here to login : ${BACKEND_URL}/api/v1/user/signin/post?token=${token}`
      );
    }

    res.status(200).json({
      message: "Email sent",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

userRouter.get("/signin/post", async (req, res) => {
  try {
    const token = req.query.token as string;

    const user = jwt.verify(token, EMAIL_JWT_SECRET) as JwtPayload;

    const userEmail = user.email;

    const isUserExists = await prisma.user.findFirst({
      where: {
        email: userEmail,
      },
    });

    if (!isUserExists) {
      res.status(400).json({
        message: "User not found!",
      });
      return;
    }

    const authToken = jwt.sign(
      {
        sub: isUserExists.id,
      },
      AUTH_JWT_SECRET
    );

    console.log(authToken);

    res.cookie(`authToken`, authToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 3600 * 1000,
    });

    res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

userRouter.post("/signout", async (req, res) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/", 
    });

    res.redirect(FRONTEND_URL);
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

userRouter.get("/balance/usd", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      res.status(400).json({
        message: "User not found!",
      });
      return;
    }

    const usdtDecmials = DecimalsMap["USDT"]!;

    const userBalance = user.usdBalance / 10 ** usdtDecmials;

    res.status(200).json({
      usdBalance: userBalance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

export default userRouter;
