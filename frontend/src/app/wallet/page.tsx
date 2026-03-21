'use client';


import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { CreditTransaction } from '@/types';

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    try {
      const data = await api.getWallet();
      setBalance(data.balance);
      setTransactions(data.transactions || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const txTypeLabels: Record<string, { label: string; color: string }> = {
    signup_bonus: { label: 'Welcome Bonus', color: 'text-green-600' },
    trade_payment: { label: 'Payment Sent', color: 'text-red-600' },
    trade_earning: { label: 'Payment Received', color: 'text-green-600' },
    negotiation_adjustment: { label: 'Negotiation', color: 'text-blue-400' },
    refund: { label: 'Refund', color: 'text-green-600' },
    admin_grant: { label: 'Admin Grant', color: 'text-purple-600' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-brand-500/20" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="reveal font-display text-3xl">💰 My Wallet</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-8 text-white reveal-scale animate-shimmer">
        <p className="text-sm opacity-80">Available Balance</p>
        <p className="text-5xl font-bold mt-1">{balance}</p>
        <p className="text-sm opacity-80 mt-1">credits</p>
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs opacity-70">
            Credits are used to balance trades when exchanges aren&apos;t perfectly equal.
            Every new user starts with 100 credits.
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800">
        <div className="p-6 border-b border-stone-800">
          <h2 className="font-semibold text-lg">Transaction History</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-6 text-center text-sm text-stone-400">
            No transactions yet. Credits will appear here when you complete trades.
          </div>
        ) : (
          <div className="divide-y divide-stone-800/50">
            {transactions.map((tx) => {
              const typeInfo = txTypeLabels[tx.type] || { label: tx.type, color: 'text-stone-400' };
              const isPositive = tx.amount > 0;

              return (
                <div key={tx.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      {isPositive ? '↓' : '↑'}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${typeInfo.color}`}>{typeInfo.label}</p>
                      {tx.description && (
                        <p className="text-xs text-stone-400">{tx.description}</p>
                      )}
                      {tx.relatedUser && (
                        <p className="text-xs text-stone-400">
                          {isPositive ? 'From' : 'To'}: {tx.relatedUser.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{tx.amount}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      bal: {tx.balanceAfter}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
