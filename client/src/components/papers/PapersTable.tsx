import React from 'react';
import { useLocation } from 'wouter';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getIPFSUrl } from '@/lib/ipfs';
import { PaperWithAuthor } from '@shared/schema';

interface PapersTableProps {
  papers: PaperWithAuthor[];
  isLoading?: boolean;
}

const PapersTable = ({ papers, isLoading = false }: PapersTableProps) => {
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"/>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"/>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"/>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>Current research papers on the platform</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Views</TableHead>
            <TableHead className="text-center">Reviews</TableHead>
            <TableHead className="text-center">Tokens</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {papers.map((paper) => (
            <TableRow key={paper.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <TableCell className="font-medium" onClick={() => setLocation(`/papers/${paper.id}`)}>
                {paper.title}
              </TableCell>
              <TableCell onClick={() => setLocation(`/papers/${paper.id}`)}>
                {paper.author.username}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {paper.author.institution}
                </div>
              </TableCell>
              <TableCell className="text-center" onClick={() => setLocation(`/papers/${paper.id}`)}>
                <Badge 
                  variant={paper.status === 'verified' ? 'default' : 
                    paper.status === 'reviewed' ? 'outline' : 'secondary'}
                  className={`capitalize ${paper.status === 'verified' ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300' : ''}`}
                >
                  {paper.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center" onClick={() => setLocation(`/papers/${paper.id}`)}>
                {paper.viewCount}
              </TableCell>
              <TableCell className="text-center" onClick={() => setLocation(`/papers/${paper.id}`)}>
                {paper.reviewCount}
              </TableCell>
              <TableCell className="text-center" onClick={() => setLocation(`/papers/${paper.id}`)}>
                {paper.tokenCount}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(getIPFSUrl(paper.ipfsCid), '_blank')}
                  >
                    <span className="material-icons text-sm mr-1">description</span>
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/papers/${paper.id}`)}
                  >
                    <span className="material-icons text-sm mr-1">visibility</span>
                    Details
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          
          {papers.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10">
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="material-icons text-4xl text-gray-400">science</span>
                  <h3 className="text-xl font-medium">No Research Papers Found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Be the first to publish your research on our platform.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PapersTable;