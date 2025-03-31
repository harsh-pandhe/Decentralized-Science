import React from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { PaperWithAuthor } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ResearchPaperCardProps {
  paper: PaperWithAuthor;
}

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

const ResearchPaperCard: React.FC<ResearchPaperCardProps> = ({ paper }) => {
  const statusBadge = getStatusBadge(paper.status);
  const createdAtDate = new Date(paper.createdAt);
  const formattedDate = formatDistanceToNow(createdAtDate, { addSuffix: true });
  
  // Get author initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge className={statusBadge.className}>
            {statusBadge.label}
          </Badge>
          <span className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</span>
        </div>
        
        <Link href={`/papers/${paper.id}`}>
          <a className="block">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary-light transition-colors">
              {paper.title}
            </h3>
          </a>
        </Link>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          {paper.abstract}
        </p>
        
        <div className="flex items-center mb-4">
          <Avatar className="w-8 h-8 mr-2">
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
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {paper.author.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {paper.author.institution || "Independent Researcher"}
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between">
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

        <div className="mt-4 flex items-center text-xs text-gray-500 dark:text-gray-400">
          <span className="material-icons text-xs mr-1">link</span>
          <span className="font-mono truncate overflow-hidden" style={{ wordBreak: "break-all" }}>
            IPFS: {paper.ipfsCid.slice(0, 16)}...
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResearchPaperCard;
