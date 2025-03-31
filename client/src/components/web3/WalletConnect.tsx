import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/context/Web3Context';
import { useToast } from '@/hooks/use-toast';
import { switchToPolygonMumbai } from '@/lib/web3';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface WalletConnectProps {
  onConnect?: () => void;
  buttonText?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  showNetworkInfo?: boolean;
  className?: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  buttonText = 'Connect Wallet',
  buttonVariant = 'default',
  showNetworkInfo = false,
  className = '',
}) => {
  const { isConnected, account, chainId, connectWallet, disconnectWallet } = useWeb3();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet('metamask');
      if (onConnect) {
        onConnect();
      }
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Could not connect to wallet',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const handleSwitchNetwork = async () => {
    setIsNetworkSwitching(true);
    try {
      const success = await switchToPolygonMumbai();
      if (success) {
        toast({
          title: 'Network Switched',
          description: 'Successfully switched to Polygon Mumbai Testnet',
        });
      } else {
        toast({
          title: 'Network Switch Failed',
          description: 'Failed to switch to Polygon Mumbai Testnet',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Network Switch Failed',
        description: error.message || 'Could not switch network',
        variant: 'destructive',
      });
    } finally {
      setIsNetworkSwitching(false);
    }
  };

  // Check if connected to Polygon Mumbai (chainId 80001)
  const isOnPolygonMumbai = chainId === 80001;

  if (!isConnected) {
    return (
      <Button
        variant={buttonVariant}
        onClick={handleConnect}
        disabled={isConnecting}
        className={`flex items-center space-x-2 ${className}`}
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <span className="material-icons text-sm">account_balance_wallet</span>
            <span>{buttonText}</span>
          </>
        )}
      </Button>
    );
  }

  if (showNetworkInfo && !isOnPolygonMumbai) {
    return (
      <Card className={className}>
        <CardHeader className="py-4">
          <CardTitle className="text-md">Wrong Network</CardTitle>
          <CardDescription>
            Please switch to Polygon Mumbai Testnet
          </CardDescription>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex items-center space-x-2">
            <span className="material-icons text-yellow-500">warning</span>
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              Current network: {chainId ? `Chain ID ${chainId}` : 'Unknown'}
            </span>
          </div>
        </CardContent>
        <CardFooter className="py-4">
          <Button
            variant="outline"
            onClick={handleSwitchNetwork}
            disabled={isNetworkSwitching}
            className="w-full"
          >
            {isNetworkSwitching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Switching...
              </>
            ) : (
              'Switch to Polygon Mumbai'
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button variant="outline" className="flex items-center space-x-2">
        <span className="material-icons text-sm">account_balance_wallet</span>
        <span className="truncate max-w-[100px]">
          {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ''}
        </span>
      </Button>
      <Button variant="ghost" onClick={handleDisconnect} size="icon">
        <span className="material-icons">logout</span>
      </Button>
    </div>
  );
};

export default WalletConnect;
