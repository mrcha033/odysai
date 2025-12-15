import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, User, MapPin, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../api';
import { RoomStatus, Member } from '../types';

export default function RoomLobby() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<RoomStatus | null>(null);
  const [nickname, setNickname] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [copied, setCopied] = useState(false);

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
    }
  }, [status]);

  const loadRoomStatus = async () => {
    if (!roomId) return;
    const data = await api.getRoomStatus(roomId);
    setStatus(data);

    if (data.trip) {
      navigate(`/trip/${data.trip.id}`);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!status) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-primary-600 font-medium">Loading room details...</div>
      </div>
    );
  }

  const canGeneratePlans = status.members.every(m => m.surveyCompleted) && status.members.length > 0;
  const hasPlans = status.planPackages && status.planPackages.length > 0;

  return (
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
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors bg-primary-50 px-3 py-1.5 rounded-full"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Invite Link'}
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
                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                      READY
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

          {currentMember.surveyCompleted && !hasPlans && canGeneratePlans && (
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
  );
}
