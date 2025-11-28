import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelerCount, setTravelerCount] = useState(4);
  const [nickname, setNickname] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
  };

  return (
    <div className="page">
      <h2>새 여행 계획 만들기</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>여행지</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="예: 제주도, 부산"
            required
          />
        </div>

        <div className="form-group">
          <label>시작 날짜</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>종료 날짜</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>여행 인원</label>
          <input
            type="number"
            value={travelerCount}
            onChange={(e) => setTravelerCount(parseInt(e.target.value))}
            min="2"
            max="10"
            required
          />
        </div>

        <div className="form-group">
          <label>내 닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="그룹에서 사용할 닉네임"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          여행 만들기
        </button>
      </form>
    </div>
  );
}
