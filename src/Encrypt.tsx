// code written by the group

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/UploadPage.css";
import PageTemplate from './components/PageTemplate';
import { useAddress } from '@thirdweb-dev/react';
import crypto from 'crypto';
import * as constants from "./constants";
import { createDiffieHellman, DiffieHellman } from 'crypto';
import { ethers } from 'ethers';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import { useDiffieHellman } from './DiffieHellmanContext';
import Loader from './components/Loader';
import { DragEvent } from 'react';

const Encrypt: React.FC = () => {

  const [loading, setLoading] = useState(false);

  const walletAddress = useAddress();
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();


  const { computeSecret, generatePublicKey } = useDiffieHellman();

  const { diffieHellman } = useDiffieHellman();

  if (walletAddress == null) {
    const navigate = useNavigate();
    navigate("/");
  }

  const [encryptionKey, setEncryptionKey] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>('');

  const [benefactorPrivateKey, setBenefactorPrivateKey] = useState<string>('');

  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);

  const handleEncryptionKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEncryptionKey(e.target.value);
  };

  const handleBeneficiaryAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBeneficiaryAddress(e.target.value);
  };

  const handleBenefactorPrivateKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBenefactorPrivateKey(e.target.value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const algorithm = 'aes-128-ctr';

  const deriveIV = () => {
    const encoder = new TextEncoder();
    return encoder.encode("7509e5bda0c762d2");
  }

  const encrypt = (buffer: crypto.BinaryLike) => {
    const initVector = deriveIV();
    console.log(`init vector for encryption: ${initVector.toString()}`);
    const key = encryptionKey.slice(0, 16);
    console.log("16 bytes key: ", key);
    const cipher = crypto.createCipheriv(algorithm, key, initVector);
    const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return encryptedData;
  }

  const handleEncryptedDownload = () => {
    if (encryptionKey && file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const fileContent = new Uint8Array(reader.result as ArrayBuffer);
          const encryptedFile = encrypt(fileContent).toString('base64');
          const downloadLink = document.createElement('a');
          downloadLink.href = `data:application/octet-stream;base64,${encryptedFile}`;
          downloadLink.download = 'encrypted_file';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const generateSecretKeys = async () => {
    setLoading(true);
    try {
      console.log(`Beneficiary address: ${beneficiaryAddress}`);
      console.log(`Benefactor private key: ${benefactorPrivateKey}`);
      // get benefactors private key
      const privateKey = parseInt(benefactorPrivateKey, 16);
      console.log(`Private key: ${privateKey}`);
      // get beneficiary's public key from smart contract
      const beneficiaryPublicKey = await dmsContract.getBeneficiaryPublicKey(walletAddress, beneficiaryAddress);
      console.log(`Beneficiary public key: ${beneficiaryPublicKey}`);
      // generate the secret key using beneficiarys public key and benefactors private key
      const secretKey = computeSecret(parseInt(beneficiaryPublicKey), privateKey);
      console.log(`Secret key: ${secretKey}`);
      // ensure secretKey is not null before setting encryption key state variable
      if (secretKey !== null) {
        // set the encryption key state variable as this secret key
        setEncryptionKey(secretKey.toString().slice(16));
      } else {
        alert("Failed to compute secret key. Ensure your beneficiary has generated their public key.");
      }
    }
    catch (e) {
      console.log(`error: ${e}`);
    }
    finally {
      setLoading(false);
    }
  };

  const fileInputRef = useRef(null);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    setFile(droppedFile);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <main>
      {loading && <Loader lockScroll={true} />}
      <div>
        {walletAddress &&
          <PageTemplate pageTitle={<h1>Encrypt Files</h1>} pageContent={
            <div>
              <input
                type="text"
                placeholder="Enter Beneficiary Address "
                className='input-priv-key'
                style={{ marginRight: "10px" }}
                value={beneficiaryAddress}
                onChange={handleBeneficiaryAddressChange}
              />
              <input
                type="password"
                placeholder="Enter your private key "
                className='input-priv-key'
                value={benefactorPrivateKey}
                onChange={handleBenefactorPrivateKeyChange}
              />

              {/* only render this button if the beneficiary has already generated their keys!! */}
              <button onClick={generateSecretKeys}><b>Generate Secret Key</b></button>

              <br />

              {/* <h2>Encrypt files here</h2>
                <input
                    type="text"
                    placeholder="Enter encryption key"
                    value={encryptionKey}
                    onChange={handleEncryptionKeyChange}
                /> */}
              <br />

              <div className="inner_container">
                <div
                  className="text__container"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <img src="images/upload.png" alt="Upload Icon" />
                  <h2>Drag and Drop File Here</h2>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                  <div
                    style={{
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                    onClick={() => fileInputRef.current && (fileInputRef.current as HTMLInputElement).click()}
                    >
                    <i>...or click <b>here</b> to browse</i>
                  </div>
                  {file && <div>
                    <h3>Selected Files:</h3>
                    <div className='uploaded_file__container'>
                      <div className='image'>
                        <img src='../images/file.png'></img>
                      </div>
                      <div className='fileName'>
                        {file.name}
                      </div>
                    </div>
                  </div>}
                </div>


              </div>

              {/* <input type="file" onChange={handleFileUpload} /> */}
              <br />
              <button
                onClick={handleEncryptedDownload}
                disabled={!encryptionKey || !file}
                style={{
                  backgroundColor: !encryptionKey || !file ? 'grey' : '#8d7fc0',
                  // Add any other styles you need
                }}
              >
                Download Encrypted File
              </button>

              {/* <h2>Decrypt files here</h2>
                <br />
                <input type="file" onChange={handleFileUpload} />
                <br />
                <button onClick={handleDecryptionDownload}>Download Decrypted File</button> */}
            </div>

          } address={walletAddress} user='benefactor' />
        }
      </div>
    </main>
  );
};

export default Encrypt;