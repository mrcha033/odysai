import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Share2, Home, Star, Award, Heart } from 'lucide-react';
import { api } from '../api';
import { Trip } from '../types';

export default function TripReport() {
    const { tripId } = useParams<{ tripId: string }>();
    const navigate = useNavigate();
    const [trip, setTrip] = useState<Trip | null>(null);

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
                <p className="text-slate-500 text-lg">Here's a summary of your amazing journey</p>
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
                                <p className="text-lg font-bold text-slate-800">Seoul, South Korea</p>
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
                    { label: 'Memories Made', value: '∞', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { label: 'Rating', value: '4.9', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
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
