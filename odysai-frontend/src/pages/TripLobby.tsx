import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RefreshCw, X, AlertCircle, Calendar, ArrowRight, Map, CheckCircle2, Circle, Upload } from 'lucide-react';
import { api } from '../api';
import { Trip, ActivitySlot } from '../types';

export default function TripLobby() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ slot: ActivitySlot; day: number } | null>(null);
  const [replaceReason, setReplaceReason] = useState('weather');
  const [alternatives, setAlternatives] = useState<ActivitySlot[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);
  const [dragging, setDragging] = useState<{ fromDay: number; fromIndex: number } | null>(null);
  const [dayEmotionsInput, setDayEmotionsInput] = useState('');
  const [photoUrlsInput, setPhotoUrlsInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [photoAddInput, setPhotoAddInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [completedSlots, setCompletedSlots] = useState<string[]>([]);
  const [now, setNow] = useState(new Date());
  const [city, setCity] = useState('');

  useEffect(() => {
    const storedRoomId = localStorage.getItem('roomId');
    if (storedRoomId) {
      loadTripDataByRoom(storedRoomId);
    } else if (tripId) {
      loadTripDataByTrip(tripId);
    }

    // Update time every minute
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [tripId]);

  useEffect(() => {
    if (trip?.id) {
      const stored = localStorage.getItem(`trip_progress_${trip.id}`);
      if (stored) {
        setCompletedSlots(JSON.parse(stored));
      }
    }
  }, [trip?.id]);

  const loadTripDataByRoom = async (roomId: string) => {
    try {
      const status = await api.getRoomStatus(roomId);
      if (status.room) {
        setCity(status.room.city);
      }
      if (status.trip) {
        setTrip(status.trip);
        if (status.trip.photos) setPhotos(status.trip.photos);
        localStorage.setItem('roomId', status.trip.roomId);
      }
    } catch (error) {
      console.error('Failed to load trip by room:', error);
    }
  };

  const loadTripDataByTrip = async (tripIdParam: string) => {
    try {
      const tripData = await api.getTrip(tripIdParam);
      if (tripData) {
        setTrip(tripData);
        if (tripData.photos) setPhotos(tripData.photos);
        localStorage.setItem('roomId', tripData.roomId);
        // If tripData doesn't contain room city, we might need another call, 
        // but for now we'll assume the title is descriptive enough or 
        // try to fetch room if roomId exists.
        if (tripData.roomId) {
          const status = await api.getRoomStatus(tripData.roomId);
          if (status.room) setCity(status.room.city);
        }
      }
    } catch (error) {
      console.error('Failed to load trip by id:', error);
    }
  };

  const handleReplaceSpot = async (slot: ActivitySlot, day: number) => {
    setSelectedSlot({ slot, day });
    setShowReplaceModal(true);
    setIsLoadingAlternatives(true);
    setAlternatives([]);

    if (!tripId) return;

    try {
      const alts = await api.replaceSpot(tripId, slot.id, replaceReason, day);
      setAlternatives(alts);
    } catch (error) {
      console.error('Failed to get alternatives:', error);
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  const handleSelectAlternative = (alt: ActivitySlot) => {
    if (!trip || !selectedSlot) return;

    const updatedTrip = { ...trip };
    const dayPlan = updatedTrip.plan.days.find(d => d.day === selectedSlot.day);

    if (dayPlan) {
      const slotIndex = dayPlan.slots.findIndex(s => s.id === selectedSlot.slot.id);
      if (slotIndex !== -1) {
        dayPlan.slots[slotIndex] = alt;
      }
    }

    setTrip(updatedTrip);
    setShowReplaceModal(false);
    setAlternatives([]);
  };

  const persistPlan = async (updatedTrip: Trip) => {
    if (!trip) return;
    await api.updatePlan(trip.roomId, trip.plan.id, { days: updatedTrip.plan.days });
    setTrip(updatedTrip);
  };

  const handleDragStart = (day: number, index: number) => {
    setDragging({ fromDay: day, fromIndex: index });
  };

  const handleDrop = (targetDay: number, targetIndex: number) => {
    if (!trip || !dragging) return;
    const updated = { ...trip, plan: { ...trip.plan, days: trip.plan.days.map(d => ({ ...d, slots: [...d.slots] })) } };

    const fromDayPlan = updated.plan.days.find(d => d.day === dragging.fromDay);
    const toDayPlan = updated.plan.days.find(d => d.day === targetDay);
    if (!fromDayPlan || !toDayPlan) return;

    const [moved] = fromDayPlan.slots.splice(dragging.fromIndex, 1);
    toDayPlan.slots.splice(targetIndex, 0, moved);

    setDragging(null);
    persistPlan(updated);
  };

  const parseList = (input: string) =>
    input
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

  const handleAddPhoto = async () => {
    if (!trip || !photoAddInput.trim()) return;
    try {
      const res = await api.addTripPhoto(trip.id, photoAddInput.trim());
      setPhotos(res.photos || []);
      setPhotoAddInput('');
    } catch (error) {
      console.error('Failed to add photo:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !trip) return;
    setIsUploading(true);

    try {
      const file = e.target.files[0];
      const { url } = await api.uploadFile(file);
      const res = await api.addTripPhoto(trip.id, url);
      setPhotos(res.photos || []);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSlotCompletion = (slotId: string) => {
    if (!trip?.id) return;
    const newCompleted = completedSlots.includes(slotId)
      ? completedSlots.filter(id => id !== slotId)
      : [...completedSlots, slotId];

    setCompletedSlots(newCompleted);
    localStorage.setItem(`trip_progress_${trip.id}`, JSON.stringify(newCompleted));
  };

  const getSlotTimeStatus = (day: number, timeStr: string, durationMin: number) => {
    if (!trip) return 'future';

    // Very simple logic: assume day 1 is today for demo purposes if dates aren't parsed
    // Or strictly rely on trip.currentDay
    if (day < trip.currentDay) return 'past';
    if (day > trip.currentDay) return 'future';

    // Parse time "10:00"
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotStart = new Date(now);
    slotStart.setHours(hours, minutes, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotStart.getMinutes() + durationMin);

    if (now >= slotEnd) return 'past';
    if (now >= slotStart && now < slotEnd) return 'current';
    return 'future';
  };

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-lg font-medium text-slate-600">Loading your journey...</p>
      </div>
    );
  }

  const currentDay = trip.plan.days.find(d => d.day === trip.currentDay);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">Trip in Progress 🎉</h2>
        <p className="text-slate-500 font-medium">{trip.plan.name}</p>
      </div>

      {currentDay && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg shadow-primary-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-primary-100 text-sm font-medium mb-1">Current Status</div>
              <h3 className="text-2xl font-bold flex items-center gap-2">
                Day {trip.currentDay} <span className="text-primary-200 text-lg font-normal">• {currentDay.date}</span>
              </h3>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Calendar size={24} />
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-8">
        {trip.plan.days.map((day, dayIndex) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dayIndex * 0.1 }}
            className={`relative pl-8 border-l-2 ${day.day === trip.currentDay ? 'border-primary-500' : 'border-slate-200'}`}
          >
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${day.day === trip.currentDay ? 'bg-primary-500 border-primary-100' : 'bg-white border-slate-300'
              }`} />

            <h4 className={`text-lg font-bold mb-4 ${day.day === trip.currentDay ? 'text-primary-700' : 'text-slate-700'}`}>
              Day {day.day} <span className="text-slate-400 font-normal text-sm ml-2">{day.date}</span>
            </h4>

            <div className="space-y-4">
              {day.slots.map((slot, slotIndex) => {
                const isCompleted = completedSlots.includes(slot.id);
                const timeStatus = getSlotTimeStatus(day.day, slot.time, slot.duration);
                const isCurrent = timeStatus === 'current' && !isCompleted;

                return (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: dayIndex * 0.1 + slotIndex * 0.05 }}
                    className={`card p-4 transition-all group ${dragging ? 'opacity-90 border-dashed border-slate-200' : ''} 
                      ${isCurrent ? 'ring-2 ring-primary-400 shadow-lg shadow-primary-100 scale-[1.02]' : 'hover:shadow-md'}
                      ${isCompleted ? 'opacity-60 bg-slate-50' : 'bg-white'}
                    `}
                    draggable
                    onDragStart={() => handleDragStart(day.day, slotIndex)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleDrop(day.day, slotIndex); }}
                  >
                    {isCurrent && (
                      <div className="absolute -top-3 left-4 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                        Happening Now
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      {/* Interactive Time Column */}
                      <div className="flex flex-col items-center gap-2">
                        <div className={`min-w-[80px] text-sm font-medium flex flex-col items-center p-2 rounded-lg ${isCurrent ? 'bg-primary-50 text-primary-700' : 'bg-slate-50 text-slate-500'}`}>
                          <Clock size={16} className={`mb-1 ${isCurrent ? 'text-primary-500' : 'text-slate-400'}`} />
                          {slot.time}
                          <span className={`text-xs ${isCurrent ? 'text-primary-400' : 'text-slate-400'}`}>{slot.duration}m</span>
                        </div>

                        <button
                          onClick={() => toggleSlotCompletion(slot.id)}
                          className={`p-1 rounded-full transition-colors ${isCompleted ? 'text-green-500 hover:text-green-600' : 'text-slate-300 hover:text-primary-500'}`}
                        >
                          {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h5 className={`font-bold text-lg ${isCompleted ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
                            {slot.title}
                          </h5>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(slot.title + ' ' + city)}`, '_blank')}
                              className="text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-blue-50"
                              title="Get Directions"
                            >
                              <Map size={18} />
                            </button>
                            <button
                              onClick={() => handleReplaceSpot(slot, day.day)}
                              className="text-slate-400 hover:text-primary-600 transition-colors p-2 rounded-full hover:bg-primary-50"
                              title="Find alternative"
                            >
                              <RefreshCw size={18} />
                            </button>
                          </div>
                        </div>

                        <p className="text-slate-600 text-sm leading-relaxed">{slot.description}</p>

                        <div className="flex flex-wrap gap-2">
                          {slot.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium border border-slate-200">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center pt-8 pb-12">
        <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Add trip photos</label>

            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={photoAddInput}
                onChange={(e) => setPhotoAddInput(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="input flex-1"
              />
              <button
                onClick={handleAddPhoto}
                className="btn btn-secondary whitespace-nowrap"
                disabled={isUploading}
              >
                Add URL
              </button>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-xs text-slate-400 font-medium">OR</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <div className="btn btn-secondary w-full flex items-center justify-center gap-2 border-dashed border-2 bg-slate-50 hover:bg-slate-100 text-slate-500">
                {isUploading ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <Upload size={20} />
                )}
                {isUploading ? 'Uploading...' : 'Upload Photo from Device'}
              </div>
            </div>

            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2 pb-4">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative flex-shrink-0 group">
                    <img src={p} alt="trip" className="w-20 h-20 object-cover rounded-lg border border-slate-200 shadow-sm" />
                    <div className="absolute inset-0 bg-black/10 rounded-lg group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <h4 className="text-lg font-semibold text-slate-800">Trip wrap-up</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-700">Day emotions (comma separated)</label>
              <input
                type="text"
                value={dayEmotionsInput}
                onChange={(e) => setDayEmotionsInput(e.target.value)}
                placeholder="e.g., excited, tired but happy, relaxed"
                className="input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Photo URLs (optional)</label>
              <input
                type="text"
                value={photoUrlsInput}
                onChange={(e) => setPhotoUrlsInput(e.target.value)}
                placeholder="Comma separated URLs"
                className="input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Feedback / story notes</label>
            <textarea
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="What stood out? Any learnings?"
              className="input min-h-[80px]"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={async () => {
                if (!trip) return;
                if (window.confirm('Complete the trip and generate the report?')) {
                  await api.completeTrip(trip.id, {
                    dayEmotions: parseList(dayEmotionsInput),
                    photos: [...photos, ...parseList(photoUrlsInput)], // Use the actual photos array state
                    feedback: feedbackInput,
                  });
                  window.location.href = `/trip/${trip.id}/report`;
                }
              }}
              className="btn btn-primary px-8 py-3 text-lg shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transform hover:-translate-y-1 transition-all"
            >
              Complete Trip 🎉
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showReplaceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Find Alternative</h3>
                  <p className="text-sm text-slate-500">Replace {selectedSlot?.slot.title}</p>
                </div>
                <button
                  onClick={() => setShowReplaceModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Reason for change</label>
                  <select
                    value={replaceReason}
                    onChange={(e) => setReplaceReason(e.target.value)}
                    className="input"
                  >
                    <option value="weather">Weather issues</option>
                    <option value="transport">Transportation issues</option>
                    <option value="energy">Too tired / Low energy</option>
                    <option value="mood">Change of mood</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    <AlertCircle size={18} className="text-primary-500" />
                    AI Suggestions
                  </h4>

                  {isLoadingAlternatives ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3 text-slate-400">
                      <RefreshCw className="animate-spin" size={24} />
                      <p className="text-sm">Finding best alternatives...</p>
                    </div>
                  ) : alternatives.length > 0 ? (
                    <div className="grid gap-4">
                      {alternatives.map(alt => (
                        <div
                          key={alt.id}
                          onClick={() => handleSelectAlternative(alt)}
                          className="p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition-all group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-slate-800 group-hover:text-primary-700">{alt.title}</h5>
                            <span className="text-xs font-medium bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-500">
                              {alt.duration} min
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{alt.description}</p>
                          <div className="flex items-center text-primary-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Select this option <ArrowRight size={16} className="ml-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p>Select a reason to see alternatives</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
