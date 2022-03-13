pragma solidity 0.8.12;
import "./YieldToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract YieldFarm is Ownable {
    IERC20 public dai;
    YieldToken public yieldToken;

    mapping(address => uint256) public balances;
    mapping(address => bool) public isEarning;
    mapping(address => uint256) public startTime;
    mapping(address => uint256) public yieldBalances;

    event DepositedLiquidity(address depositer, uint256 amount);
    event RemovedLiquidity(address depositer, uint256 amount);
    event YieldClaimed(address depositer, uint256 amount);

    constructor(IERC20 _dai, YieldToken _yieldToken) {
        dai = _dai;
        yieldToken = _yieldToken;
    }

    function depositLiquidity(uint256 amount) public {
        require(
            amount > 0 && dai.balanceOf(msg.sender) >= amount,
            "No tokens deposit or more tokens than you own."
        );
        require(
            dai.allowance(msg.sender, address(this)) >= amount,
            "Contract has not been given the allowance to trasfer your dai tokens."
        );

        if (isEarning[msg.sender] == true) {
            yieldBalances[msg.sender] += calculateYield(msg.sender);
        } else {
            startTime[msg.sender] = block.timestamp;
        }

        balances[msg.sender] += amount;
        isEarning[msg.sender] = true;

        dai.transferFrom(msg.sender, address(this), amount);
        emit DepositedLiquidity(msg.sender, amount);
    }

    function removeLiquidity(uint256 amount) public {
        require(amount > 0, "You cannot remove 0 liquidity");
        require(
            balances[msg.sender] >= amount,
            "You cannot remove more than you have deposited"
        );
        balances[msg.sender] -= amount;
        dai.transfer(msg.sender, amount);

        // Check is user is earning Yield and if so add earned yield to balance before removing liquidity
        if (isEarning[msg.sender] == true) {
            yieldBalances[msg.sender] += calculateYield(msg.sender);
        }
        // If user removes all of his liquidity then set isEarning to false
        if (amount == balances[msg.sender]) {
            isEarning[msg.sender] = false;
        }
        emit RemovedLiquidity(msg.sender, amount);
    }

    function claimYield() public {
        uint256 earnedYield = calculateYield(msg.sender);
        require(
            earnedYield > 0 || yieldBalances[msg.sender] > 0,
            "You cannot claim more yield than you have earned"
        );
        if (yieldBalances[msg.sender] != 0) {
            earnedYield += yieldBalances[msg.sender];
        }
        startTime[msg.sender] = block.timestamp;
        yieldToken.transfer(msg.sender, earnedYield);
        emit YieldClaimed(msg.sender, earnedYield);
    }

    function calculateYield(address user) internal view returns (uint256) {
        uint256 time = calculateYieldTime(user) * 10**18;
        uint256 rate = 365 days;
        uint256 earnedYield = (balances[user] * (time / rate)) / 10**18;
        return earnedYield;
    }

    function calculateYieldTime(address user) internal view returns (uint256) {
        return block.timestamp - startTime[user];
    }
}
