import OpenAI from "openai";
import { storage } from "../storage";
import { getIPFSContent } from "./ipfs";



function splitTextIntoChunks(text: string, maxSize: number = 10000): string[] {
  const chunks: string[] = [];
  let currentChunk = "";
  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

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

    let content = abstract;
    try {
      const paperContent = await getIPFSContent(ipfsCid);
      if (paperContent) {
        content = paperContent.toString();
      }
    } catch (error) {
      console.error("Error retrieving paper content from IPFS:", error);
    }

    const MAX_CHUNK_SIZE = 10000;
    const contentChunks = splitTextIntoChunks(content, MAX_CHUNK_SIZE);

    if (contentChunks.length === 1) {
      return await analyzeSingleChunk(paperId, title, content);
    }

    console.log(`Paper is large, splitting into ${contentChunks.length} chunks for analysis`);

    const initialAnalysis = await analyzeSingleChunk(paperId, title,
      `${abstract}\n\nNote: This is just the abstract. The full paper is very large and being analyzed separately.`);

    let introduction = "";
    let conclusion = "";

    for (const chunk of contentChunks) {
      if (chunk.toLowerCase().includes("introduction") || chunk.toLowerCase().includes("background")) {
        introduction = chunk;
        break;
      }
    }

    for (let i = contentChunks.length - 1; i >= 0; i--) {
      if (contentChunks[i].toLowerCase().includes("conclusion") ||
        contentChunks[i].toLowerCase().includes("discussion") ||
        contentChunks[i].toLowerCase().includes("summary")) {
        conclusion = contentChunks[i];
        break;
      }
    }

    const representativeSample = `Title: ${title}
    
Abstract: ${abstract}

${introduction ? "Introduction excerpt:\n" + introduction : ""}

${conclusion ? "Conclusion excerpt:\n" + conclusion : ""}

Note: This is a sample of a large paper. The full text was too large to analyze in one request.`;

    await sleep(3000);

    const detailedAnalysis = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI research assistant specialized in analyzing scientific papers. Analyze the given research paper sample and provide the following:\n" +
            "1. Plagiarism Check: Identify if the content appears original or might contain plagiarized sections\n" +
            "2. Reference Verification: Evaluate if the paper has proper citations and references\n" +
            "3. Content Summary: Provide a concise summary of the paper's key findings and contributions\n" +
            "4. Quality Rating: Rate the overall quality of the paper from 1-10 based on the sample provided\n\n" +
            "Respond with a JSON object with these keys: plagiarismCheck, referenceVerification, contentSummary, qualityRating"
        },
        {
          role: "user",
          content: representativeSample
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(detailedAnalysis.choices[0].message.content);

    if (analysis.qualityRating >= 6) {
      await storage.updatePaperStatus(paperId, "verified");
      await storage.updatePaperAIVerified(paperId, true);

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

async function analyzeSingleChunk(paperId: number, title: string, content: string): Promise<any> {
  const estimatedTokens = content.length / 4;
  const estimatedDelayMs = Math.ceil((estimatedTokens / 30000) * 60 * 1000);
  await sleep(estimatedDelayMs);
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
        content: `Title: ${title}\n\nContent: ${content}`
      }
    ],
    response_format: { type: "json_object" }
  });

  const analysis = JSON.parse(response.choices[0].message.content);

  if (analysis.qualityRating >= 7) {
    await storage.updatePaperStatus(paperId, "verified");
    await storage.updatePaperAIVerified(paperId, true);

    const paper = await storage.getPaper(paperId);
    if (paper) {
      await storage.awardTokens(paper.authorId, 10, "High-quality paper verified by AI");
    }
  }

  return analysis;
}

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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}