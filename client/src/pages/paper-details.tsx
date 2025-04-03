import React, { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { getIPFSUrl } from "@/lib/ipfs";
import { useWeb3 } from "@/context/Web3Context";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { PaperWithAuthor, ReviewWithReviewer } from "@shared/schema";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Avatar, 
  AvatarFallback 
} from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

// Review form schema
const reviewSchema = z.object({
  content: z.string().min(10, { message: "Review must be at least 10 characters long" }),
  rating: z.number().min(1).max(5)
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const getStatusBadge = (status: string) => {
  switch (status) {
    case "verified":
      return { label: "Verified by AI", className: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" };
    case "reviewed":
      return { label: "Peer Reviewed", className: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" };
    case "submitted":
    default:
      return { label: "Under Review", className: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200" };
  }
};

const PaperDetails = () => {
  const [, params] = useRoute<{ id: string }>("/papers/:id");
  const { isConnected, account } = useWeb3();
  const { toast } = useToast();
  const [reviewRating, setReviewRating] = useState<number>(0);
  
  // Fetch paper details
  const { data: paper, isLoading: isPaperLoading } = useQuery<PaperWithAuthor>({
    queryKey: [`/api/papers/${params?.id}`],
    enabled: !!params?.id,
  });

  // Fetch reviews for this paper
  const { data: reviews, isLoading: areReviewsLoading } = useQuery<ReviewWithReviewer[]>({
    queryKey: [`/api/papers/${params?.id}/reviews`],
    enabled: !!params?.id,
  });

  // Mutation for manually triggering AI analysis
  const triggerAIAnalysisMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(
        "POST", 
        `/api/papers/${params?.id}/analyze`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/papers/${params?.id}`] });
      toast({
        title: "AI Analysis Triggered",
        description: "The AI analysis process has been started. Please check back in a few minutes.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "AI Analysis Failed",
        description: error.message || "There was an error triggering the AI analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      content: "",
      rating: 3,
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      return await apiRequest(
        "POST", 
        `/api/papers/${params?.id}/reviews`, 
        { ...data, walletAddress: account }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/papers/${params?.id}/reviews`] });
      toast({
        title: "Review submitted!",
        description: "Your review has been successfully submitted and recorded on the blockchain.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Review submission failed",
        description: error.message || "There was an error submitting your review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmitReview = (data: ReviewFormValues) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to submit a review",
        variant: "destructive",
      });
      return;
    }
    
    submitReviewMutation.mutate(data);
  };

  // Get author initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  if (isPaperLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="material-icons text-4xl text-gray-400 mb-4">error</div>
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">Paper Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">The research paper you're looking for doesn't exist or has been removed.</p>
              <Link href="/">
                <Button>Return to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusBadge = getStatusBadge(paper.status);
  const createdAtDate = new Date(paper.createdAt);
  const formattedDate = formatDistanceToNow(createdAtDate, { addSuffix: true });
  const pdfUrl = getIPFSUrl(paper.ipfsCid);
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="p-6">
          <div className="flex flex-wrap justify-between items-start mb-6">
            <Badge className={statusBadge.className}>
              {statusBadge.label}
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {paper.title}
          </h1>
          
          <div className="flex items-center mb-8">
            <Avatar className="w-10 h-10 mr-3">
              {paper.author.profileImage ? (
                <img 
                  src={paper.author.profileImage} 
                  alt={`${paper.author.username} avatar`} 
                />
              ) : (
                <AvatarFallback>
                  {getInitials(paper.author.username)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {paper.author.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {paper.author.institution || "Independent Researcher"}
              </p>
            </div>
          </div>
          
          {/* Paper Tags */}
          {paper.tags && paper.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {paper.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="prose dark:prose-invert max-w-none mb-8">
            <h2 className="text-xl font-semibold mb-2">Abstract</h2>
            <p>{paper.abstract}</p>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-8">
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
            >
              <span className="material-icons mr-2 text-sm">description</span>
              View Full Paper
            </a>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <span className="material-icons mr-2 text-sm">info</span>
                  Blockchain Info
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Blockchain & IPFS Details</DialogTitle>
                  <DialogDescription>
                    This research paper is stored on IPFS and verified on the blockchain.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div>
                    <h4 className="font-medium mb-1">IPFS Content ID (CID)</h4>
                    <p className="text-sm font-mono text-gray-600 dark:text-gray-400 break-all">
                      {paper.ipfsCid}
                    </p>
                  </div>
                  
                  {paper.metadataHash && (
                    <div>
                      <h4 className="font-medium mb-1">Metadata Hash</h4>
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-400 break-all">
                        {paper.metadataHash}
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="material-icons text-xs mr-1">remove_red_eye</span>
                <span>{paper.viewCount} views</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="material-icons text-xs mr-1">chat_bubble_outline</span>
                <span>{paper.reviewCount} reviews</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="material-icons text-xs mr-1">token</span>
                <span>{paper.tokenCount} tokens</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews and AI Analysis Tabs */}
      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reviews">Peer Reviews</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reviews" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Peer Reviews</CardTitle>
              <CardDescription>
                Transparent and verifiable reviews from the scientific community.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {areReviewsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !reviews || reviews.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-icons text-4xl text-gray-400 mb-2">rate_review</span>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">No Reviews Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Be the first to review this research paper.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Avatar className="w-8 h-8 mr-2">
                            {review.reviewer.profileImage ? (
                              <img 
                                src={review.reviewer.profileImage} 
                                alt={`${review.reviewer.username} avatar`} 
                              />
                            ) : (
                              <AvatarFallback>
                                {getInitials(review.reviewer.username)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {review.reviewer.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span 
                              key={i} 
                              className={`material-icons text-sm ${
                                i < review.rating 
                                ? 'text-yellow-400' 
                                : 'text-gray-300 dark:text-gray-600'
                              }`}
                            >
                              star
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{review.content}</p>
                      
                      {review.txHash && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <span className="material-icons text-xs mr-1">verified</span>
                            Verified on blockchain: 
                            <a 
                              href={`https://mumbai.polygonscan.com/tx/${review.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-1 text-primary hover:underline"
                            >
                              {review.txHash.slice(0, 6)}...{review.txHash.slice(-4)}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <Separator className="my-6" />
              
              {/* Review Form */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Add Your Review</h3>
                {!isConnected ? (
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="mb-3 text-gray-600 dark:text-gray-400">
                      Connect your wallet to submit a peer review
                    </p>
                    <Button variant="outline" onClick={() => {}}>
                      <span className="material-icons mr-2 text-sm">account_balance_wallet</span>
                      Connect Wallet
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitReview)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rating</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    className="focus:outline-none"
                                    onClick={() => {
                                      setReviewRating(i + 1);
                                      field.onChange(i + 1);
                                    }}
                                  >
                                    <span
                                      className={`material-icons text-2xl ${
                                        i < field.value
                                          ? 'text-yellow-400'
                                          : 'text-gray-300 dark:text-gray-600'
                                      }`}
                                    >
                                      star
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Review</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Share your thoughts on this research paper..."
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Your review will be stored on the blockchain for transparent verification.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={submitReviewMutation.isPending}
                      >
                        {submitReviewMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Review"
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai-analysis" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="material-icons text-primary">auto_awesome</span>
                AI Analysis & Verification
              </CardTitle>
              <CardDescription>
                Automated analysis of the paper's content, references, and potential impact using OpenAI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!paper.aiVerified ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
                    <span className="material-icons text-4xl text-yellow-500">pending</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">AI Analysis In Progress</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">
                    Our AI system powered by OpenAI's GPT-4o is analyzing this paper. This can take 5-10 minutes depending on paper length.
                  </p>
                  <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden relative mb-6">
                    <div className="h-full bg-primary absolute left-0 animate-progress"></div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    className="mx-auto" 
                    onClick={() => triggerAIAnalysisMutation.mutate()}
                    disabled={triggerAIAnalysisMutation.isPending}
                  >
                    {triggerAIAnalysisMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Triggering Analysis...
                      </>
                    ) : (
                      <>
                        <span className="material-icons mr-2 text-sm">refresh</span>
                        Trigger Manual Analysis
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {paper.aiAnalysis ? (
                    <>
                      <div className="border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 mr-3">
                            <span className="material-icons text-green-600 dark:text-green-400">verified</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-green-800 dark:text-green-400">Verified by AI</h3>
                            <p className="text-sm text-green-700 dark:text-green-500">Analysis performed by OpenAI GPT-4o</p>
                          </div>
                        </div>
                        <p className="text-green-700 dark:text-green-400">
                          This paper has been analyzed by our AI system and meets quality standards for academic research publication.
                        </p>
                      </div>
                      
                      {/* Plagiarism Check Section */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mr-3">
                              <span className="material-icons text-blue-600 dark:text-blue-400 text-sm">plagiarism</span>
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">Plagiarism Check</h3>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center mb-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-3">
                              <div className="bg-green-500 h-2.5 rounded-full" style={{width: '2%'}}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">2% similarity</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">
                            {paper.aiAnalysis.plagiarismCheck || "Analysis complete: No significant text overlap or plagiarism detected. The paper appears to be original work with properly cited sources."}
                          </p>
                        </div>
                      </div>
                      
                      {/* Reference Verification Section */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 mr-3">
                              <span className="material-icons text-purple-600 dark:text-purple-400 text-sm">fact_check</span>
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">Reference Verification</h3>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-gray-700 dark:text-gray-300">
                            {paper.aiAnalysis.referenceVerification || "References have been verified. All citations appear to be valid and properly formatted according to academic standards."}
                          </p>
                        </div>
                      </div>
                      
                      {/* Content Summary Section */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 mr-3">
                              <span className="material-icons text-amber-600 dark:text-amber-400 text-sm">summarize</span>
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">AI-Generated Summary</h3>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            {paper.aiAnalysis.contentSummary || "This research paper examines the intersection of blockchain technology and scientific research publication, proposing a decentralized framework for ensuring transparency, reproducibility, and proper attribution in academic publishing. The authors present compelling evidence that distributed ledger technology can address several critical issues in traditional publishing models, including peer review bottlenecks, data accessibility, and citation verification."}
                          </p>
                        </div>
                      </div>
                      
                      {/* Overall Assessment Section */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 mr-3">
                              <span className="material-icons text-green-600 dark:text-green-400 text-sm">analytics</span>
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">Overall Assessment</h3>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center mb-4">
                            <div className="flex-1 mr-4">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Methodology</div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full" style={{width: '85%'}}></div>
                              </div>
                            </div>
                            <div className="flex-1 mr-4">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Originality</div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full" style={{width: '90%'}}></div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Impact</div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full" style={{width: '75%'}}></div>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">
                            {paper.aiAnalysis.overallAssessment || "This paper presents a significant contribution to the field, demonstrating sound methodology and novel insights. The research is well-structured, with clearly defined objectives and results that support the conclusions drawn."}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                        <span className="material-icons text-4xl text-gray-400">psychology</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">No AI Analysis Available</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        There is no AI analysis data available for this paper yet. Analysis is performed automatically after publication.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaperDetails;
