import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ThumbsDown, DollarSign, AlertTriangle, Clock, Camera } from 'lucide-react';
import { api } from '../api';
import { Survey as SurveyType } from '../types';

export default function Survey() {
  const { roomId, memberId } = useParams<{ roomId: string; memberId: string }>();
  const navigate = useNavigate();

  const [emotions, setEmotions] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [constraints, setConstraints] = useState<string[]>([]);
  const [wakeUpTime, setWakeUpTime] = useState('08:00');
  const [instagramImportance, setInstagramImportance] = useState(3);
  const [travelPurpose, setTravelPurpose] = useState<string[]>([]);
  const [staminaLevel, setStaminaLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [maxTravelMinutes, setMaxTravelMinutes] = useState(40);
  const [mustHavesInput, setMustHavesInput] = useState('');

  const emotionOptions = ['Healing', 'Excitement', 'Adventure', 'Relaxation', 'Culture', 'Foodie'];
  const dislikeOptions = ['Crowds', 'Long Walks', 'Spicy Food', 'Loud Places', 'Early Mornings'];
  const constraintOptions = ['Low Stamina', 'Dietary Restrictions', 'Mobility Issues', 'Kids'];
  const purposeOptions = ['Family', 'Friends', 'Workation', 'Romantic', 'Wellness', 'Food Tour', 'Culture Dive'];

  const toggleOption = (option: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(option)) {
      setter(current.filter(o => o !== option));
    } else {
      setter([...current, option]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const survey: SurveyType = {
      emotions,
      dislikes,
      budgetLevel,
      constraints,
      wakeUpTime,
      instagramImportance,
      travelPurpose,
      staminaLevel,
      maxTravelMinutes,
      mustHaves: mustHavesInput.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (!memberId || !roomId) return;

    await api.submitSurvey(roomId, memberId, survey);
    navigate(`/room/${roomId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Travel Preferences</h2>
        <p className="text-slate-500">Tell us your style, and AI will plan the perfect trip!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card p-6 space-y-4">
          <label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Heart className="text-red-500" size={20} />
            Preferred Vibe
          </label>
          <div className="flex flex-wrap gap-2">
            {emotionOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option, emotions, setEmotions)}
                className={`px-4 py-2 rounded-full border transition-all ${emotions.includes(option)
                  ? 'bg-red-50 border-red-200 text-red-600 font-medium ring-2 ring-red-100'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-500'
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ThumbsDown className="text-slate-500" size={20} />
            Dislikes
          </label>
          <div className="flex flex-wrap gap-2">
            {dislikeOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option, dislikes, setDislikes)}
                className={`px-4 py-2 rounded-full border transition-all ${dislikes.includes(option)
                  ? 'bg-slate-100 border-slate-300 text-slate-700 font-medium ring-2 ring-slate-200'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <DollarSign className="text-green-600" size={20} />
            Budget Level
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'low', label: 'Budget', desc: 'Cost-effective' },
              { value: 'medium', label: 'Standard', desc: 'Balanced' },
              { value: 'high', label: 'Luxury', desc: 'Comfort first' },
            ].map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setBudgetLevel(level.value as any)}
                className={`p-4 rounded-xl border text-left transition-all ${budgetLevel === level.value
                  ? 'bg-green-50 border-green-200 ring-2 ring-green-100'
                  : 'bg-white border-slate-200 hover:border-green-200'
                  }`}
              >
                <div className={`font-semibold ${budgetLevel === level.value ? 'text-green-700' : 'text-slate-700'}`}>
                  {level.label}
                </div>
                <div className="text-xs text-slate-500 mt-1">{level.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={20} />
            Constraints
          </label>
          <div className="flex flex-wrap gap-2">
            {constraintOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option, constraints, setConstraints)}
                className={`px-4 py-2 rounded-full border transition-all ${constraints.includes(option)
                  ? 'bg-orange-50 border-orange-200 text-orange-600 font-medium ring-2 ring-orange-100'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-orange-200 hover:text-orange-500'
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="text-blue-500" size={20} />
            Wake Up Time
          </label>
          <input
            type="time"
            value={wakeUpTime}
            onChange={(e) => setWakeUpTime(e.target.value)}
            className="input text-center text-lg"
          />
        </div>

        <div className="card p-6 space-y-4">
          <label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            Trip Purpose
          </label>
          <div className="flex flex-wrap gap-2">
            {purposeOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option, travelPurpose, setTravelPurpose)}
                className={`px-4 py-2 rounded-full border transition-all ${travelPurpose.includes(option)
                  ? 'bg-purple-50 border-purple-200 text-purple-600 font-medium ring-2 ring-purple-100'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-purple-200 hover:text-purple-500'
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-lg font-semibold text-slate-800">Energy / Mobility Preference</label>
            <div className="flex gap-3">
              {['low', 'medium', 'high'].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setStaminaLevel(level as any)}
                  className={`px-4 py-2 rounded-xl border ${staminaLevel === level ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}
                >
                  {level === 'low' ? 'Take it slow' : level === 'medium' ? 'Balanced' : 'Active'}
                </button>
              ))}
            </div>
            <div>
              <label className="text-sm text-slate-600">Max travel time (minutes)</label>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={maxTravelMinutes}
                onChange={(e) => setMaxTravelMinutes(parseInt(e.target.value))}
                className="w-full accent-primary-500"
              />
              <div className="text-sm text-slate-500 mt-1">Prefer moves within {maxTravelMinutes} minutes</div>
            </div>
            <div>
              <label className="text-sm text-slate-600">Must-have (comma separated)</label>
              <input
                type="text"
                value={mustHavesInput}
                onChange={(e) => setMustHavesInput(e.target.value)}
                placeholder="e.g., spa, night view, local food"
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-6">
          <label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Camera className="text-pink-500" size={20} />
            Instagrammability
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="5"
              value={instagramImportance}
              onChange={(e) => setInstagramImportance(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <div className="flex justify-between text-sm text-slate-500">
              <span>Not important</span>
              <span className="font-medium text-pink-500">{instagramImportance}/5</span>
              <span>Very important</span>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full py-4 text-lg shadow-xl shadow-primary-500/20">
          Submit Preferences
        </button>
      </form>
    </motion.div>
  );
}
