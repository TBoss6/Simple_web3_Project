import { Contract } from "ethers";
import { ethers } from "ethers";
import axios from "axios";
import dotenv from "dotenv";
import { response } from "express";

dotenv.config({ path: "./config.env" });

// import CustomError from "../Utils/CustomError.js";

const polygonZkEVM_ApiKey = process.env.POLYGON_API_KEY;
const testnetJSONRPC = {
  polygonZkEVM: "https://rpc.cardona.zkevm-rpc.com",
  ethereum: "https://eth.blockrazor.xyz",
};

const convertFromTokenUnits = (amount, decimals) => {
  return ethers.formatUnits(amount, decimals);
};

const convertToTokenUnits = (amount, decimals) => {
  return ethers.parseUnits(amount, decimals);
};

const tokenABI = [
  // Standard ERC-20 functions
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address recipient, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function _decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function _symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function name() view returns (string)",
];

export const greeting = (req, res) => {
  console.log("Hello! \nGood to have you here Champ");
  return res.status(200).json({
    message: "Welcome to this blockchain",
    response: "Welcome On Board!",
  });
};

export const createWallet = async (req, res, next) => {
  try {
    const newWallet = ethers.Wallet.createRandom();
    // console.log(newWallet);

    res.status(201).json({
      status: "Success",
      data: {
        Address: newWallet.address,
        Mnemonic: newWallet.mnemonic.phrase,
        privateKey: newWallet.privateKey,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const queryNativeBalance = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const provider = new ethers.JsonRpcProvider(testnetJSONRPC.polygonZkEVM);

    const balance = await provider.getBalance(walletAddress);

    const convertedBalance = Number(ethers.formatEther(balance));
    console.log(
      "====fetching Native Token Balance======",
      balance,
      convertedBalance
    );

    res.status(200).json({
      status: "Success",
      response: `Converted  Balance = ${convertedBalance}`,
    });
  } catch (error) {
    return next(error);
  }
};

export const queryErc20Balance = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    const { erc20contractAddress } = req.params;

    const provider = new ethers.JsonRpcProvider(testnetJSONRPC.polygonZkEVM);

    // console.log("TokenAddress:", erc20contractAddress);
    const tokenContract = new ethers.Contract(
      erc20contractAddress,
      tokenABI,
      provider
    );

    // const tokenDecimals = await tokenContract.decimals();
    // const tokenBalance = await tokenContract.balanceOf(walletAddress);
    // const tokenName = await tokenContract.name();
    const batchRequest = await Promise.all([
      tokenContract.balanceOf(walletAddress),
      tokenContract.decimals(),
      tokenContract.name(),
    ]);

    // const batchRequest = await Promise.all([
    //   tokenContract.balanceOf(walletAddress),
    //   tokenContract.name(),
    // ]);
    const amount = batchRequest[0];
    const decimals = batchRequest[1];
    const name = batchRequest[2];

    console.log(convertFromTokenUnits);
    const convertedAmount = convertFromTokenUnits(amount, decimals);

    console.log(tokenContract);

    console.log("====fetching erc20 Token Balance=====", convertedAmount, name);
    res.status(200).json({
      status: "Success",
      response: `${convertedAmount} ${name} Tokens`,
    });
  } catch (error) {
    // res.json({ message: "error occured" });
    return next(error);
  }
};

export const getTransactionHistory = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const url = `https://api-zkevm.polygonscan.com/api?module=account&action=txlistinternal&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=${polygonZkEVM_ApiKey}`;

    const response = await axios.get(url);
    console.log("===== Fetching Transaction History =====", response.data);

    // Check if the API request was successful
    if (response.data.status === "1") {
      const transactionHistory = response.data.result;

      // Handle the case when transaction status is available
      if (transactionHistory.length > 0) {
        return res.status(200).json({
          status: "Success",
          message: "Transaction history found",
          response: transactionHistory,
        });
      } else {
        // Handle case when there are no transactions or status is undefined
        return res.status(404).json({
          status: "Failed",
          message:
            "No transactions found or status might be pending or invalid",
          response: transactionHistory,
        });
      }
    } else {
      // Handle cases where the API status is not '1' (failed request)
      return res.status(400).json({
        status: "Failed",
        message: "Error fetching transaction history",
        response: response.data,
      });
    }
  } catch (error) {
    // Handle any errors that occur during the API request
    return next(error);
  }
};

export const sendErc20Token = async (req, res, next) => {
  try {
    const {
      addressOfReceiver,
      amountToSend,
      privateKey,
      erc20contractAddress,
    } = req.body;

    const provider = new ethers.JsonRpcProvider(testnetJSONRPC.polygonZkEVM);
    const walletInstance = new ethers.Wallet(privateKey, provider);
    const tokenContract = new ethers.Contract(
      erc20contractAddress,
      tokenABI,
      walletInstance
    );

    const tokenDecimals = await tokenContract.decimals();
    const convertedAmount = convertToTokenUnits(amountToSend, tokenDecimals);

    const transfer = await tokenContract.transfer(
      addressOfReceiver,
      convertedAmount
    );
    res.status(200).json({
      message: `Transfer of ${amountToSend} has been sent successfully to ${addressOfReceiver}`,
    });
    return transfer.hash;
  } catch (error) {
    return next(error);
  }
};

export const sendNativeToken = async (req, res, next) => {
  try {
    const { addressOfReceiver, amountToSend, privateKey } = req.body;
    const provider = new ethers.JsonRpcProvider(testnetJSONRPC.polygonZkEVM);

    const walletInstance = new ethers.Wallet(privateKey, provider);

    const transfer = await walletInstance.sendTransaction({
      addressOfReceiver,
      value: ethers.parseEther(amountToSend.toString()),
    });
    res
      .status(200)
      .json(
        `Transfer of ${amountToSend} has been sent successfully to ${addressOfReceiver}`
      );
    return transfer.hash;
  } catch (error) {
    return next(error);
  }
};
