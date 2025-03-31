import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").unique(),
  institution: text("institution"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  tokenBalance: integer("token_balance").default(0),
});

export const papers = pgTable("papers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  abstract: text("abstract").notNull(),
  authorId: integer("author_id").notNull(),
  ipfsCid: text("ipfs_cid").notNull(),
  metadataHash: text("metadata_hash"),
  status: text("status").notNull().default("submitted"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  tags: text("tags").array(),
  viewCount: integer("view_count").default(0),
  tokenCount: integer("token_count").default(0),
  aiVerified: boolean("ai_verified").default(false),
  aiAnalysis: json("ai_analysis"),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id").notNull(),
  reviewerId: integer("reviewer_id").notNull(),
  content: text("content").notNull(),
  rating: integer("rating").notNull(),
  ipfsCid: text("ipfs_cid"),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
  institution: true,
  bio: true,
  profileImage: true,
});

export const insertPaperSchema = createInsertSchema(papers).pick({
  title: true,
  abstract: true,
  authorId: true,
  ipfsCid: true,
  metadataHash: true,
  tags: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  paperId: true,
  reviewerId: true,
  content: true,
  rating: true,
  ipfsCid: true,
  txHash: true,
});

export const insertTokenSchema = createInsertSchema(tokens).pick({
  userId: true,
  amount: true,
  reason: true,
  txHash: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPaper = z.infer<typeof insertPaperSchema>;
export type Paper = typeof papers.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;

// Extended types for frontend use
export type PaperWithAuthor = Paper & {
  author: User;
  reviewCount: number;
};

export type ReviewWithReviewer = Review & {
  reviewer: User;
};
