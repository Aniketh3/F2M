const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleAuction", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploySimpleAuctionFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = ethers.utils.parseEther("1"); // Ensure ethers is imported

    const biddingTime = ONE_YEAR_IN_SECS;
    const beneficiary = "0xdD2FD4581271e230360230F9337D5c0430Bf44C0"; // Replace with actual address

    // Contracts are deployed using the first signer/account by default
    const [deployer] = await ethers.getSigners();

    const SimpleAuction = await ethers.getContractFactory("SimpleAuction");
    const auction = await SimpleAuction.deploy(biddingTime, beneficiary);

    return { auction, biddingTime, ONE_GWEI, deployer };
  }

  describe("Deployment", function () {
    it("Should set the right auction end time", async function () {
      const { auction, biddingTime } = await loadFixture(deploySimpleAuctionFixture);

      const auctionEndTime = await auction.auctionEndTime();
      expect(auctionEndTime).to.equal((await time.latest()) + biddingTime);
    });

    it("Should set the right beneficiary", async function () {
      const { auction, deployer } = await loadFixture(deploySimpleAuctionFixture);

      const beneficiary = await auction.beneficiary();
      expect(beneficiary).to.equal(deployer.address);
    });
  });

  describe("Bidding", function () {
    it("Should allow placing a bid and update the highest bid", async function () {
      const { auction, ONE_GWEI, deployer } = await loadFixture(deploySimpleAuctionFixture);

      await auction.connect(deployer).bid({ value: ONE_GWEI });

      const highestBidder = await auction.highestBidder();
      const highestBid = await auction.highestBid();

      expect(highestBidder).to.equal(deployer.address);
      expect(highestBid).to.equal(ONE_GWEI);
    });

    it("Should not allow bids lower than the highest bid", async function () {
      const { auction, ONE_GWEI, deployer } = await loadFixture(deploySimpleAuctionFixture);

      await auction.connect(deployer).bid({ value: ONE_GWEI });

      await expect(
        auction.connect(deployer).bid({ value: ONE_GWEI.sub(1) })
      ).to.be.revertedWith("There already is a higher bid.");
    });
  });

  describe("Auction End", function () {
    it("Should allow the owner to end the auction after it has ended", async function () {
      const { auction, biddingTime } = await loadFixture(deploySimpleAuctionFixture);

      await time.increaseTo((await time.latest()) + biddingTime);

      await expect(auction.auctionEnd()).not.to.be.reverted;
    });

    it("Should revert if trying to end the auction before it has ended", async function () {
      const { auction } = await loadFixture(deploySimpleAuctionFixture);

      await expect(auction.auctionEnd()).to.be.revertedWith("Auction not yet ended.");
    });
  });
});
