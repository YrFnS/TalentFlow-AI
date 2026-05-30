// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

// GET: List team members for a company
export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const companyId = auth.companyId || searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json([]);
    }

    const members = await db.companyMember.findMany({
      where: { companyId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST: Invite a new team member
export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { email, role, name } = body;
    const companyId = auth.companyId || body.companyId;

    if (!email || !role || !companyId) {
      return NextResponse.json(
        { error: 'Email, role, and companyId are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // Create a new user with the given role
      user = await db.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          role: role as never,
          isActive: true,
        },
      });
    }

    // Check if already a member
    const existing = await db.companyMember.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member of this company' },
        { status: 409 }
      );
    }

    const member = await db.companyMember.create({
      data: {
        userId: user.id,
        companyId,
        role: role as never,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Failed to invite team member:', error);
    return NextResponse.json(
      { error: 'Failed to invite team member' },
      { status: 500 }
    );
  }
}

// PUT: Update member role
export async function PUT(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json(
        { error: 'memberId and role are required' },
        { status: 400 }
      );
    }

    const member = await db.companyMember.update({
      where: { id: memberId },
      data: { role: role as never },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Also update the user's role
    await db.user.update({
      where: { id: member.userId },
      data: { role: role as never },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Failed to update member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}

// DELETE: Remove member from company
export async function DELETE(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      );
    }

    await db.companyMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
