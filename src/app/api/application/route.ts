import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Define error response helper
function errorResponse(message: string, status: number = 500) {
  return new NextResponse(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    // Parse form data
    const formData = await req.json();
    const { personalInfo, educationInfo } = formData;

    if (!personalInfo || !educationInfo) {
      return errorResponse('Missing required form data', 400);
    }

    // Validate required fields
    if (!personalInfo.email || !personalInfo.firstName || !personalInfo.lastName) {
      return errorResponse('Missing required personal information', 400);
    }

    if (!educationInfo.educationLevel || !educationInfo.degreeProgram) {
      return errorResponse('Missing required education information', 400);
    }

    // 1. Create or update user
    const user = await prisma.user.upsert({
      where: { email: personalInfo.email },
      update: {
        firstName: personalInfo.firstName,
        middleName: personalInfo.middleName,
        lastName: personalInfo.lastName,
        additionalName: personalInfo.additionalName,
        gender: personalInfo.gender,
        dateOfBirth: personalInfo.dateOfBirth,
      },
      create: {
        email: personalInfo.email,
        firstName: personalInfo.firstName,
        middleName: personalInfo.middleName || null,
        lastName: personalInfo.lastName,
        additionalName: personalInfo.additionalName || null,
        gender: personalInfo.gender,
        dateOfBirth: personalInfo.dateOfBirth,
      },
    }).catch((error: PrismaClientKnownRequestError) => {
      console.error('Error creating/updating user:', error);
      throw new Error('Failed to create or update user');
    });

    // 2. Create or update education
    const education = await prisma.education.upsert({
      where: { userId: user.id },
      update: {
        educationLevel: educationInfo.educationLevel,
        degreeProgram: educationInfo.degreeProgram,
      },
      create: {
        userId: user.id,
        educationLevel: educationInfo.educationLevel,
        degreeProgram: educationInfo.degreeProgram,
      },
    }).catch((error: PrismaClientKnownRequestError) => {
      console.error('Error creating/updating education:', error);
      throw new Error('Failed to create or update education information');
    });

    // 3. Create application
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    }).catch((error: PrismaClientKnownRequestError) => {
      console.error('Error creating application:', error);
      throw new Error('Failed to create application');
    });

    return NextResponse.json({ 
      success: true, 
      applicationId: application.id,
      userId: user.id,
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Application submission error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
} 