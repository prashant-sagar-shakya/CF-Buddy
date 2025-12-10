import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Link as LinkIconLucide,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { DppProblemEntry, getRatingClass } from "@/services/dppHelpers";

const INITIAL_DPP_TAG_LIMIT = 1;

interface ProblemTableProps {
  problems: DppProblemEntry[];
  title: string;
  titleColor: string;
  solvedProblemKeys?: Set<string>;
}

const ProblemTable: React.FC<ProblemTableProps> = ({
  problems,
  title,
  titleColor,
  solvedProblemKeys,
}) => {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  const toggleTags = (problemKey: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(problemKey)) {
        next.delete(problemKey);
      } else {
        next.add(problemKey);
      }
      return next;
    });
  };

  if (!problems || problems.length === 0) return null;

  return (
    <section className="mt-2">
      <h3
        className={`text-lg sm:text-xl font-semibold mb-2 sm:mb-3 ${titleColor}`}
      >
        {title} ({problems.length})
      </h3>
      <div className="border rounded-md dark:border-dark-blue/50 overflow-x-auto">
        <Table className="min-w-full text-sm table-fixed">
          <TableHeader>
            <TableRow className="dark:border-dark-blue/30 bg-muted/50 dark:bg-dark-card/30">
              <TableHead className="w-[35%] sm:w-[30%] pl-3 pr-1 py-2.5 text-foreground dark:text-gray-300">
                Problem Name
              </TableHead>
              <TableHead className="w-[15%] sm:w-[10%] px-1 py-2.5 text-center text-foreground dark:text-gray-300">
                Rating
              </TableHead>
              <TableHead className="w-[25%] sm:w-[35%] px-1 py-2.5 text-center text-foreground dark:text-gray-300">
                Tags
              </TableHead>
              <TableHead className="w-[25%] sm:w-[25%] pl-1 pr-3 py-2.5 text-center text-foreground dark:text-gray-300">
                Solutions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.map((p) => {
              const problemKey = `${p.contestId}-${p.index}`;
              const problemTags = p.tags || [];
              const areTagsExpanded = expandedTags.has(problemKey);
              const problemUrl = `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;
              const eliteSolvers = p.solvedByElite || [];
              const isSolved = solvedProblemKeys?.has(problemKey);

              return (
                <TableRow
                  key={problemKey}
                  className={`dark:border-dark-blue/30 transition-colors duration-150 ${
                    isSolved
                      ? "bg-green-500/10 hover:bg-green-500/20 dark:bg-green-500/10 dark:hover:bg-green-500/20"
                      : "hover:bg-muted/50 dark:hover:bg-dark-card/50"
                  }`}
                >
                  <TableCell className="pl-3 pr-1 py-2.5 align-middle">
                    <a
                      href={problemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group text-foreground dark:text-gray-200 hover:text-primary dark:hover:text-teal-400 font-medium"
                    >
                      <span
                        className="block truncate"
                        title={`${p.name} (${p.contestId}${p.index})`}
                      >
                        {p.name}
                      </span>
                    </a>
                  </TableCell>
                  <TableCell
                    className={`px-1 py-2.5 text-center font-semibold align-middle ${getRatingClass(
                      p.rating
                    )}`}
                  >
                    {p.rating ?? "N/A"}
                  </TableCell>
                  <TableCell className="px-1 py-2.5 align-middle">
                    <div className="flex flex-wrap items-center justify-center gap-1 max-w-[150px] md:max-w-[200px] mx-auto">
                      {(areTagsExpanded
                        ? problemTags
                        : problemTags.slice(0, INITIAL_DPP_TAG_LIMIT)
                      ).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs truncate px-1.5 py-0.5 bg-secondary/10 dark:bg-dark-blue/40 text-foreground dark:text-gray-300 cursor-default"
                          title={tag}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {problemTags.length > INITIAL_DPP_TAG_LIMIT && (
                        <button
                          onClick={() => toggleTags(problemKey)}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center h-[18px] px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                          title={
                            areTagsExpanded
                              ? "Show fewer tags"
                              : `Show ${
                                  problemTags.length - INITIAL_DPP_TAG_LIMIT
                                } more tag(s)`
                          }
                        >
                          {areTagsExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                          <span className="ml-0.5 sr-only">
                            {areTagsExpanded ? "less" : "more"}
                          </span>
                          {!areTagsExpanded && (
                            <span className="ml-0.5">
                              (+{problemTags.length - INITIAL_DPP_TAG_LIMIT})
                            </span>
                          )}
                        </button>
                      )}
                      {problemTags.length === 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                          No tags
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="pl-1 pr-3 py-2.5 text-center align-middle">
                    {eliteSolvers.length > 0 ? (
                      <div className="flex flex-col items-center gap-0.5">
                        {eliteSolvers.slice(0, 3).map((solver) => (
                          <a
                            key={`${solver.handle}-${solver.submissionId}`}
                            href={`https://codeforces.com/contest/${solver.contestId}/submission/${solver.submissionId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 p-0.5 rounded-md space-x-1.5 group w-full max-w-[120px] hover:bg-blue-500/10 dark:hover:bg-blue-400/10 transition-colors duration-150"
                            title={`View ${solver.handle}'s solution`}
                          >
                            <LinkIconLucide
                              size={14}
                              className="flex-shrink-0"
                            />
                            <span className="text-xs truncate font-medium">
                              {solver.handle}
                            </span>
                          </a>
                        ))}
                        {eliteSolvers.length > 3 && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            (+{eliteSolvers.length - 3} more)
                          </span>
                        )}
                      </div>
                    ) : (
                      <a
                        href={problemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 p-1 rounded-md space-x-1 group hover:bg-teal-500/10 dark:hover:bg-teal-400/10 transition-colors duration-150"
                        title="Solve problem on Codeforces"
                      >
                        <ExternalLink size={16} className="flex-shrink-0" />
                        <span className="text-xs">Solve</span>
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default ProblemTable;
