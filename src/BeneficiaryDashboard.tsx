// code written by the group

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css";
import { useAddress} from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import { ethers } from 'ethers';
import { useDiffieHellman} from './DiffieHellmanContext';
import Loader from './components/Loader';
import crypto from 'crypto';


const BeneficiaryDashboard: React.FC = () => {
  const location = useLocation();
  const benefactorAddress = (location.state as any)?.benefactorAddress;

  const [countdown, setCountdown] = useState("Benefactor is alive.");
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [countdownEnded, setCountdownEnded] = useState(false);

  const [remainingTime,setRemainingTime] = useState(0);
  const [isAlive,setAliveStatus] = useState(true);
  const [publicKey,setBeneficiaryPublicKey] = useState("");


  const [loading, setLoading] = useState(false);

  const { computeSecret, generatePublicKey } = useDiffieHellman();

  const walletAddress = useAddress();
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);
  const [beneficiaryPrivateKey, setBeneficiaryPrivateKey] = useState('');

  const [secretKey, setSecretKey] = useState("");
  const [mode, setMode] = useState('view');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]); // State variable to store selected files
  const [ipfsCid, setIpfsCid] = useState<string[]>([]);


  const navigate = useNavigate();
  function redirectToHomePage(): void {
    navigate("/");
  }  

  if (walletAddress==null){
    redirectToHomePage();
  }

  const toggleMode = () => {
    setMode(mode === 'view' ? 'select' : 'view');
  };


  // Function to handle file selection
  const handleFileSelection = (cid: string) => {
    // Check if the file is already selected
    if (!selectedFiles.includes(cid)) {
      setSelectedFiles([...selectedFiles, cid]); // Add the file to the selected files
    } else {
      setSelectedFiles(selectedFiles.filter(file => file !== cid)); // Deselect the file
    }
  };

  const handleKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBeneficiaryPrivateKey(event.target.value);
  };

  const handleEnableSwitch = async (_benefactor: string) => {
    setLoading(true);
    try {
      console.log(_benefactor);
      await dmsContract.enableSwitch(_benefactor);
      if (dmsContract.checkAliveStatus(_benefactor)) {
        const remainingCountdown = await dmsContract.getRemainingCountdownTime(_benefactor);
        setCountdownStarted(true);
        setCountdownEnded(false);
        setCountdown(formatCountdown(remainingCountdown));
        alert("Successfully enabled your benefactor's dead man's switch.");
      } else {
        alert("Benefactor does not exist.");
      }
    } catch (error) {
      alert("An error occurred when enabling your benefactor's switch.");
    }finally{
      setLoading(false);
      window.location.reload();
    }
  }

  const formatCountdown = (remainingTimeInSeconds: number): string => {
    const days = Math.floor(remainingTimeInSeconds / (60 * 60 * 24));
    const hours = Math.floor((remainingTimeInSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((remainingTimeInSeconds % (60 * 60)) / 60);
    const seconds = remainingTimeInSeconds % 60;
    let formattedCountdown = '';
    if (days > 0) {
      formattedCountdown += `${days} day${days !== 1 ? 's' : ''} `;
    }
    if (hours > 0) {
      formattedCountdown += `${hours} hour${hours !== 1 ? 's' : ''} `;
    }
    if (minutes > 0) {
      formattedCountdown += `${minutes} min${minutes !== 1 ? 's' : ''} `;
    }
    if (seconds > 0) {
      formattedCountdown += `${seconds} sec${seconds !== 1 ? 's' : ''}`;
    }
    return formattedCountdown.trim();
  }

  const getData = async () => {
    setLoading(true);
    try {
      const tx = await dmsContract.getBeneficiaryData(benefactorAddress,walletAddress);
      const receipt = await tx.wait();
      const event = receipt.events.find((event: { event: string; }) => event.event === "BeneficiariesData");
      if (event) {
        const { switchStatus, remainingTime, isAlive, publicKey} = event.args;
        // setCountdown(isAlive  ? "Benefactor is alive." : formatCountdown(remainingTime));
        setCountdown(!isAlive  ? "Benefactor is dead." : switchStatus ? formatCountdown(remainingTime) : "Benefactor is alive.");
        switchStatus ? setCountdownStarted(true): setCountdownStarted(false);
        setRemainingTime(remainingTime);
        setAliveStatus(isAlive);
        setBeneficiaryPublicKey(publicKey);
      } else {
        setCountdown("Data not found.");
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setCountdown("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!isAlive) {
      alert("Benefactor is dead");
    }
  },[isAlive]);
  
  useEffect(() => {
    if (walletAddress) {
      getData();
    }
  }, []);
  
  useEffect(() => {
    if (countdownStarted && !countdownEnded) {
      const interval = setInterval(() => {
        setRemainingTime(prevTime => {
          if (prevTime <= 0) {
            setCountdownEnded(true);
            return 0;
          } else {
            return prevTime - 1;
          }
        });
      }, 1000);
  
      return () => {
        clearInterval(interval);
      };
    }
  }, [countdownStarted, countdownEnded]);
  
  useEffect(() => {
    if (countdownStarted && !countdownEnded) {
      const formattedCountdown = formatCountdown(remainingTime);
      setCountdown(formattedCountdown);
    }
  }, [remainingTime]);
  



  const generateSecretKey = async (): Promise<string | null> => {
    setLoading(true);
    let secretKey: string | null = null;
    try {
        // get benefactor public key from contract
        const benefactorPublicKey = await dmsContract.getBenefactorPublicKey(benefactorAddress, { from: walletAddress });
        console.log(`Benefactor public key: ${benefactorPublicKey}`);
        // generate the secret key using beneficiary's public key and benefactor's private key
        console.log(`Beneficiary private key: ${beneficiaryPrivateKey}`);
        const privateKey = parseInt(beneficiaryPrivateKey, 16);
        console.log(`Private key: ${privateKey}`);
        const secret = computeSecret(parseInt(benefactorPublicKey), privateKey);
        if (secret !== null) {
            secretKey = secret.toString().slice(0, 16);
            console.log(`Secret key: ${secret}`);
            setSecretKey(secretKey);
        }
    } catch (error) {
        console.log(`Error in generating secret key: ${error}`);
    } finally {
        setLoading(false);
    }
    return secretKey;
};


  const generateBPublicKey = async () => {
    setLoading(true);
    try{
      console.log(`Beneficiary private key: ${beneficiaryPrivateKey}`)
      // generate the public key using the beneficiary entered private key
      const privateKey = parseInt(beneficiaryPrivateKey, 16);
      console.log(`Private key: ${privateKey}`);
      const beneficiaryPublicKey = generatePublicKey(privateKey).toString();
      setBeneficiaryPublicKey(beneficiaryPublicKey);
      // store beneficiary public key in contract
      await dmsContract.addBeneficiaryPublicKey(benefactorAddress,walletAddress,beneficiaryPublicKey);
      console.log(`Beneficiary public key: ${beneficiaryPublicKey}`)
      return beneficiaryPublicKey;
    }
    catch(error){
      console.log(`error in generating public key: ${error}`);
    }
    finally{
      setLoading(false);
    }
  }

  const generateDecryptionKey = async () => {
    setLoading(true);
    try{
      console.log(`Benefactor address: ${benefactorAddress}`);
      console.log(`Beneficiary private key: ${beneficiaryPrivateKey}`);
      // get beneficiary private key
      const privateKey = parseInt(beneficiaryPrivateKey, 16);
      console.log(`Private key: ${privateKey}`);
      // get benefactor's public key from smart contract
      const benefactorPublicKey = await dmsContract.getBenefactorPublicKey(benefactorAddress, {from: walletAddress});
      console.log(`Benefactor public key: ${benefactorPublicKey}`);
      // generate the secret key using benefactors public key and beneficiary private key
      const secret = computeSecret(parseInt(benefactorPublicKey), privateKey);
      console.log(`Secret key: ${secret}`);
      // ensure secretKey is not null before setting encryption key state variable
      if (secret !== null) {
          // set the encryption key state variable as this secret key
          setSecretKey(secret.toString());
          <h2>Decrypt your assets with this decryption key: {secretKey}</h2>
      } else {
          alert("Failed to compute secret key. Ensure your benefactor has assigned your assets first.");
      }
    }
    catch(e){
      console.log(`error: ${e}`);
    }
    finally{
      setLoading(false);
    } 
};
  

const decryptHashes = async () => {
  try {
      //can only get the ids when the benefactor dies
      const encryptedHashes = dmsContract.getCIDs(benefactorAddress, walletAddress, { from: walletAddress });
      const secret = await generateSecretKey();
      if (secret !== null) {
          const decryptedHashes = encryptedHashes.map((encryptedHash: string) => {
              const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(secret, 'utf8'), Buffer.alloc(16));
              let decrypted = decipher.update(encryptedHash, 'hex', 'utf8');
              decrypted += decipher.final('utf8');
              return decrypted;
          });
          const prefixedHashes = decryptedHashes.map((hash: string) => "https://gateway.pinata.cloud/ipfs/" + hash);
          console.log(`Decrypted hashes: ${prefixedHashes}`);
          //const hashes = decryptedHashes(); // <- This line seems unnecessary
          setIpfsCid(decryptedHashes);
      } else {
          console.error("Failed to compute secret key. Ensure your benefactor has assigned your assets first.");
      }
  } catch (error) {
      console.error('Error decrypting hashes:', error);
  }
};





  return (
    <main>
      {loading && <Loader lockScroll={true}/>}
      <div>
        {walletAddress && 
          <PageTemplate pageTitle={
            <div className='title-container'>
              <h1>Dashboard</h1>
              <div className='right-content'>
                <h2>{countdown}</h2>
                  <div className='beneficiary-right'>
                    {!countdownStarted && !countdownEnded &&
                      <button 
                        onClick={() => handleEnableSwitch(benefactorAddress.toString())} 
                        disabled={!benefactorAddress}
                      >
                        Enable switch
                      </button>
                    }
                  </div>
              </div>
            </div>
          } pageContent={
                <>
                                 
                    {publicKey=="" ? 
                    <div>
                        <input 
                          type="text" 
                          value={beneficiaryPrivateKey} 
                          onChange={(e) => handleKeyChange(e)} 
                          placeholder="Your private key..." 
                          className='input-priv-key'
                        />
                        <button onClick={generateBPublicKey}>Generate Public Key</button>
                      </div>
                    : <></>}

                    
                    {!isAlive && 
                    <div>
                    <input 
                      type="text" 
                      value={beneficiaryPrivateKey} 
                      onChange={(e) => handleKeyChange(e)} 
                      placeholder="Your private key..." 
                      className='input-priv-key'
                    />
                      <button onClick={() => decryptHashes()}>Get My Assets</button> 
                      <button onClick={() => generateDecryptionKey()}>Get Decryption Key</button>
                    </div>
                    }

                  <div className="dash__header">
                    <div className="dash__title">
                      <h2>Your Files</h2>
                    </div>
                    <div>
                      {/* {mode === 'view' ? <></> : <><button className="newBtn" onClick={createZipFile}>Download Files</button></>} */}
                      <button className="newBtn" onClick={toggleMode}>
                        {mode === 'view' ? 'Switch to Select Mode' : 'Switch to View Mode'}
                      </button>
                    </div>
                  </div>
                  <div className="files__display__container">
                    {/* {ipfsCid && ipfsCid.length !== 0 ? ( */}
                    {!isAlive ? (
                      ipfsCid.map((cid, index) => (
                        <a href={`https://gateway.pinata.cloud/ipfs/${cid}`} className="files__display__box" key={index} target="_blank" rel="noopener noreferrer">
                          <div className="file__icon" >
                            <img src="../images/file.png"></img>
                          </div>
                          <div className='file__name'>
                            {cid}
                          </div>
                          {mode == "view" ?
                            <div className="chevron__icon">
                              <img src="../images/chevron.png"></img>
                            </div>
                            :
                            <div className="file__checkbox">
                              <input type="checkbox"
                                checked={selectedFiles.includes(cid)}
                                onChange={() => handleFileSelection(cid)} />
                            </div>}
                        </a>
                      ))
                    ) : (
                      <p>You don't have access to your assets yet.</p>
                    )}
                  </div>
                    
                  

                </>
          }
          user={"beneficiary"}
          address={walletAddress} />
        }
      </div>
    </main>
  );
};

export default BeneficiaryDashboard;
 