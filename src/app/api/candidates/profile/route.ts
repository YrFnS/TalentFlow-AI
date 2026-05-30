// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const userId = auth.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user with candidate profile and related data
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: {
          include: {
            experiences: true,
            educations: true,
            certifications: true,
            applications: {
              include: {
                job: {
                  include: {
                    company: {
                      select: { name: true, logo: true },
                    },
                  },
                },
              },
              orderBy: { appliedAt: 'desc' },
            },
            savedJobs: {
              include: {
                job: {
                  include: {
                    company: {
                      select: { name: true, logo: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
      profile: user.candidateProfile
        ? {
            id: user.candidateProfile.id,
            phone: user.candidateProfile.phone,
            location: user.candidateProfile.location,
            bio: user.candidateProfile.bio,
            resumeUrl: user.candidateProfile.resumeUrl,
            skills: user.candidateProfile.skills
              ? JSON.parse(user.candidateProfile.skills)
              : [],
            experienceYears: user.candidateProfile.experienceYears,
            currentTitle: user.candidateProfile.currentTitle,
            linkedin: user.candidateProfile.linkedin,
            portfolio: user.candidateProfile.portfolio,
            availability: user.candidateProfile.availability,
            expectedSalary: user.candidateProfile.expectedSalary,
            isPublic: user.candidateProfile.isPublic,
            publicSlug: user.candidateProfile.publicSlug,
            experiences: user.candidateProfile.experiences,
            educations: user.candidateProfile.educations,
            certifications: user.candidateProfile.certifications,
            applications: user.candidateProfile.applications,
            savedJobs: user.candidateProfile.savedJobs,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const userId = auth.userId;
    const { ...profileData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if profile exists
    const existingProfile = await db.candidateProfile.findUnique({
      where: { userId },
    });

    // Update user name if provided
    if (profileData.name) {
      await db.user.update({
        where: { id: userId },
        data: { name: profileData.name },
      });
    }

    const profileUpdateData: Record<string, unknown> = {};
    if (profileData.phone !== undefined) profileUpdateData.phone = profileData.phone;
    if (profileData.location !== undefined) profileUpdateData.location = profileData.location;
    if (profileData.bio !== undefined) profileUpdateData.bio = profileData.bio;
    if (profileData.currentTitle !== undefined) profileUpdateData.currentTitle = profileData.currentTitle;
    if (profileData.linkedin !== undefined) profileUpdateData.linkedin = profileData.linkedin;
    if (profileData.portfolio !== undefined) profileUpdateData.portfolio = profileData.portfolio;
    if (profileData.availability !== undefined) profileUpdateData.availability = profileData.availability;
    if (profileData.expectedSalary !== undefined) profileUpdateData.expectedSalary = profileData.expectedSalary;
    if (profileData.isPublic !== undefined) profileUpdateData.isPublic = profileData.isPublic;
    if (profileData.skills !== undefined) {
      profileUpdateData.skills = JSON.stringify(profileData.skills);
    }
    if (profileData.experienceYears !== undefined) {
      profileUpdateData.experienceYears = profileData.experienceYears;
    }

    let profile;
    if (existingProfile) {
      profile = await db.candidateProfile.update({
        where: { userId },
        data: profileUpdateData,
      });
    } else {
      profile = await db.candidateProfile.create({
        data: {
          userId,
          ...profileUpdateData,
          publicSlug: `profile-${userId.slice(-8)}`,
        },
      });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        id: profile.id,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        currentTitle: profile.currentTitle,
        linkedin: profile.linkedin,
        portfolio: profile.portfolio,
        availability: profile.availability,
        expectedSalary: profile.expectedSalary,
        isPublic: profile.isPublic,
        skills: profile.skills ? JSON.parse(profile.skills) : [],
      },
    });
  } catch (error) {
    console.error('Error updating candidate profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const userId = auth.userId;
    const { action, ...data } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get candidate profile
    let profile = await db.candidateProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await db.candidateProfile.create({
        data: {
          userId,
          publicSlug: `profile-${userId.slice(-8)}`,
        },
      });
    }

    switch (action) {
      case 'addExperience': {
        const experience = await db.experience.create({
          data: {
            profileId: profile.id,
            title: data.title,
            company: data.company,
            description: data.description || null,
            startDate: data.startDate,
            endDate: data.endDate || null,
            current: data.current || false,
          },
        });
        return NextResponse.json({ experience });
      }

      case 'updateExperience': {
        const experience = await db.experience.update({
          where: { id: data.experienceId },
          data: {
            title: data.title,
            company: data.company,
            description: data.description || null,
            startDate: data.startDate,
            endDate: data.endDate || null,
            current: data.current || false,
          },
        });
        return NextResponse.json({ experience });
      }

      case 'deleteExperience': {
        await db.experience.delete({
          where: { id: data.experienceId },
        });
        return NextResponse.json({ message: 'Experience deleted' });
      }

      case 'addEducation': {
        const education = await db.education.create({
          data: {
            profileId: profile.id,
            institution: data.institution,
            degree: data.degree,
            field: data.field || null,
            startDate: data.startDate,
            endDate: data.endDate || null,
          },
        });
        return NextResponse.json({ education });
      }

      case 'updateEducation': {
        const education = await db.education.update({
          where: { id: data.educationId },
          data: {
            institution: data.institution,
            degree: data.degree,
            field: data.field || null,
            startDate: data.startDate,
            endDate: data.endDate || null,
          },
        });
        return NextResponse.json({ education });
      }

      case 'deleteEducation': {
        await db.education.delete({
          where: { id: data.educationId },
        });
        return NextResponse.json({ message: 'Education deleted' });
      }

      case 'addCertification': {
        const certification = await db.certification.create({
          data: {
            profileId: profile.id,
            name: data.name,
            issuer: data.issuer || null,
            date: data.date || null,
          },
        });
        return NextResponse.json({ certification });
      }

      case 'updateCertification': {
        const certification = await db.certification.update({
          where: { id: data.certificationId },
          data: {
            name: data.name,
            issuer: data.issuer || null,
            date: data.date || null,
          },
        });
        return NextResponse.json({ certification });
      }

      case 'deleteCertification': {
        await db.certification.delete({
          where: { id: data.certificationId },
        });
        return NextResponse.json({ message: 'Certification deleted' });
      }

      case 'saveJob': {
        const savedJob = await db.savedJob.create({
          data: {
            candidateId: profile.id,
            jobId: data.jobId,
          },
        });
        return NextResponse.json({ savedJob });
      }

      case 'unsaveJob': {
        await db.savedJob.deleteMany({
          where: {
            candidateId: profile.id,
            jobId: data.jobId,
          },
        });
        return NextResponse.json({ message: 'Job unsaved' });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing profile action:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
