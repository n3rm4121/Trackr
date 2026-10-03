import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler.js";
import applicationRouter from "./modules/applications/application.route.js";
import config from "./config/config.js";
import { authRouter } from "./modules/auth/auth.route.js";

const app: Express = express();

app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({
    message: "Server is healthy",
    status: "OK",
  });
});

app.get("/api", (req, res) => {
  res.send("Hello World!");
});
app.use("/api/auth", authRouter);

app.use("/api/applications", applicationRouter);

// after routes
app.use(errorHandler);

export default app;
