// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract Marketplace{
    string public name;
    uint public productCount = 0;
    mapping(uint => Product) public products;

    struct Product{
        uint id;
        string name;
        uint price;
        address payable oldOwner;
        address payable owner;
        bool purchased;
    }

    event ProductCreated(
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    event ProductPurchased(
        uint id,
        string name,
        uint price,
        address payable oldOwner,
        address payable owner,
        bool purchased
    );

    constructor(){
        name = "Daivik's Ecommerce";
    }

    function createProduct(string memory _name, uint _price) public{
        //make sure parameters are correct
        require(bytes(_name).length > 0);
        require(_price > 0);
        //Increment Product count
        productCount = productCount + 1;
        //Create the product
        products[productCount] = Product(productCount,_name,_price,payable(msg.sender),payable(msg.sender),false);
        //Trigger the event
        emit ProductCreated(productCount, _name, _price, payable(msg.sender), false);

    }

    function purchaseProduct(uint _id) public payable{
        //Fetch the product
        Product memory _product = products[_id];
        //Fetch the owner
        address payable _seller = _product.owner;
        // Make sure the product is valid
        require(_product.id > 0 && _product.id <= productCount);
        // Require that there is enough ethers in the transactions
        require(msg.value >= _product.price);
        // Require that the product is not purchased already
        require(!_product.purchased);
        // require that the buyer is not the seller
        require(_seller != msg.sender);
        _product.oldOwner = _product.owner;
        // Transfer the ownership
        _product.owner = payable(msg.sender);
        // MArk as purchased
        _product.purchased = true;
        // Update the product
        products[_id] = _product;
        // Transfer the seller by sending them Ether
        payable(address(_seller)).transfer(msg.value);
        //Trigger the event
        emit ProductPurchased(productCount, _product.name, _product.price, _product.oldOwner, payable(msg.sender), true);

    }
}