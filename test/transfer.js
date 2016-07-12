web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
    var transactionReceiptAsync;
    interval |= 500;
    transactionReceiptAsync = function(txnHash, resolve, reject) {
        try {
            var receipt = web3.eth.getTransactionReceipt(txnHash);
            if (receipt == null) {
                setTimeout(function () {
                    transactionReceiptAsync(txnHash, resolve, reject);
                }, interval);
            } else {
                resolve(receipt);
            }
        } catch(e) {
            reject(e);
        }
    };

    return new Promise(function (resolve, reject) {
        transactionReceiptAsync(txnHash, resolve, reject);
    });
};

contract('Library Transfer', function(accounts) {

  it("should accept ether in contract", function(done) {

    var meta = MetaCoin.deployed();
    var before = web3.eth.getBalance(meta.address);
    assert.equal(before.valueOf(), 0, "contract was not empty");

    var tx1 = web3.eth.sendTransaction({
        from: accounts[0], 
        to: meta.address,
        value: 1 });
    web3.eth.getTransactionReceiptMined(tx1)
      .then(function (receipt2) {
        var after = web3.eth.getBalance(meta.address);
        assert.equal(after.valueOf(), 1, "contract was not credited");
      })
      .then(done).catch(done);

  });

  it("should not accept ether in library", function(done) {

    var lib = ConvertLib.deployed();
    var before = web3.eth.getBalance(lib.address);
    assert.equal(before.valueOf(), 0, "library was not empty");

    var tx1;
    try {
      tx1 = web3.eth.sendTransaction({
          from: accounts[0], 
          to: lib.address,
          value: 1,
          gas: 100000 });
    } catch (e) {
      // We should be in TestRPC
      assert.include(e.toString(), "invalid JUMP", "should have been an invalid jump");
      done();
    }
    web3.eth.getTransactionReceiptMined(tx1)
      .then(function (receipt2) {
        assert.equal(receipt2.gasUsed, 100000, "all gas should have been used");
        var after = web3.eth.getBalance(lib.address);
        assert.equal(after.valueOf(), 0, "library should not have been credited");
      })
      .then(done).catch(done);

  });

});
