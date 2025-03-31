import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <h2 className="text-xl font-bold">DeSci Hub</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Revolutionizing scientific research through decentralization, transparency, and incentivization.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <span className="sr-only">Twitter</span>
                <span className="material-icons">twitter</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <span className="sr-only">GitHub</span>
                <span className="material-icons">code</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <span className="sr-only">Discord</span>
                <span className="material-icons">forum</span>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">API Reference</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Community Forum</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Token Economics</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><Link href="/"><a className="text-gray-400 hover:text-white transition">Browse Research</a></Link></li>
              <li><Link href="/upload"><a className="text-gray-400 hover:text-white transition">Submit Paper</a></Link></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Peer Review</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Token Rewards</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} DeSci Hub. All rights reserved.</p>
          <div className="flex items-center mt-4 md:mt-0">
            <p className="text-gray-400 text-sm mr-2">Powered by</p>
            <div className="flex space-x-3">
              <span className="text-gray-400 hover:text-white transition">Ethereum</span>
              <span className="text-gray-400 hover:text-white transition">IPFS</span>
              <span className="text-gray-400 hover:text-white transition">Polygon</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
