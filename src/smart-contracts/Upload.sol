// sources: https://github.com/kshitijofficial/Dgdrive3.0

// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

contract Upload {
    struct Access{
        address user;
        bool access;
    }

    mapping(address=>string[]) value; //stores URL
    mapping(address=>mapping(address=>bool)) ownership;
    mapping(address=>Access[]) public accessList;
    mapping(address=>mapping(address=>bool)) previousData;

    function add(address _user, string calldata url) external{
        value[_user].push(url);
    }

    function allow(address user) external{
        ownership[msg.sender][user]=true;

        if (previousData[msg.sender][user] == true) {
            for (uint i = 0; i < accessList[msg.sender].length; i++) {
                if (accessList[msg.sender][i].user == user) {
                    accessList[msg.sender][i].access = true;
                }
            }
        } else {
            accessList[msg.sender].push(Access(user,true));
            previousData[msg.sender][user] = true;
        }
    }

    function disallow(address user) external{
        ownership[msg.sender][user] = false;

        for (uint i = 0; i < accessList[msg.sender].length; i++) {
            if (accessList[msg.sender][i].user == user) {
                accessList[msg.sender][i].access = false;
            }
        }
    }

    event DebugInfo(address indexed user, address indexed sender, bool conditionMet);

    function display(address _user) external returns(string[] memory) {
        require(_user == msg.sender || ownership[_user][msg.sender], "You don't have access");

        emit DebugInfo(_user, msg.sender, true);
        return value[_user];
    }

    function shareAccess() public view returns(Access[] memory) {
        return accessList[msg.sender];
    }
}