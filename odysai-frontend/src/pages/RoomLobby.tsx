import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { RoomStatus, Member } from '../types';

export default function RoomLobby() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<RoomStatus | null>(null);
  const [nickname, setNickname] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

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
    if (!currentMember) return;
    await api.setReady(currentMember.id, !currentMember.isReady);
    loadRoomStatus();
  };

  if (!status) {
    return <div className="page"><div className="loading">로딩 중...</div></div>;
  }

  const canGeneratePlans = status.members.every(m => m.surveyCompleted) && status.members.length > 0;
  const hasPlans = status.planPackages && status.planPackages.length > 0;

  return (
    <div className="page">
      <h2>{status.room.city} 여행</h2>
      <p>{status.room.dateRange.start} ~ {status.room.dateRange.end}</p>

      <div className="share-link">
        <strong>초대 링크:</strong> {window.location.href}
      </div>

      {!currentMember && !showJoinForm && (
        <button onClick={() => setShowJoinForm(true)} className="btn btn-primary">
          여행 참여하기
        </button>
      )}

      {showJoinForm && (
        <form onSubmit={handleJoin} style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label>닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 입력"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">참여하기</button>
        </form>
      )}

      <div className="member-list">
        <h3>참여자 ({status.members.length}명)</h3>
        {status.members.map(member => (
          <div key={member.id} className="member-item">
            <span className="member-name">
              {member.nickname}
              {member.id === currentMember?.id && ' (나)'}
            </span>
            <div>
              {member.surveyCompleted && (
                <span className="status-badge status-done">설문 완료</span>
              )}
              {member.isReady && (
                <span className="status-badge status-ready" style={{ marginLeft: '0.5rem' }}>
                  READY
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {currentMember && !currentMember.surveyCompleted && (
        <div className="alert alert-info">
          <p>여행 선호도 설문을 작성해주세요!</p>
          <button onClick={handleStartSurvey} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            설문 시작하기
          </button>
        </div>
      )}

      {currentMember && currentMember.surveyCompleted && !hasPlans && canGeneratePlans && (
        <div className="alert alert-success">
          <p>모두 설문을 완료했어요! AI가 여행 계획을 생성할 수 있어요.</p>
          <button onClick={handleGeneratePlans} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            AI 여행 계획 생성하기
          </button>
        </div>
      )}

      {hasPlans && (
        <div className="alert alert-success">
          <p>AI 여행 계획이 준비되었습니다!</p>
          <button onClick={handleViewPlans} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            계획 보기
          </button>
          {currentMember && (
            <button
              onClick={handleToggleReady}
              className="btn btn-secondary"
              style={{ marginTop: '1rem', marginLeft: '1rem' }}
            >
              {currentMember.isReady ? 'READY 취소' : 'READY 표시'}
            </button>
          )}
        </div>
      )}

      {status.allReady && hasPlans && (
        <div className="alert alert-success">
          <p>모두 준비 완료! 여행을 시작할 수 있습니다.</p>
        </div>
      )}
    </div>
  );
}
