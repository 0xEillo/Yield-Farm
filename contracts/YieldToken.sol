pragma solidity 0.8.12;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract YieldToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("YieldToken", "YT") {
        _mint(msg.sender, initialSupply);
    }
}
