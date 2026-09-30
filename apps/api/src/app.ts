import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler.js";
import applicationRouter from "./modules/applications/application.route.js";
import config from "./config/config.js";

const app: Express = express();

app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({
    message: "Server is healthy",
    status: "OK",
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/applications", applicationRouter);

// after routes
app.use(errorHandler);

export default app;
