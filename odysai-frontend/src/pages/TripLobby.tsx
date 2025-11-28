import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { Trip, ActivitySlot } from '../types';

export default function TripLobby() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ slot: ActivitySlot; day: number } | null>(null);
  const [replaceReason, setReplaceReason] = useState('weather');
  const [alternatives, setAlternatives] = useState<ActivitySlot[]>([]);

  useEffect(() => {
    // In real app, fetch trip data
    // For now, we'll use mock data from localStorage
    const roomId = localStorage.getItem('roomId');
    if (roomId) {
      loadTripData(roomId);
    }
  }, [tripId]);

  const loadTripData = async (roomId: string) => {
    const status = await api.getRoomStatus(roomId);
    if (status.trip) {
      setTrip(status.trip);
    }
  };

  const handleReplaceSpot = async (slot: ActivitySlot, day: number) => {
    setSelectedSlot({ slot, day });
    setShowReplaceModal(true);

    if (!tripId) return;

    const alts = await api.replaceSpot(tripId, slot.id, replaceReason, day);
    setAlternatives(alts);
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

  if (!trip) {
    return <div className="page"><div className="loading">여행 정보 로딩 중...</div></div>;
  }

  const currentDay = trip.plan.days.find(d => d.day === trip.currentDay);

  return (
    <div className="page">
      <h2>여행 진행 중 🎉</h2>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        {trip.plan.name} - Day {trip.currentDay}
      </p>

      <div className="alert alert-info">
        <strong>오늘의 일정</strong>
        <p>{currentDay?.date}</p>
      </div>

      {trip.plan.days.map(day => (
        <div key={day.day} className="day-plan">
          <h4>
            Day {day.day} - {day.date}
            {day.day === trip.currentDay && <span style={{ color: '#667eea' }}> (오늘)</span>}
          </h4>

          {day.slots.map(slot => (
            <div key={slot.id} className="activity-slot">
              <div className="activity-time">{slot.time} ({slot.duration}분)</div>
              <div className="activity-title">{slot.title}</div>
              <div className="activity-description">{slot.description}</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {slot.tags.map(tag => (
                  <span key={tag} className="status-badge status-pending" style={{ fontSize: '0.75rem' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleReplaceSpot(slot, day.day)}
                className="btn btn-secondary"
                style={{ marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
              >
                장소 변경
              </button>
            </div>
          ))}
        </div>
      ))}

      {showReplaceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h3>대체 장소 선택</h3>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              {selectedSlot?.slot.title}를 대체할 장소를 선택하세요
            </p>

            <div className="form-group">
              <label>변경 이유</label>
              <select value={replaceReason} onChange={(e) => setReplaceReason(e.target.value)}>
                <option value="weather">날씨</option>
                <option value="transport">교통</option>
                <option value="energy">체력</option>
                <option value="mood">분위기</option>
                <option value="other">기타</option>
              </select>
            </div>

            {alternatives.length > 0 ? (
              <div style={{ marginTop: '1rem' }}>
                <h4>AI 추천 대안</h4>
                {alternatives.map(alt => (
                  <div
                    key={alt.id}
                    className="activity-slot"
                    onClick={() => handleSelectAlternative(alt)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="activity-time">{alt.time} ({alt.duration}분)</div>
                    <div className="activity-title">{alt.title}</div>
                    <div className="activity-description">{alt.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="loading">대안을 생성하는 중...</div>
            )}

            <button
              onClick={() => {
                setShowReplaceModal(false);
                setAlternatives([]);
              }}
              className="btn btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
