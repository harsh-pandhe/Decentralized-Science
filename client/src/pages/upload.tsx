import React, { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertPaperSchema } from "@shared/schema";
import { useWeb3 } from "@/context/Web3Context";
import { uploadFileToIPFS, uploadMetadataToIPFS } from "@/lib/ipfs";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

// Extend the schema with validation
const paperUploadSchema = insertPaperSchema.extend({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  abstract: z.string().min(50, { message: "Abstract must be at least 50 characters" }),
  pdfFile: z.instanceof(FileList).refine(files => files.length === 1, {
    message: "Please select a PDF file",
  }),
  tags: z.string().optional().transform(val => 
    val ? val.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []
  ),
}).omit({ authorId: true, ipfsCid: true, metadataHash: true });

type PaperUploadFormValues = z.infer<typeof paperUploadSchema>;

const Upload = () => {
  const [, setLocation] = useLocation();
  const { isConnected, account, signer } = useWeb3();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // Redirect if not connected
  React.useEffect(() => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to upload research papers",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [isConnected, setLocation, toast]);

  const form = useForm<PaperUploadFormValues>({
    resolver: zodResolver(paperUploadSchema),
    defaultValues: {
      title: "",
      abstract: "",
      tags: "",
    },
  });

  const uploadPaperMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/papers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/papers'] });
      toast({
        title: "Research paper uploaded!",
        description: "Your paper has been successfully uploaded and is now being verified.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your paper. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: PaperUploadFormValues) => {
    if (!isConnected || !account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to upload research papers",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadProgress(10);
      
      // Upload PDF to IPFS
      const pdfFile = data.pdfFile[0];
      setUploadProgress(20);
      
      // Upload file to IPFS with proper error handling
      let ipfsCid;
      try {
        toast({
          title: "Uploading to IPFS",
          description: "Your paper is being uploaded to decentralized storage...",
        });
        ipfsCid = await uploadFileToIPFS(pdfFile);
        toast({
          title: "File uploaded successfully",
          description: `Your paper has been stored on IPFS with CID: ${ipfsCid.substring(0, 10)}...`,
        });
      } catch (ipfsError: any) {
        console.error("IPFS upload error:", ipfsError);
        toast({
          title: "IPFS Upload Failed",
          description: "There was an error uploading your paper to IPFS. Please try again.",
          variant: "destructive",
        });
        setUploadProgress(0);
        return;
      }
      
      setUploadProgress(50);
      setIsVerifying(true);
      
      // Prepare metadata
      const metadata = {
        title: data.title,
        abstract: data.abstract,
        tags: data.tags || [],
        author: account,
        timestamp: new Date().toISOString(),
      };
      
      setUploadProgress(70);
      
      // Upload metadata to IPFS with error handling
      let metadataCid;
      try {
        metadataCid = await uploadMetadataToIPFS(metadata);
      } catch (metadataError: any) {
        console.error("Metadata upload error:", metadataError);
        toast({
          title: "Metadata Upload Failed",
          description: "Failed to upload paper metadata. Please try again.",
          variant: "destructive",
        });
        setUploadProgress(0);
        return;
      }
      
      setUploadProgress(80);
      
      // Sign the submission with the wallet to verify ownership
      let signature = "";
      try {
        if (signer) {
          const message = `I am submitting my research paper "${data.title}" with IPFS CID ${ipfsCid}`;
          signature = await signer.signMessage(message);
        }
      } catch (signError: any) {
        console.error("Signature error:", signError);
        toast({
          title: "Signature Failed",
          description: "Failed to sign the transaction with your wallet. Please try again.",
          variant: "destructive",
        });
        setUploadProgress(0);
        return;
      }
      
      setUploadProgress(90);
      
      // Submit to our API with error handling
      try {
        await uploadPaperMutation.mutateAsync({
          title: data.title,
          abstract: data.abstract,
          tags: data.tags,
          ipfsCid,
          metadataHash: metadataCid,
          signature,
          walletAddress: account,
        });
        
        setUploadProgress(100);
      } catch (apiError: any) {
        console.error("API submission error:", apiError);
        toast({
          title: "Submission Failed",
          description: apiError.message || "Failed to submit paper to the platform. Your file was uploaded to IPFS, but registration failed.",
          variant: "destructive",
        });
        setUploadProgress(0);
      }
    } catch (error: any) {
      console.error("Error uploading paper:", error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your paper. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Upload Research Paper</CardTitle>
            <CardDescription>
              Share your research with the scientific community through our decentralized platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paper Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the title of your research paper" {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear, concise title that accurately reflects your research.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="abstract"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abstract</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide a summary of your research" 
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        A brief summary of your research, methodology, and key findings.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="quantum-computing, blockchain, ai" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated keywords related to your research.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pdfFile"
                  render={({ field: { onChange, value, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Paper PDF</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => onChange(e.target.files)}
                          {...fieldProps}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload your research paper in PDF format.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {(uploadProgress > 0 && uploadProgress < 100) && (
                  <div className="mt-4">
                    <Label>Upload Progress</Label>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {isVerifying ? "Verifying paper with AI..." : "Uploading to IPFS..."}
                    </p>
                  </div>
                )}
                
                <CardFooter className="px-0 mt-4 flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setLocation("/")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={uploadPaperMutation.isPending || uploadProgress > 0}
                  >
                    {uploadPaperMutation.isPending || uploadProgress > 0 ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {uploadProgress > 0 ? "Uploading..." : "Submitting..."}
                      </>
                    ) : (
                      "Upload Paper"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-300">How your paper is processed</h3>
          <ul className="list-disc list-inside space-y-2 text-blue-700 dark:text-blue-400">
            <li>Your research paper is securely uploaded to IPFS (InterPlanetary File System)</li>
            <li>Paper metadata is stored on the Polygon blockchain for immutable proof of existence</li>
            <li>Our AI system verifies your paper for plagiarism and quality</li>
            <li>Peer reviewers can provide transparent feedback, stored on-chain</li>
            <li>You earn tokens based on the quality and impact of your research</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Upload;
