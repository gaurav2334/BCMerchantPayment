const { assert } = require('chai');

require('chai')
    .use(require('chai-as-promised'))
    .should()

const Marketplace = artifacts.require('Marketplace');

contract('Marketplace', ([deployer, seller, buyer]) => {
    before(async() =>{
        marketplace = await Marketplace.deployed();
    })

    describe('deployment', async() => {
        it('deploys successfully', async() => {
            const address = await marketplace.address
            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })
        
        it('has a name', async() =>{
            const name = await marketplace.name()
            assert.equal(name, "Daivik's Ecommerce")
        })
    })

    describe('Product Creation', async() => {
        let result, _productCount
        before(async() =>{
            result = await marketplace.createProduct('IPhone', web3.utils.toWei('1', 'Ether'), {from: seller})
            _productCount = await marketplace.productCount()
        })
    
        it('Creates Product', async() => {
            //SUCCESS
            assert.equal(_productCount,1)
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), _productCount.toNumber(), 'Id is correct')
            assert.equal(event.name, 'IPhone', 'Name is correct')
            assert.equal(event.price, '1000000000000000000', 'Price is correct')
            assert.equal(event.owner, seller, 'Id is correct')
            assert.equal(event.purchased, false, "Purchased is correct")

            //Failure : Product must have a name
            await marketplace.createProduct('', web3.utils.toWei('1', 'Ether'), {from: seller}).should.be.rejected;
            //Product must have a price
            await marketplace.createProduct('IPhone', 0, {from: seller}).should.be.rejected;
        })

        it('List Products', async() => {
            //SUCCESS
            const product = await marketplace.products(_productCount)
            assert.equal(product.id.toNumber(), _productCount.toNumber(), 'Id is correct')
            assert.equal(product.name, 'IPhone', 'Name is correct')
            assert.equal(product.price, '1000000000000000000', 'Price is correct')
            assert.equal(product.owner, seller, 'Id is correct')
            assert.equal(product.purchased, false, "Purchased is correct")
        })
        
        it('Sells Products', async() => {
            //SUCCESS
            // Check seller balance before purchase
            let oldSellerBalance 
            oldSellerBalance = await web3.eth.getBalance(seller);
            oldSellerBalance = new web3.utils.BN(oldSellerBalance);

            result = await marketplace.purchaseProduct(_productCount, {from: buyer, value: web3.utils.toWei('1', 'Ether')})
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), _productCount.toNumber(), 'Id is correct')
            assert.equal(event.name, 'IPhone', 'Name is correct')
            assert.equal(event.price, '1000000000000000000', 'Price is correct')
            assert.equal(event.owner, buyer, 'Id is correct')
            assert.equal(event.purchased, true, "Purchased is correct")

            // Check seller new balance

            let newSellerBalance 
            newSellerBalance = await web3.eth.getBalance(seller);
            newSellerBalance = new web3.utils.BN(newSellerBalance);

            let Price
            Price = web3.utils.toWei('1','Ether')
            Price = new web3.utils.BN(Price)

            const expectedBalance = oldSellerBalance.add(Price);
            assert.equal(newSellerBalance.toString(), expectedBalance.toString());


            //Failure
            // Tries to buy the product which is not present
            await marketplace.purchaseProduct(99, {from: buyer,  value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
            // Buyer tries to buy with not enough amount of ethers
            await marketplace.purchaseProduct(_productCount, {from: buyer,  value: web3.utils.toWei('0.5', 'Ether')}).should.be.rejected;
            // Purchasing already sold item
            await marketplace.purchaseProduct(_productCount, {from: deployer,  value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
            // Buyer can not buy again
            await marketplace.purchaseProduct(_productCount, {from: buyer,  value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
        })
    })
})