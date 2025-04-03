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
}

export const storage = new MemStorage();
