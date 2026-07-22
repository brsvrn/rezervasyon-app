import React, { useState, useEffect } from 'react';
import { 
  Menu, User, PlusCircle, Info, Users, 
  CheckCircle2, XCircle, AlertTriangle, 
  Utensils, Cigarette, CigaretteOff, 
  ListOrdered, Layers, Clock
} from 'lucide-react';

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Tabs: 'feed' (Liste), 'new' (Sadece mobil form), 'salon' (Kroki)
  const [activeTab, setActiveTab] = useState('feed');

  // Form States
  const [formData, setFormData] = useState({
    name: '', phone: '', time: '19:30', pax: 2, smoking: false, notes: ''
  });

  // Dummy Reservations Data
  const getInitialData = () => {
    const now = new Date();
    const future = new Date(now.getTime() + 60 * 60000);
    const past = new Date(now.getTime() - 30 * 60000);
    
    const formatTime = (d) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

    return [
      { id: 1, name: 'Ahmet Yılmaz', phone: '+90 555 111 2233', time: formatTime(future), pax: 4, smoking: false, notes: 'Pencere kenarı', status: 'pending' },
      { id: 2, name: 'Selin Demir', phone: '+90 555 222 3344', time: formatTime(past), pax: 2, smoking: true, notes: 'Ulaşılamıyor', status: 'pending' },
      { id: 3, name: 'Mehmet Can', phone: '+90 555 333 4455', time: '14:00', pax: 3, smoking: false, notes: '', status: 'arrived' },
    ];
  };

  const [reservations, setReservations] = useState(getInitialData());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dummy Tables Data for Salon View
  const [tables] = useState([
    { id: 1, no: '1', capacity: 2, status: 'occupied', info: 'Mehmet Can (14:00)' },
    { id: 2, no: '2', capacity: 2, status: 'empty', info: '' },
    { id: 3, no: '3', capacity: 4, status: 'reserved', info: 'Ahmet Y. (19:30)' },
    { id: 4, no: '4', capacity: 4, status: 'empty', info: '' },
    { id: 5, no: '12 (VIP)', capacity: 6, status: 'occupied', info: 'Ali Bey' },
    { id: 6, no: '14', capacity: 4, status: 'reserved', info: 'Selin D. (18:45)' },
    { id: 7, no: 'Bahçe 1', capacity: 2, status: 'empty', info: '' },
    { id: 8, no: 'Bahçe 2', capacity: 4, status: 'occupied', info: 'Walk-in' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const checkIsLate = (rezTime, status) => {
    if (status !== 'pending') return false;
    const [hours, minutes] = rezTime.split(':').map(Number);
    const rezDate = new Date(currentTime);
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
      setFormData({ name: '', phone: '', time: '19:30', pax: 2, smoking: false, notes: '' });
      setIsSubmitting(false);
      setActiveTab('feed');
    }, 600);
  };

  const updateStatus = (id, newStatus) => {
    setReservations(prev => prev.map(rez => rez.id === id ? { ...rez, status: newStatus } : rez));
  };

  return (
    <div className="bg-[#fcf9ef] text-[#1c1c16] font-hanken antialiased min-h-screen flex flex-col pt-[64px] pb-[80px] md:pb-0">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 border-b border-[#D4AF37]/20 bg-[#fcf9ef] shadow-sm shadow-[#4A0404]/5 flex items-center justify-between px-5 h-16">
        <button className="text-[#4A0404] hover:opacity-80 transition-opacity active:scale-95 duration-200 p-2 -ml-2">
          <Menu size={24} />
        </button>
        <h1 className="font-playfair text-[24px] font-semibold text-[#4A0404] tracking-tight">
          Reservations
        </h1>
        <button className="h-8 w-8 rounded-full border border-[#D4AF37]/30 overflow-hidden flex items-center justify-center bg-[#f1eee4] text-[#4A0404] hover:opacity-80 transition-opacity active:scale-95 duration-200">
          <User size={18} />
        </button>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col md:flex-row-reverse gap-6 p-5 md:p-8 items-start pt-4 md:pt-8">
        
        {/* SIDEBAR: New Entry Form */}
        <aside className={`w-full md:w-[360px] md:sticky md:top-[88px] flex-shrink-0 bg-white border border-[#D4AF37]/30 rounded-xl p-6 shadow-sm shadow-[#4A0404]/5 ${activeTab === 'new' ? 'block' : 'hidden md:block'}`}>
          <h2 className="font-playfair text-[28px] font-semibold text-[#4A0404] mb-6 text-center">Yeni Ekle</h2>
          
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col relative group">
              <label className="font-hanken font-semibold text-[#554240] absolute -top-2.5 left-2 bg-white px-1 uppercase tracking-widest text-[10px]">Misafir Adı</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="h-12 bg-transparent border border-[#dcc0bd] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-md px-3 mt-2 text-base w-full" placeholder="Ad Soyad" required />
            </div>

            <div className="flex flex-col relative group">
              <label className="font-hanken font-semibold text-[#554240] absolute -top-2.5 left-2 bg-white px-1 uppercase tracking-widest text-[10px]">Telefon</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="h-12 bg-transparent border border-[#dcc0bd] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-md px-3 mt-2 text-base w-full" placeholder="+90 555 000 0000" />
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex flex-col relative flex-1">
                <label className="font-hanken font-semibold text-[#554240] absolute -top-2.5 left-2 bg-white px-1 uppercase tracking-widest text-[10px]">Saat</label>
                <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="h-12 bg-transparent border border-[#dcc0bd] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-md px-3 mt-2 text-base w-full" />
              </div>
              <div className="flex flex-col flex-1 items-end">
                <label className="font-hanken font-semibold text-[#554240] mb-1 uppercase tracking-widest text-[10px]">Kişi (Pax)</label>
                <div className="flex items-center justify-between border border-[#dcc0bd] rounded-md h-12 w-full bg-white">
                  <button type="button" onClick={() => handlePaxChange(-1)} className="w-10 h-full flex items-center justify-center text-[#554240] text-xl font-bold pb-1">-</button>
                  <span className="font-hanken text-lg text-[#4A0404] font-semibold">{formData.pax}</span>
                  <button type="button" onClick={() => handlePaxChange(1)} className="w-10 h-full flex items-center justify-center text-[#554240] text-xl font-bold pb-1">+</button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-hanken font-semibold text-[#554240] uppercase tracking-widest text-[10px] mb-1">Tercih</label>
              <div className="flex bg-[#f6f4ea] rounded-md p-1 gap-1 border border-[#dcc0bd]">
                <button type="button" onClick={() => setFormData(p => ({...p, smoking: false}))} className={`flex-1 h-10 rounded flex items-center justify-center gap-2 font-semibold text-[13px] ${!formData.smoking ? 'bg-white shadow-sm border border-[#D4AF37]/50 text-[#4A0404]' : 'text-[#554240] border-transparent'}`}>
                  <CigaretteOff size={16} /> İçilmeyen
                </button>
                <button type="button" onClick={() => setFormData(p => ({...p, smoking: true}))} className={`flex-1 h-10 rounded flex items-center justify-center gap-2 font-semibold text-[13px] ${formData.smoking ? 'bg-white shadow-sm border border-[#D4AF37]/50 text-[#4A0404]' : 'text-[#554240] border-transparent'}`}>
                  <Cigarette size={16} /> İçilen
                </button>
              </div>
            </div>

            <div className="flex flex-col relative group mt-2">
              <label className="font-hanken font-semibold text-[#554240] absolute -top-2.5 left-2 bg-white px-1 uppercase tracking-widest text-[10px]">Notlar</label>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="min-h-[80px] bg-transparent border border-[#dcc0bd] focus:border-[#D4AF37] rounded-md px-3 py-3 mt-2 text-base w-full resize-none" placeholder="Özel istek..."></textarea>
            </div>

            <button type="submit" disabled={isSubmitting || !formData.name} className={`h-14 w-full text-white font-semibold text-lg rounded-md flex items-center justify-center gap-2 mt-2 shadow-md ${isSubmitting ? 'bg-[#D4AF37]' : 'bg-[#4A0404] hover:bg-[#210000]'}`}>
              {isSubmitting ? "Kaydediliyor..." : <><PlusCircle size={20} /> Oluştur</>}
            </button>
          </form>
        </aside>

        {/* MAIN AREA: Feed (List) OR Salon (Floor Plan) */}
        <section className={`flex-1 w-full flex flex-col ${activeTab === 'new' ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Desktop/Tablet Tab Switcher */}
          <div className="flex items-center justify-between mb-6 px-1 border-b border-[#D4AF37]/20 pb-4">
            <div className="flex bg-[#f1eee4] p-1 rounded-lg border border-[#dcc0bd]/50">
              <button onClick={() => setActiveTab('feed')} className={`px-4 py-1.5 rounded-md font-hanken font-semibold text-[14px] flex items-center gap-2 transition-all ${activeTab === 'feed' ? 'bg-white text-[#4A0404] shadow-sm' : 'text-[#89726f] hover:text-[#4A0404]'}`}>
                <ListOrdered size={16} /> Liste
              </button>
              <button onClick={() => setActiveTab('salon')} className={`px-4 py-1.5 rounded-md font-hanken font-semibold text-[14px] flex items-center gap-2 transition-all ${activeTab === 'salon' ? 'bg-white text-[#4A0404] shadow-sm' : 'text-[#89726f] hover:text-[#4A0404]'}`}>
                <Layers size={16} /> Kroki (Salon)
              </button>
            </div>

            <div className="hidden md:flex gap-2">
              <span className="px-4 py-1.5 rounded-full bg-[#FDFAF0] border border-[#D4AF37]/30 text-[#554240] font-hanken font-semibold text-[12px] flex items-center gap-2 shadow-sm tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]"></span> 
                {reservations.filter(r => r.status === 'pending').length} Bekleyen
              </span>
            </div>
          </div>

          {/* TAB CONTENT: FEED (LISTE) */}
          {activeTab === 'feed' && (
            <div className="flex flex-col gap-4">
              {reservations.length === 0 && <div className="text-center py-10 text-[#554240]">Henüz kayıt yok.</div>}

              {reservations.map((rez) => {
                const late = checkIsLate(rez.time, rez.status);
                
                if (rez.status === 'pending' && !late) {
                  return (
                    <article key={rez.id} className="bg-white border border-[#D4AF37]/30 rounded-xl border-l-4 border-l-[#D4AF37] p-5 flex flex-col gap-4 relative overflow-hidden transition-all shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <h3 className="font-playfair font-semibold text-[20px] text-[#4A0404] tracking-tight">{rez.name}</h3>
                          {rez.notes && <span className="font-hanken text-[14px] text-[#554240] flex items-center gap-1.5 mt-1"><Info size={16} className="text-[#D4AF37]" /> {rez.notes}</span>}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="bg-[#FDFAF0] border border-[#D4AF37]/20 px-3 py-1 rounded font-hanken font-bold text-[14px] text-[#4A0404]">{rez.time}</div>
                          <div className="flex items-center gap-1 text-[#554240] font-hanken font-semibold text-[14px]"><Users size={16} /> {rez.pax}</div>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => updateStatus(rez.id, 'arrived')} className="flex-1 h-10 rounded-md border border-[#4A0404] text-[#4A0404] font-hanken font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#4A0404] hover:text-white transition-all"><CheckCircle2 size={18} /> Geldi</button>
                        <button onClick={() => updateStatus(rez.id, 'cancelled')} className="flex-1 h-10 rounded-md border border-[#dcc0bd] text-[#554240] font-hanken font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#f1eee4] transition-all"><XCircle size={18} /> İptal</button>
                      </div>
                    </article>
                  );
                }

                if (rez.status === 'pending' && late) {
                  return (
                    <article key={rez.id} className="bg-[#ffdad6]/20 border border-[#ba1a1a]/20 rounded-xl border-l-4 border-l-[#ba1a1a] p-5 flex flex-col gap-4 relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 right-0 bg-[#ba1a1a] text-white font-hanken font-semibold text-[11px] px-3 py-1 rounded-bl-md flex items-center gap-1"><AlertTriangle size={14} /> GEÇ KALDI</div>
                      <div className="flex justify-between items-start mt-3">
                        <div className="flex flex-col">
                          <h3 className="font-playfair font-semibold text-[20px] text-[#ba1a1a]">{rez.name}</h3>
                          {rez.notes && <span className="font-hanken text-[14px] text-[#554240] mt-1">{rez.notes}</span>}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="bg-[#ba1a1a]/10 text-[#ba1a1a] px-3 py-1 rounded font-hanken font-bold text-[14px] line-through opacity-80">{rez.time}</div>
                          <div className="flex items-center gap-1 text-[#554240] font-hanken font-semibold text-[14px]"><Users size={16} /> {rez.pax}</div>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => updateStatus(rez.id, 'cancelled')} className="flex-1 h-10 rounded-md bg-white border border-[#ba1a1a] text-[#ba1a1a] font-hanken font-semibold text-[14px] flex items-center justify-center gap-2">İptal Et</button>
                        <button onClick={() => updateStatus(rez.id, 'arrived')} className="flex-1 h-10 rounded-md bg-[#ba1a1a] text-white font-hanken font-semibold text-[14px] flex items-center justify-center gap-2">Geç Geldi</button>
                      </div>
                    </article>
                  );
                }

                if (rez.status === 'arrived') {
                  return (
                    <article key={rez.id} className="bg-[#FDFAF0] border border-[#D4AF37]/40 rounded-xl border-l-4 border-l-[#4A0404] p-5 flex flex-col gap-2 relative overflow-hidden shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <h3 className="font-playfair font-semibold text-[20px] text-[#4A0404]">{rez.name}</h3>
                          <div className="mt-2 inline-flex items-center gap-1.5 bg-[#4A0404]/10 text-[#4A0404] font-hanken font-semibold text-[13px] px-3 py-1 rounded border border-[#4A0404]/20"><Utensils size={14} /> Durum: İçeride</div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 opacity-80">
                          <div className="font-hanken font-bold text-[14px] text-[#4A0404]">{rez.time}</div>
                          <div className="flex items-center gap-1 text-[#554240] font-hanken font-semibold text-[14px]"><Users size={16} /> {rez.pax}</div>
                        </div>
                      </div>
                    </article>
                  );
                }

                if (rez.status === 'cancelled') {
                  return (
                    <article key={rez.id} className="bg-white border border-[#dcc0bd]/50 rounded-xl border-l-4 border-l-[#dcc0bd] p-5 flex flex-col gap-2 relative opacity-60 grayscale">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <h3 className="font-playfair font-semibold text-[20px] text-[#554240] line-through">{rez.name}</h3>
                          <span className="font-hanken text-[14px] text-[#554240] mt-1 italic">{rez.notes || "İptal edildi."}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="font-hanken font-bold text-[14px] text-[#554240] line-through">{rez.time}</div>
                        </div>
                      </div>
                    </article>
                  );
                }
                return null;
              })}
            </div>
          )}

          {/* TAB CONTENT: SALON (KROKİ) */}
          {activeTab === 'salon' && (
            <div>
              <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-xl border border-[#D4AF37]/30 shadow-sm">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-white border border-[#D4AF37]/50"></div><span className="text-[14px] font-semibold text-[#554240]">Boş</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-[#4A0404]"></div><span className="text-[14px] font-semibold text-[#554240]">Dolu</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-[#FDFAF0] border border-[#D4AF37] border-dashed"></div><span className="text-[14px] font-semibold text-[#554240]">Rezerve</span></div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map(table => {
                  let styleClass = "";
                  let icon = null;

                  if (table.status === 'empty') {
                    styleClass = "bg-white border-[#D4AF37]/50 text-[#554240]";
                  } else if (table.status === 'occupied') {
                    styleClass = "bg-[#4A0404] border-[#4A0404] text-white shadow-md";
                    icon = <Utensils size={16} className="text-[#D4AF37]" />;
                  } else if (table.status === 'reserved') {
                    styleClass = "bg-[#FDFAF0] border-[#D4AF37] border-dashed text-[#4A0404]";
                    icon = <Clock size={16} className="text-[#D4AF37]" />;
                  }

                  return (
                    <div key={table.id} className={`p-4 rounded-xl border-2 flex flex-col justify-between min-h-[120px] transition-all cursor-pointer hover:scale-[1.02] ${styleClass}`}>
                      <div className="flex justify-between items-start">
                        <span className="font-playfair font-bold text-[22px]">Masa {table.no}</span>
                        <div className="flex items-center gap-1 opacity-80 text-[12px] font-hanken font-bold bg-black/10 px-2 py-0.5 rounded">
                          <Users size={12}/> {table.capacity}
                        </div>
                      </div>
                      
                      <div className="mt-4 font-hanken font-semibold text-[14px] flex items-center gap-2">
                        {icon} {table.info || "Müsait"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="h-28 md:hidden"></div>
        </section>
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 w-full z-50 rounded-t-xl border-t border-[#D4AF37]/30 bg-[#FDFAF0] shadow-[0_-4px_24px_rgba(74,4,4,0.06)] flex justify-around items-center h-20 px-2 pb-safe md:hidden">
        <button onClick={() => setActiveTab('feed')} className={`flex flex-col items-center justify-center px-5 py-2 rounded-full transition-all duration-200 ${activeTab === 'feed' ? 'text-[#4A0404] bg-[#fed65b]/20' : 'text-[#89726f] opacity-70'}`}>
          <ListOrdered size={24} />
          <span className="font-hanken font-semibold text-[10px] uppercase tracking-widest mt-1">Liste</span>
        </button>
        
        <button onClick={() => setActiveTab('new')} className={`flex flex-col items-center justify-center px-5 py-2 rounded-full transition-all duration-200 ${activeTab === 'new' ? 'text-[#4A0404] bg-[#fed65b]/20' : 'text-[#89726f] opacity-70'}`}>
          <PlusCircle size={24} />
          <span className="font-hanken font-semibold text-[10px] uppercase tracking-widest mt-1">Ekle</span>
        </button>
        
        <button onClick={() => setActiveTab('salon')} className={`flex flex-col items-center justify-center px-5 py-2 rounded-full transition-all duration-200 ${activeTab === 'salon' ? 'text-[#4A0404] bg-[#fed65b]/20' : 'text-[#89726f] opacity-70'}`}>
          <Layers size={24} />
          <span className="font-hanken font-semibold text-[10px] uppercase tracking-widest mt-1">Salon</span>
        </button>
      </nav>
    </div>
  );
}



