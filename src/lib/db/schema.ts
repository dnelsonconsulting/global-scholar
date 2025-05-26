"use client";
import { z } from "zod";

// User Schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  middleName: z.string().optional(),
  lastName: z.string(),
  additionalName: z.string().optional(),
  gender: z.string(),
  dateOfBirth: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Education Schema
export const educationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  educationLevel: z.string(),
  degreeProgram: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Document Schema
export const documentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(["NATIONAL_ID", "TRANSCRIPT"]),
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileSize: z.number(),
  mimeType: z.string(),
  countryOfIssue: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Application Schema
export const applicationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"]),
  submittedAt: z.date().optional(),
  reviewedAt: z.date().optional(),
  reviewedBy: z.string().uuid().optional(),
  reviewNotes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Types
export type User = z.infer<typeof userSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Document = z.infer<typeof documentSchema>;
export type Application = z.infer<typeof applicationSchema>; 