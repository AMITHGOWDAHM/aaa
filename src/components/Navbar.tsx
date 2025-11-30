
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { Wallet, Upload, Grid2x2, User, Search,CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const { account, isConnected, isConnecting, connectWallet, disconnectWallet, balance } = useWeb3();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home', icon: Grid2x2 },
    { path: '/marketplace', label: 'Marketplace', icon: Search },
    { path: '/upload', label: 'Upload', icon: Upload },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/QualityAnalyzer', label: 'Quality Check', icon: CheckCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-black/20 backdrop-blur-lg border-b border-purple-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Grid2x2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">DataVerse</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive(path)
                    ? "text-purple-400 bg-purple-500/20"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
          

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm text-gray-300">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </div>
                  <div className="text-xs text-purple-400">
                    {parseFloat(balance).toFixed(4)} ETH
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectWallet}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
