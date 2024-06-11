// code written by group

import React, { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../styles/Page-template.css";
import { ConnectWallet, darkTheme } from '@thirdweb-dev/react';
import { TiUpload, TiThMenu, TiHome, TiStopwatch, TiThLarge, TiDownload } from "react-icons/ti";
import { SiLetsencrypt } from "react-icons/Si";
import { FaWallet } from "react-icons/fa";



interface PageTemplateProps {
    pageTitle: ReactNode;
    pageContent: ReactNode;
    user:string;
    address: string;
}

const PageTemplate: React.FC<PageTemplateProps> = ({ pageTitle, pageContent,user, address }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to control sidebar visibility
    const navigate = useNavigate();
    const userType = user;

    if (address == null) {
        navigate("/");
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="screen">
            <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
            {/* <div className={isSidebarOpen?`sidebaropen`:`sidebarclosed`}> */}
                <div className="logo-content">
                    <Link to="/">
                        <img className={`logo ${isSidebarOpen ? 'open' : 'closed'}`} src={isSidebarOpen ? "/images/logo.png" : "/images/icon-192x192.png"} alt="dWill logo" />
                    </Link>
                </div>
                <ul>
                    <li>
                        <div className="sidebar-toggle" onClick={toggleSidebar}>
                            <TiThMenu className='icon' />
                            {
                                isSidebarOpen ? <span>Menu</span> : <></>
                            }
                        </div>
                    </li>

                    <li>
                        <Link to={userType==="benefactor"?"/benefactorDashboard":"/beneficiaryDashboard"}>
                            <TiThLarge className='icon'/>
                            {
                                isSidebarOpen ? <span>Dashboard</span> : <></>
                            }
                        </Link>
                    </li>
                    {userType==="benefactor"?
                    <>
                        <li>
                            <Link to="/upload">
                                <TiUpload className='icon' />
                                {
                                    isSidebarOpen ? <span>Upload</span> : <></>
                                }
                            </Link>
                        </li>
                        <li>
                            <Link to="/encrypt">
                                <SiLetsencrypt className='icon' />
                                {
                                    isSidebarOpen ? <span>Encrypt</span> : <></>
                                }
                            </Link>
                        </li>
                    </>
                    :
                    <></>
                    }
                    
                </ul>
                <div className="wallet">
                    {isSidebarOpen ? 
                    <ConnectWallet
                        theme={darkTheme({
                            colors: {
                                primaryText: "#d9d9d9",
                                accentText: "#707ddb",
                                accentButtonBg: "#bab4d2",
                                modalBg: "#21212c",
                                danger: "#db6d6d",
                                secondaryText: "#bab4d2",
                                accentButtonText: "#d9d9d9",
                                primaryButtonBg: "#bab4d2",
                                primaryButtonText: "#21212c",
                                secondaryButtonBg: "#191a1f",
                                secondaryButtonHoverBg: "#21212c",
                                connectedButtonBg: "#191a1f",
                                connectedButtonBgHover: "#645c82",
                                secondaryButtonText: "#bab4d2",
                            },
                        })}
                        modalTitleIconUrl={""}
                        />
                    :
                    <div>
                        <FaWallet className='icon' onClick={toggleSidebar} />
                    </div>
                }
                </div>
            </div>
            <div className='page-container'>
                <div className="page-title">
                    {pageTitle}
                </div>
                <div className="page-content">
                    {pageContent}
                </div>
            </div>
        </div>
    );
};

export default PageTemplate;
