// services/ipfsService.ts
import axios from 'axios';

const PINATA_API_KEY = 'bf708289594cc2f26e67';
const PINATA_API_SECRET = 'd5aa80a3fb7e8a957ab96fb7922fa2c8c0bd5e842841fa3fe1db215fa3eb3bba';

export class IPFSService {
  static async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        maxContentLength: Infinity,
        headers: {
          'Content-Type': 'multipart/form-data',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET,
        },
      });

      const cid = res.data.IpfsHash;
      console.log('File uploaded to IPFS via Pinata. CID:', cid);
      return cid;
    } catch (error: any) {
      console.error('IPFS Pinata upload error:', error.response?.data || error.message);
      throw new Error('Failed to upload file to IPFS via Pinata');
    }
  }

  static getIPFSUrl(cid: string): string {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
}
