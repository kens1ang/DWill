//  code adapted from https://codepen.io/bojankrsmanovic/full/dpzeZm
import React, { useEffect } from 'react';
import '../styles/loader.css';

interface LoaderProps {
  lockScroll?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ lockScroll = false }) => {
  useEffect(() => {
    if (lockScroll) {
      document.body.classList.add('scroll-locked');
    } else {
      document.body.classList.remove('scroll-locked');
    }
    // Clean up function to remove the class when unmounting
    return () => {
      document.body.classList.remove('scroll-locked');
    };
  }, [lockScroll]);

  return (
    <div className={`loader-wrapper ${lockScroll ? 'scroll-locked' : ''}`}>
      <div className="overlay"></div>
      <div className="loader">
        <div className="wrapper">
          <div className="box-wrap">
            <div className="box one"></div>
            <div className="box two"></div>
            <div className="box three"></div>
            <div className="box four"></div>
            <div className="box five"></div>
            <div className="box six"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
