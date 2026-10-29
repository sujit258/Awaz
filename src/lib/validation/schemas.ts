import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  displayName: z.string().trim().min(2, "Name must be at least 2 characters.").max(60).optional(),
});

export const LoginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const IndianRegions = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi NCR",
  "Jammu and Kashmir",
  "Ladakh",
  "Chandigarh",
  "Puducherry",
  "Other / Not Specified",
] as const;

export const ComplaintSubmissionSchema = z.object({
  issueId: z.string().min(1, "Please select an applicable issue category."),
  companyId: z.literal("flipkart"),
  orderDate: z.string().optional().nullable(),
  promisedDeliveryDate: z.string().min(1, "Promised delivery date is required."),
  orderStatus: z.enum(["AWAITING_DELIVERY", "DELIVERED", "CANCELLED", "UNKNOWN"]).default("AWAITING_DELIVERY"),
  hasMeaningfulUpdate: z.boolean().default(false),
  summary: z
    .string()
    .trim()
    .min(10, "Summary must be at least 10 characters.")
    .max(140, "Summary cannot exceed 140 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Please describe your experience in at least 20 characters.")
    .max(2500, "Description cannot exceed 2500 characters."),
  resolutionOutcome: z.string().trim().max(300).optional().nullable(),
  approximateRegion: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
  confirmationAccurate: z.literal(true, {
    message: "You must confirm the accuracy of your submission.",
  }),
  confirmationConsent: z.literal(true, {
    message: "You must accept the privacy and evidence policy.",
  }),
});

export const ReportStatusUpdateSchema = z.object({
  orderStatus: z.enum(["AWAITING_DELIVERY", "DELIVERED", "CANCELLED", "UNKNOWN"]).optional(),
  complaintStatus: z.enum(["OPEN", "RESOLVED_BY_CUSTOMER", "DISPUTED", "UNDER_REVIEW"]).optional(),
  resolutionOutcome: z.string().trim().max(500).optional().nullable(),
});

export const EvidenceUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().refine((type) => {
    return [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ].includes(type);
  }, "Only JPEG, PNG, WEBP, or PDF files are accepted."),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024, "Evidence file size must not exceed 10MB."),
  redactionConfirmed: z.boolean().refine((val) => val === true, {
    message: "You must confirm that sensitive private info has been redacted.",
  }),
});

export const ModerationReviewSchema = z.object({
  verificationStatus: z.enum(["UNVERIFIED", "EVIDENCE_SUBMITTED", "VERIFIED", "REJECTED"]),
  reviewNote: z.string().trim().max(1000).optional().nullable(),
  evidenceId: z.string().optional().nullable(),
  evidenceStatus: z.enum(["PENDING_REVIEW", "VERIFIED", "REJECTED"]).optional(),
});

export const AdminModerationActionSchema = z.object({
  action: z.enum(["VERIFY", "REJECT", "HIDE", "FLAG_DUPLICATE", "RECLASSIFY"]),
  reason: z.string().trim().min(5, "A reason of at least 5 characters is required for audit trail."),
  targetType: z.enum(["REPORT", "EVIDENCE", "ISSUE", "USER"]),
  targetId: z.string().min(1),
  newIssueId: z.string().optional(),
});
