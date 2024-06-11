//code written by group

import React, { useState, useRef, ChangeEventHandler } from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/UploadPage.css";
import { ConnectWallet, MediaRenderer, ThirdwebProvider, Web3Button, useAddress, useContract, useContractRead, useSigner, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';
import axios from 'axios';
import { ethers } from 'ethers';
import UploadABI from './smart-contracts/UploadABI.json';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import crypto from 'crypto';
import Loader from './components/Loader';
import { useDiffieHellman } from './DiffieHellmanContext';

const Upload: React.FC = () => {

  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);

  const { computeSecret, generatePublicKey } = useDiffieHellman();

  const walletAddress = useAddress();

  if (walletAddress == null) {
    const navigate = useNavigate();
    navigate("/");
  }

  const signer = useSigner();

  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);
  const contract = new ethers.Contract(constants.UPLOAD_CONTRACT, UploadABI, signer);

  const [beneficiaryAddressInput, setBeneficiaryAddressInput] = useState("");
  const [benefactorPrivateKey, handleBenefactorPrivateKeyChange] = useState("");

  const [secretKey, setSecretKey] = useState("");

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (files.length > 0) {
      setLoading(true);
      try {
        generateSecretKeys();
        const formDataArray = files.map(file => {
          const formData = new FormData();
          formData.append("file", file);
          return formData;
        });

        const uploadPromises = formDataArray.map(formData => {
          return axios({
            method: "post",
            url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
            data: formData,
            headers: {
              pinata_api_key: constants.PINATA_API_KEY,
              pinata_secret_api_key: constants.PINATA_SECRET_KEY,
              "Content-Type": "multipart/form-data",
            },
          });
        });

        const resFiles = await Promise.all(uploadPromises);
        const imgHashes = resFiles.map(resFile => resFile.data.IpfsHash);
        console.log(`secret key ${secretKey}`);
        const key = Buffer.from(secretKey.padEnd(16, ' '), 'utf8').slice(0, 16);
        const encryptHashes = (imgHashes: any[], secretKey: WithImplicitCoercion<string> | { [Symbol.toPrimitive](hint: "string"): string; }) => {
          const encryptedHashes = imgHashes.map(hash => {
            const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(secretKey, 'utf8'), Buffer.alloc(16));
            let encrypted = cipher.update(hash, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return encrypted;
          });
          return encryptedHashes;
        };


        const encryptedHashes = encryptHashes(imgHashes, secretKey);
        console.log(`Encrypted hashes: ${encryptedHashes}`);
        // decryptHashes(encryptedHashes,secretKey);
        await dmsContract.addIpfsCIDs(beneficiaryAddressInput, encryptedHashes, { from: walletAddress });

        alert("Successfully uploaded data.");

        let dataArray = await contract.display(walletAddress);
        console.log(dataArray);
        setFiles([]);
        setFileNames([]);

      } catch (e) {
        alert("Unable to upload image to Pinata");
        console.log(e);
      }
      finally {
        setLoading(false);
      }
    }
  };

  const generateSecretKeys = async () => {
    setLoading(true);
    try {
      console.log(`Beneficiary address: ${beneficiaryAddressInput}`);
      console.log(`Benefactor private key: ${benefactorPrivateKey}`);
      // get benefactors private key
      const privateKey = parseInt(benefactorPrivateKey, 16);
      console.log(`Private key: ${privateKey}`);
      // get beneficiary's public key from smart contract
      const beneficiaryPublicKey = await dmsContract.getBeneficiaryPublicKey(walletAddress, beneficiaryAddressInput);
      console.log(`Beneficiary public key: ${beneficiaryPublicKey}`);
      // generate the secret key using beneficiarys public key and benefactors private key
      const secret = computeSecret(parseInt(beneficiaryPublicKey), privateKey);
      console.log(`Secret key: ${secret}`);
      // ensure secretKey is not null before setting encryption key state variable
      if (secret !== null) {
        // set the encryption key state variable as this secret key
        setSecretKey(secret.toString().slice(0, 16));
        console.log(`secret key: ${secret}`);

      } else {
        console.error("Failed to compute secret key.");
      }
    }
    catch (e) {
      console.log(`error: ${e}`);
    }
    finally {
      setLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const fileList = event.target.files;
    if (fileList) {
        const fileArray = Array.from(fileList);
        setFiles(fileArray);

        const fileNameArray = fileArray.map(file => file.name);
        setFileNames(fileNameArray);
    }
};


  const handleDrop = (event: { preventDefault: () => void; dataTransfer: { files: FileList; }; }) => {
    event.preventDefault();
    const fileList = event.dataTransfer.files;
    const fileArray = Array.from(fileList) as File[];
    setFiles(fileArray);
  
    const fileNameArray = fileArray.map(file => file.name);
    setFileNames(fileNameArray);
  };

  const handleDragOver = (event: { preventDefault: () => void; }) => {
    event.preventDefault();
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  

  return (
    <main>
      {loading && <Loader lockScroll={true} />}
      <div>
        {walletAddress &&
          <PageTemplate pageTitle={<h1>Upload</h1>} pageContent={

            <div>
              <form onSubmit={handleSubmit}>

                <div className='inner_container'>
                  <div
                    className="text__container"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <img src="images/upload.png"></img>
                    <h2>Drag and Drop File Here</h2>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      multiple
                    />
                    <span
                      style={{
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                      onClick={handleBrowseClick}
                    >
                      <i>...or click <b>here</b> to browse</i>
                    </span>
                    {files.length > 0 && (
                      <div>
                        <h3>Selected Files:</h3>
                        <ul>
                          {fileNames.map((fileName, index) => (
                            <div className='uploaded_file__container'>
                              <div className='image'>
                                <img src='../images/file.png'></img>
                              </div>
                              <div className='fileName'>
                                {fileName}
                              </div>
                            </div>
                          ))}
                        </ul>
                        <button onClick={() => setFiles([])}>Clear Files</button>
                      </div>
                    )}
                  </div>
                </div>

                <h3>Enter beneficiary address to assign to:</h3>
                <input
                  type="text"
                  placeholder="Enter your beneficiary address"
                  value={beneficiaryAddressInput}
                  className='input-priv-key'
                  onChange={(e) => setBeneficiaryAddressInput(e.target.value)}
                />
                <br></br>
                <input
                  type="password"
                  placeholder="Enter your private key "
                  value={benefactorPrivateKey}
                  className='input-priv-key'
                  onChange={(e) => handleBenefactorPrivateKeyChange(e.target.value)}
                /><br></br>
                <button type="submit" className="newBtn" disabled={files.length === 0}>
                  Upload File(s)
                </button>

              </form>
            </div>

          } address={walletAddress} user='benefactor' />
        }
      </div>
    </main>
  );
};

export default Upload;