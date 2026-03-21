import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

// ============================================================
// Wallet
// ============================================================

/** Get user's credit balance and recent transactions */
export async function getWallet(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsBalance: true },
  });
  if (!user) throw new AppError('User not found.', 404);

  const transactions = await prisma.creditTransaction.findMany({
    where: { userId },
    include: {
      relatedUser: { select: { id: true, name: true } },
      relatedMatch: { select: { id: true, projectId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return { balance: user.creditsBalance, transactions };
}

// ============================================================
// Credit Offers (Negotiation)
// ============================================================

/**
 * Propose a credit offer on a match.
 * "I'll do this work for you for X credits" or "I'll pay you X credits for your work"
 */
export async function proposeOffer(
  matchId: string,
  proposedBy: string,
  amount: number,
  payerId: string,
  payeeId: string,
  note?: string
) {
  if (amount < 0) throw new AppError('Amount must be positive.', 400);
  if (amount > 10000) throw new AppError('Amount too large.', 400);

  // Verify the match exists and involves this user
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new AppError('Match not found.', 404);
  if (match.proposerId !== proposedBy && match.receiverId !== proposedBy) {
    throw new AppError('You are not part of this match.', 403);
  }

  // Check payer has enough credits
  const payer = await prisma.user.findUnique({
    where: { id: payerId },
    select: { creditsBalance: true },
  });
  if (!payer) throw new AppError('Payer not found.', 404);
  if (payer.creditsBalance < amount) {
    throw new AppError(`Insufficient credits. Payer has ${payer.creditsBalance} but offer requires ${amount}.`, 400);
  }

  // Expire any existing pending/countered offers on this match
  await prisma.creditOffer.updateMany({
    where: {
      matchId,
      status: { in: ['proposed', 'countered'] },
    },
    data: { status: 'expired' },
  });

  return prisma.creditOffer.create({
    data: {
      matchId,
      proposedBy,
      amount,
      payerId,
      payeeId,
      note,
      status: 'proposed',
    },
    include: {
      proposer: { select: { id: true, name: true } },
      payer: { select: { id: true, name: true, creditsBalance: true } },
      payee: { select: { id: true, name: true, creditsBalance: true } },
    },
  });
}

/**
 * Counter an existing offer with a different amount.
 */
export async function counterOffer(
  offerId: string,
  userId: string,
  counterAmount: number,
  counterNote?: string,
  counterPayerId?: string,
  counterPayeeId?: string
) {
  if (counterAmount < 0) throw new AppError('Amount must be positive.', 400);

  const offer = await prisma.creditOffer.findUnique({ where: { id: offerId } });
  if (!offer) throw new AppError('Offer not found.', 404);
  if (offer.status !== 'proposed' && offer.status !== 'countered') {
    throw new AppError('This offer is no longer negotiable.', 400);
  }
  if (offer.proposedBy === userId) {
    throw new AppError('You cannot counter your own offer. Wait for the other party.', 400);
  }

  // Use new payer/payee if provided, otherwise keep the original direction
  const newPayerId = counterPayerId || offer.payerId;
  const newPayeeId = counterPayeeId || offer.payeeId;

  // Verify the new payer has enough credits
  const payer = await prisma.user.findUnique({
    where: { id: newPayerId },
    select: { creditsBalance: true },
  });
  if (payer && payer.creditsBalance < counterAmount) {
    throw new AppError(`Payer only has ${payer.creditsBalance} credits.`, 400);
  }

  return prisma.creditOffer.update({
    where: { id: offerId },
    data: {
      status: 'countered',
      counterAmount,
      counterNote,
      proposedBy: userId,
      amount: counterAmount,
      payerId: newPayerId,
      payeeId: newPayeeId,
      note: counterNote || offer.note,
    },
    include: {
      proposer: { select: { id: true, name: true } },
      payer: { select: { id: true, name: true, creditsBalance: true } },
      payee: { select: { id: true, name: true, creditsBalance: true } },
    },
  });
}

/**
 * Accept an offer — triggers the credit transfer.
 */
export async function acceptOffer(offerId: string, userId: string) {
  const offer = await prisma.creditOffer.findUnique({
    where: { id: offerId },
    include: {
      payer: { select: { id: true, creditsBalance: true } },
      payee: { select: { id: true, creditsBalance: true } },
    },
  });

  if (!offer) throw new AppError('Offer not found.', 404);
  if (offer.status !== 'proposed' && offer.status !== 'countered') {
    throw new AppError('This offer is no longer active.', 400);
  }
  // Only the non-proposer can accept
  if (offer.proposedBy === userId) {
    throw new AppError('You cannot accept your own offer. Wait for the other party.', 400);
  }

  const finalAmount = offer.amount;

  // Verify payer still has enough credits
  if (!offer.payer || offer.payer.creditsBalance < finalAmount) {
    throw new AppError('Payer no longer has enough credits.', 400);
  }

  // Execute the credit transfer atomically
  const payerNewBalance = offer.payer.creditsBalance - finalAmount;
  const payeeNewBalance = (offer.payee?.creditsBalance || 0) + finalAmount;

  // Update payer balance
  await prisma.user.update({
    where: { id: offer.payerId },
    data: { creditsBalance: payerNewBalance },
  });

  // Update payee balance
  await prisma.user.update({
    where: { id: offer.payeeId },
    data: { creditsBalance: payeeNewBalance },
  });

  // Record transactions for both parties
  await prisma.creditTransaction.create({
    data: {
      userId: offer.payerId,
      amount: -finalAmount,
      balanceAfter: payerNewBalance,
      type: 'trade_payment',
      description: `Paid ${finalAmount} credits`,
      relatedMatchId: offer.matchId,
      relatedUserId: offer.payeeId,
    },
  });

  await prisma.creditTransaction.create({
    data: {
      userId: offer.payeeId,
      amount: finalAmount,
      balanceAfter: payeeNewBalance,
      type: 'trade_earning',
      description: `Earned ${finalAmount} credits`,
      relatedMatchId: offer.matchId,
      relatedUserId: offer.payerId,
    },
  });

  // Mark offer as accepted
  return prisma.creditOffer.update({
    where: { id: offerId },
    data: { status: 'accepted', acceptedAt: new Date() },
    include: {
      proposer: { select: { id: true, name: true } },
      payer: { select: { id: true, name: true, creditsBalance: true } },
      payee: { select: { id: true, name: true, creditsBalance: true } },
    },
  });
}

/**
 * Reject an offer.
 */
export async function rejectOffer(offerId: string, userId: string) {
  const offer = await prisma.creditOffer.findUnique({ where: { id: offerId } });
  if (!offer) throw new AppError('Offer not found.', 404);
  if (offer.proposedBy === userId) {
    throw new AppError('You cannot reject your own offer.', 400);
  }

  return prisma.creditOffer.update({
    where: { id: offerId },
    data: { status: 'rejected' },
  });
}

/**
 * Get all offers for a match (negotiation history).
 */
export async function getMatchOffers(matchId: string) {
  return prisma.creditOffer.findMany({
    where: { matchId },
    include: {
      proposer: { select: { id: true, name: true } },
      payer: { select: { id: true, name: true } },
      payee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get the current active offer for a match (if any).
 */
export async function getActiveOffer(matchId: string) {
  return prisma.creditOffer.findFirst({
    where: {
      matchId,
      status: { in: ['proposed', 'countered'] },
    },
    include: {
      proposer: { select: { id: true, name: true } },
      payer: { select: { id: true, name: true, creditsBalance: true } },
      payee: { select: { id: true, name: true, creditsBalance: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
