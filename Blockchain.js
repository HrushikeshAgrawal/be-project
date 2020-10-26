const crypto = require("crypto");
const axios = require("axios");

class Blockchain {
  constructor() {
    this.chain = [];
    this.transactions = [];
    this.nodes = [];
    this.createBlock(1, "0");
  }

  createBlock(proof, previousHash) {
    const block = {
      index: this.chain.length + 1,
      timeStamp: new Date().getTime(),
      proof,
      previousHash,
      transactions: this.transactions,
    };
    block.hash = this.hash(block);
    this.transactions = [];
    this.chain.push(block);
    return block;
  }

  getPreviousBlock() {
    return this.chain[this.chain.length - 1];
  }

  proofOfWork(previousProof) {
    let newProof = 1;
    let checkProof = false;
    while (!checkProof) {
      let str = (
        newProof * newProof -
        previousProof * previousProof
      ).toString();
      let hashOperation = crypto.createHash("sha256").update(str).digest("hex");
      if (hashOperation.slice(0, 4) === "0000") checkProof = true;
      else newProof++;
    }
    return newProof;
  }

  hash(block) {
    // const encodedBlock = { block, sort_keys: true };
    const { index, timeStamp, proof, previousHash, transactions } = block;
    const encodedBlock = JSON.stringify({
      index,
      timeStamp,
      proof,
      previousHash,
      transactions,
    });
    return crypto.createHash("sha256").update(encodedBlock).digest("hex");
  }

  isChainValid(chain) {
    let previousBlock = chain[0];
    let blockIndex = 1;
    while (blockIndex < chain.length) {
      let block = chain[blockIndex];
      if (block["previousHash"] != this.hash(previousBlock)) return false;
      let previousProof = previousBlock["proof"];
      let proof = block["proof"];
      let str = (proof * proof - previousProof * previousProof).toString();
      let hashOperation = crypto.createHash("sha256").update(str).digest("hex");
      if (hashOperation.slice(0, 4) !== "0000") return false;
      previousBlock = block;
      blockIndex++;
    }
    return true;
  }

  addTransaction(sender, receiver, amount) {
    this.transactions.push({ sender, receiver, amount });
    let previousBlock = this.getPreviousBlock();
    return previousBlock["index"] + 1;
  }

  addNode(address) {
    if (!this.nodes.includes(address)) this.nodes.push(address);
  }

  async replaceChain() {
    let network = this.nodes;
    let longestChain = null;
    let maxLength = this.chain.length;
    for (var i = 0; i < network.length; i++) {
      let response = await axios.get(`${network[i]}/getChain`);
      if (response.status === 200) {
        let length = response.data.length;
        let chain = response.data.chain;
        if (length > maxLength && this.isChainValid(chain)) {
          maxLength = length;
          longestChain = chain;
        }
      }
    }
    if (longestChain !== null) {
      this.chain = longestChain;
      return true;
    }
    return false;
  }
}

module.exports = Blockchain;
