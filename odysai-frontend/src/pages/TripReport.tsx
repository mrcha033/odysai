import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Share2, Home, Star, Award, Heart, Image as ImageIcon } from 'lucide-react';
import { api } from '../api';
import type { Trip, TripReport } from '../types';

export default function TripReport() {
    const { tripId } = useParams<{ tripId: string }>();
    const navigate = useNavigate();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [report, setReport] = useState<TripReport | null>(null);
    const [heroImage, setHeroImage] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    useEffect(() => {
        const roomId = localStorage.getItem('roomId');
        if (roomId) {
            loadTripData(roomId);
        }
    }, [tripId]);

    const loadTripData = async (roomId: string) => {
        try {
            const status = await api.getRoomStatus(roomId);
            if (status.trip) {
                setTrip(status.trip);
                if (status.trip.report) {
                    setReport(status.trip.report);
                    if (status.trip.report.heroImageData) {
                        setHeroImage(status.trip.report.heroImageData);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load trip data:', error);
        }
    };

    if (!trip) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <p className="text-lg font-medium text-slate-600">Generating your report...</p>
            </div>
        );
    }

    const handleGenerateImage = async () => {
        if (!trip) return;
        setIsGeneratingImage(true);
        try {
            const res = await api.generateReportImage(trip.id);
            if (res?.imageData) {
                setHeroImage(res.imageData);
            }
        } catch (error) {
            console.error('Failed to generate image:', error);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const cards = report?.cards || [];
    const highlights = report?.highlights || [];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 pb-12"
        >
            {/* Header Section */}
            <div className="text-center space-y-4 py-8">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-orange-200"
                >
                    <Award size={48} className="text-white" />
                </motion.div>
                <h2 className="text-4xl font-bold text-slate-800">Trip Completed! 🏆</h2>
                <p className="text-slate-500 text-lg">{report?.summary || "Here's a summary of your amazing journey"}</p>
            </div>

            {/* Hero Image */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {heroImage ? (
                    <img src={heroImage} alt="Trip hero" className="w-full max-h-[420px] object-cover" />
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                        <ImageIcon size={32} className="mb-3" />
                        <p className="mb-3">No hero image yet. Generate one?</p>
                        <button
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImage}
                            className="btn btn-primary flex items-center gap-2 disabled:opacity-60"
                        >
                            {isGeneratingImage ? 'Generating...' : 'Generate Hero Image'}
                        </button>
                    </div>
                )}
            </div>

            {/* Trip Summary Card */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-32 -mt-32 opacity-50" />

                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-slate-800 mb-6">{trip.plan.name}</h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Destination</p>
                                <p className="text-lg font-bold text-slate-800">{trip.plan.days[0]?.slots[0]?.location || 'Trip'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Duration</p>
                                <p className="text-lg font-bold text-slate-800">{trip.plan.days.length} Days</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Highlights / Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    { label: 'Places Visited', value: trip.plan.days.reduce((acc, day) => acc + day.slots.length, 0), icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Highlights', value: highlights.length || '—', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Cards', value: cards.length || '—', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-2"
                    >
                        <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-full flex items-center justify-center mb-2`}>
                            <stat.icon size={20} />
                        </div>
                        <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Report Highlights */}
            {highlights.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-2"
                >
                    <h4 className="text-lg font-bold text-slate-800">Highlights</h4>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                        {highlights.map((h, idx) => <li key={idx}>{h}</li>)}
                    </ul>
                </motion.div>
            )}

            {/* Story Cards */}
            {cards.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                    {cards.map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h5 className="text-lg font-semibold text-slate-800">{card.title}</h5>
                                {card.day && <span className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded-full border border-primary-100">Day {card.day}</span>}
                            </div>
                            <p className="text-slate-600 text-sm mb-2 leading-relaxed">{card.body}</p>
                            <div className="flex flex-wrap gap-2">
                                {(card.tags || []).map(tag => (
                                    <span key={tag} className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full border border-slate-200">#{tag}</span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Action Buttons */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
            >
                <button
                    onClick={() => navigate('/')}
                    className="btn btn-secondary flex items-center justify-center gap-2"
                >
                    <Home size={20} />
                    Back to Home
                </button>
                <button className="btn btn-primary flex items-center justify-center gap-2">
                    <Share2 size={20} />
                    Share Report
                </button>
            </motion.div>
        </motion.div>
    );
}
