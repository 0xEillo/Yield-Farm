const { expect } = require("chai");

describe("YieldFarm", function () {
  let mockDai;
  let YieldFarm;
  let addr1;

  beforeEach(async function () {
    MockDai = await ethers.getContractFactory("MockDai");
    YieldFarm = await ethers.getContractFactory("YieldFarm");
    YieldToken = await ethers.getContractFactory("YieldToken");
    [tokenOwner, addr1] = await ethers.getSigners();

    mockDai = await MockDai.deploy(1000000000000);
    yieldToken = await YieldToken.deploy();
    yieldFarm = await YieldFarm.deploy(mockDai.address, yieldToken.address);
  });

  describe("Depositing Liquidity", function () {
    it("Tries to deposit 0 liquidity, reverts with message", async () => {
      await expect(
        yieldFarm.connect(addr1).depositLiquidity(0)
      ).to.be.revertedWith("No tokens deposit or more tokens than you own.");
    });

    it("Tries to deposit liquidity without owning any tokens, reverts with message", async () => {
      await expect(
        yieldFarm.connect(addr1).depositLiquidity(1)
      ).to.be.revertedWith("No tokens deposit or more tokens than you own.");
    });

    it("Tries to deposit liquidity without giving allowance to contract reverts with message", async () => {
      await mockDai.connect(tokenOwner).transfer(addr1.address, 10000000000);
      await expect(
        yieldFarm.connect(addr1).depositLiquidity(1)
      ).to.be.revertedWith(
        "Contract has not been given the allowance to trasfer your dai tokens."
      );
    });

    it("Checks the isEarning status before and after depositing yield", async () => {
      await mockDai.connect(tokenOwner).transfer(addr1.address, 10000000000);
      await mockDai.connect(addr1).approve(yieldFarm.address, 10);
      expect(await yieldFarm.connect(addr1).isEarning(addr1.address)).to.eq(
        false
      );
      await expect(yieldFarm.connect(addr1).depositLiquidity(10));
      expect(await yieldFarm.connect(addr1).isEarning(addr1.address)).to.eq(
        true
      );
    });

    it("Successfully deposits liquidity", async () => {
      await mockDai.connect(tokenOwner).transfer(addr1.address, 10000000000);
      await mockDai.connect(addr1).approve(yieldFarm.address, 10);
      await expect(yieldFarm.connect(addr1).depositLiquidity(10))
        .to.emit(yieldFarm, "DepositedLiquidity")
        .withArgs(addr1.address, 10);
    });
  });

  describe("Testing Yield calculator", function () {
    it("Deposits 10 tokens, waits 365 days, should have 10 tokens as yield", async () => {
      await mockDai.connect(tokenOwner).transfer(addr1.address, 10000000000);
      await mockDai.connect(addr1).approve(yieldFarm.address, 20);

      await yieldFarm.connect(addr1).depositLiquidity(10);
      expect(await yieldFarm.connect(addr1).yieldBalances(addr1.address)).to.eq(
        0
      );
      await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
      await yieldFarm.connect(addr1).depositLiquidity(10);
      expect(await yieldFarm.connect(addr1).yieldBalances(addr1.address)).to.eq(
        10
      );
    });
  });

  describe("Removing Liquidity", function () {
    it("Tries to remove 0 liquidity, reverts with message", async () => {
      await expect(
        yieldFarm.connect(addr1).removeLiquidity(0)
      ).to.be.revertedWith("You cannot remove 0 liquidity");
    });

    it("Tries to remove liquidity without any being deposited, reverts with message", async () => {
      await expect(
        yieldFarm.connect(addr1).removeLiquidity(1)
      ).to.be.revertedWith("You cannot remove more than you have deposited");
    });

    it("Successfully removes liquidity", async () => {
      await mockDai.connect(tokenOwner).transfer(addr1.address, 10000000000);
      await mockDai.connect(addr1).approve(yieldFarm.address, 10);
      await yieldFarm.connect(addr1).depositLiquidity(10);
      expect(await yieldFarm.connect(addr1).balances(addr1.address)).to.eq(10);
      await expect(yieldFarm.connect(addr1).removeLiquidity(10))
        .to.emit(yieldFarm, "RemovedLiquidity")
        .withArgs(addr1.address, 10);
      expect(await yieldFarm.connect(addr1).balances(addr1.address)).to.eq(0);
    });
  });

  describe("Claiming Yield", function () {
    beforeEach(async () => {
      await yieldToken.transferOwnership(yieldFarm.address);
    });

    it("Tries to claim 0 yield, reverts with message", async () => {
      await expect(yieldFarm.connect(addr1).claimYield()).to.be.revertedWith(
        "You cannot claim more yield than you have earned"
      );
    });

    it("Tries to claim more yield than earned, reverts with message", async () => {
      await expect(yieldFarm.connect(addr1).claimYield()).to.be.revertedWith(
        "You cannot claim more yield than you have earned"
      );
    });

    it("Should successfully remove liquidity", async () => {
      await mockDai.connect(tokenOwner).transfer(addr1.address, 10000000000);
      await mockDai.connect(addr1).approve(yieldFarm.address, 10);
      await yieldFarm.connect(addr1).depositLiquidity(10);
      // Advance time 365 days so that depositors can get rewards
      await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]); // 365 days
      expect(await yieldFarm.connect(addr1).claimYield())
        .to.emit(yieldFarm, "YieldClaimed")
        .withArgs(addr1.address, 10);
    });
  });
});
