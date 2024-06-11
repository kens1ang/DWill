//written by group members
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Subscription
 * @dev A smart contract for handling subscription-based payments.
 */
contract SubscriptionContract {
    address public owner; // address of whoever deploys this contract
    uint256 public subscriptionAmount = 0.0005 ether; // amount required for regular subscription
    uint256 public firstPaymentAmount = 0.001 ether; // amount required for the first subscription payment
    uint256 public subscriptionDuration = 182 days; // duration of a subscription 182 days (6 months)
    uint256 public gracePeriod = 7 days; // grace period for subscription renewal (1 week)
    uint32 constant public VALID = 1; // subscription status: valid, no need for renewal
    uint32 constant public REQUIRES_RENEWAL = 2; // subscription status: in grace period, must renew
    uint32 constant public EXPIRED = 0; // subscription status: expired
    uint32 constant public NEW = 3; // subscription status: new subscriber

    struct Subscriber {
        uint256 lastPaymentTimestamp;
        bool isSubscribed;
    }

    mapping(address => Subscriber) public subscribers;

    event SubscriptionRenewed(address indexed subscriber, uint256 currentTimestamp, uint256 newExpirationTimestamp);
    event Unsubscribed(address indexed subscriber);
    event Status(address indexed subscriber, string status);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlySubscribed() {
        require(subscribers[msg.sender].isSubscribed, "Not subscribed");
        _;
    }

    /**
     * @dev Constructor that sets the owner to the address that deploys the contract.
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Checks the subscription status of a given address.
     * @param addressToValidate The address to check the subscription status for.
     * @return uint32 The subscription status (VALID, REQUIRES_RENEWAL, EXPIRED, NEW).
     */
    function checkSubscriptionStatus(address addressToValidate) public returns (uint32) {
        Subscriber storage subscriber = subscribers[addressToValidate];
        if (subscriber.isSubscribed) {
            // if subscription is valid
            if (block.timestamp < subscriber.lastPaymentTimestamp + subscriptionDuration) {
                emit Status(addressToValidate, "no need to renew, subscription is valid");
                return VALID;
            }
            // if subscription is expired
            else if (block.timestamp > subscriber.lastPaymentTimestamp + subscriptionDuration + gracePeriod) {
                subscribers[addressToValidate].isSubscribed = false;
                emit Unsubscribed(addressToValidate);
                emit Status(addressToValidate, "subscription is expired");
                return EXPIRED;
            }
            // within grace period, requires renewal
            else {
                emit Status(addressToValidate, "within grace period, requires renewal");
                return REQUIRES_RENEWAL;
            }
        } else {
            // new subscriber
            emit Status(addressToValidate, "not subscribed");
            return NEW;
        }
    }

    /**
     * @dev Handles subscription payments. Validates the payment amount and updates subscriber details.
     */
    function subscribe() external payable {
        address subscriberAddress = msg.sender;
        uint32 subscriptionStatus = checkSubscriptionStatus(subscriberAddress);
        
        // validate payment amount based on subscription status
        if (subscriptionStatus == EXPIRED || subscriptionStatus == NEW) {
            require(msg.value == firstPaymentAmount, "Invalid first subscription amount");
        } else if (subscriptionStatus == REQUIRES_RENEWAL) {
            require(msg.value == subscriptionAmount, "Invalid renewal amount");
        } else {
            revert("Invalid subscription status");
        }

        // transfer payment to the owner
        payable(owner).transfer(msg.value);

        // update subscriber details
        subscribers[subscriberAddress].lastPaymentTimestamp = block.timestamp;
        subscribers[subscriberAddress].isSubscribed = true;
        
        // emit events
        emit SubscriptionRenewed(subscriberAddress, block.timestamp, block.timestamp + subscriptionDuration);
        emit Status(subscriberAddress, "Successfully subscribed/renewed");
    }

    /**
     * @dev Returns the contract's current balance.
     * @return uint256 The contract's current balance.
     */
    function withdrawBalance() external view onlyOwner returns (uint256) {
        return payable(owner).balance;
    }

    /**
     * @dev Handles unsubscription by resetting the subscriber's status.
     */
    function unsubscribe() external onlySubscribed {
        subscribers[msg.sender].isSubscribed = false;
        emit Unsubscribed(msg.sender);
    }

    /**
     * @dev Fallback function to receive Ether payments.
     */
    receive() external payable {
        // handles payment that arrives from an unknown function signature
    }
}
