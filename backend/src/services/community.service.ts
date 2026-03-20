import prisma from '../utils/prisma';

/**
 * Get all users who opted in to show on the community map.
 * Returns only public-safe data — no emails or password hashes.
 */
export async function getMapUsers() {
  return prisma.user.findMany({
    where: {
      showOnMap: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      name: true,
      profileImageUrl: true,
      bio: true,
      specialty: true,
      city: true,
      region: true,
      latitude: true,
      longitude: true,
      avgRating: true,
      totalReviews: true,
      skills: {
        include: { skill: true },
        take: 5,
      },
    },
  });
}

/**
 * Get platform-wide impact statistics for the community page.
 */
export async function getImpactStats() {
  const [
    totalUsers,
    totalProjects,
    completedProjects,
    totalMatches,
    acceptedMatches,
    totalReviews,
    totalSkills,
    totalChains,
    completedChains,
    topSkills,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.project.count({ where: { status: 'completed' } }),
    prisma.match.count(),
    prisma.match.count({ where: { status: 'accepted' } }),
    prisma.review.count(),
    prisma.userSkill.count(),
    prisma.barterChain.count().catch(() => 0),
    prisma.barterChain.count({ where: { status: 'completed' } }).catch(() => 0),
    // Top 10 most common skills
    prisma.userSkill.groupBy({
      by: ['skillId'],
      _count: { skillId: true },
      orderBy: { _count: { skillId: 'desc' } },
      take: 10,
    }),
  ]);

  // Resolve skill names for top skills
  let topSkillsWithNames: { name: string; count: number }[] = [];
  if (topSkills.length > 0) {
    const skillIds = topSkills.map((s) => s.skillId);
    const skills = await prisma.skill.findMany({
      where: { id: { in: skillIds } },
      select: { id: true, name: true },
    });
    const skillMap = new Map(skills.map((s) => [s.id, s.name]));
    topSkillsWithNames = topSkills.map((s) => ({
      name: skillMap.get(s.skillId) || 'Unknown',
      count: s._count.skillId,
    }));
  }

  // Estimate "value exchanged" — each completed match ≈ $50 of services
  const estimatedValueExchanged = acceptedMatches * 50;

  // Get recent activity (last 5 matches)
  const recentActivity = await prisma.match.findMany({
    where: { status: 'accepted' },
    select: {
      id: true,
      createdAt: true,
      project: { select: { title: true } },
      proposer: { select: { name: true, city: true } },
      receiver: { select: { name: true, city: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return {
    totalUsers,
    totalProjects,
    completedProjects,
    totalMatches,
    acceptedMatches,
    totalReviews,
    totalSkills,
    totalChains,
    completedChains,
    estimatedValueExchanged,
    topSkills: topSkillsWithNames,
    recentActivity: recentActivity.map((m: any) => ({
      id: m.id,
      project: m.project?.title || 'Untitled',
      proposer: m.proposer?.name || 'Unknown',
      proposerCity: m.proposer?.city,
      receiver: m.receiver?.name || 'Unknown',
      receiverCity: m.receiver?.city,
      date: m.createdAt,
    })),
  };
}
