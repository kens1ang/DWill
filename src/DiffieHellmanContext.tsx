//code written by group

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { ethers } from 'ethers';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import * as constants from "./constants";


interface DiffieHellmanType {
  prime: number;
  generator: number;
}

interface DiffieHellmanContextType {
  diffieHellman: DiffieHellmanType | null;
  setDiffieHellman: (dh: DiffieHellmanType) => void;
  computeSecret: (publicKey: number, privateKey: number) => number | null;
  generatePublicKey: (privateKey: number) => number;
}

const DiffieHellmanContext = createContext<DiffieHellmanContextType>({
  diffieHellman: null,
  setDiffieHellman: () => {},
  computeSecret: () => null,
  generatePublicKey: () => 0, // Default implementation
});

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);

export const DiffieHellmanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [diffieHellman, setDiffieHellman] = useState<DiffieHellmanType | null>(null);

  useEffect(() => {
    const initializeDiffieHellman = async () => {
      const prime = 23;
      const generator = 5;
      // Set the Diffie-Hellman context
      setDiffieHellman({
        prime,
        generator,
      });
    };

    initializeDiffieHellman();
  }, []);

  const computeSecret = (publicKey: number, privateKey: number): number | null => {
    console.log(`Public key: ${publicKey}`)
    console.log(`Private key: ${privateKey}`)
    //parse private key as BigInt
    const privateKeyNum = BigInt(privateKey.toString().replace(".", "").replace("e+76", "").slice(0,8));
    console.log(`Private key num: ${privateKeyNum}`);
    //convert publicKey to BigInt
    const publicKeyBigInt = BigInt(publicKey);
    //check if diffieHellman is null
    if (diffieHellman === null) {
      return null;
    }
    //calculate the shared secret using modular exponentiation and multiplying with prime to make the number larger for encryption
    const sharedSecret = (Number(publicKeyBigInt ** privateKeyNum % BigInt(diffieHellman.prime)))*(diffieHellman.prime**(diffieHellman.generator*diffieHellman.generator));
    console.log(`shared secret: ${sharedSecret}`);
    return sharedSecret;
  };

  function modExp(base: number, exp: number, modulus: number): number {
    var exponent = parseInt(exp.toString().replace(".", "").replace("e+76", ""));
    console.log(`Exponent: ${exponent}`)
    let result = 1;
    base = base % modulus;
    while (exponent > 0) {
        if (exponent % 2 == 1) {
            result = (result * base) % modulus;
        }
        exponent = exponent >> 1;
        base = (base * base) % modulus;
    }
    console.log(`result: ${result}`)
    return result;
 
  };

  const generatePublicKey = (privateKey: number): number => {
      console.log("Inside diffie hellman context");
      if (diffieHellman === null) {
        return 0; // or handle the null case accordingly
      }
      console.log(`Private key: ${privateKey} Prime: ${diffieHellman.prime} Generator: ${diffieHellman.generator}`);
      return modExp(diffieHellman.generator, privateKey, diffieHellman.prime);
  };

  return (
    <DiffieHellmanContext.Provider value={{ diffieHellman, setDiffieHellman, computeSecret, generatePublicKey }}>
      {children}
    </DiffieHellmanContext.Provider>
  );
};

export const useDiffieHellman = (): DiffieHellmanContextType => useContext(DiffieHellmanContext);
