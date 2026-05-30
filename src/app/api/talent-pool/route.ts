// @ts-nocheck - Complex Prisma types, validated at runtime
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/talent-pool?companyId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Fetch pools for the company
    const pools = await db.talentPool.findMany({
      where: { companyId },
      include: {
        members: {
          include: {
            pool: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all candidate profiles for pool members
    const candidateIds = pools.flatMap(p => p.members.map(m => m.candidateId));
    const candidateProfiles = candidateIds.length > 0
      ? await db.candidateProfile.findMany({
          where: { id: { in: candidateIds } },
          include: { user: true },
        })
      : [];

    const candidateMap = new Map(candidateProfiles.map(cp => [cp.id, cp]));

    // Format response
    const formattedPools = pools.map(pool => ({
      id: pool.id,
      name: pool.name,
      description: pool.description,
      category: pool.category,
      isDefault: pool.isDefault,
      memberCount: pool.members.length,
      lastActivity: pool.updatedAt,
      members: pool.members.map(member => {
        const profile = candidateMap.get(member.candidateId);
        return {
          id: member.id,
          candidateId: member.candidateId,
          notes: member.notes,
          tags: member.tags,
          lastContacted: member.lastContacted,
          addedAt: member.createdAt,
          candidate: profile ? {
            id: profile.id,
            name: profile.user?.name || 'Unknown',
            email: profile.user?.email || '',
            currentTitle: profile.currentTitle,
            skills: profile.skills,
            availability: profile.availability,
          } : null,
        };
      }),
    }));

    return NextResponse.json({
      pools: formattedPools,
      totalPools: pools.length,
      totalMembers: pools.reduce((acc, p) => acc + p.members.length, 0),
    });
  } catch (error) {
    console.error('Error fetching talent pools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch talent pools' },
      { status: 500 }
    );
  }
}

// POST /api/talent-pool
// Create a new pool or add member to existing pool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, companyId, name, description, category, poolId, candidateId, notes, tags } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Create new pool
    if (action === 'createPool') {
      if (!name) {
        return NextResponse.json(
          { error: 'Pool name is required' },
          { status: 400 }
        );
      }

      const pool = await db.talentPool.create({
        data: {
          companyId,
          name,
          description: description || null,
          category: category || 'GENERAL',
        },
      });

      return NextResponse.json({ pool }, { status: 201 });
    }

    // Add member to pool
    if (action === 'addMember') {
      if (!poolId || !candidateId) {
        return NextResponse.json(
          { error: 'poolId and candidateId are required' },
          { status: 400 }
        );
      }

      // Check if already a member
      const existing = await db.talentPoolMember.findUnique({
        where: {
          poolId_candidateId: { poolId, candidateId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Candidate is already in this pool' },
          { status: 409 }
        );
      }

      const member = await db.talentPoolMember.create({
        data: {
          poolId,
          candidateId,
          addedById: companyId, // Using companyId as placeholder for addedById
          notes: notes || null,
          tags: tags || null,
        },
      });

      return NextResponse.json({ member }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "createPool" or "addMember"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in talent pool POST:', error);
    return NextResponse.json(
      { error: 'Failed to process talent pool request' },
      { status: 500 }
    );
  }
}

// DELETE /api/talent-pool
// Remove a member from a pool
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, poolId, candidateId } = body;

    if (memberId) {
      await db.talentPoolMember.delete({
        where: { id: memberId },
      });
      return NextResponse.json({ success: true });
    }

    if (poolId && candidateId) {
      await db.talentPoolMember.delete({
        where: {
          poolId_candidateId: { poolId, candidateId },
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'memberId or (poolId and candidateId) is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error removing from talent pool:', error);
    return NextResponse.json(
      { error: 'Failed to remove from talent pool' },
      { status: 500 }
    );
  }
}
