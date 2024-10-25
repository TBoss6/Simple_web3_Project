import express from "express";
import {
  greeting,
  createWallet,
  queryNativeBalance,
  queryErc20Balance,
  getTransactionHistory,
  sendErc20Token,
  sendNativeToken,
} from "../controllers/walletController.js";

export const router = express.Router();

router.route("/").get(greeting);
router.route("/createNewWallet").get(createWallet);
router.route("/balance/:walletAddress").get(queryNativeBalance);
router.route("/senderc20Token").post(sendErc20Token);
router.route("/sendNativeToken").post(sendNativeToken);
router.route("/balance/:erc20contractAddress").post(queryErc20Balance);
router.route("/transactionHistory/:walletAddress").get(getTransactionHistory);

export default router;
