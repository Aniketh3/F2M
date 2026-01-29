// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FarmerEscrow.sol";

contract FarmerEscrowFactory {
    
    // Array to keep track of all created escrow contracts
    address[] public allEscrows;

    // Event emitted when a new escrow is created
    event EscrowCreated(
        address indexed escrowAddress,
        address indexed company,
        address indexed farmer,
        uint256 totalPrice
    );

    /**
     * @dev Creates and deploys a new FarmerEscrow contract
     * @param _farmer Address of the farmer
     * @param _totalPrice Agreed total price (in wei)
     * @param _quantity Quantity of produce
     * @param _produceType Type or name of the produce
     * @param _deliveryDeadline Unix timestamp for delivery deadline
     * @param _penaltyPercent Penalty percentage (e.g. 5 = 5%)
     * @return newEscrow Address of the newly created escrow contract
     */
    function createEscrow(
        address _farmer,
        uint256 _totalPrice,
        uint256 _quantity,
        string memory _produceType,
        uint256 _deliveryDeadline,
        uint8 _penaltyPercent
    ) 
        external 
        returns (address newEscrow)
    {
        require(_farmer != address(0), "Invalid farmer address");
        require(_totalPrice > 0, "Total price must be greater than zero");
        require(_penaltyPercent <= 50, "Penalty percent too high"); // reasonable cap

        FarmerEscrow escrow = new FarmerEscrow(
            _farmer,
            msg.sender,
            _totalPrice,
            _quantity,
            _produceType,
            _deliveryDeadline,
            _penaltyPercent
        );

        newEscrow = address(escrow);
        allEscrows.push(newEscrow);

        emit EscrowCreated(newEscrow, msg.sender, _farmer, _totalPrice);

        return newEscrow;
    }

    /**
     * @dev Returns the total number of escrow contracts created
     */
    function getEscrowCount() external view returns (uint256) {
        return allEscrows.length;
    }

    /**
     * @dev Returns the address of an escrow at a specific index
     */
    function getEscrowAtIndex(uint256 index) external view returns (address) {
        require(index < allEscrows.length, "Index out of bounds");
        return allEscrows[index];
    }

    /**
     * @dev Returns all escrow addresses created so far
     */
    function getAllEscrows() external view returns (address[] memory) {
        return allEscrows;
    }
}