import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertPaperSchema, insertReviewSchema } from "@shared/schema";
import { verifySignature } from "./services/blockchain";
import { uploadToIPFS, checkIPFSContent } from "./services/ipfs";
import { analyzePaperContent } from "./services/openai";
import multer from "multer";

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for the DeSci platform
  
  // Get all papers
  app.get("/api/papers", async (req, res) => {
    try {
      const papers = await storage.getAllPapers();
      res.json(papers);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching papers: ${error.message}` });
    }
  });

  // Get a specific paper by ID
  app.get("/api/papers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const paper = await storage.getPaperWithAuthor(id);
      
      if (!paper) {
        return res.status(404).json({ message: "Paper not found" });
      }
      
      // Increment view count
      await storage.incrementPaperViews(id);
      
      res.json(paper);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching paper: ${error.message}` });
    }
  });

  // Upload a research paper
  app.post("/api/papers", async (req, res) => {
    try {
      // Create a custom validation schema without authorId which will be derived from walletAddress
      const paperUploadSchema = insertPaperSchema.omit({ authorId: true }).extend({
        walletAddress: z.string().min(1, "Wallet address is required")
      });
      
      // Validate input
      const validationResult = paperUploadSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid paper data", errors: validationResult.error.errors });
      }
      
      // Get or create user by wallet address
      const walletAddress = req.body.walletAddress;
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // First, try to find the user by wallet address
      let user = await storage.getUserByWalletAddress(walletAddress);
      
      // If no user exists, create a new one
      if (!user) {
        // Create a new user with the wallet address
        const username = `researcher_${Math.floor(Math.random() * 10000)}`;
        user = await storage.createUser({
          username,
          password: "wallet_auth", // Placeholder for Web3 auth
          walletAddress
        });
        
        if (!user) {
          return res.status(500).json({ message: "Failed to create user" });
        }
        
        console.log(`Created new user with ID ${user.id} for wallet ${walletAddress}`);
      } else {
        console.log(`Found existing user with ID ${user.id} for wallet ${walletAddress}`);
      }
      
      // Check if the signature is valid
      if (req.body.signature) {
        const message = `I am submitting my research paper "${req.body.title}" with IPFS CID ${req.body.ipfsCid}`;
        const isValid = verifySignature(message, req.body.signature, walletAddress);
        
        if (!isValid) {
          return res.status(401).json({ message: "Invalid signature" });
        }
      }
      
      // We now have a valid user object with an ID
      if (!user || !user.id) {
        return res.status(500).json({ message: "Failed to resolve user ID" });
      }
      
      // Use the user ID directly from the user object
      const authorId = user.id;
      
      const paper = await storage.createPaper({
        title: req.body.title,
        abstract: req.body.abstract,
        authorId,
        ipfsCid: req.body.ipfsCid,
        metadataHash: req.body.metadataHash,
        tags: req.body.tags || [],
      });
      
      // Initiate AI analysis in the background
      analyzePaperContent(paper.id, paper.ipfsCid, paper.title, paper.abstract)
        .then(async (aiAnalysis) => {
          if (aiAnalysis) {
            await storage.updatePaperAIAnalysis(paper.id, aiAnalysis);
          }
        })
        .catch(error => {
          console.error("AI analysis error:", error);
        });
      
      res.status(201).json(paper);
    } catch (error: any) {
      res.status(500).json({ message: `Error creating paper: ${error.message}` });
    }
  });
  
  // Upload file to IPFS
  app.post("/api/ipfs/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }
      
      const cid = await uploadToIPFS(req.file.buffer);
      res.json({ cid });
    } catch (error: any) {
      res.status(500).json({ message: `Error uploading to IPFS: ${error.message}` });
    }
  });
  
  // Upload metadata to IPFS
  app.post("/api/ipfs/metadata", async (req, res) => {
    try {
      const metadata = req.body;
      if (!metadata) {
        return res.status(400).json({ message: "No metadata provided" });
      }
      
      const cid = await uploadToIPFS(Buffer.from(JSON.stringify(metadata)));
      res.json({ cid });
    } catch (error: any) {
      res.status(500).json({ message: `Error uploading metadata to IPFS: ${error.message}` });
    }
  });
  
  // Check if an IPFS file exists
  app.get("/api/ipfs/check/:cid", async (req, res) => {
    try {
      const exists = await checkIPFSContent(req.params.cid);
      res.json({ exists });
    } catch (error: any) {
      res.status(500).json({ message: `Error checking IPFS content: ${error.message}` });
    }
  });
  
  // Get reviews for a paper
  app.get("/api/papers/:id/reviews", async (req, res) => {
    try {
      const paperId = parseInt(req.params.id);
      const reviews = await storage.getReviewsForPaper(paperId);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching reviews: ${error.message}` });
    }
  });
  
  // Manually trigger AI analysis for a paper
  app.post("/api/papers/:id/analyze", async (req, res) => {
    try {
      const paperId = parseInt(req.params.id);
      const paper = await storage.getPaper(paperId);
      
      if (!paper) {
        return res.status(404).json({ message: "Paper not found" });
      }
      
      // Trigger AI analysis
      const aiAnalysis = await analyzePaperContent(
        paperId,
        paper.ipfsCid,
        paper.title,
        paper.abstract
      );
      
      if (aiAnalysis) {
        await storage.updatePaperAIAnalysis(paperId, aiAnalysis);
        return res.status(200).json({ 
          message: "AI analysis completed successfully", 
          analysis: aiAnalysis,
          status: paper.status
        });
      } else {
        return res.status(500).json({ message: "AI analysis failed" });
      }
    } catch (error: any) {
      console.error("Error in AI analysis:", error);
      res.status(500).json({ message: `Error analyzing paper: ${error.message}` });
    }
  });
  
  // Submit a review for a paper
  app.post("/api/papers/:id/reviews", async (req, res) => {
    try {
      const paperId = parseInt(req.params.id);
      
      // Validate the paper exists
      const paper = await storage.getPaper(paperId);
      if (!paper) {
        return res.status(404).json({ message: "Paper not found" });
      }
      
      // Get user from wallet address
      const walletAddress = req.body.walletAddress;
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      const user = await storage.getUserByWalletAddress(walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check that you're not reviewing your own paper
      if (paper.authorId === user.id) {
        return res.status(400).json({ message: "You cannot review your own paper" });
      }
      
      // Validate review data
      const reviewSchema = insertReviewSchema
        .omit({ paperId: true, reviewerId: true, ipfsCid: true, txHash: true })
        .extend({
          rating: z.number().min(1).max(5),
        });
      
      const validationResult = reviewSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid review data", errors: validationResult.error.errors });
      }
      
      // Upload review to IPFS for transparency
      const reviewData = {
        paperId,
        reviewerId: user.id,
        content: req.body.content,
        rating: req.body.rating,
        timestamp: new Date().toISOString(),
      };
      
      const ipfsCid = await uploadToIPFS(Buffer.from(JSON.stringify(reviewData)));
      
      // Store the review in our database
      const review = await storage.createReview({
        paperId,
        reviewerId: user.id,
        content: req.body.content,
        rating: req.body.rating,
        ipfsCid,
        txHash: "", // In production, this would be the transaction hash from the blockchain
      });
      
      // Award tokens to reviewer (simplified for now)
      await storage.awardTokens(user.id, 5, "Submitted peer review");
      
      res.status(201).json(review);
    } catch (error: any) {
      res.status(500).json({ message: `Error creating review: ${error.message}` });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
