const { expect } = require("chai");

describe("Wallet", () => {
  let Wallet, wallet, addr1, addr2, addr3, addr4, addr5;

  beforeEach(async () => {
    [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
    Wallet = await ethers.getContractFactory("Wallet");
    wallet = await Wallet.deploy(
      [addr1.address, addr2.address, addr3.address],
      2
    );
    await addr1.sendTransaction({
      from: addr1.address,
      to: wallet.address,
      value: 1000,
    });
  });

  describe("Deployment", () => {
    it("Should have the correct approvers and quorum", async () => {
      const approvers = await wallet.getApprovers();
      const quorum = await wallet.quorum();

      expect(approvers.length).to.equal(3);
      expect(approvers[0]).to.equal(addr1.address);
      expect(approvers[1]).to.equal(addr2.address);
      expect(approvers[2]).to.equal(addr3.address);
      expect(quorum.toNumber()).to.equal(2);
    });
  });

  describe("Transfers", () => {
    it("Should create transfers", async () => {
      await wallet.connect(addr1).createTransfer(100, addr5.address);
      const transfers = await wallet.getTransfers();
      expect(transfers.length).to.equal(1);
      expect(transfers[0].id.toNumber()).to.equal(0);
      expect(transfers[0].amount.toNumber()).to.equal(100);
      expect(transfers[0].to).to.equal(addr5.address);
      expect(transfers[0].approvals.toNumber()).to.equal(0);
      expect(transfers[0].sent).to.equal(false);
    });

    it("Should not create transfers, if sender is not approved", async () => {
      await expect(
        wallet.connect(addr4).createTransfer(100, addr5.address)
      ).to.be.revertedWith("only approver allowed");
    });
  });

  describe("Approvals", () => {
    it("should increment approvals", async () => {
      await wallet.connect(addr1).createTransfer(100, addr5.address);
      await wallet.connect(addr1).approveTransfer(0);
      const transfers = await wallet.getTransfers();
      expect(transfers[0].approvals.toNumber()).to.equal(1);
      expect(transfers[0].sent).to.equal(false);
      const balance = await ethers.provider.getBalance(wallet.address);
      expect(balance.toNumber()).to.equal(1000);
    });

    it("should send transfer if quorum reached", async () => {
      const balanceBefore = ethers.BigNumber.from(
        await ethers.provider.getBalance(wallet.address)
      );
      await wallet.connect(addr1).createTransfer(100, addr5.address);
      await wallet.connect(addr1).approveTransfer(0);
      await wallet.connect(addr2).approveTransfer(0);
      const transfers = await wallet.getTransfers();
      expect(transfers[0].approvals.toNumber()).to.equal(2);
      expect(transfers[0].sent).to.equal(true);
      const balanceAfter = ethers.BigNumber.from(
        await ethers.provider.getBalance(wallet.address)
      );
      expect(balanceBefore.sub(balanceAfter).toNumber()).to.equal(100);
    });

    it("should NOT approve transfer if sender is not allowed", async () => {
      await wallet.connect(addr1).createTransfer(100, addr5.address);
      await expect(wallet.connect(addr4).approveTransfer(0)).to.be.revertedWith(
        "only approver allowed"
      );
    });

    it("should NOT approve transfer twice", async () => {
      await wallet.connect(addr1).createTransfer(100, addr5.address);
      await wallet.connect(addr1).approveTransfer(0);
      await expect(wallet.connect(addr1).approveTransfer(0)).to.be.revertedWith(
        "cannot approve transfer twice"
      );
    });
  });
});
