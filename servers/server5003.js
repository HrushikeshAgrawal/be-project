const express = require("express");
const cors = require("cors");
const path = require("path");
const Web3 = require("web3");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const Blockchain = require("../Blockchain");

const app = express();
app.use(express.json({ extended: false }));
const nodeAddress = uuidv4().toString().replace("-", "");
let blockChain = new Blockchain();

const PORT = process.env.PORT || 5003;

app.use(cors());
app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});

app.get("/mineBlock", (req, res) => {
  let previousBlock = blockChain.getPreviousBlock();
  let previousHash = blockChain.hash(previousBlock);
  let previousProof = previousBlock["proof"];
  let proof = blockChain.proofOfWork(previousProof);
  blockChain.addTransaction(nodeAddress, "D", 1);
  let block = blockChain.createBlock(proof, previousHash);
  let response = { message: "Congratulations, you just mined a block!", block };
  res.status(200).send(response);
});

app.get("/getChain", (req, res) => {
  let response = { chain: blockChain.chain, length: blockChain.chain.length };
  res.status(200).send(response);
});

app.get("/isValid", (req, res) => {
  let isValid = blockChain.isChainValid(blockChain.chain);
  if (isValid) response = { message: "All Good! :D" };
  else response = { message: "Something's wrong :(" };
  res.status(200).send(response);
});

app.post("/addTransaction", (req, res) => {
  const reqData = req.body;
  let index = blockChain.addTransaction(
    reqData.sender,
    reqData.receiver,
    reqData.amount
  );
  let response = { message: `Transaction will be added to Block ${index}` };
  res.status(201).send(response);
});

app.get("/connectNode", (req, res) => {
  let tnodes = [
    "http://localhost:5000",
    "http://localhost:5001",
    "http://localhost:5002",
  ];
  for (var i = 0; i < tnodes.length; i++) {
    blockChain.addNode(tnodes[i]);
  }
  let response = {
    message: `Connected to following nodes:`,
    totalNodes: blockChain.nodes,
  };
  res.status(200).send(response);
});

app.get("/replaceChain", async (req, res) => {
  let isChainReplaced = await blockChain.replaceChain();
  if (isChainReplaced)
    response = {
      message:
        "The node had different chains so chain was replaced by the longest one.",
      newChain: blockChain.chain,
    };
  else
    response = {
      message: "All good. The chain is the largest one.",
      actualChain: blockChain.chain,
    };
  res.status(200).send(response);
});

app.get("/reset", (req, res) => {
  blockChain = new Blockchain();
});
