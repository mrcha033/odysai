import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, User, Calendar, MapPin, Copy, Check, Loader2, Sparkles, Rocket, Heart, X, Globe } from 'lucide-react';
import { api } from '../api';
import { RoomStatus, Member } from '../types';

export default function RoomLobby() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<RoomStatus | null>(null);
  const [nickname, setNickname] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isAutoStarting, setIsAutoStarting] = useState(false);

  // Wishlist State
  const [candidateInput, setCandidateInput] = useState('');
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);

  // Discover State
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  useEffect(() => {
    // Smart Default: Pre-fill nickname
    const saved = localStorage.getItem('userNickname');
    if (saved) setNickname(saved);
  }, []);

  useEffect(() => {
    loadRoomStatus();
    const interval = setInterval(loadRoomStatus, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    const memberId = localStorage.getItem('memberId');
    if (memberId && status) {
      const member = status.members.find(m => m.id === memberId);
      setCurrentMember(member || null);

      // Auto-Start Logic: Check if everyone is ready
      if (status.members.length > 0 &&
        status.members.length >= status.room.travelerCount &&
        status.members.every(m => m.isReady) &&
        !isAutoStarting) {
        handleAutoStart();
      }
    }
  }, [status]);

  const loadRoomStatus = async () => {
    if (!roomId) return;
    const data = await api.getRoomStatus(roomId);
    setStatus(data);

    if (data.trip && !isAutoStarting) {
      navigate(`/trip/${data.trip.id}`);
    }
  };

  const handleAutoStart = async () => {
    if (!roomId || isAutoStarting) return;

    setIsAutoStarting(true);

    try {
      // 1. Get votes to determine winner
      const voteData = await api.getVotes(roomId);
      const winnerPlanId = voteData?.winnerPlanId;

      if (winnerPlanId) {
        // 2. Start the trip
        await api.startTrip(roomId, winnerPlanId);
        // Navigation will be handled by the next poll or api response, 
        // but we can also manually push if api returns tripId instantly.
        const updatedStatus = await api.getRoomStatus(roomId);
        if (updatedStatus.trip) {
          navigate(`/trip/${updatedStatus.trip.id}`);
        }
      } else {
        console.error("No winner plan found despite everyone being ready.");
        setIsAutoStarting(false);
      }
    } catch (error) {
      console.error("Auto-start failed:", error);
      setIsAutoStarting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;

    localStorage.setItem('userNickname', nickname); // Save for future

    const member = await api.joinRoom(roomId, nickname);
    localStorage.setItem('memberId', member.id);
    localStorage.setItem('roomId', roomId);
    setCurrentMember(member);
    setShowJoinForm(false);
    loadRoomStatus();
  };

  const handleStartSurvey = () => {
    navigate(`/room/${roomId}/survey/${currentMember?.id}`);
  };

  const handleViewPlans = () => {
    navigate(`/room/${roomId}/plans`);
  };

  const handleDiscover = async () => {
    if (!roomId) return;
    setIsDiscovering(true);
    setSearchResults([]);
    try {
      const { results } = await api.discoverPlaces(roomId);
      setSearchResults(results || []);
    } catch (e) {
      console.error('Discover failed', e);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleAddCandidateWithTitle = async (title: string) => {
    if (!roomId) return;
    try {
      await api.addCandidate(roomId, title);
      console.log('Added candidate:', title);
      const updatedStatus = await api.getRoomStatus(roomId);
      setStatus(updatedStatus);
    } catch (e) {
      console.error('Failed to add candidate', e);
    }
  };

  const handleAddCandidate = async () => {
    if (!roomId || !candidateInput.trim()) return;
    setIsAddingCandidate(true);
    try {
      const { candidates } = await api.addCandidate(roomId, candidateInput);
      if (status) {
        setStatus({
          ...status,
          room: { ...status.room, candidates }
        });
      }
      setCandidateInput('');
    } catch (e) {
      console.error('Failed to add candidate', e);
    } finally {
      setIsAddingCandidate(false);
    }
  };

  const handleRemoveCandidate = async (candidate: string) => {
    if (!roomId) return;
    try {
      const { candidates } = await api.removeCandidate(roomId, candidate);
      if (status) {
        setStatus({
          ...status,
          room: { ...status.room, candidates }
        });
      }
    } catch (e) {
      console.error('Failed to remove candidate', e);
    }
  };

  const handleGeneratePlans = async () => {
    if (!roomId) return;
    await api.generatePlans(roomId);
    loadRoomStatus();
  };

  const handleToggleReady = async () => {
    if (!currentMember || !roomId) return;
    await api.setReady(roomId, currentMember.id, !currentMember.isReady);
    loadRoomStatus();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 3000);
  };

  if (!status) {
    // Skeleton Loading
    return (
      <div className="space-y-8 animate-pulse max-w-2xl mx-auto pt-10 px-4">
        <div className="text-center space-y-4">
          <div className="h-10 bg-slate-200 rounded-lg w-2/3 mx-auto"></div>
          <div className="h-6 bg-slate-200 rounded-lg w-1/3 mx-auto"></div>
        </div>
        <div className="card p-6 space-y-6">
          <div className="flex justify-between">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="h-8 bg-slate-200 rounded-full w-1/4"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const canGeneratePlans =
    status.members.length >= status.room.travelerCount &&
    status.members.every(m => m.surveyCompleted);
  const hasPlans = status.planPackages && status.planPackages.length > 0;

  return (
    <>
      <AnimatePresence>
        {isAutoStarting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/95 backdrop-blur-md z-[60] flex flex-col items-center justify-center space-y-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary-200 rounded-full animate-ping opacity-25"></div>
              <div className="bg-primary-50 p-6 rounded-full relative z-10">
                <Rocket size={64} className="text-primary-600 animate-bounce" />
              </div>
            </div>
            <div className="text-center space-y-2 max-w-md px-4">
              <h3 className="text-2xl font-bold text-slate-800">Everyone is Ready!</h3>
              <p className="text-slate-500 text-lg">Launching your adventure based on the group's vote...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3"
          >
            <div className="bg-green-500 rounded-full p-1">
              <Check size={12} strokeWidth={3} />
            </div>
            <span className="font-medium">Link copied! Share it with your friends.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
            <MapPin className="text-primary-500" />
            {status.room.city} Trip
          </h2>
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Calendar size={18} />
            <span>{status.room.dateRange.start} ~ {status.room.dateRange.end}</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-700">Travelers ({status.members.length})</h3>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-full font-medium"
            >
              <Copy size={16} />
              Invite Friends
            </button>
          </div>

          <div className="grid gap-3">
            <AnimatePresence>
              {status.members.map(member => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-400">
                      <User size={20} />
                    </div>
                    <div>
                      <span className="font-medium text-slate-700 flex items-center gap-2">
                        {member.nickname}
                        {member.id === currentMember?.id && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">You</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.surveyCompleted ? (
                      <span className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Check size={12} /> Survey Done
                      </span>
                    ) : (
                      <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
                        Pending Survey
                      </span>
                    )}
                    {member.isReady && (
                      <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Rocket size={12} /> READY
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {!currentMember && !showJoinForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center"
            >
              <button onClick={() => setShowJoinForm(true)} className="btn btn-primary w-full">
                Join This Trip
              </button>
            </motion.div>
          )}

          {showJoinForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleJoin}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nickname</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname"
                  className="input"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">Join Now</button>
            </motion.form>
          )}
        </div>

        {currentMember && (
          <div className="space-y-4">
            {!currentMember.surveyCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-lg font-semibold text-blue-900">Tell us your preferences!</h4>
                  <p className="text-blue-700">Complete the survey to help AI plan the perfect trip.</p>
                </div>
                <button onClick={handleStartSurvey} className="btn bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200">
                  Start Survey
                </button>
              </motion.div>
            )}

            {currentMember.surveyCompleted && !hasPlans && (
              canGeneratePlans ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                      <Sparkles className="text-green-600" />
                      Ready to Generate Plans
                    </h4>
                    <p className="text-green-700">Everyone has completed the survey.</p>
                  </div>
                  <button onClick={handleGeneratePlans} className="btn bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200">
                    Generate AI Plans
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center"
                >
                  {/* Discover Section */}
                  <div className="card p-6 space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Globe size={20} className="text-blue-500" />
                      Discover Trending Places <span className="text-sm font-normal text-slate-500">(Real-time web search)</span>
                    </h3>

                    {!searchResults.length ? (
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-600 mb-4">Not sure where to go? Search the web for top rated spots!</p>
                        <button
                          onClick={handleDiscover}
                          disabled={isDiscovering}
                          className="btn bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                        >
                          {isDiscovering ? (
                            <>
                              <Loader2 className="animate-spin" size={18} />
                              Searching Web...
                            </>
                          ) : (
                            <>
                              <Sparkles size={18} />
                              Search Top Places
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-500">Found {searchResults.length} results</span>
                          <button onClick={() => setSearchResults([])} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          {searchResults.map((result, idx) => (
                            <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors group">
                              <div className="flex justify-between items-start mb-1">
                                <a href={result.link} target="_blank" rel="noreferrer" className="font-semibold text-slate-800 hover:underline flex-1 truncate pr-2">
                                  {result.title}
                                </a>
                                <button
                                  onClick={() => {
                                    setCandidateInput(result.title);
                                    handleAddCandidateWithTitle(result.title);
                                  }}
                                  className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md transition-colors text-xs font-bold"
                                >
                                  + Add
                                </button>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2">{result.snippet}</p>
                              {result.rating && <div className="mt-2 text-xs font-medium text-amber-500">★ {result.rating}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shared Wishlist Section */}
                  <div className="card p-6 space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Heart size={20} className="text-pink-500" />
                      Shared Wishlist <span className="text-sm font-normal text-slate-500">(Places you want to visit)</span>
                    </h3>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={candidateInput}
                        onChange={(e) => setCandidateInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCandidate()}
                        placeholder="e.g. Eiffel Tower, Grandma's Cookie Shop"
                        className="input flex-1"
                      />
                      <button
                        onClick={handleAddCandidate}
                        disabled={isAddingCandidate || !candidateInput.trim()}
                        className="btn btn-secondary whitespace-nowrap"
                      >
                        {isAddingCandidate ? 'Adding...' : 'Add Place'}
                      </button>
                    </div>

                    {status.room.candidates && status.room.candidates.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {status.room.candidates.map((candidate, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-700 rounded-full text-sm font-medium border border-pink-100">
                            {candidate}
                            <button
                              onClick={() => handleRemoveCandidate(candidate)}
                              className="hover:bg-pink-100 rounded-full p-0.5 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm italic">No specific places requested yet. Add some to guide the AI!</p>
                    )}
                  </div>

                  <div className="flex justify-center pt-8">
                    <div className="p-3 bg-white rounded-full shadow-sm">
                      <User className="text-slate-400" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-700">Waiting for other travelers...</h4>
                  <p className="text-slate-500 mb-2">
                    {status.members.length < status.room.travelerCount
                      ? `Waiting for ${status.room.travelerCount - status.members.length} more person(s) to join.`
                      : 'Waiting for everyone to complete the survey.'}
                  </p>
                  <div className="w-full bg-slate-200 rounded-full h-2 max-w-xs mx-auto overflow-hidden">
                    <div
                      className="bg-primary-500 h-full transition-all duration-500"
                      style={{
                        width: `${(status.members.filter(m => m.surveyCompleted).length / status.room.travelerCount) * 100}%`
                      }}
                    />
                  </div>
                </motion.div>
              )
            )}

            {hasPlans && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-purple-50 border border-purple-100 rounded-2xl p-6"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-purple-900">Plans are Ready!</h4>
                    <p className="text-purple-700">Check out the AI-generated itineraries.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleViewPlans} className="btn btn-primary flex items-center gap-2">
                      View Plans <ArrowRight size={18} />
                    </button>
                    <button
                      onClick={handleToggleReady}
                      className={`btn ${currentMember.isReady ? 'bg-slate-200 text-slate-700' : 'bg-white border border-slate-200 text-slate-700'}`}
                    >
                      {currentMember.isReady ? 'Cancel Ready' : 'Mark as Ready'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
}
