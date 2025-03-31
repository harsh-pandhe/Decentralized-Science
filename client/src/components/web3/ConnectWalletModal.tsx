import React from "react";
import { useWeb3 } from "@/context/Web3Context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({ isOpen, onClose }) => {
  const { connectWallet } = useWeb3();

  const handleConnectWallet = async (walletType: 'metamask' | 'walletconnect' | 'coinbase') => {
    await connectWallet(walletType);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect your wallet to access DeSci Hub. Your wallet address will be used as your decentralized identity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-between p-4"
            onClick={() => handleConnectWallet('metamask')}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 mr-4 flex-shrink-0">
                <svg viewBox="0 0 784.37 784.37" className="w-full h-full">
                  <path d="M392.07 0c-215.53.99-390.74 176.82-390.74 392.93 0 165.67 102.66 307.42 247.7 365.44 18.12 3.3 24.65-7.83 24.65-17.38 0-8.57-.31-31.28-.48-61.48-100.73 21.87-122.03-48.52-122.03-48.52-16.47-41.83-40.2-52.96-40.2-52.96-32.85-22.45 2.5-22 2.5-22 36.31 2.56 55.43 37.3 55.43 37.3 32.29 55.31 84.72 39.33 105.33 30.08 3.28-23.34 12.64-39.34 22.97-48.37-80.37-9.13-164.93-40.2-164.93-178.95 0-39.53 14.07-71.82 37.3-97.16-3.73-9.17-16.18-46.08 3.53-96.05 0 0 30.44-9.77 99.8 37.2 28.94-8.06 60.01-12.07 90.9-12.23 30.89.16 61.96 4.17 90.9 12.23 69.33-46.97 99.79-37.2 99.79-37.2 19.71 49.97 7.26 86.88 3.53 96.05 23.25 25.34 37.29 57.63 37.29 97.16 0 139.13-84.64 169.72-165.28 178.69 13.02 11.24 24.63 33.4 24.63 67.31 0 48.6-.45 87.79-.45 99.73 0 9.72 6.5 21 24.93 17.34 145.06-48.46 247.8-190.03 247.8-356.35C784.07 175.97 608.67.15 392.07 0"></path>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">MetaMask</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connect using browser extension</p>
              </div>
            </div>
            <span className="material-icons text-gray-400">arrow_forward_ios</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full flex items-center justify-between p-4"
            onClick={() => handleConnectWallet('walletconnect')}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 mr-4 flex-shrink-0">
                <svg viewBox="0 0 512 512" className="w-full h-full">
                  <path d="M364.4 131.3C335.5 108.7 299.1 96 256 96c-43.1 0-79.5 12.7-108.4 35.3C118.7 154 96 193.3 96 255.9c0 29.2 11.7 51.8 27.7 68.3 15.6 16.2 35 28.8 51.7 39.5 16.7 10.6 31.4 19.4 41 26.7 9.6 7.3 10.7 9.4 10.7 12.6 0 4.1-.9 10.3-2.5 17-1.5 6.5-3.1 14.9-3.1 26 0 6 4.8 10 10 10 7.1 0 27.8-10.9 43.5-22.2c15.6-11.3 26.5-23.6 26.5-41.8 0-11-2.8-21.8-10.2-29.8-7.3-7.9-17.5-14.7-27.6-21.4-9.9-6.7-20-13.3-26.5-19.7-6.3-6.3-8.2-9.5-8.2-15.3 0-5.5 2.4-10 7.9-15.4 5.5-5.5 14.3-10.8 24.6-15.1 10.2-4.3 21.9-7.6 33.9-9.4 11.7-1.9 23.7-2.4 34.2-1.5 15.9.9 27-8.2 27-26 0-16.2-9.3-28.9-22.1-35.6-12.4-6.5-27-10-41.4-10.4-14.1-.4-27.9 1.7-39.8 5.2">
                  </path>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">WalletConnect</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connect using mobile wallet</p>
              </div>
            </div>
            <span className="material-icons text-gray-400">arrow_forward_ios</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full flex items-center justify-between p-4"
            onClick={() => handleConnectWallet('coinbase')}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 mr-4 flex-shrink-0">
                <svg viewBox="0 0 1024 1024" className="w-full h-full">
                  <circle cx="512" cy="512" r="512" fill="#0052FF"></circle>
                  <path d="M516.9 188.2c180 0 325.8 145.8 325.8 325.8S696.9 839.8 516.9 839.8 191.1 694 191.1 514c0-180 145.8-325.8 325.8-325.8zm0 504c98 0 178.2-80.2 178.2-178.2S614.9 335.8 516.9 335.8 338.7 416 338.7 514c0 98 80.2 178.2 178.2 178.2zm0-118.8c-32.7 0-59.4-26.7-59.4-59.4s26.7-59.4 59.4-59.4 59.4 26.7 59.4 59.4-26.7 59.4-59.4 59.4z" fill="#FFF"></path>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Coinbase Wallet</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connect using Coinbase Wallet</p>
              </div>
            </div>
            <span className="material-icons text-gray-400">arrow_forward_ios</span>
          </Button>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            By connecting your wallet, you agree to our <a href="#" className="text-primary">Terms of Service</a> and <a href="#" className="text-primary">Privacy Policy</a>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectWalletModal;
