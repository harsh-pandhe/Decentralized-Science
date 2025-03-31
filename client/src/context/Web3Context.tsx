import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useToast } from "@/hooks/use-toast";

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  connectWallet: (walletType: 'metamask' | 'walletconnect' | 'coinbase') => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { toast } = useToast();

  // Check if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum && localStorage.getItem('isWalletConnected') === 'true') {
        try {
          await connectWallet('metamask');
        } catch (error) {
          console.error("Failed to reconnect wallet:", error);
          localStorage.removeItem('isWalletConnected');
        }
      }
    };
    
    checkConnection();
  }, []);

  // Subscribe to account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          toast({
            title: "Account Changed",
            description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          });
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        toast({
          title: "Network Changed",
          description: `Connected to network ${newChainId}`,
        });
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account, toast]);

  const connectWallet = async (walletType: 'metamask' | 'walletconnect' | 'coinbase') => {
    try {
      if (!window.ethereum && walletType === 'metamask') {
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask extension and refresh the page",
          variant: "destructive",
        });
        return;
      }

      // Currently only supporting MetaMask for initial implementation
      if (walletType === 'metamask') {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        
        if (accounts.length === 0) {
          throw new Error("No accounts returned from wallet");
        }
        
        const walletSigner = await browserProvider.getSigner();
        const network = await browserProvider.getNetwork();
        
        setProvider(browserProvider);
        setSigner(walletSigner);
        setAccount(accounts[0]);
        setChainId(Number(network.chainId));
        setIsConnected(true);
        
        localStorage.setItem('isWalletConnected', 'true');
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      } else {
        // For future implementation
        toast({
          title: "Coming Soon",
          description: `Support for ${walletType} will be available soon`,
        });
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to wallet",
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    localStorage.removeItem('isWalletConnected');
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        isConnected,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
