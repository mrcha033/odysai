import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Star, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { PlanPackage } from '../types';

export default function PlanSelection() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PlanPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PlanPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [winnerPlanId, setWinnerPlanId] = useState<string | undefined>();
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
    const storedMemberId = localStorage.getItem('memberId');
    setMemberId(storedMemberId);
  }, [roomId]);

  const loadPlans = async () => {
    if (!roomId) return;
    try {
      const plans = await api.getPlans(roomId);
      setPackages(plans);
      const voteData = await api.getVotes(roomId);
      setVotes(voteData?.tallies || {});
      setWinnerPlanId(voteData?.winnerPlanId);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load plans:', error);
      setLoading(false);
    }
  };

  const handleSelectPackage = (pkg: PlanPackage) => {
    setSelectedPackage(pkg);
  };

  const handleVote = async (pkg: PlanPackage) => {
    if (!roomId || !memberId) return;
    const updated = await api.votePlan(roomId, memberId, pkg.id);
    setVotes(updated?.tallies || {});
    setWinnerPlanId(updated?.winnerPlanId);
    setSelectedPackage(pkg);
  };

  const handleStartTrip = async () => {
    if (!roomId || !selectedPackage) return;

    setIsStarting(true);
    await api.startTrip(roomId, selectedPackage.id);
    navigate(`/room/${roomId}`);
  };

  const handleBackToLobby = () => {
    navigate(`/room/${roomId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-lg font-medium text-slate-600">AI is crafting your perfect itinerary...</p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isStarting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center space-y-6"
          >
            <div className="w-20 h-20 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-slate-800">Starting Your Journey</h3>
              <p className="text-slate-500">Finalizing itinerary and preparing your trip...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-800">Choose Your Journey</h2>
          <p className="text-slate-500">We've curated 3 unique plans based on your group's preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`cursor-pointer relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${selectedPackage?.id === pkg.id
                ? 'border-primary-500 bg-primary-50/50 shadow-xl shadow-primary-500/20 scale-105 z-10'
                : 'border-slate-200 bg-white hover:border-primary-300 hover:shadow-lg'
                }`}
              onClick={() => handleSelectPackage(pkg)}
            >
              {selectedPackage?.id === pkg.id && (
                <div className="absolute top-4 right-4 bg-primary-500 text-white p-1 rounded-full">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
              {winnerPlanId === pkg.id && (
                <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                  Leading
                </div>
              )}

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{pkg.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{pkg.description}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-primary-600 font-semibold">
                  <span className="px-2 py-1 bg-primary-50 rounded-lg border border-primary-100">Votes: {votes[pkg.id] || 0}</span>
                  {pkg.fitScore && (
                    <span className="px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-600">Fit {pkg.fitScore.groupScore}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {pkg.themeEmphasis.map(theme => (
                    <span key={theme} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-1">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      {theme}
                    </span>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  {pkg.days.map(day => (
                    <div key={day.day} className="space-y-2">
                      <h4 className="text-sm font-semibold text-primary-700">Day {day.day}</h4>
                      <div className="space-y-2 pl-3 border-l-2 border-primary-100">
                        {day.slots.slice(0, 3).map(slot => (
                          <div key={slot.id} className="text-xs text-slate-600 flex items-start gap-2">
                            <span className="font-medium min-w-[40px]">{slot.time}</span>
                            <span className="truncate">{slot.title}</span>
                          </div>
                        ))}
                        {day.slots.length > 3 && (
                          <div className="text-xs text-slate-400 pl-12">+ {day.slots.length - 3} more activities</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleVote(pkg); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:border-primary-300 hover:text-primary-700"
                >
                  Vote
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedPackage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none"
            >
              <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-center gap-4 pointer-events-auto max-w-lg w-full">
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-500">Selected Plan</div>
                  <div className="font-bold text-slate-800">{selectedPackage.name}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBackToLobby}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartTrip}
                    disabled={isStarting}
                    className="px-6 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStarting ? 'Starting...' : 'Start Trip'} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
