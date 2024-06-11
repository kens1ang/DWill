//written by group members
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DeadManSwitch
 * @dev Smart contract for managing a benefactor's dead man's switch with assigned beneficiaries.
 */

contract DeadManSwitch {

    struct Beneficiary {
        bool exists;
        string[] ipfsCIDs; // array to store IPFS CIDs
        string beneficiaryPublicKey;
    }
    struct BenefactorInfo {
        bool exists;
        mapping(address => Beneficiary) beneficiaries;
        uint256 countdownDuration;
        uint256 lastBenefactorResponseTime;
        bool isSwitchedOff;
        bool isAlive;
        string benefactorPublicKey;
    }


    mapping(address => BenefactorInfo) private benefactors; 

    //auxiliary mapping to store keys of beneficiaries
    mapping(address => address[]) private beneficiaryKeys;

    event DeadMansSwitchEnabled(address indexed benefactor, address indexed beneficiary, uint256 countdownDuration);
    event DeadMansSwitchDisabled(address indexed benefactor, address indexed caller, uint256 responseTime);
    event BeneficiaryAdded(address indexed benefactor, address indexed beneficiary);
    event BeneficiaryRemoved(address indexed benefactor, address indexed beneficiary);
    event SwitchAlreadyOff(address indexed benefactor, address indexed caller);
    event SwitchAlreadyOn(address indexed benefactor, address indexed caller);
    event RemainingCountdownInfo(address indexed benefactor, uint256 countdownDuration, uint256 responseTime, uint256 currentTime, uint256 lastBenefactorResponseTime);
    event BenefactorIsAlive(address indexed benefactor, string aliveStatus);
    event BenefactorIsDead(address indexed benefactor, string deadStatus);
    event IpfsCIDAdded(address indexed benefactor, address indexed beneficiary, string ipfsCID);
    event IpfsCIDRemoved(address indexed benefactor, address indexed beneficiary, string ipfsCID);
    event BenefactorKeyAdded(address indexed benefactor, string key);
    event BeneficiaryKeyAdded(address indexed benefactor, address indexed beneficiary, string key);
    event BenefactorsData(bool switchStatus, address[] beneficiaries, uint256 remainingTime, bool isAlive, string publicKey, string[] allIpfsCIDs);
    event BeneficiariesData(bool switchStatus, uint256 remainingTime, bool isAlive, string publicKey);

    /**
     * @dev Modifier to check if the caller is the benefactor.
     */
    modifier onlyBenefactor() {
        require(benefactors[msg.sender].exists && benefactors[msg.sender].isAlive, "Not a valid benefactor");
        _;
    }

    constructor() {}

    /**
     * @dev Sets up a benefactor. Only callable by benefactor.
     */
    function setBenefactor() public{
        benefactors[msg.sender].exists=true;
        benefactors[msg.sender].countdownDuration = 7*24*3600 seconds; // count down set to 1 week
        // benefactors[msg.sender].countdownDuration = 120 seconds;
        benefactors[msg.sender].isSwitchedOff = true;
        benefactors[msg.sender].isAlive = true;
        benefactors[msg.sender].lastBenefactorResponseTime = 0;
        benefactors[msg.sender].benefactorPublicKey = "";
    }


    /**
     * @dev Checks if the given address is a beneficiary. Only benefactor
     * @param _address The address to check.
     * @return A boolean indicating whether the address is a beneficiary.
     */
    function isBeneficiary(address _benefactor, address _address) public view returns (bool) {
        return benefactors[_benefactor].beneficiaries[_address].exists;
    }


    /**
    * @dev Auxiliary function to return the number of beneficiaries for a benefactor.
    */
    function getBeneficiariesCount(address _benefactor) private view returns (uint256) {
        return beneficiaryKeys[_benefactor].length;
    }
    /**
    * @dev adds the benefactor public key to the specified benefactor-beneficiary pair
    */
    function addBenefactorPublicKey(address _benefactor, string memory _key) public {
        benefactors[_benefactor].benefactorPublicKey = _key;
        emit BenefactorKeyAdded(_benefactor, _key);
    }
    /**
    * @dev adds the beneficiary public key to the specified benefactor-beneficiary pair
    */
    function addBeneficiaryPublicKey(address _benefactor, address _beneficiary, string memory _key) public {
        require(isBeneficiary(_benefactor,_beneficiary), "Beneficiary/Benefactor not found");
        benefactors[_benefactor].beneficiaries[_beneficiary].beneficiaryPublicKey = _key;
        emit BeneficiaryKeyAdded(_benefactor,_beneficiary, _key);
    }

    /**
    * @dev returns the benefactor public key from the specified benefactor-beneficiary pair
    */
    function getBenefactorPublicKey(address _benefactor) public view returns(string memory) {
        if (isBeneficiary(_benefactor, msg.sender)) {
            return benefactors[_benefactor].benefactorPublicKey;
        } else {
            return "";
        }
    }

    /**
    * @dev returns the beneficiary public key from the specified benefactor-beneficiary pair
    */
    function getBeneficiaryPublicKey(address _benefactor, address _beneficiary) public view returns(string memory) {
        if (isBeneficiary(_benefactor, _beneficiary)) {
            return benefactors[_benefactor].beneficiaries[_beneficiary].beneficiaryPublicKey;
        } else {
            return "";
        }
    }

    /**
     * @dev Removes a benefactor. Only callable by benefactor.
     */
    function removeBenefactor(address _benefactor) public {
        require(benefactors[msg.sender].exists, "Benefactor not registered");
        benefactors[msg.sender].exists = false;
        delete benefactors[_benefactor];
    }

    function getSwitchStatus(address _benefactor) public view returns (bool) {
        require(benefactors[_benefactor].exists,"Benefactor does not exist");
        return !benefactors[_benefactor].isSwitchedOff;
    }

    /**
     * @dev Removes a beneficiary from the list. Only callable by the benefactor.
     * @param _beneficiary The address of the beneficiary to be removed.
     */
    function removeBeneficiary(address _beneficiary) external onlyBenefactor {
        require(isBeneficiary(msg.sender,_beneficiary), "Beneficiary not found");
        delete benefactors[msg.sender].beneficiaries[_beneficiary];
        emit BeneficiaryRemoved(msg.sender,_beneficiary);
    }

    /**
    * @dev Adds new beneficiaries to the list. Only callable by the benefactor.
    * @param _beneficiaries The addresses of the new beneficiaries.
    */
    function addBeneficiaries(address[] calldata _beneficiaries) external onlyBenefactor {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            address beneficiary = _beneficiaries[i];
            require(!isBeneficiary(msg.sender, beneficiary), "Beneficiary already exists");
            benefactors[msg.sender].beneficiaries[beneficiary] = Beneficiary(true, new string[](0), "");
            beneficiaryKeys[msg.sender].push(beneficiary); // Add beneficiary to the beneficiaryKeys mapping
            emit BeneficiaryAdded(msg.sender, beneficiary);
        }
    }


    /**
     * @dev Add an IPFS CID array to the specified beneficiary. Only callable by benefactor.
     * @param _beneficiary The address of the beneficiary.
     * @param _ipfsCIDs Array of IPFS CIDs to add.
     */

    function addIpfsCIDs(address _beneficiary, string[] memory _ipfsCIDs) external onlyBenefactor {
        require(isBeneficiary(msg.sender,_beneficiary), "Beneficiary not found");
        string[] storage ipfsCIDs = benefactors[msg.sender].beneficiaries[_beneficiary].ipfsCIDs;
        for (uint256 i = 0; i < _ipfsCIDs.length; i++) {
            // Check if CID already exists
            bool cidExists = false;
            for (uint256 j = 0; j < ipfsCIDs.length; j++) {
                if (keccak256(abi.encodePacked(ipfsCIDs[j])) == keccak256(abi.encodePacked(_ipfsCIDs[i]))) {
                    cidExists = true;
                    break;
                }
            }
            require(!cidExists, "CID already assigned to this beneficiary");
            // If CID doesn't exist, append it to the list
            ipfsCIDs.push(_ipfsCIDs[i]);
            emit IpfsCIDAdded(msg.sender,_beneficiary, _ipfsCIDs[i]);
        }
    }

    /**
     * @dev Removes an IPFS CID from the specified beneficiary. Only callable by benefactor.
     * @param _beneficiary The address of the beneficiary.
     * @param _ipfsCID The IPFS CID to remove.
     */
    function removeIpfsCID(address _beneficiary, string memory _ipfsCID) external onlyBenefactor {
        require(isBeneficiary(msg.sender, _beneficiary), "Beneficiary not found");

        string[] storage ipfsCIDs = benefactors[msg.sender].beneficiaries[_beneficiary].ipfsCIDs;
        
        // check if the CID exists
        for (uint256 i = 0; i < ipfsCIDs.length; i++) {
            if (keccak256(abi.encodePacked(ipfsCIDs[i])) == keccak256(abi.encodePacked(_ipfsCID))) {
                // remove CID by overwriting with the last element
                ipfsCIDs[i] = ipfsCIDs[ipfsCIDs.length - 1];
                // decrease the array length by one
                ipfsCIDs.pop();
                emit IpfsCIDRemoved(msg.sender, _beneficiary, _ipfsCID);
                return;
            }
        }
        // CID not found
        revert("CID not assigned to this beneficiary");
    }


    /**
     * @dev Enables the dead man's switch. Only callable by beneficiaries.
     * @param _benefactor The address of the benefactor.
     */
    function enableSwitch(address _benefactor) external {
        //checks if the caller is a beneficiary of the benefactor
        require(benefactors[_benefactor].beneficiaries[msg.sender].exists, "Not a valid beneficiary");
        if (!benefactors[_benefactor].isSwitchedOff) {
            emit SwitchAlreadyOn(_benefactor,msg.sender);
            return;
        }
        benefactors[_benefactor].isSwitchedOff = false; // switch is on
        // countdown starts
        benefactors[_benefactor].lastBenefactorResponseTime = block.timestamp; //setting last response time as current time, this shows that countdown starts at this moment when the switch is enabled
        emit DeadMansSwitchEnabled(_benefactor,msg.sender, benefactors[_benefactor].countdownDuration);
    }

    /**
     * @dev Returns the remaining countdown time.
     * @param _benefactor The address of the benefactor.
     * @return The remaining countdown time in seconds.
     */
    function getRemainingCountdownTime(address _benefactor) public returns (uint256) {
        uint256 responseTime = block.timestamp - benefactors[_benefactor].lastBenefactorResponseTime;
        emit RemainingCountdownInfo(_benefactor,benefactors[_benefactor].countdownDuration, responseTime, block.timestamp, benefactors[_benefactor].lastBenefactorResponseTime);
        return (responseTime > benefactors[_benefactor].countdownDuration) ? 0 : benefactors[_benefactor].countdownDuration - responseTime;
    }

    /**
     * @dev Checks the alive status of the benefactor.
     * @param _benefactor The address of the benefactor.
     * @return A boolean indicating whether the benefactor is alive.
     */
    function checkAliveStatus(address _benefactor) public returns (bool) {
        if (getSwitchStatus(_benefactor)){
            if (benefactors[_benefactor].lastBenefactorResponseTime != 0) {
                uint256 remainingCountdown = getRemainingCountdownTime(_benefactor);
                if (remainingCountdown <= 0) {
                    benefactors[_benefactor].isAlive = false;
                }
             }   
        }
        return benefactors[_benefactor].isAlive;
    }

    /**
     * @dev Disables the dead man's switch. Only callable by the benefactor.
     */
    function disableSwitch() internal onlyBenefactor {
        if (benefactors[msg.sender].isSwitchedOff) {
            emit SwitchAlreadyOff(msg.sender,msg.sender);
            return;
        }
        benefactors[msg.sender].isSwitchedOff = true;
        emit DeadMansSwitchDisabled(msg.sender,msg.sender, block.timestamp);
    }

    /**
     * @dev Performs actions based on benefactor's activity when responding to an enabled switch. Only callable by the benefactor.
     */
    function respondToSwitch() external onlyBenefactor {
        if (benefactors[msg.sender].lastBenefactorResponseTime != 0) {
            if (checkAliveStatus(msg.sender)) {
                emit BenefactorIsAlive(msg.sender,"Benefactor is alive");
                disableSwitch();
                benefactors[msg.sender].lastBenefactorResponseTime = block.timestamp;
            } else {
                emit BenefactorIsDead(msg.sender,"Benefactor is dead");
            }
        } else {
            emit BenefactorIsAlive(msg.sender,"Benefactor is alive");
            disableSwitch();
            benefactors[msg.sender].lastBenefactorResponseTime = block.timestamp;
        }
    }
    
    /**
     * @dev Release CIDs to beneficiary.
     * @param _benefactor The address of the benefactor.
     * @param _beneficiary The address of the beneficiary.
     */
    function getCIDs(address _benefactor, address _beneficiary) public view returns (string[] memory){
        require(isBeneficiary(_benefactor,_beneficiary),"Beneficiary not found");
        require(benefactors[_benefactor].beneficiaries[msg.sender].exists && benefactors[_benefactor].isAlive == false,"No access to CIDs");
        return benefactors[_benefactor].beneficiaries[_beneficiary].ipfsCIDs;
    }


    /**
    * @dev Auxiliary function to return the total count of all IPFS CIDs across all beneficiaries for a benefactor.
    */
    function getTotalBeneficiaryCIDsCount(address _benefactor) private view returns (uint256) {
        uint256 totalCount = 0;
        uint256 count = getBeneficiariesCount(_benefactor);
        for (uint256 i = 0; i < count; i++) {
            address beneficiary = beneficiaryKeys[_benefactor][i];
            if (benefactors[_benefactor].beneficiaries[beneficiary].exists) {
                totalCount += benefactors[_benefactor].beneficiaries[beneficiary].ipfsCIDs.length;
            }
        }
        return totalCount;
    }

    
    /**
     * @dev Returns current data of benefactor.
     */
    function getBenefactorData(address _benefactor) public returns (bool switchStatus, address[] memory beneficiaries, uint256 remainingTime, bool isAlive, string memory publicKey, string[] memory allIpfsCIDs) {
        require(benefactors[_benefactor].exists, "Benefactor does not exist");
        switchStatus = !benefactors[_benefactor].isSwitchedOff;
        beneficiaries = new address[](getBeneficiariesCount(_benefactor));
        uint256 totalCIDsCount = getTotalBeneficiaryCIDsCount(_benefactor);
        allIpfsCIDs = new string[](totalCIDsCount);
        uint256 index = 0;

        uint256 count = getBeneficiariesCount(_benefactor);
        for (uint256 i = 0; i < count; i++) {
            address beneficiary = beneficiaryKeys[_benefactor][i];
            if (benefactors[_benefactor].beneficiaries[beneficiary].exists) {
                string[] memory beneficiaryCIDs = benefactors[_benefactor].beneficiaries[beneficiary].ipfsCIDs;
                for (uint256 j = 0; j < beneficiaryCIDs.length; j++) {
                    allIpfsCIDs[index] = beneficiaryCIDs[j];
                    index++;
                }
            }
        }
        if (benefactors[_benefactor].isSwitchedOff) {
            remainingTime = 0;
        } else {
            remainingTime = getRemainingCountdownTime(_benefactor);
        }
        isAlive = benefactors[_benefactor].isAlive;
        publicKey = benefactors[_benefactor].benefactorPublicKey;

        emit BenefactorsData(switchStatus, beneficiaries, remainingTime, isAlive, publicKey, allIpfsCIDs);
        return (switchStatus, beneficiaries, remainingTime, isAlive, publicKey, allIpfsCIDs);
    }


    /**
     * @dev Returns current status of benefactor to beneficiary.
     */
    function getBeneficiaryData(address _benefactor, address _beneficiary) public returns (bool switchStatus, uint256 remainingTime, bool isAlive, string memory publicKey) {
        require(benefactors[_benefactor].exists, "Benefactor does not exist");
        switchStatus = !benefactors[_benefactor].isSwitchedOff;
        if (benefactors[_benefactor].isSwitchedOff) {
            remainingTime = 0;
        } else {
            remainingTime = getRemainingCountdownTime(_benefactor);
        }
        isAlive = benefactors[_benefactor].isAlive;
        publicKey = benefactors[_benefactor].beneficiaries[_beneficiary].beneficiaryPublicKey;

        emit BeneficiariesData(switchStatus, remainingTime, isAlive, publicKey);
        return (switchStatus, remainingTime, isAlive, publicKey);
    }
}