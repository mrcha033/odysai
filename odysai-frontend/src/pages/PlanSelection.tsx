import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { PlanPackage } from '../types';

export default function PlanSelection() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PlanPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PlanPackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, [roomId]);

  const loadPlans = async () => {
    if (!roomId) return;
    try {
      const plans = await api.getPlans(roomId);
      setPackages(plans);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load plans:', error);
      setLoading(false);
    }
  };

  const handleSelectPackage = (pkg: PlanPackage) => {
    setSelectedPackage(pkg);
  };

  const handleStartTrip = async () => {
    if (!roomId || !selectedPackage) return;

    await api.startTrip(roomId, selectedPackage.id);
    navigate(`/room/${roomId}`);
  };

  const handleBackToLobby = () => {
    navigate(`/room/${roomId}`);
  };

  if (loading) {
    return <div className="page"><div className="loading">AI가 여행 계획을 생성하는 중...</div></div>;
  }

  return (
    <div className="page">
      <h2>AI 추천 여행 계획</h2>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        그룹의 선호도를 반영한 3가지 여행 스타일을 준비했어요!
      </p>

      <div className="plan-packages">
        {packages.map(pkg => (
          <div
            key={pkg.id}
            className={`plan-card ${selectedPackage?.id === pkg.id ? 'selected' : ''}`}
            onClick={() => handleSelectPackage(pkg)}
          >
            <h3>{pkg.name}</h3>
            <p>{pkg.description}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {pkg.themeEmphasis.map(theme => (
                <span key={theme} className="status-badge status-done">
                  {theme}
                </span>
              ))}
            </div>

            {pkg.days.map(day => (
              <div key={day.day} className="day-plan">
                <h4>Day {day.day} - {day.date}</h4>
                {day.slots.map(slot => (
                  <div key={slot.id} className="activity-slot">
                    <div className="activity-time">{slot.time} ({slot.duration}분)</div>
                    <div className="activity-title">{slot.title}</div>
                    <div className="activity-description">{slot.description}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {selectedPackage && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button onClick={handleBackToLobby} className="btn btn-secondary">
            로비로 돌아가기
          </button>
          <button onClick={handleStartTrip} className="btn btn-primary">
            이 계획으로 확정하기
          </button>
        </div>
      )}
    </div>
  );
}
