const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FarmerEscrow", function () {
  let factory, escrow, farmer, company;
  let totalPrice = ethers.parseEther("1.0");
  let quantity = 1000;
  let produceType = "Wheat";
  let deliveryDeadline = Math.floor(Date.now() / 1000) + 86400 * 7; // 7 days
  let penaltyPercent = 5;

  beforeEach(async function () {
    [company, farmer] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("FarmerEscrowFactory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();

    // Company creates the escrow
    const tx = await factory.connect(company).createEscrow(
      farmer.address,
      totalPrice,
      quantity,
      produceType,
      deliveryDeadline,
      penaltyPercent
    );

    const receipt = await tx.wait();

    // Find EscrowCreated event
    let escrowAddress;
    for (const log of receipt.logs) {
      try {
        const parsed = factory.interface.parseLog(log);
        if (parsed.name === "EscrowCreated") {
          escrowAddress = parsed.args.escrowAddress;
          break;
        }
      } catch {}
    }

    if (!escrowAddress) throw new Error("EscrowCreated event not found");

    escrow = await ethers.getContractAt("FarmerEscrow", escrowAddress);
  });

  it("Should create and accept agreement", async function () {
    await escrow.connect(farmer).acceptAgreement();
    expect(await escrow.status()).to.equal(1); // Active = 1
  });

  it("Should deposit funds", async function () {
    // Step 1: Farmer accepts
    await escrow.connect(farmer).acceptAgreement();

    // Step 2: Company deposits the correct amount
    await expect(
      escrow.connect(company).depositFunds({ value: totalPrice })
    )
      .to.emit(escrow, "FundsDeposited")
      .withArgs(totalPrice);

    expect(await ethers.provider.getBalance(escrow.target)).to.equal(totalPrice);
  });
});