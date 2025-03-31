import { 
  users, type User, type InsertUser, 
  papers, type Paper, type InsertPaper,
  reviews, type Review, type InsertReview,
  tokens, type Token, type InsertToken
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Paper operations
  createPaper(paper: InsertPaper): Promise<Paper>;
  getPaper(id: number): Promise<Paper | undefined>;
  getAllPapers(): Promise<any[]>; // Returns papers with author info
  getPaperWithAuthor(id: number): Promise<any | undefined>; // Returns paper with author info
  updatePaperStatus(id: number, status: string): Promise<boolean>;
  updatePaperAIVerified(id: number, verified: boolean): Promise<boolean>;
  updatePaperAIAnalysis(id: number, analysis: any): Promise<boolean>;
  incrementPaperViews(id: number): Promise<boolean>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReview(id: number): Promise<Review | undefined>;
  getReviewsForPaper(paperId: number): Promise<any[]>; // Returns reviews with reviewer info
  
  // Token operations
  awardTokens(userId: number, amount: number, reason: string): Promise<Token>;
  getUserTokens(userId: number): Promise<Token[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private papers: Map<number, Paper>;
  private reviews: Map<number, Review>;
  private tokens: Map<number, Token>;
  
  private userIdCounter: number;
  private paperIdCounter: number;
  private reviewIdCounter: number;
  private tokenIdCounter: number;

  constructor() {
    this.users = new Map();
    this.papers = new Map();
    this.reviews = new Map();
    this.tokens = new Map();
    
    this.userIdCounter = 1;
    this.paperIdCounter = 1;
    this.reviewIdCounter = 1;
    this.tokenIdCounter = 1;
    
    // Seed with some initial data
    this.seedInitialData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === walletAddress,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, tokenBalance: 0 };
    this.users.set(id, user);
    return user;
  }
  
  // Paper operations
  async createPaper(insertPaper: InsertPaper): Promise<Paper> {
    const id = this.paperIdCounter++;
    const now = new Date();
    
    const paper: Paper = {
      ...insertPaper,
      id,
      status: "submitted",
      createdAt: now,
      viewCount: 0,
      tokenCount: 0,
      aiVerified: false,
      aiAnalysis: null,
    };
    
    this.papers.set(id, paper);
    
    // Award initial tokens to the author
    await this.awardTokens(paper.authorId, 3, "Paper submission");
    
    return paper;
  }
  
  async getPaper(id: number): Promise<Paper | undefined> {
    return this.papers.get(id);
  }
  
  async getAllPapers(): Promise<any[]> {
    return Promise.all(
      Array.from(this.papers.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(async (paper) => {
          const author = await this.getUser(paper.authorId);
          const reviewCount = this.getReviewCountForPaper(paper.id);
          
          return {
            ...paper,
            author: author || { username: "Unknown Author" },
            reviewCount,
          };
        })
    );
  }
  
  async getPaperWithAuthor(id: number): Promise<any | undefined> {
    const paper = this.papers.get(id);
    if (!paper) return undefined;
    
    const author = await this.getUser(paper.authorId);
    const reviewCount = this.getReviewCountForPaper(paper.id);
    
    return {
      ...paper,
      author: author || { username: "Unknown Author" },
      reviewCount,
    };
  }
  
  async updatePaperStatus(id: number, status: string): Promise<boolean> {
    const paper = this.papers.get(id);
    if (!paper) return false;
    
    paper.status = status;
    this.papers.set(id, paper);
    
    return true;
  }
  
  async updatePaperAIVerified(id: number, verified: boolean): Promise<boolean> {
    const paper = this.papers.get(id);
    if (!paper) return false;
    
    paper.aiVerified = verified;
    this.papers.set(id, paper);
    
    return true;
  }
  
  async updatePaperAIAnalysis(id: number, analysis: any): Promise<boolean> {
    const paper = this.papers.get(id);
    if (!paper) return false;
    
    paper.aiAnalysis = analysis;
    this.papers.set(id, paper);
    
    return true;
  }
  
  async incrementPaperViews(id: number): Promise<boolean> {
    const paper = this.papers.get(id);
    if (!paper) return false;
    
    paper.viewCount += 1;
    this.papers.set(id, paper);
    
    return true;
  }
  
  // Review operations
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const now = new Date();
    
    const review: Review = {
      ...insertReview,
      id,
      createdAt: now,
    };
    
    this.reviews.set(id, review);
    
    // Update paper review count and status
    const paper = this.papers.get(insertReview.paperId);
    if (paper) {
      // If paper has multiple reviews, update status
      if (this.getReviewCountForPaper(paper.id) >= 2) {
        paper.status = "reviewed";
        this.papers.set(paper.id, paper);
      }
    }
    
    return review;
  }
  
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }
  
  async getReviewsForPaper(paperId: number): Promise<any[]> {
    const paperReviews = Array.from(this.reviews.values())
      .filter(review => review.paperId === paperId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return Promise.all(
      paperReviews.map(async (review) => {
        const reviewer = await this.getUser(review.reviewerId);
        return {
          ...review,
          reviewer: reviewer || { username: "Unknown Reviewer" },
        };
      })
    );
  }
  
  private getReviewCountForPaper(paperId: number): number {
    return Array.from(this.reviews.values())
      .filter(review => review.paperId === paperId)
      .length;
  }
  
  // Token operations
  async awardTokens(userId: number, amount: number, reason: string): Promise<Token> {
    const id = this.tokenIdCounter++;
    const now = new Date();
    
    const token: Token = {
      id,
      userId,
      amount,
      reason,
      txHash: null,
      createdAt: now,
    };
    
    this.tokens.set(id, token);
    
    // Update user's token balance
    const user = this.users.get(userId);
    if (user) {
      user.tokenBalance = (user.tokenBalance || 0) + amount;
      this.users.set(userId, user);
    }
    
    // If awarding tokens for review, update paper token count
    if (reason.includes("review")) {
      // Try to find the relevant paper
      const reviewerPapers = Array.from(this.reviews.values())
        .filter(review => review.reviewerId === userId)
        .map(review => review.paperId);
      
      if (reviewerPapers.length > 0) {
        const latestReviewedPaperIds = reviewerPapers[reviewerPapers.length - 1];
        const paper = this.papers.get(latestReviewedPaperIds);
        if (paper) {
          paper.tokenCount = (paper.tokenCount || 0) + amount;
          this.papers.set(paper.id, paper);
        }
      }
    }
    
    return token;
  }
  
  async getUserTokens(userId: number): Promise<Token[]> {
    return Array.from(this.tokens.values())
      .filter(token => token.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  // Seed initial data for demo purposes
  private seedInitialData() {
    // Create a few users
    const user1: User = {
      id: this.userIdCounter++,
      username: "researcher_1",
      password: "wallet_auth",
      walletAddress: "0x123abc...",
      institution: "MIT Quantum Lab",
      bio: "Quantum computing researcher",
      profileImage: null,
      tokenBalance: 45,
    };
    
    const user2: User = {
      id: this.userIdCounter++,
      username: "researcher_2",
      password: "wallet_auth",
      walletAddress: "0x456def...",
      institution: "Stanford Medical School",
      bio: "Medical researcher focusing on blockchain applications",
      profileImage: null,
      tokenBalance: 62,
    };
    
    const user3: User = {
      id: this.userIdCounter++,
      username: "researcher_3",
      password: "wallet_auth",
      walletAddress: "0x789ghi...",
      institution: "Oxford University",
      bio: "AI ethics researcher",
      profileImage: null,
      tokenBalance: 17,
    };
    
    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);
    this.users.set(user3.id, user3);
    
    // Create some papers
    const paper1: Paper = {
      id: this.paperIdCounter++,
      title: "Novel Approach to Quantum Computing Using Blockchain Verification",
      abstract: "This paper introduces a novel approach to quantum computing that leverages blockchain technology for verification of quantum states. We demonstrate how this approach can improve the reliability and security of quantum computations in distributed systems.",
      authorId: user1.id,
      ipfsCid: "QmT7fsg3fTtDgVgLw...",
      metadataHash: "0x123...",
      status: "verified",
      createdAt: new Date(2023, 5, 15), // June 15, 2023
      tags: ["quantum-computing", "blockchain", "security"],
      viewCount: 423,
      tokenCount: 45,
      aiVerified: true,
      aiAnalysis: {
        plagiarismCheck: "No plagiarism detected. Content appears to be original.",
        referenceVerification: "All references are properly cited and valid.",
        contentSummary: "This paper presents a novel approach to quantum computing verification using blockchain technology. The authors demonstrate improved security and reliability in distributed quantum systems.",
        qualityRating: 9
      },
    };
    
    const paper2: Paper = {
      id: this.paperIdCounter++,
      title: "Decentralized Clinical Trials: A Blockchain Approach",
      abstract: "This study explores how blockchain technology can enhance transparency and data integrity in clinical trials, addressing reproducibility issues in medical research. We present a framework for decentralized clinical trials that ensures tamper-proof data collection and analysis.",
      authorId: user2.id,
      ipfsCid: "QmW7hsg2gHvDbKpT8...",
      metadataHash: "0x456...",
      status: "reviewed",
      createdAt: new Date(2023, 4, 29), // May 29, 2023
      tags: ["clinical-trials", "blockchain", "medical-research"],
      viewCount: 287,
      tokenCount: 62,
      aiVerified: true,
      aiAnalysis: {
        plagiarismCheck: "No plagiarism detected. Content appears to be original.",
        referenceVerification: "All references are properly cited and valid.",
        contentSummary: "This paper presents a framework for decentralized clinical trials using blockchain technology. The approach addresses data integrity and reproducibility issues in medical research.",
        qualityRating: 8
      },
    };
    
    const paper3: Paper = {
      id: this.paperIdCounter++,
      title: "Ethics of AI in Scientific Research: A Decentralized Framework",
      abstract: "This paper proposes a decentralized governance framework for ethical AI use in scientific research, addressing concerns of bias and transparency. We discuss how blockchain-based governance can provide accountability while maintaining scientific freedom.",
      authorId: user3.id,
      ipfsCid: "QmT9ksh3fTtDgVg3w...",
      metadataHash: "0x789...",
      status: "submitted",
      createdAt: new Date(2023, 6, 3), // July 3, 2023
      tags: ["ai-ethics", "blockchain", "governance"],
      viewCount: 156,
      tokenCount: 17,
      aiVerified: false,
      aiAnalysis: null,
    };
    
    this.papers.set(paper1.id, paper1);
    this.papers.set(paper2.id, paper2);
    this.papers.set(paper3.id, paper3);
    
    // Create some reviews
    const review1: Review = {
      id: this.reviewIdCounter++,
      paperId: paper1.id,
      reviewerId: user2.id,
      content: "This paper presents a fascinating approach to quantum verification. The methodology is sound and the results are promising. I would recommend more extensive testing with larger quantum systems in future work.",
      rating: 4,
      ipfsCid: "QmReview1...",
      txHash: "0xreview1hash...",
      createdAt: new Date(2023, 5, 20), // June 20, 2023
    };
    
    const review2: Review = {
      id: this.reviewIdCounter++,
      paperId: paper1.id,
      reviewerId: user3.id,
      content: "Excellent work on combining quantum computing with blockchain verification. The security implications are significant and well-explained. The paper could benefit from more discussion of scalability challenges.",
      rating: 5,
      ipfsCid: "QmReview2...",
      txHash: "0xreview2hash...",
      createdAt: new Date(2023, 5, 25), // June 25, 2023
    };
    
    const review3: Review = {
      id: this.reviewIdCounter++,
      paperId: paper2.id,
      reviewerId: user1.id,
      content: "This paper makes a strong case for blockchain in clinical trials. The framework is well-designed and addresses key challenges in the field. I would like to see more discussion on regulatory compliance aspects.",
      rating: 4,
      ipfsCid: "QmReview3...",
      txHash: "0xreview3hash...",
      createdAt: new Date(2023, 5, 10), // June 10, 2023
    };
    
    const review4: Review = {
      id: this.reviewIdCounter++,
      paperId: paper2.id,
      reviewerId: user3.id,
      content: "A comprehensive study on decentralizing clinical trials. The implementation details are thorough and the case studies compelling. Future work should address patient privacy considerations in more detail.",
      rating: 5,
      ipfsCid: "QmReview4...",
      txHash: "0xreview4hash...",
      createdAt: new Date(2023, 5, 15), // June 15, 2023
    };
    
    const review5: Review = {
      id: this.reviewIdCounter++,
      paperId: paper3.id,
      reviewerId: user1.id,
      content: "This paper tackles an important topic in AI ethics governance. The decentralized approach is novel, but I would suggest more concrete mechanisms for implementation and oversight.",
      rating: 3,
      ipfsCid: "QmReview5...",
      txHash: "0xreview5hash...",
      createdAt: new Date(2023, 6, 10), // July 10, 2023
    };
    
    this.reviews.set(review1.id, review1);
    this.reviews.set(review2.id, review2);
    this.reviews.set(review3.id, review3);
    this.reviews.set(review4.id, review4);
    this.reviews.set(review5.id, review5);
    
    // Create some token transactions
    this.tokenIdCounter = 100; // Start with higher ID for tokens
  }
}

export const storage = new MemStorage();
