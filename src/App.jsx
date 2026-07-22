import React, { useState, useEffect } from 'react';
import { 
  Menu, User, PlusCircle, Info, Users, 
  CheckCircle2, XCircle, AlertTriangle, 
  Utensils, Cigarette, CigaretteOff, 
  ListOrdered, Layers, Clock, Calendar
} from 'lucide-react';

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('feed');

  const getTodayDateStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: '', 
    phone: '', 
    date: getTodayDateStr(),
    time: '19:30', 
    pax: 2, 
    smoking: false, 
    tableNo: 'V1',
    notes: ''
  });

  // Kalıcı Hafızadan (localStorage) Verileri Yükleme
  const [reservations, setReservations] = useState(() => {
    const saved = localStorage.getItem('maitre_reservations');
    return saved ? JSON.parse(saved) : [];
  });

  const generateTables = () => {
    const generated = [];
    for (let i = 1; i <= 20; i++) {
      generated.push({ id: `v${i}`, no: `V${i}`, area: 'salon', capacity: 4, status: 'empty', info: '' });
    }
    for (let i = 1; i <= 16; i++) {
      generated.push({ id: `t${i}`, no: `t${i}`, area: 'teras', capacity: 4, status: 'empty', info: '' });
    }
    return generated;
  };

  const [tables, setTables] = useState(() => {
    const saved = localStorage.getItem('maitre_tables');
    return saved ? JSON.parse(saved) : generateTables();
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Veriler değiştikçe telefon hafızasına otomatik kaydet
  useEffect(() => {
    localStorage.setItem('maitre_reservations', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('maitre_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const checkIsLate = (rezDateStr, rezTime, status) => {
    if (status !== 'pending') return false;
    const [hours, minutes] = rezTime.split(':').map(Number);
    const rezDate = new Date(rezDateStr);
    rezDate.setHours(hours, minutes, 0, 0);
    return currentTime > rezDate;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaxChange = (amount) => {
    setFormData(prev => ({ ...prev, pax: Math.max(1, Math.min(20, prev.pax + amount)) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    setIsSubmitting(true);
    
    setTimeout(() => {
      const newRez = { ...formData, id: Date.now(), status: 'pending' };
      setReservations(prev => [...prev, newRez].sort((a, b) => a.time.localeCompare(b.time)));
      
      setTables(prev => prev.map(t => {
        if (t.no === formData.tableNo) {
          return { ...t, status: 'reserved', info: `${formData.name} (${formData.time})` };
        }
        return t;
      }));

      setFormData({
        name: '', phone: '', date: getTodayDateStr(), time: '19:30', pax: 2, smoking: false, tableNo: 'V1', notes: ''
      });
      setIsSubmitting(false);
      setActiveTab('feed');
    }, 600);
  };

  const updateStatus = (id, newStatus, tableNo) => {
    setReservations(prev => prev.map(rez => rez.id === id ? { ...rez, status: newStatus } : rez));
    
    setTables(prev => prev.map(t => {
      if (t.no === tableNo) {
        if (newStatus === 'arrived') return { ...t, status: 'occupied' };
        if (newStatus === 'cancelled') return { ...t, status: 'empty', info: '' };
      }
      return t;
    }));
  };

  const renderTableCard = (table) => {
    let styleClass = "";
    let icon = null;

    if (table.status === 'empty') {
      styleClass = "bg-white border-[#D4AF37]/50 text-[#554240]";
    } else if (table.status === 'occupied') {
      styleClass = "bg-[#4A0404] border-[#4A0404] text-white shadow-md";
      icon = <Utensils size={14} className="text-[#D4AF37]" />;
    } else if (table.status === 'reserved') {
      styleClass = "bg-[#FDFAF0] border-[#D4AF37] border-dashed text-[#4A0404]";
      icon = <Clock size={14} className="text-[#D4AF37]" />;
    }

    return (
      <div key={table.id} className={`p-3 rounded-xl border-2 flex flex-col justify-between min-h-[100px] transition-all cursor-pointer hover:scale-[1.02] ${styleClass}`}>
        <div className="flex justify-between items-start">
          <span className="font-playfair font-bold text-[20px]">Masa {table.no}</span>
          <div className="flex items-center gap-1 opacity-80 text-[11px] font-hanken font-bold bg-black/10 px-1.5 py-0.5 rounded">
            <Users size={10}/> {table.capacity}
          </div>
        </div>
        
        <div className="mt-2 font-hanken font-semibold text-[13px] flex items-center gap-1.5">
          {icon} {table.info || "Müsait"}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#fcf9ef] text-[#1c1c16] font-hanken antialiased min-h-screen flex flex-col pt-[64px] pb-[80px] md:pb-0">
      <header className="fixed top-0 w-full z-50 border-b border-[#D4AF37]/20 bg-[#fcf9ef] shadow-sm flex items-center justify-between px-5 h-16">
        <button className="text-[#4A0404] p-2 -ml-2"><Menu size={24} /></button>
        <h1 className="font-playfair text-[24px] font-semibold text-[#4A0404] tracking-tight">Reservations</h1>
        <button className="h-8 w-8 rounded-full border border-[#D4AF37]/30 flex items-center justify-center bg-[#f1eee4] text-[#4A0404]"><User size={18} /></button>
      </header>

      <main className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col md:flex-row-reverse gap-6 p-5 md:p-8 items-start pt-4 md:pt-8">
        
        <aside className={`w-full md:w-[360px] md:sticky md:top-[88px] flex-shrink-0 bg-white border border-[#D4AF37]/30 rounded-xl p-6 shadow-sm ${activeTab === 'new' ? 'block' : 'hidden md:block'}`}>
          <h2 className="font-playfair text-[28px] font-semibold text-[#4A0404] mb-6 text-center">Yeni Ekle</h2>
          
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col relative group">
              <label className="font-hanken font-semibold text-[#554240] absolute -top-2.5 left-2 bg-white px-1 uppercase tracking-widest text-[10px]">Misafir Adı</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="h-12 bg-transparent border border-[#dcc0bd] focus:border-[#D4AF37] rounded-md px-3 mt-2 text-base w-full" placeholder="Ad Soyad" required />
            </div>

            <div className="flex flex-col relative group">
              <label className="font-hanken font-semibold text-[#554240] absolute -top-2.5 left-2 bg-white px-1 uppercase tracking-widest text-[10px]">Telefon</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="h-12 bg-transparent border border-[#dcc0bd] focus:border-[#D4AF37] rounded-md px-3 mt-2 text-base w-full" placeholder="+90 555 000 0000" />
            </div>

            <div className="flex flex-col relative group">
              <label className="font-hanken font-semibold text-[#554240] absolute -top-2.5 left-2 bg-white px-1 uppercase tracking-widest text-[10px]">Tarih</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="h-12 bg-transparent border border-[#dcc0bd] focus:border-[#D4AF37] rounded-md px-3 mt-2 text-base w-full text-[#4A0404] font-semibold" required />
            </div>

            <div className="flex gap-3 items-end">
              <div className="flex flex-col relative flex-1">
                <label className="font-hanken font-semibold text-[#554240] absolute -top-2.5 left-2 bg-white px-1 uppercase tracking-widest text-[10px]">Saat</label>
                <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="h-12 bg-transparent border border-[#dcc0bd] focus:border-[#D4AF37] rounded-md px-3 mt-2 text-base w-full" />
              </div>

              <div className="flex flex-col relative flex-1">
                <label className="font-hanken font-semibold text-[#554240] absolute -top-2.5 left-2 bg-white px-1 uppercase tracking-widest text-[10px]">Masa Ata</label>
                <select name="tableNo" value={formData.tableNo} onChange={handleInputChange} className="h-12 bg-white border border-[#dcc0bd] focus:border-[#D4AF37] rounded-md px-2 mt-2 text-base w-full font-bold text-[#4A0404]">
                  <optgroup label="Salon (V1-V20)">
                    {tables.filter(t => t.area === 'salon').map(t => <option key={t.id} value={t.no}>Masa {t.no}</option>)}
                  </optgroup>
                  <optgroup label="Teras (t1-t16)">
                    {tables.filter(t => t.area === 'teras').map(t => <option key={t.id} value={t.no}>Masa {t.no}</option>)}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="flex flex-col flex-1 items-start mt-1">
              <label className="font-hanken font-semibold text-[#554240] mb-1 uppercase tracking-widest text-[10px]">Kişi (Pax)</label>
              <div className="flex items-center justify-between border border-[#dcc0bd] rounded-md h-12 w-full bg-white">
                <button type="button" onClick={() => handlePaxChange(-1)} className="w-12 h-full flex items-center justify-center text-[#554240] text-xl font-bold pb-1">-</button>
                <span className="font-hanken text-lg text-[#4A0404] font-semibold">{formData.pax}</span>
                <button type="button" onClick={() => handlePaxChange(1)} className="w-12 h-full flex items-center justify-center text-[#554240] text-xl font-bold pb-1">+</button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-hanken font-semibold text-[#554240] uppercase tracking-widest text-[10px] mb-1">Tercih</label>
              <div className="flex bg-[#f6f4ea] rounded-md p-1 gap-1 border border-[#dcc0bd]">
                <button type="button" onClick={() => setFormData(p => ({...p, smoking: false}))} className={`flex-1 h-10 rounded flex items-center justify-center gap-2 font-semibold text-[13px] ${!formData.smoking ? 'bg-white shadow-sm border border-[#D4AF37]/50 text-[#4A0404]' : 'text-[#554240]'}`}><CigaretteOff size={16} /> İçilmeyen</button>
                <button type="button" onClick={() => setFormData(p => ({...p, smoking: true}))} className={`flex-1 h-10 rounded flex items-center justify-center gap-2 font-semibold text-[13px] ${formData.smoking ? 'bg-white shadow-sm border border-[#D4AF37]/50 text-[#4A0404]' : 'text-[#554240]'}`}><Cigarette size={16} /> İçilen</button>
              </div>
            </div>

            <div className="flex flex-col relative group mt-1">
              <label className="font-hanken font-semibold text-[#554240] absolute -top-2.5 left-2 bg-white px-1 uppercase tracking-widest text-[10px]">Notlar</label>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="min-h-[70px] bg-transparent border border-[#dcc0bd] focus:border-[#D4AF37] rounded-md px-3 py-3 mt-2 text-base w-full resize-none" placeholder="Özel istek..."></textarea>
            </div>

            <button type="submit" disabled={isSubmitting || !formData.name} className={`h-14 w-full text-white font-semibold text-lg rounded-md flex items-center justify-center gap-2 mt-2 shadow-md ${isSubmitting ? 'bg-[#D4AF37]' : 'bg-[#4A0404] hover:bg-[#210000]'}`}>
              {isSubmitting ? "Kaydediliyor..." : <><PlusCircle size={20} /> Oluştur</>}
            </button>
          </form>
        </aside>

        <section className={`flex-1 w-full flex flex-col ${activeTab === 'new' ? 'hidden md:flex' : 'flex'}`}>
          
          <div className="flex items-center justify-between mb-6 px-1 border-b border-[#D4AF37]/20 pb-4">
            <div className="flex bg-[#f1eee4] p-1 rounded-lg border border-[#dcc0bd]/50">
              <button onClick={() => setActiveTab('feed')} className={`px-4 py-1.5 rounded-md font-hanken font-semibold text-[14px] flex items-center gap-2 transition-all ${activeTab === 'feed' ? 'bg-white text-[#4A0404] shadow-sm' : 'text-[#89726f]'}`}><ListOrdered size={16} /> Liste</button>
              <button onClick={() => setActiveTab('salon')} className={`px-4 py-1.5 rounded-md font-hanken font-semibold text-[14px] flex items-center gap-2 transition-all ${activeTab === 'salon' ? 'bg-white text-[#4A0404] shadow-sm' : 'text-[#89726f]'}`}><Layers size={16} /> Kroki (Salon)</button>
            </div>

            <div className="hidden md:flex gap-2">
              <span className="px-4 py-1.5 rounded-full bg-[#FDFAF0] border border-[#D4AF37]/30 text-[#554240] font-hanken font-semibold text-[12px] flex items-center gap-2 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]"></span> {reservations.filter(r => r.status === 'pending').length} Bekleyen
              </span>
            </div>
          </div>

          {activeTab === 'feed' && (
            <div className="flex flex-col gap-4">
              {reservations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-[#89726f]">
                  <ListOrdered size={48} className="mb-4 opacity-30" />
                  <p className="font-hanken font-semibold text-lg">Şu an bekleyen kayıt yok.</p>
                </div>
              )}

              {reservations.map((rez) => {
                const late = checkIsLate(rez.date, rez.time, rez.status);
                
                if (rez.status === 'pending' && !late) {
                  return (
                    <article key={rez.id} className="bg-white border border-[#D4AF37]/30 rounded-xl border-l-4 border-l-[#D4AF37] p-5 flex flex-col gap-3 relative shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="font-playfair font-semibold text-[20px] text-[#4A0404]">{rez.name}</h3>
                            <span className="bg-[#4A0404] text-[#D4AF37] px-2 py-0.5 rounded text-xs font-bold">Masa {rez.tableNo}</span>
                          </div>
                          <span className="font-hanken text-[12px] text-[#89726f] flex items-center gap-1 mt-0.5"><Calendar size={12}/> {rez.date}</span>
                          {rez.notes && <span className="font-hanken text-[14px] text-[#554240] flex items-center gap-1.5 mt-1"><Info size={16} className="text-[#D4AF37]" /> {rez.notes}</span>}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="bg-[#FDFAF0] border border-[#D4AF37]/20 px-3 py-1 rounded font-hanken font-bold text-[14px] text-[#4A0404]">{rez.time}</div>
                          <div className="flex items-center gap-1 text-[#554240] font-hanken font-semibold text-[14px]"><Users size={16} /> {rez.pax}</div>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => updateStatus(rez.id, 'arrived', rez.tableNo)} className="flex-1 h-10 rounded-md border border-[#4A0404] text-[#4A0404] font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#4A0404] hover:text-white transition-all"><CheckCircle2 size={18} /> Geldi</button>
                        <button onClick={() => updateStatus(rez.id, 'cancelled', rez.tableNo)} className="flex-1 h-10 rounded-md border border-[#dcc0bd] text-[#554240] font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#f1eee4] transition-all"><XCircle size={18} /> İptal</button>
                      </div>
                    </article>
                  );
                }

                if (rez.status === 'pending' && late) {
                  return (
                    <article key={rez.id} className="bg-[#ffdad6]/20 border border-[#ba1a1a]/20 rounded-xl border-l-4 border-l-[#ba1a1a] p-5 flex flex-col gap-3 relative shadow-sm">
                      <div className="absolute top-0 right-0 bg-[#ba1a1a] text-white font-hanken font-semibold text-[11px] px-3 py-1 rounded-bl-md flex items-center gap-1"><AlertTriangle size={14} /> GEÇ KALDI</div>
                      <div className="flex justify-between items-start mt-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="font-playfair font-semibold text-[20px] text-[#ba1a1a]">{rez.name}</h3>
                            <span className="bg-[#ba1a1a] text-white px-2 py-0.5 rounded text-xs font-bold">Masa {rez.tableNo}</span>
                          </div>
                          <span className="font-hanken text-[12px] text-[#89726f] mt-0.5">{rez.date}</span>
                          {rez.notes && <span className="font-hanken text-[14px] text-[#554240] mt-1">{rez.notes}</span>}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="bg-[#ba1a1a]/10 text-[#ba1a1a] px-3 py-1 rounded font-bold text-[14px] line-through">{rez.time}</div>
                          <div className="flex items-center gap-1 text-[#554240] font-semibold text-[14px]"><Users size={16} /> {rez.pax}</div>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => updateStatus(rez.id, 'cancelled', rez.tableNo)} className="flex-1 h-10 rounded-md bg-white border border-[#ba1a1a] text-[#ba1a1a] font-semibold text-[14px] flex items-center justify-center">İptal Et</button>
                        <button onClick={() => updateStatus(rez.id, 'arrived', rez.tableNo)} className="flex-1 h-10 rounded-md bg-[#ba1a1a] text-white font-semibold text-[14px] flex items-center justify-center">Geç Geldi</button>
                      </div>
                    </article>
                  );
                }

                if (rez.status === 'arrived') {
                  return (
                    <article key={rez.id} className="bg-[#FDFAF0] border border-[#D4AF37]/40 rounded-xl border-l-4 border-l-[#4A0404] p-4 flex flex-col gap-2 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="font-playfair font-semibold text-[20px] text-[#4A0404]">{rez.name}</h3>
                            <span className="bg-[#4A0404] text-[#D4AF37] px-2 py-0.5 rounded text-xs font-bold">Masa {rez.tableNo}</span>
                          </div>
                          <div className="mt-2 inline-flex items-center gap-1.5 bg-[#4A0404]/10 text-[#4A0404] font-semibold text-[13px] px-3 py-1 rounded border border-[#4A0404]/25"><Utensils size={14} /> İçeride</div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 opacity-80">
                          <div className="font-bold text-[14px] text-[#4A0404]">{rez.time}</div>
                          <div className="flex items-center gap-1 text-[#554240] font-semibold text-[14px]"><Users size={16} /> {rez.pax}</div>
                        </div>
                      </div>
                    </article>
                  );
                }

                if (rez.status === 'cancelled') {
                  return (
                    <article key={rez.id} className="bg-white border border-[#dcc0bd]/50 rounded-xl border-l-4 border-l-[#dcc0bd] p-4 flex flex-col gap-2 opacity-60 grayscale">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <h3 className="font-playfair font-semibold text-[20px] text-[#554240] line-through">{rez.name} (Masa {rez.tableNo})</h3>
                          <span className="font-hanken text-[14px] text-[#554240] mt-1 italic">İptal edildi.</span>
                        </div>
                        <div className="font-bold text-[14px] text-[#554240] line-through">{rez.time}</div>
                      </div>
                    </article>
                  );
                }
                return null;
              })}
            </div>
          )}

          {activeTab === 'salon' && (
            <div>
              <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-xl border border-[#D4AF37]/30 shadow-sm">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-white border border-[#D4AF37]/50"></div><span className="text-[14px] font-semibold text-[#554240]">Boş</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-[#4A0404]"></div><span className="text-[14px] font-semibold text-[#554240]">Dolu</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-[#FDFAF0] border border-[#D4AF37] border-dashed"></div><span className="text-[14px] font-semibold text-[#554240]">Rezerve</span></div>
              </div>

              <div className="mb-8">
                <h3 className="font-playfair font-semibold text-[20px] text-[#4A0404] mb-4 border-b border-[#D4AF37]/20 pb-2">KAPALI SALON (V1 - V20)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {tables.filter(t => t.area === 'salon').map(table => renderTableCard(table))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-playfair font-semibold text-[20px] text-[#4A0404] mb-4 border-b border-[#D4AF37]/20 pb-2">TERAS (t1 - t16)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {tables.filter(t => t.area === 'teras').map(table => renderTableCard(table))}
                </div>
              </div>
            </div>
          )}

          <div className="h-28 md:hidden"></div>
        </section>
      </main>

      <nav className="fixed bottom-0 w-full z-50 rounded-t-xl border-t border-[#D4AF37]/30 bg-[#FDFAF0] flex justify-around items-center h-20 px-2 md:hidden">
        <button onClick={() => setActiveTab('feed')} className={`flex flex-col items-center justify-center px-5 py-2 rounded-full ${activeTab === 'feed' ? 'text-[#4A0404] bg-[#fed65b]/20' : 'text-[#89726f]'}`}><ListOrdered size={24} /><span className="font-hanken font-semibold text-[10px] uppercase tracking-widest mt-1">Liste</span></button>
        <button onClick={() => setActiveTab('new')} className={`flex flex-col items-center justify-center px-5 py-2 rounded-full ${activeTab === 'new' ? 'text-[#4A0404] bg-[#fed65b]/20' : 'text-[#89726f]'}`}><PlusCircle size={24} /><span className="font-hanken font-semibold text-[10px] uppercase tracking-widest mt-1">Ekle</span></button>
        <button onClick={() => setActiveTab('salon')} className={`flex flex-col items-center justify-center px-5 py-2 rounded-full ${activeTab === 'salon' ? 'text-[#4A0404] bg-[#fed65b]/20' : 'text-[#89726f]'}`}><Layers size={24} /><span className="font-hanken font-semibold text-[10px] uppercase tracking-widest mt-1">Salon</span></button>
      </nav>
    </div>
  );
}
