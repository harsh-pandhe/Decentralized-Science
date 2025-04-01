import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { createReadStream } from 'fs';
import FormData from 'form-data';

// Use Pinata for IPFS uploads
const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY || '';
const PINATA_JWT = process.env.PINATA_JWT || '';

// Gateway for IPFS content retrieval
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

/**
 * Upload content to IPFS via Pinata
 * @param content Buffer or string content to upload
 * @returns The IPFS CID (Content Identifier)
 */
export async function uploadToIPFS(content: Buffer): Promise<string> {
  try {
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      throw new Error('Pinata API keys not configured');
    }

    const formData = new FormData();
    formData.append('file', content, {
      filename: `file-${Date.now()}`, // Generate a unique filename
    });

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      }
    );

    if (response.status === 200) {
      return response.data.IpfsHash;
    } else {
      throw new Error(`Failed to upload to IPFS: ${response.statusText}`);
    }
  } catch (error: any) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
}

/**
 * Upload metadata to IPFS via Pinata
 * @param metadata Object to upload as JSON
 * @returns The IPFS CID (Content Identifier)
 */
export async function uploadMetadataToIPFS(metadata: any): Promise<string> {
  try {
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      throw new Error('Pinata API keys not configured');
    }

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      }
    );

    if (response.status === 200) {
      return response.data.IpfsHash;
    } else {
      throw new Error(`Failed to upload metadata to IPFS: ${response.statusText}`);
    }
  } catch (error: any) {
    console.error('Error uploading metadata to IPFS:', error);
    throw new Error(`Failed to upload metadata to IPFS: ${error.message}`);
  }
}

/**
 * Check if content exists on IPFS
 * @param cid The IPFS CID to check
 * @returns Boolean indicating if the content exists
 */
export async function checkIPFSContent(cid: string): Promise<boolean> {
  try {
    const response = await axios.head(`${IPFS_GATEWAY}${cid}`, {
      timeout: 5000, // 5 second timeout
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Get content from IPFS
 * @param cid The IPFS CID to retrieve
 * @returns The content as a Buffer, or null if not found
 */
export async function getIPFSContent(cid: string): Promise<Buffer | null> {
  try {
    const response = await axios.get(`${IPFS_GATEWAY}${cid}`, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 second timeout
    });

    if (response.status === 200) {
      return Buffer.from(response.data);
    }
    return null;
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    return null;
  }
}

/**
 * Get IPFS URL for a CID
 * @param cid The IPFS CID
 * @returns The full URL to access the content
 */
export function getIPFSUrl(cid: string): string {
  return `${IPFS_GATEWAY}${cid}`;
}
