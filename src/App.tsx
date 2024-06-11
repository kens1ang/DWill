// code written by the group

import React from "react";
import MainContent from "./MainContent";
import { ThirdwebProvider, metamaskWallet, embeddedWallet, localWallet, ConnectWallet, darkTheme, ThirdwebSDKProvider } from "@thirdweb-dev/react";
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from "react-router-dom";
import Upload from "./Upload";
import Encrypt from "./Encrypt";
import BeneficiaryDashboard from "./BeneficiaryDashboard";
import BenefactorDashboard from "./BenefactorDashboard";
import * as constants from "./constants";
import { DiffieHellmanProvider } from './DiffieHellmanContext';

interface AppProps {
  isAppInstalled: boolean;
  handleInstallClick: () => void;
}

const App: React.FC<AppProps> = ({ isAppInstalled, handleInstallClick }) => {

  return (
    <>
    <ThirdwebProvider
      clientId={constants.DWILL_CLIENT_ID}
      activeChain = "polygon"
      supportedWallets={[
        metamaskWallet(),
        embeddedWallet({
          auth: {
            options: ["email", "google"]
          }
        }),
        localWallet()
      ]}
    >
      
      <DiffieHellmanProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainContent handleInstallClick={handleInstallClick} />} />
            <Route path="upload" element={<Upload />} />
            <Route path="beneficiaryDashboard" element={<BeneficiaryDashboard />}/>
            <Route path="benefactorDashboard" element={<BenefactorDashboard />}/>
            <Route path="encrypt" element={<Encrypt />} />
          </Routes>
        </BrowserRouter>
      </DiffieHellmanProvider>

    </ThirdwebProvider>
    
    </>
    
  );
};

export default App;