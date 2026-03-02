import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'https://irac-backend.onrender.com/api';

// ==========================================
// 1. หน้าล็อกอิน และ สมัครสมาชิก (AuthScreen)
// ==========================================
function AuthScreen({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const endpoint = isLoginMode ? '/login' : '/register';
    const payload = isLoginMode ? { username, password } : { username, password, name };

    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error); // แจ้งเตือนถ้ารหัสผิด หรือ ชื่อซ้ำ
      } else if (isLoginMode) {
        onLogin(data.user); // ล็อกอินสำเร็จ เข้าสู่ระบบ
      } else {
        alert('สมัครสมาชิกสำเร็จ! กรุณาล็อกอินเพื่อเข้าใช้งาน');
        setIsLoginMode(true); // กลับไปหน้าล็อกอิน
      }
    })
    .catch(err => console.error(err));
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h2>🛡️ ระบบ IRAC</h2>
          <p>{isLoginMode ? 'เข้าสู่ระบบเพื่อจัดการศัตรูพืช' : 'สร้างบัญชีผู้ใช้งานใหม่'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLoginMode && (
            <input 
              type="text" 
              placeholder="ชื่อ-นามสกุล (แสดงในระบบ)" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          )}
          <input 
            type="text" 
            placeholder="ชื่อผู้ใช้ (Username)" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="รหัสผ่าน (Password)" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="btn-auth">
            {isLoginMode ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="auth-toggle">
          {isLoginMode ? 'ยังไม่มีบัญชีใช่ไหม? ' : 'มีบัญชีอยู่แล้ว? '}
          <span onClick={() => setIsLoginMode(!isLoginMode)}>
            {isLoginMode ? 'คลิกเพื่อสมัครสมาชิก' : 'คลิกเพื่อเข้าสู่ระบบ'}
          </span>
        </p>
      </div>
    </div>
  );
}

// ==========================================
// 2. หน้าแอปพลิเคชันหลัก (MainApp) - จะแสดงเมื่อล็อกอินผ่าน
// ==========================================
function MainApp({ user, onLogout }) {
  const [pests, setPests] = useState([]);
  const [moaGroups, setMoaGroups] = useState([]);
  const [activeIngredients, setActiveIngredients] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedPest, setSelectedPest] = useState(null);
  const [selectedMoa, setSelectedMoa] = useState(null);
  const [selectedAi, setSelectedAi] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [usageDate, setUsageDate] = useState(new Date().toISOString().split('T')[0]);
  const [locationNote, setLocationNote] = useState('');
  const [currentView, setCurrentView] = useState('form'); 
  const [historyLogs, setHistoryLogs] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/pests`).then(res => res.json()).then(data => setPests(data));
  }, []);

  const fetchHistory = () => {
    fetch(`${API_BASE_URL}/history?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => setHistoryLogs(data));
  };

  useEffect(() => {
    if (currentView === 'dashboard') fetchHistory();
  }, [currentView]);

  const handleSelectPest = (pest) => {
    setSelectedPest(pest);
    setSelectedMoa(null); setSelectedAi(null); setSelectedProduct(null);
    setMoaGroups([]); setActiveIngredients([]); setProducts([]);
    fetch(`${API_BASE_URL}/moa-groups?pest_id=${pest.pest_id}&user_id=${user.id}`)
      .then(res => res.json()).then(data => setMoaGroups(data));
  };

  const handleSelectMoa = (moa) => {
    if (moa.is_locked) return alert("ไม่อนุญาตให้ใช้กลุ่มยานี้ เนื่องจากใช้ซ้ำบ่อยเกินไป");
    setSelectedMoa(moa);
    setSelectedAi(null); setSelectedProduct(null);
    setActiveIngredients([]); setProducts([]);
    fetch(`${API_BASE_URL}/active-ingredients?pest_id=${selectedPest.pest_id}&g_id=${moa.g_id}`)
      .then(res => res.json()).then(data => setActiveIngredients(data));
  };

  const handleSelectAi = (ai) => {
    setSelectedAi(ai); setSelectedProduct(null);
    fetch(`${API_BASE_URL}/products?c_id=${ai.c_id}`)
      .then(res => res.json()).then(data => setProducts(data));
  };

  const handleSaveUsage = () => {
    const payload = {
      user_id: user.id, 
      pest_id: selectedPest.pest_id, g_id: selectedMoa.g_id,
      c_id: selectedAi.c_id, p_id: selectedProduct.p_id,
      usage_date: usageDate, location_note: locationNote
    };

    fetch(`${API_BASE_URL}/usage-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      alert('บันทึกข้อมูลประวัติการใช้ยาสำเร็จ!');
      setSelectedPest(null); setSelectedMoa(null); 
      setSelectedAi(null); setSelectedProduct(null);
      setLocationNote('');
    });
  };

  return (
    <div className="app-container">
      <div className="header-flex">
        <h1>ระบบจัดการศัตรูพืช</h1>
        <div className="user-profile">
          <span>สวัสดี, <strong>{user.name}</strong></span>
          <button onClick={onLogout} className="btn-logout">ออกจากระบบ</button>
        </div>
      </div>

      <div className="nav-menu">
        <button className={currentView === 'form' ? 'nav-active' : 'nav-btn'} onClick={() => setCurrentView('form')}>📝 บันทึกการใช้ยา</button>
        <button className={currentView === 'dashboard' ? 'nav-active' : 'nav-btn'} onClick={() => setCurrentView('dashboard')}>📊 ประวัติของฉัน</button>
      </div>

      {currentView === 'form' && (
        <>
          <div className="section">
            <h2>1. เลือกแมลงเป้าหมาย</h2>
            <div className="button-group">
              {pests.map((pest) => (
                <button key={pest.pest_id} onClick={() => handleSelectPest(pest)} className={selectedPest?.pest_id === pest.pest_id ? 'active' : ''}>🐛 {pest.pest_name}</button>
              ))}
            </div>
          </div>

          {selectedPest && (
            <div className="section">
              <h2>2. เลือกกลุ่มยา (MoA) สำหรับกำจัด {selectedPest.pest_name}</h2>
              <div className="button-group">
                {moaGroups.length === 0 ? <p>ไม่มีข้อมูลกลุ่มยา</p> : moaGroups.map((moa) => (
                  <button key={moa.g_id} onClick={() => handleSelectMoa(moa)} className={`${selectedMoa?.g_id === moa.g_id ? 'active' : ''} ${moa.is_locked ? 'locked' : ''}`} disabled={moa.is_locked === 1}>
                    กลุ่ม {moa.g_id}: {moa.g_name} {moa.is_locked === 1 ? ' 🔒 (เพิ่งใช้งาน)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedMoa && (
            <div className="section">
              <h2>3. เลือกสารสามัญในกลุ่ม {selectedMoa.g_id}</h2>
              <div className="button-group list-group">
                {activeIngredients.map((ai) => (
                  <div key={ai.c_id} className={`card ${selectedAi?.c_id === ai.c_id ? 'active' : ''}`} onClick={() => handleSelectAi(ai)}>
                    <h3>{ai.c_name}</h3><p>💡 {ai.recommended_note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedAi && (
            <div className="section">
              <h2>4. เลือกยี่ห้อสินค้า</h2>
              <div className="button-group">
                {products.map((product) => (
                  <button key={product.p_id} onClick={() => setSelectedProduct(product)} className={selectedProduct?.p_id === product.p_id ? 'active' : ''}>📦 {product.p_name}</button>
                ))}
              </div>
              
              {selectedProduct && (
                <div className="save-box">
                  <h3>พร้อมบันทึกประวัติ</h3>
                  <p>กำลังจะใช้ <strong>{selectedProduct.p_name}</strong> เพื่อกำจัด <strong>{selectedPest.pest_name}</strong></p>
                  <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="date" value={usageDate} onChange={(e) => setUsageDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    <input type="text" placeholder="แปลงที่ฉีดพ่น" value={locationNote} onChange={(e) => setLocationNote(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  </div>
                  <button className="btn-save" onClick={handleSaveUsage}>💾 ยืนยันการบันทึก</button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {currentView === 'dashboard' && (
        <div className="section dashboard-section">
          <h2>📊 ประวัติการฉีดพ่นของ {user.name}</h2>
          {historyLogs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280' }}>คุณยังไม่มีประวัติการบันทึกข้อมูล</p>
          ) : (
            <div className="table-responsive">
              <table className="history-table">
                <thead><tr><th>วันที่</th><th>สถานที่</th><th>เป้าหมาย</th><th>ยี่ห้อ (สารสามัญ)</th><th>กลุ่ม MoA</th></tr></thead>
                <tbody>
                  {historyLogs.map((log) => (
                    <tr key={log.log_id}>
                      <td>{new Date(log.usage_date).toLocaleDateString('th-TH')}</td>
                      <td>{log.location_note || '-'}</td>
                      <td>🐛 {log.pest_name}</td>
                      <td><strong>{log.product_name}</strong> <br/><span style={{fontSize: '0.85em', color: '#666'}}>({log.ai_name})</span></td>
                      <td><span className="moa-badge">กลุ่ม {log.g_id}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. Component หลัก (คอยสลับหน้า ล็อกอิน <-> แอปหลัก)
// ==========================================
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return currentUser 
    ? <MainApp user={currentUser} onLogout={() => setCurrentUser(null)} /> 
    : <AuthScreen onLogin={setCurrentUser} />;
}