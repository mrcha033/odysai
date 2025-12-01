import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, User, ArrowRight } from 'lucide-react';
import { api } from '../api';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelerCount, setTravelerCount] = useState(4);
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const room = await api.createRoom({
        city,
        dateRange: { start: startDate, end: endDate },
        theme: ['여행'],
        travelerCount,
      });

      const member = await api.joinRoom(room.id, nickname);

      localStorage.setItem('memberId', member.id);
      localStorage.setItem('roomId', room.id);

      navigate(`/room/${room.id}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Start Your Journey</h2>
        <p className="text-slate-500">Create a new trip and invite your friends</p>
      </div>

      <div className="card p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <MapPin size={16} className="text-primary-500" />
              Destination
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Jeju Island, Busan"
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Calendar size={16} className="text-primary-500" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Calendar size={16} className="text-primary-500" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Users size={16} className="text-primary-500" />
              Travelers
            </label>
            <input
              type="number"
              value={travelerCount}
              onChange={(e) => setTravelerCount(parseInt(e.target.value))}
              min="2"
              max="10"
              className="input"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <User size={16} className="text-primary-500" />
              Your Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg"
          >
            {isLoading ? (
              'Creating...'
            ) : (
              <>
                Create Trip <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
