import OpenAI from "openai";
import { storage } from "../storage";
import { getIPFSContent } from "./ipfs";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

/**
 * Analyze a research paper for plagiarism, quality, and generate a summary
 * @param paperId The ID of the paper being analyzed
 * @param ipfsCid The IPFS CID to retrieve the paper content
 * @param title The paper title
 * @param abstract The paper abstract
 */
export async function analyzePaperContent(
  paperId: number,
  ipfsCid: string,
  title: string,
  abstract: string
): Promise<any> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not found, skipping AI analysis");
      return null;
    }

    // Retrieve paper content from IPFS
    // For now, we'll just use the abstract if we can't get the full content
    let content = abstract;
    try {
      const paperContent = await getIPFSContent(ipfsCid);
      if (paperContent) {
        content = paperContent.toString();
      }
    } catch (error) {
      console.error("Error retrieving paper content from IPFS:", error);
    }

    // Analyze the content with OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an AI research assistant specialized in analyzing scientific papers. Analyze the given research paper and provide the following:\n" +
            "1. Plagiarism Check: Identify if the content appears original or might contain plagiarized sections\n" +
            "2. Reference Verification: Evaluate if the paper has proper citations and references\n" +
            "3. Content Summary: Provide a concise summary of the paper's key findings and contributions\n" +
            "4. Quality Rating: Rate the overall quality of the paper from 1-10\n\n" +
            "Respond with a JSON object with these keys: plagiarismCheck, referenceVerification, contentSummary, qualityRating"
        },
        {
          role: "user",
          content: `Title: ${title}\n\nAbstract/Content: ${content}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    // Update paper status based on analysis
    if (analysis.qualityRating >= 7) {
      await storage.updatePaperStatus(paperId, "verified");
      await storage.updatePaperAIVerified(paperId, true);
      
      // Award tokens to the author for high-quality paper
      const paper = await storage.getPaper(paperId);
      if (paper) {
        await storage.awardTokens(paper.authorId, 10, "High-quality paper verified by AI");
      }
    }

    return analysis;
  } catch (error) {
    console.error("Error analyzing paper with OpenAI:", error);
    return null;
  }
}

/**
 * Check a paper for possible plagiarism
 * @param content The paper content to check
 */
export async function checkForPlagiarism(content: string): Promise<{
  isPlagiarized: boolean;
  confidence: number;
  details: string;
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        isPlagiarized: false,
        confidence: 0,
        details: "OpenAI API key not found, plagiarism check skipped"
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an AI plagiarism detection expert. Analyze the given text and determine if it appears to be plagiarized. " +
            "Look for telltale signs like inconsistent writing style, unusual phrasing, or content that seems copied from common sources. " +
            "Respond with a JSON object containing: isPlagiarized (boolean), confidence (number between 0-1), and details (string explanation)."
        },
        {
          role: "user",
          content: content
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error checking for plagiarism:", error);
    return {
      isPlagiarized: false,
      confidence: 0,
      details: "Error processing plagiarism check"
    };
  }
}

/**
 * Generate a summary of a research paper
 * @param content The paper content to summarize
 */
export async function summarizePaper(content: string): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return "OpenAI API key not found, summary generation skipped";
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI research assistant. Summarize the following research paper in a concise way, highlighting key findings, methodologies, and implications."
        },
        {
          role: "user",
          content: content
        }
      ]
    });

    return response.choices[0].message.content || "Failed to generate summary";
  } catch (error) {
    console.error("Error summarizing paper:", error);
    return "Error processing paper summary";
  }
}
