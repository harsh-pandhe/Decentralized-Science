import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/context/Web3Context";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onConnectWalletClick: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onConnectWalletClick, 
  isDarkMode, 
  onToggleDarkMode 
}) => {
  const { account, isConnected, disconnectWallet } = useWeb3();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <a className="flex items-center space-x-3">
                <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">DeSci Hub</h1>
              </a>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden md:block">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons text-gray-400 text-sm">search</span>
                </span>
                <Input 
                  type="text" 
                  placeholder="Search research papers" 
                  className="pl-10 pr-4 py-2 w-64" 
                />
              </div>
            </div>
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={onToggleDarkMode} 
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
            >
              <span className={`material-icons ${isDarkMode ? 'hidden' : 'block'}`}>dark_mode</span>
              <span className={`material-icons ${isDarkMode ? 'block' : 'hidden'}`}>light_mode</span>
            </button>
            
            {/* Connect Wallet Button */}
            {!isConnected ? (
              <Button 
                onClick={onConnectWalletClick}
                className="hidden md:flex items-center space-x-2 bg-primary hover:bg-opacity-90 text-white py-2 px-4 rounded-lg transition"
              >
                <span className="material-icons text-sm">account_balance_wallet</span>
                <span>Connect Wallet</span>
              </Button>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <span className="material-icons text-sm">account_balance_wallet</span>
                  <span className="truncate max-w-[100px]">
                    {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ''}
                  </span>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={disconnectWallet}
                  size="icon"
                >
                  <span className="material-icons">logout</span>
                </Button>
              </div>
            )}
            
            <div className="md:hidden">
              <button 
                className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="material-icons">{isMobileMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="material-icons text-gray-400 text-sm">search</span>
              </span>
              <Input 
                type="text" 
                placeholder="Search research papers" 
                className="pl-10 pr-4 py-2 w-full" 
              />
            </div>
            
            {!isConnected ? (
              <Button 
                onClick={onConnectWalletClick}
                className="w-full flex items-center justify-center space-x-2"
              >
                <span className="material-icons text-sm">account_balance_wallet</span>
                <span>Connect Wallet</span>
              </Button>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-sm">account_balance_wallet</span>
                  <span className="truncate max-w-[150px]">
                    {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ''}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={disconnectWallet}
                  size="icon"
                >
                  <span className="material-icons">logout</span>
                </Button>
              </div>
            )}
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <Link href="/">
                <a className="block py-2 hover:text-primary">Home</a>
              </Link>
              <Link href="/upload">
                <a className="block py-2 hover:text-primary">Upload Research</a>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
