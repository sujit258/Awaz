import { prisma } from "@/lib/db/prisma";

/**
 * Tokenize and normalize text for Jaccard similarity.
 */
function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

/**
 * Computes Jaccard similarity coefficient between two strings (0.0 to 1.0).
 */
export function calculateTextSimilarity(textA: string, textB: string): number {
  const setA = tokenize(textA);
  const setB = tokenize(textB);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionSize++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

export interface DuplicateDetectionResult {
  isDuplicateBySameUser: boolean;
  suspectedDuplicateOfReportId?: string;
  similarityScore: number;
}

/**
 * Evaluates whether a new complaint submission is an exact duplicate retry or suspiciously similar.
 * 
 * Rules:
 * - If the same user has submitted an active complaint for the same issue in the last 2 hours
 *   with similarity > 0.85, flags as suspected duplicate.
 * - Legitimate complaints describing the same systemic defect by DIFFERENT users are NOT blocked.
 */
export async function detectPotentialDuplicate(
  userId: string,
  issueId: string,
  summary: string,
  description: string
): Promise<DuplicateDetectionResult> {
  const recentReports = await prisma.complaintReport.findMany({
    where: {
      userId,
      issueId,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24h
      },
    },
    select: {
      id: true,
      summary: true,
      description: true,
      createdAt: true,
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const incomingCombined = `${summary} ${description}`;

  let highestScore = 0;
  let matchingReportId: string | undefined;

  for (const past of recentReports) {
    const pastCombined = `${past.summary} ${past.description}`;
    const score = calculateTextSimilarity(incomingCombined, pastCombined);
    if (score > highestScore) {
      highestScore = score;
      matchingReportId = past.id;
    }
  }

  const isDuplicateBySameUser = highestScore >= 0.85;

  return {
    isDuplicateBySameUser,
    suspectedDuplicateOfReportId: isDuplicateBySameUser ? matchingReportId : undefined,
    similarityScore: highestScore,
  };
}
