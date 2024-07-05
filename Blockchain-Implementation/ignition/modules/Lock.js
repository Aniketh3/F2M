const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SimpleAuctionModule", (m) => {
  const biddingTime = m.getParameter("biddingtime", 6000); // Default to 6000 seconds
  const beneficiary = m.getParameter("beneficiary", "0xdD2FD4581271e230360230F9337D5c0430Bf44C0");

  console.log("Parameters received:", { biddingTime, beneficiary });

  if (!beneficiary) {
    throw new Error("Beneficiary address must be provided");
  }

  const simpleAuction = m.contract("SimpleAuction", [biddingTime, beneficiary]);

  return { simpleAuction };
});
