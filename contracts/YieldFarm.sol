pragma solidity 0.8.12;
import "./YieldToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract YieldFarm is Ownable {
    YieldToken yieldToken;
    address dai;

    mapping(address => uint256) public balances;

    constructor(address daiToken) {
        dai = daiToken;
    }

    function depositLiquidity(uint256 amount) public {
        require(amount > 0 && IERC20(dai).balanceOf(msg.sender) >= amount);
        balances[msg.sender] += amount;
    }

    function removeLiquidity() public {}

    function claimInterest() public {}
}
