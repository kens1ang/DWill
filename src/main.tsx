//boilerplate code altered by group

import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import { isInStandaloneMode } from "./utils";

const container = document.getElementById("root");
const root = createRoot(container!);

export default function Main() {
  const [installPromptEvent, setInstallPromptEvent] = useState<any | undefined>();
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    // initialize from localStorage if available, otherwise default to false
    return localStorage.getItem('isAppInstalled') === 'true';
  });

  useEffect(() => {
    if (isInStandaloneMode()) {
      setIsAppInstalled(true);
      return;
    }

    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed");
      localStorage.setItem('isAppInstalled', 'true'); // persist the state to localStorage
      setIsAppInstalled(true); // update the state variable
    });

    const beforeInstallPromptListener = (event: any) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    window.addEventListener("beforeinstallprompt", beforeInstallPromptListener);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        beforeInstallPromptListener
      );
    };
  }, []);

  // install button click handler
  const handleInstallClick = () => {
    console.log(isAppInstalled);
    if (isAppInstalled==true){
      console.log("app already installed");
      return;
    }
    if (installPromptEvent && installPromptEvent.prompt) {
      installPromptEvent.prompt();
      console.log("prompting user to install app");
    }
  };

  return (
    <React.StrictMode>
      <App isAppInstalled={isAppInstalled} handleInstallClick={handleInstallClick} />
    </React.StrictMode>
  );
}

root.render(<Main />);
