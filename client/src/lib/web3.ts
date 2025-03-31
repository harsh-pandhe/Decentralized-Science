import { ethers } from 'ethers';

// Polygon Mumbai Testnet configuration
export const CHAIN_CONFIG = {
  chainId: '0x13881', // 80001 in decimal
  chainName: 'Polygon Mumbai Testnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
  blockExplorerUrls: ['https://mumbai.polygonscan.com/']
};

// Helper to ensure we're on the right network
export const switchToPolygonMumbai = async (): Promise<boolean> => {
  if (!window.ethereum) {
    console.error('MetaMask is not installed');
    return false;
  }

  try {
    // Try to switch to Polygon Mumbai
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_CONFIG.chainId }]
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [CHAIN_CONFIG]
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Polygon Mumbai network:', addError);
        return false;
      }
    }
    console.error('Failed to switch to Polygon Mumbai network:', switchError);
    return false;
  }
};

// Function to sign a message using the connected wallet
export const signMessage = async (
  signer: ethers.Signer,
  message: string
): Promise<string> => {
  try {
    return await signer.signMessage(message);
  } catch (error) {
    console.error('Error signing message:', error);
    throw new Error('Failed to sign message with wallet');
  }
};

// Function to verify a signed message
export const verifySignature = (
  message: string,
  signature: string,
  address: string
): boolean => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};
