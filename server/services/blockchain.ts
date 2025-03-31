import { ethers } from 'ethers';

// Polygon Mumbai Testnet RPC URL
const POLYGON_MUMBAI_RPC_URL = process.env.POLYGON_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com/';

// Optional private key for server-side operations
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';

// Create an ethers provider
let provider: ethers.JsonRpcProvider;
try {
  provider = new ethers.JsonRpcProvider(POLYGON_MUMBAI_RPC_URL);
} catch (error) {
  console.error('Failed to initialize Ethereum provider:', error);
  // Initialize with a fallback provider to avoid breaking the app
  provider = new ethers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com/');
}

/**
 * Verify a signature against a message and address
 * @param message The original message that was signed
 * @param signature The signature to verify
 * @param address The Ethereum address that supposedly signed the message
 * @returns Boolean indicating if the signature is valid
 */
export function verifySignature(
  message: string,
  signature: string,
  address: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Sign a message using the server's private key
 * @param message The message to sign
 * @returns The signature or null if private key not available
 */
export async function signMessage(message: string): Promise<string | null> {
  try {
    if (!PRIVATE_KEY) {
      console.warn('No private key available for signing');
      return null;
    }

    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    return await wallet.signMessage(message);
  } catch (error) {
    console.error('Error signing message:', error);
    return null;
  }
}

/**
 * Get the current gas price on the network
 * @returns The current gas price in gwei
 */
export async function getCurrentGasPrice(): Promise<string> {
  try {
    const gasPrice = await provider.getFeeData();
    // Convert to gwei for readability
    return ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
  } catch (error) {
    console.error('Error getting gas price:', error);
    return '0';
  }
}

/**
 * Get the transaction receipt for a transaction hash
 * @param txHash The transaction hash to lookup
 * @returns The transaction receipt or null if not found
 */
export async function getTransactionReceipt(txHash: string): Promise<any | null> {
  try {
    return await provider.getTransactionReceipt(txHash);
  } catch (error) {
    console.error('Error getting transaction receipt:', error);
    return null;
  }
}

/**
 * Get the block number and timestamp for a transaction
 * @param txHash The transaction hash
 * @returns Object with block number and timestamp or null
 */
export async function getTransactionBlock(
  txHash: string
): Promise<{ blockNumber: number; timestamp: number } | null> {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) return null;
    
    const block = await provider.getBlock(tx.blockNumber!);
    if (!block) return null;
    
    return {
      blockNumber: tx.blockNumber!,
      timestamp: block.timestamp,
    };
  } catch (error) {
    console.error('Error getting transaction block:', error);
    return null;
  }
}

/**
 * Check if a transaction is confirmed
 * @param txHash The transaction hash to check
 * @returns Boolean indicating if the transaction is confirmed
 */
export async function isTransactionConfirmed(txHash: string): Promise<boolean> {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt !== null && receipt.confirmations > 0;
  } catch (error) {
    console.error('Error checking transaction confirmation:', error);
    return false;
  }
}
