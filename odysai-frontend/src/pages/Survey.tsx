import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [nightlife, setNightlife] = useState(false);
  const [instagramImportance, setInstagramImportance] = useState(3);

  const emotionOptions = ['힐링', '설렘', '모험', '휴식', '문화', '맛집'];
  const dislikeOptions = ['인파', '긴 걷기', '매운 음식', '시끄러운 곳', '일찍 일어나기'];
  const constraintOptions = ['체력 제한', '식이 제한', '이동 불편', '어린이 동반'];

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
      nightlife,
      instagramImportance,
    };

    if (!memberId) return;

    await api.submitSurvey(memberId, survey);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="page">
      <h2>여행 선호도 설문</h2>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        여러분의 여행 스타일을 알려주세요. AI가 최적의 일정을 만들어드려요!
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>원하는 여행 감성 (복수 선택 가능)</label>
          <div className="survey-options">
            {emotionOptions.map(option => (
              <div
                key={option}
                className={`option-chip ${emotions.includes(option) ? 'selected' : ''}`}
                onClick={() => toggleOption(option, emotions, setEmotions)}
              >
                {option}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>피하고 싶은 것 (복수 선택 가능)</label>
          <div className="survey-options">
            {dislikeOptions.map(option => (
              <div
                key={option}
                className={`option-chip ${dislikes.includes(option) ? 'selected' : ''}`}
                onClick={() => toggleOption(option, dislikes, setDislikes)}
              >
                {option}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>예산 수준</label>
          <select value={budgetLevel} onChange={(e) => setBudgetLevel(e.target.value as any)}>
            <option value="low">저예산 (가성비 중심)</option>
            <option value="medium">중간 (밸런스)</option>
            <option value="high">고예산 (편안함 중심)</option>
          </select>
        </div>

        <div className="form-group">
          <label>제약사항 (복수 선택 가능)</label>
          <div className="survey-options">
            {constraintOptions.map(option => (
              <div
                key={option}
                className={`option-chip ${constraints.includes(option) ? 'selected' : ''}`}
                onClick={() => toggleOption(option, constraints, setConstraints)}
              >
                {option}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>선호 기상 시간</label>
          <input
            type="time"
            value={wakeUpTime}
            onChange={(e) => setWakeUpTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={nightlife}
              onChange={(e) => setNightlife(e.target.checked)}
            />
            나이트라이프 관심 있음
          </label>
        </div>

        <div className="form-group">
          <label>인스타그램/SNS 중요도 (1-5)</label>
          <input
            type="range"
            min="1"
            max="5"
            value={instagramImportance}
            onChange={(e) => setInstagramImportance(parseInt(e.target.value))}
          />
          <div style={{ textAlign: 'center', color: '#666' }}>{instagramImportance}</div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          설문 제출하기
        </button>
      </form>
    </div>
  );
}
