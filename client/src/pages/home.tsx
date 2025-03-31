import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/context/Web3Context";
import ResearchPaperCard from "@/components/papers/ResearchPaperCard";
import FeatureCard from "@/components/papers/FeatureCard";
import PapersTable from "@/components/papers/PapersTable";
import { PaperWithAuthor } from "@shared/schema";

const Home = () => {
  const [, setLocation] = useLocation();
  const { isConnected, connectWallet } = useWeb3();

  // Fetch latest papers
  const { data: papers, isLoading } = useQuery<PaperWithAuthor[]>({
    queryKey: ['/api/papers'],
  });

  const handleConnectWalletClick = async () => {
    if (!isConnected) {
      await connectWallet('metamask');
    }
  };

  const handleUploadClick = () => {
    if (isConnected) {
      setLocation('/upload');
    } else {
      connectWallet('metamask').then(() => {
        setLocation('/upload');
      });
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Decentralized Scientific Research Publishing</h1>
              <p className="text-lg mb-6 text-gray-100">Empower researchers with transparent, accessible, and rewarding publishing through blockchain technology and AI verification.</p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => {
                    const researchSection = document.getElementById('latest-research');
                    if (researchSection) {
                      researchSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-white text-primary font-medium py-2 px-6 rounded-lg hover:bg-gray-100 transition"
                >
                  Explore Research
                </Button>
                <Button 
                  onClick={handleUploadClick}
                  variant="outline"
                  className="border-2 border-white text-white font-medium py-2 px-6 rounded-lg hover:bg-white hover:bg-opacity-10 transition"
                >
                  Publish Paper
                </Button>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative">
                {/* Decorative elements to represent blockchain and science */}
                <div className="absolute -z-10 w-64 h-64 bg-white bg-opacity-10 rounded-full"></div>
                <svg className="w-72 h-72 text-white" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" fillOpacity="0.2" d="M48.8,-73.2C63.5,-66.2,75.8,-54.8,81.9,-40.5C88.1,-26.2,88.1,-9,84.8,6.9C81.5,22.8,75.1,37.4,65.3,49.9C55.5,62.4,42.3,72.7,27.4,77.3C12.4,81.9,-4.3,80.7,-20.6,76.5C-36.9,72.3,-52.8,65.1,-63.3,53.1C-73.8,41.1,-79,24.4,-80.5,7.5C-82,-9.4,-79.8,-26.4,-72.1,-40.9C-64.4,-55.5,-51.3,-67.5,-36.8,-74.4C-22.3,-81.3,-6.4,-83.1,8.6,-81.4C23.6,-79.7,47.3,-74.5,48.8,-73.2Z" transform="translate(100 100)" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg">
                      <div className="material-icons text-4xl">science</div>
                    </div>
                    <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg">
                      <div className="material-icons text-4xl">token</div>
                    </div>
                    <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg">
                      <div className="material-icons text-4xl">verified</div>
                    </div>
                    <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg">
                      <div className="material-icons text-4xl">storage</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Revolutionizing Scientific Publishing</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">Our platform combines the power of blockchain and AI to create a transparent, accessible, and rewarding research ecosystem.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon="snippet_folder"
              title="Blockchain Publishing"
              description="Securely store research papers on IPFS with metadata recorded on Ethereum/Polygon."
            />
            
            <FeatureCard
              icon="rate_review"
              title="Transparent Peer Review"
              description="Reviews stored on-chain for tamper-proof verification and complete transparency."
            />
            
            <FeatureCard
              icon="psychology"
              title="AI-Assisted Verification"
              description="AI tools detect plagiarism, check for duplicates, and provide quality ratings."
            />
            
            <FeatureCard
              icon="payments"
              title="Tokenized Rewards"
              description="Earn blockchain-based tokens for research contributions and peer reviews."
            />
          </div>
        </div>
      </section>

      {/* Latest Research Section */}
      <section id="latest-research" className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest Research Papers</h2>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={handleUploadClick}
              >
                <span className="material-icons text-sm">add</span>
                Upload Paper
              </Button>
              <Link href="/">
                <a className="text-primary hover:text-primary-dark font-medium flex items-center">
                  View All
                  <span className="material-icons text-sm ml-1">arrow_forward</span>
                </a>
              </Link>
            </div>
          </div>
          
          {/* Table view of research papers */}
          {papers && papers.length > 0 ? (
            <PapersTable papers={papers} isLoading={isLoading} />
          ) : isLoading ? (
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"/>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"/>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"/>
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="material-icons text-6xl text-gray-300 dark:text-gray-600 mb-4">science</div>
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">No Research Papers Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">Be the first to publish your research on our decentralized platform and start earning tokens.</p>
              <Button onClick={handleUploadClick} size="lg" className="gap-2">
                <span className="material-icons">upload_file</span>
                Upload Research Paper
              </Button>
            </div>
          )}
          
          {/* Card view (alternative display, commented out for now) */}
          {/* <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {papers && papers.length > 0 && papers.map((paper) => (
              <ResearchPaperCard key={paper.id} paper={paper} />
            ))}
          </div> */}
        </div>
      </section>

      {/* Publishing Process Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">Our decentralized publishing platform simplifies the process while enhancing transparency and impact.</p>
          </div>
          
          <div className="relative">
            {/* Desktop Timeline */}
            <div className="hidden md:block">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200 dark:bg-gray-700"></div>
              
              <div className="grid grid-cols-2 gap-8">
                {/* Step 1 */}
                <div className="flex justify-end pr-8 relative">
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md max-w-md">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">1</div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Connect Wallet & Upload Research</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">Connect your MetaMask wallet and upload your research paper to IPFS. The platform ensures your research is securely stored with tamper-proof verification.</p>
                  </div>
                  <div className="absolute right-0 top-8 transform translate-x-1/2 w-4 h-4 bg-primary rounded-full"></div>
                </div>
                <div></div>
                
                {/* Step 2 */}
                <div></div>
                <div className="flex justify-start pl-8 relative">
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md max-w-md">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">2</div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI Verification & Analysis</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">Our AI tools analyze your paper for plagiarism, verify references, and provide a preliminary assessment to help improve quality before review.</p>
                  </div>
                  <div className="absolute left-0 top-8 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full"></div>
                </div>
                
                {/* Step 3 */}
                <div className="flex justify-end pr-8 relative">
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md max-w-md">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">3</div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Transparent Peer Review</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">Your paper undergoes peer review by experts in your field. All reviews are stored on the blockchain, ensuring complete transparency and accountability.</p>
                  </div>
                  <div className="absolute right-0 top-8 transform translate-x-1/2 w-4 h-4 bg-primary rounded-full"></div>
                </div>
                <div></div>
                
                {/* Step 4 */}
                <div></div>
                <div className="flex justify-start pl-8 relative">
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md max-w-md">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">4</div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Publication & Token Rewards</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">Once approved, your research is published on the platform. You receive token rewards based on the quality and impact of your work.</p>
                  </div>
                  <div className="absolute left-0 top-8 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* Mobile Timeline */}
            <div className="md:hidden">
              <div className="absolute left-4 top-0 h-full w-1 bg-gray-200 dark:bg-gray-700"></div>
              
              <div className="space-y-12">
                {/* Step 1 */}
                <div className="relative pl-12">
                  <div className="absolute left-4 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full"></div>
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">1</div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Connect Wallet & Upload Research</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">Connect your MetaMask wallet and upload your research paper to IPFS. The platform ensures your research is securely stored with tamper-proof verification.</p>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="relative pl-12">
                  <div className="absolute left-4 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full"></div>
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">2</div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI Verification & Analysis</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">Our AI tools analyze your paper for plagiarism, verify references, and provide a preliminary assessment to help improve quality before review.</p>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="relative pl-12">
                  <div className="absolute left-4 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full"></div>
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">3</div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Transparent Peer Review</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">Your paper undergoes peer review by experts in your field. All reviews are stored on the blockchain, ensuring complete transparency and accountability.</p>
                  </div>
                </div>
                
                {/* Step 4 */}
                <div className="relative pl-12">
                  <div className="absolute left-4 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full"></div>
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">4</div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Publication & Token Rewards</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">Once approved, your research is published on the platform. You receive token rewards based on the quality and impact of your work.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Research CTA */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-12 sm:px-12 lg:px-16">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                <div className="md:col-span-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to Publish Your Research?</h2>
                  <p className="text-white text-opacity-90 mb-8">Join our decentralized platform today and be part of the scientific revolution. Get started with just a few steps.</p>
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      onClick={handleUploadClick}
                      className="bg-white text-primary font-medium py-3 px-6 rounded-lg hover:bg-gray-100 transition flex items-center"
                    >
                      <span className="material-icons mr-2">cloud_upload</span>
                      Upload Research
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {}}
                      className="bg-transparent border-2 border-white text-white font-medium py-3 px-6 rounded-lg hover:bg-white hover:bg-opacity-10 transition"
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="bg-white/20 rounded-lg h-64 flex items-center justify-center">
                    <span className="material-icons text-white text-8xl">science</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
