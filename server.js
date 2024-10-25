import express from "express";
import dotenv from "dotenv";
import WalletRouter from "./routes/walletRoute.js";
import { globalErrorHandler } from "./controllers/errorController.js";
import { CustomError } from "./Utils/CustomError.js";

let app = express();

dotenv.config({ path: "./config.env" });

const port = process.env.PORT || 8080;

app.use(express.json());
console.log(app.get("env"));

//USING ROUTE
app.use("/User", WalletRouter);
app.all("*", (req, res, next) => {
  const err = new CustomError(
    `Cannot find ${req.originalUrl} on the server`,
    404
  );

  next(err);
});

app.use(globalErrorHandler);

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
