export interface PublicReportDTO {
  referenceNumber: string;
  issueSlug: string;
  issueTitle: string;
  orderStatus: string;
  complaintStatus: string;
  verificationStatus: string;
  approximateRegion?: string | null;
  createdAt: string;
  hasMeaningfulUpdate: boolean;
  evidenceCount: number;
}

export interface OwnerReportDTO {
  id: string;
  referenceNumber: string;
  issueId: string;
  issueSlug: string;
  issueTitle: string;
  companyId: string;
  orderStatus: string;
  complaintStatus: string;
  verificationStatus: string;
  summary: string;
  description: string;
  resolutionOutcome?: string | null;
  approximateRegion?: string | null;
  orderReference?: string | null;
  contactEmail?: string | null;
  hasMeaningfulUpdate: boolean;
  orderDate?: string | null;
  promisedDeliveryDate?: string | null;
  createdAt: string;
  updatedAt: string;
  isAnonymous: boolean;
  isDeleted: boolean;
  evidence: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    reviewStatus: string;
    redactionStatus: string;
    createdAt: string;
  }>;
}

/**
 * Explicit allowlist projection for public display / unauthenticated lookup.
 * Strictly guarantees no private descriptions, contact info, or internal keys leak.
 */
export function toPublicReportDTO(report: {
  referenceNumber: string;
  orderStatus: string;
  complaintStatus: string;
  verificationStatus: string;
  approximateRegion?: string | null;
  createdAt: Date | string;
  hasMeaningfulUpdate?: boolean;
  issue?: { slug: string; title: string };
  evidence?: unknown[];
}): PublicReportDTO {
  return {
    referenceNumber: report.referenceNumber,
    issueSlug: report.issue?.slug || "general",
    issueTitle: report.issue?.title || "Consumer Issue",
    orderStatus: report.orderStatus,
    complaintStatus: report.complaintStatus,
    verificationStatus: report.verificationStatus,
    approximateRegion: report.approximateRegion || null,
    createdAt: typeof report.createdAt === "string" ? report.createdAt : report.createdAt.toISOString(),
    hasMeaningfulUpdate: Boolean(report.hasMeaningfulUpdate),
    evidenceCount: Array.isArray(report.evidence) ? report.evidence.length : 0,
  };
}

/**
 * Projection for the authenticated owner or authorized access key holder.
 */
export function toOwnerReportDTO(report: {
  id: string;
  referenceNumber: string;
  userId?: string | null;
  issueId: string;
  orderStatus: string;
  complaintStatus: string;
  verificationStatus: string;
  summary: string;
  description: string;
  resolutionOutcome?: string | null;
  approximateRegion?: string | null;
  orderReference?: string | null;
  contactEmail?: string | null;
  hasMeaningfulUpdate?: boolean;
  orderDate?: Date | string | null;
  promisedDeliveryDate?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  isDeleted?: boolean;
  issue?: { slug: string; title: string; companyId: string };
  evidence?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    reviewStatus: string;
    redactionStatus: string;
    createdAt: Date | string;
  }>;
}): OwnerReportDTO {
  return {
    id: report.id,
    referenceNumber: report.referenceNumber,
    issueId: report.issueId,
    issueSlug: report.issue?.slug || "",
    issueTitle: report.issue?.title || "",
    companyId: report.issue?.companyId || "flipkart",
    orderStatus: report.orderStatus,
    complaintStatus: report.complaintStatus,
    verificationStatus: report.verificationStatus,
    summary: report.summary,
    description: report.description,
    resolutionOutcome: report.resolutionOutcome || null,
    approximateRegion: report.approximateRegion || null,
    orderReference: report.orderReference || null,
    contactEmail: report.contactEmail || null,
    hasMeaningfulUpdate: Boolean(report.hasMeaningfulUpdate),
    orderDate: report.orderDate ? (typeof report.orderDate === "string" ? report.orderDate : report.orderDate.toISOString()) : null,
    promisedDeliveryDate: report.promisedDeliveryDate ? (typeof report.promisedDeliveryDate === "string" ? report.promisedDeliveryDate : report.promisedDeliveryDate.toISOString()) : null,
    createdAt: typeof report.createdAt === "string" ? report.createdAt : report.createdAt.toISOString(),
    updatedAt: typeof report.updatedAt === "string" ? report.updatedAt : report.updatedAt.toISOString(),
    isAnonymous: !report.userId,
    isDeleted: Boolean(report.isDeleted),
    evidence: (report.evidence || []).map((ev) => ({
      id: ev.id,
      fileName: ev.fileName,
      fileType: ev.fileType,
      fileSize: ev.fileSize,
      reviewStatus: ev.reviewStatus,
      redactionStatus: ev.redactionStatus,
      createdAt: typeof ev.createdAt === "string" ? ev.createdAt : ev.createdAt.toISOString(),
    })),
  };
}
