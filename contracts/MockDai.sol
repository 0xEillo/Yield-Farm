pragma solidity 0.8.12;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockDai is ERC20 {
    constructor(uint256 initialSupply) ERC20("MockDai", "Dai") {
        _mint(msg.sender, initialSupply);
    }
}
