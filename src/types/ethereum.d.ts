
interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (accounts: string[]) => void) => void;
    removeAllListeners: () => void;
    isMetaMask?: boolean;
  };
}
