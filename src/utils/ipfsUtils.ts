
export const formatIPFSHash = (hash: string): string => {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
};

export const isValidIPFSHash = (hash: string): boolean => {
  // Basic validation for IPFS CID
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|z[1-9A-HJ-NP-Za-km-z]{48})$/.test(hash);
};

export const getIPFSGatewayUrl = (hash: string, gateway: string = 'https://w3s.link/ipfs'): string => {
  return `${gateway}/${hash}`;
};
