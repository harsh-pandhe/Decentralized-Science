import { apiRequest } from './queryClient';

// For our frontend, we'll delegate IPFS operations to our backend API
// which will handle the actual interaction with Pinata/IPFS

/**
 * Upload a file to IPFS through our backend API
 * @param file The file to upload
 * @returns The IPFS CID (Content Identifier) of the uploaded file
 */
export const uploadFileToIPFS = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload to IPFS: ${errorText}`);
    }
    
    const data = await response.json();
    return data.cid;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
};

/**
 * Upload metadata to IPFS through our backend API
 * @param metadata The metadata object to upload
 * @returns The IPFS CID of the uploaded metadata
 */
export const uploadMetadataToIPFS = async (metadata: any): Promise<string> => {
  try {
    const response = await apiRequest('POST', '/api/ipfs/metadata', metadata);
    const data = await response.json();
    return data.cid;
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw error;
  }
};

/**
 * Get a file from IPFS by its CID
 * @param cid The CID of the file to retrieve
 * @returns The URL to access the file
 */
export const getIPFSUrl = (cid: string): string => {
  // Use a gateway that's reliable and fast
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
};

/**
 * Check if a file exists on IPFS
 * @param cid The CID to check
 * @returns Boolean indicating if the file exists
 */
export const checkIPFSFile = async (cid: string): Promise<boolean> => {
  try {
    const response = await apiRequest('GET', `/api/ipfs/check/${cid}`, undefined);
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking IPFS file:', error);
    return false;
  }
};
