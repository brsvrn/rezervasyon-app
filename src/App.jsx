import React, { useState, useEffect } from 'react';
import { 
  Menu, User, PlusCircle, Info, Users, 
  CheckCircle2, XCircle, AlertTriangle, 
  Utensils, Cigarette, CigaretteOff, 
  ListOrdered, Layers, Clock, Calendar,
  Phone, MessageCircle, Search, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('feed');
  
  // Yeni Eklenenler: Arama ve Tarih Filtresi
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Yeni Eklenen: Mini CRM Bilgisi
  const [crmInfo, setCrmInfo] = useState(null);

  const [formData, setFormData] = useState({
    name: '', phone: '', date: selectedDate, time: '19:30', pax: 2, smoking: false, tableNo: 'V1', notes: ''
  });

  const [reservations, setReservations] = useState(() => {
    const saved = localStorage.getItem('maitre_reservations_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem('maitre_reservations_v2', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Seçili tarihe ve aramaya göre listeyi filtrele
  const displayReservations = reservations.filter(r => {
    const matchDate = r.date === selectedDate;
    const matchSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.phone.includes(searchTerm);
    return matchDate && matchSearch;
  });

  // Salon krokisini seçili günün rezervasyonlarına göre dinamik oluştur
  const generateTables = () => {
    const generated = [];
    for (let i = 1; i <= 20; i++) generated.push({ id: `v${i}`, no: `V${i}`, area: 'salon', capacity: 4, status: 'empty', info: '' });
    for (let i = 1; i <= 16; i++) generated.push({ id: `t${i}`, no: `t${i}`, area: 'teras', capacity: 4, status: 'empty', info: '' });
    
    // O günkü rezervasyonları masalara yerleştir
    return generated.map(t => {
      // O masaya ait iptal edilmemiş bir rezervasyon var mı?
      const tableRes = displayReservations.find(r => r.tableNo === t.no && r.status !== 'cancelled');
      if (tableRes) {
        if (tableRes.status === 'arrived') return { ...t, status: 'occupied', info: `${tableRes.name} (${tableRes.time})` };
        if (tableRes.status === 'pending') return { ...t, status: 'reserved', info: `${tableRes.name} (${tableRes.time})` };
      }
      return t;
    });
  };

  const currentTables = generateTables();

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

  // Mini CRM: Numara girildikçe geçmişi tara
  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, phone: val }));
    
    if (val.replace(/\D/g, '').length > 7) {
      const pastRes = reservations.filter(r => r.phone.replace(/\D/g, '') === val.replace(/\D/g, ''));
      if (pastRes.length > 0) {
        const lastRes = pastRes[pastRes.length - 1];
        const arrivedCount = pastRes.filter(r => r.status === 'arrived').length;
        const cancelCount = pastRes.filter(r => r.status === 'cancelled').length;
        
        setCrmInfo({
          name: lastRes.name,
          visits: arrivedCount,
          cancels: cancelCount,
          lastNote: lastRes.notes
        });

        // İsim boşsa otomatik doldur
        setFormData(prev => ({ ...prev, name: prev.name || lastRes.name, smoking: lastRes.smoking }));
      } else {
        setCrmInfo(null);
      }
    } else {
      setCrmInfo(null);
    }
  };

  const handlePaxChange = (amount) => {
    setFormData(prev => ({ ...prev, pax: Math.max(1, Math.min(20, prev.pax + amount)) }));
  };

  const changeDate = (daysToAdd) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + daysToAdd);
    const newDateStr = d.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
    setFormData(prev => ({ ...prev, date: newDateStr }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    setIsSubmitting(true);
    
    setTimeout(() => {
      const newRez = { ...formData, id: Date.now(), status: 'pending' };
      setReservations(prev => [...prev, newRez].sort((a, b) => a.time.localeCompare(b.time)));
      
      setFormData({
        name: '', phone: '', date: selectedDate, time: '19:30', pax: 2, smoking: false, tableNo: 'V1', notes: ''
      });
      setCrmInfo(null);
      setIsSubmitting(false);
      setActiveTab('feed');
    }, 400);
  };

  const updateStatus = (id, newStatus) => {
    setReservations(prev => prev.map(rez => rez.id === id ? { ...rez, status: newStatus } : rez));
  };

  const handleSendMenu = (name, phone) => {
    if (!phone) { alert("Bu rezervasyon için numara yok."); return; }
    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('0')) cleanedPhone = '90' + cleanedPhone.substring(1);
    else if (cleanedPhone.length === 10) cleanedPhone = '90' + cleanedPhone;
    
    const message = `Merhaba ${name}, Vertice Restaurant rezervasyonunuz alınmıştır. Bizi tercih ettiğiniz için teşekkür ederiz. Güncel menümüz: https://menu.verticerestaurant.com.tr/?k=392 `;
    window.open(`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Yeni Eklenen: Gün Sonu Raporu Gönderme
  const handleShiftReport = () => {
    const dayRes = reservations.filter(r => r.date === selectedDate);
    const arrived = dayRes.filter(r => r.status === 'arrived');
    const cancelled = dayRes.filter(r => r.status === 'cancelled');
    const pending = dayRes.filter(r => r.status === 'pending');
    const totalPax = arrived.reduce((sum, r) => sum + r.pax, 0);

    const reportText = `📊 *${selectedDate.split('-').reverse().join('.')} - GÜN SONU RAPORU*\n\n` +
      `✅ *Ağırlanan:* ${arrived.length} Masa (${totalPax} Kişi)\n` +
      `❌ *İptal/No-Show:* ${cancelled.length} Masa\n` +
      (pending.length > 0 ? `⏳ *Gelmesi Beklenen:* ${pending.length} Masa\n\n` : `\n`) +
      `İyi çalışmalar!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
  };

  const renderTableCard = (table) => {
    let styleClass = table.status === 'empty' ? "bg-white border-[#D4AF37]/50 text-[#554240]" :
                     table.status === 'occupied' ? "bg-[#4A0404] border-[#4A0404] text-white shadow-md" :
                     "bg-[#FDFAF0] border-[#D4AF37] border-dashed text-[#4A0404]";
    
    let icon = table.status === 'occupied' ? <Utensils size={14} className="text-[#D4AF37]" /> :
               table.status === 'reserved' ? <Clock size={14} className="text-[#D4AF37]" /> : null;

    return (
      <div key={table.id} className={`p-3 rounded-xl border-2 flex flex-col justify-between min-h-[100px] transition-all cursor-pointer hover:scale-[1.02] ${styleClass}`}>
        <div className="flex justify-between items-start">
          <span className="font-playfair font-bold text-[20px]">Masa {table.no}</span>
          <div className="flex items-center gap-1 opacity-80 text-[11px] font-hanken font-bold bg-black/10 px-1.5 py-0.5 rounded"><Users size={10}/> {table.capacity}</div>
        </div>
        <div className="mt-2 font-hanken font-semibold text-[13px] flex items-center gap-1.5 line-clamp-2 leading-tight">
          {icon} {table.info || "Müsait"}
        </div>
      </div>
    );
  };

  const formatDateLabel = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return "Bugün";
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  };

  return (
    <div className="bg-[#fcf9ef] text-[#1c1c16] font-hanken antialiased min-h-screen flex flex-col pt-[64px] pb-[80px] md:pb-0">
      <header className="fixed top-0 w-full z-50 border-b border-[#D4AF37]/20 bg-[#fcf9ef] shadow-sm flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
          <button className="text-[#4A0404]"><Menu size={24} /></button>
          <h1 className="font-playfair text-[22px] font-semibold text-[#4A0404] tracking-tight truncate hidden md:block">Velocity Maitre D'</h1>
        </div>
        
        {/* Tarih Navigasyonu (Ortada) */}
        <div className="flex items-center gap-2 bg-[#f1eee4] border border-[#dcc0bd] rounded-full p-1">
          <button onClick={() => changeDate(-1)} className="p-1 text-[#554240] hover:bg-white rounded-full"><ChevronLeft size={20}/></button>
          <span className="font-hanken font-bold text-[14px] text-[#4A0404] min-w-[80px] text-center">{formatDateLabel(selectedDate)}</span>
          <button onClick={() => changeDate(1)} className="p-1 text-[#554240] hover:bg-white rounded-full"><ChevronRight size={20}/></button>
        </div>

        <button className="h-8 w-8 rounded-full border border-[#D4AF37]/30 flex items-center justify-center bg-[#FDFAF0] text-[#4A0404]"><User size={18} /></button>
      </header>

      <main className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col md:flex-row-reverse gap-6 p-4 md:p-8 items-start pt-4 md:pt-8">
        
        <aside className={`w-full md:w-[360px] md:sticky md:top-[88px] flex-shrink-0 bg-white border border-[#D4AF37]/30 rounded-xl p-5 shadow-sm ${activeTab === 'new' ? 'block' : 'hidden md:block'}`}>
          <h2 className="font-playfair text-[24px] font-semibold text-[#4A0404] mb-5 text-center">Yeni Ekle</h2>
          
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col relative group">
              <label className="font-hanken font-semibold text-[#554240] absolute -top-2.5 left-2 bg-white px-1 uppercase tracking-widest text-[10px]">Telefon</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handlePhoneChange} className="h-12 bg-transparent border border-[#dcc0bd] focus:border-[#D4AF37] rounded-md px-3 mt-2 text-base w-full" placeholder="0555 000 00 00" />
            </div>

            {/* Mini CRM Bilgi Kutusu */}
            {crmInfo && (
              <div className="mt-[-10px] p-3 bg-[#FDFAF0] border border-[#D4AF37]/50 rounded-md text-[13px] text-[#554240] flex items-start gap-2 shadow-sm animate-in fade-in zoom-in-95">
                <Info size={16} className="text-[#D4AF37] mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-[#4A0404]">Müşteri Kaydı: {crmInfo.name}</span>
                  <span>✅ {crmInfo.visits} kez ağırladık, ❌ {crmInfo.cancels} iptal.</span>
                  {crmInfo.lastNote && <span className="italic opacity-80 mt-1 line-clamp-2">Son Not: {crmInfo.lastNote}</span>}
                </div>
              </div>
            )}

            <div className="flex flex-col relative group">
              <label className="font-hanken font-semibold text-[#554240] absolute -top-2.5 left-2 bg-white px-1 uppercase tracking-widest text-[10px]">Misafir Adı</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="h-12 bg-transparent border border-[#dcc0bd] focus:border-[#D4AF37] rounded-md px-3 mt-2 text-base w-full" placeholder="Ad Soyad" required />
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
                    {currentTables.filter(t => t.area === 'salon').map(t => <option key={t.id} value={t.no}>Masa {t.no}</option>)}
                  </optgroup>
                  <optgroup label="Teras (t1-t16)">
                    {currentTables.filter(t => t.area === 'teras').map(t => <option key={t.id} value={t.no}>Masa {t.no}</option>)}
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
          
          <div className="flex flex-col gap-4 mb-4 border-b border-[#D4AF37]/20 pb-4">
            
            {/* Üst Kısım: Butonlar ve Rapor */}
            <div className="flex items-center justify-between">
              <div className="flex bg-[#f1eee4] p-1 rounded-lg border border-[#dcc0bd]/50">
                <button onClick={() => setActiveTab('feed')} className={`px-4 py-1.5 rounded-md font-hanken font-semibold text-[14px] flex items-center gap-2 transition-all ${activeTab === 'feed' ? 'bg-white text-[#4A0404] shadow-sm' : 'text-[#89726f]'}`}><ListOrdered size={16} /> Liste</button>
                <button onClick={() => setActiveTab('salon')} className={`px-4 py-1.5 rounded-md font-hanken font-semibold text-[14px] flex items-center gap-2 transition-all ${activeTab === 'salon' ? 'bg-white text-[#4A0404] shadow-sm' : 'text-[#89726f]'}`}><Layers size={16} /> Salon</button>
              </div>

              <div className="flex gap-2">
                <button onClick={handleShiftReport} className="hidden md:flex px-4 py-1.5 rounded-full bg-[#4A0404] text-white font-hanken font-semibold text-[12px] items-center gap-2 shadow-sm hover:bg-[#210000] transition-colors">
                  <FileText size={14} /> Gün Sonu Gönder
                </button>
              </div>
            </div>

            {/* Arama Çubuğu */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#89726f]" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="İsim veya telefon ile ara..." 
                className="w-full bg-white border border-[#dcc0bd] rounded-lg h-12 pl-10 pr-4 text-[15px] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

          </div>

          {activeTab === 'feed' && (
            <div className="flex flex-col gap-4">
              {displayReservations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-[#89726f]">
                  <ListOrdered size={48} className="mb-4 opacity-30" />
                  <p className="font-hanken font-semibold text-lg">Bu tarih için kayıt bulunamadı.</p>
                </div>
              )}

              {displayReservations.map((rez) => {
                const late = checkIsLate(rez.date, rez.time, rez.status);
                
                if (rez.status === 'pending' && !late) {
                  return (
                    <article key={rez.id} className="bg-white border border-[#D4AF37]/30 rounded-xl border-l-4 border-l-[#D4AF37] p-4 flex flex-col gap-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="font-playfair font-semibold text-[18px] md:text-[20px] text-[#4A0404]">{rez.name}</h3>
                            <span className="bg-[#4A0404] text-[#D4AF37] px-2 py-0.5 rounded text-xs font-bold">Masa {rez.tableNo}</span>
                          </div>
                          
                          <div className="flex flex-col gap-1 mt-1.5">
                            {rez.phone && (
                              <span className="font-hanken font-semibold text-[13px] text-[#554240] flex items-center gap-1.5"><Phone size={14} className="text-[#D4AF37]" /> {rez.phone}</span>
                            )}
                          </div>
                          {rez.notes && <span className="font-hanken text-[13px] md:text-[14px] text-[#554240] flex items-start gap-1.5 mt-2"><Info size={16} className="text-[#D4AF37] shrink-0 mt-0.5" /> <span>{rez.notes}</span></span>}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="bg-[#FDFAF0] border border-[#D4AF37]/20 px-3 py-1 rounded font-hanken font-bold text-[14px] text-[#4A0404]">{rez.time}</div>
                          <div className="flex items-center gap-1 text-[#554240] font-hanken font-semibold text-[14px]"><Users size={16} /> {rez.pax}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 border-t border-[#f1eee4] pt-3">
                        <button onClick={() => updateStatus(rez.id, 'arrived')} className="flex-1 h-10 rounded-md bg-[#4A0404] text-white font-semibold text-[13px] md:text-[14px] flex items-center justify-center gap-2 hover:bg-[#210000]"><CheckCircle2 size={18} /> Geldi</button>
                        <button onClick={() => handleSendMenu(rez.name, rez.phone)} className="w-12 md:w-auto md:px-4 h-10 rounded-md border border-[#25D366] text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors" title="WhatsApp Menü"><MessageCircle size={18} /></button>
                        <button onClick={() => updateStatus(rez.id, 'cancelled')} className="flex-1 h-10 rounded-md border border-[#dcc0bd] text-[#554240] font-semibold text-[13px] md:text-[14px] flex items-center justify-center gap-2 hover:bg-[#f1eee4]"><XCircle size={18} /> İptal</button>
                      </div>
                    </article>
                  );
                }

                if (rez.status === 'pending' && late) {
                  return (
                    <article key={rez.id} className="bg-[#ffdad6]/20 border border-[#ba1a1a]/20 rounded-xl border-l-4 border-l-[#ba1a1a] p-4 flex flex-col gap-4 relative shadow-sm">
                      <div className="absolute top-0 right-0 bg-[#ba1a1a] text-white font-hanken font-semibold text-[10px] md:text-[11px] px-3 py-1 rounded-bl-md flex items-center gap-1"><AlertTriangle size={14} /> GEÇ KALDI</div>
                      <div className="flex justify-between items-start mt-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="font-playfair font-semibold text-[18px] md:text-[20px] text-[#ba1a1a]">{rez.name}</h3>
                            <span className="bg-[#ba1a1a] text-white px-2 py-0.5 rounded text-xs font-bold">Masa {rez.tableNo}</span>
                          </div>
                          {rez.phone && <span className="font-hanken font-semibold text-[13px] text-[#554240] flex items-center gap-1.5 mt-1.5"><Phone size={14} className="text-[#ba1a1a]" /> {rez.phone}</span>}
                          {rez.notes && <span className="font-hanken text-[13px] text-[#554240] mt-2">{rez.notes}</span>}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="bg-[#ba1a1a]/10 text-[#ba1a1a] px-3 py-1 rounded font-bold text-[14px] line-through">{rez.time}</div>
                          <div className="flex items-center gap-1 text-[#554240] font-semibold text-[14px]"><Users size={16} /> {rez.pax}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 border-t border-[#ba1a1a]/20 pt-3">
                        <button onClick={() => updateStatus(rez.id, 'cancelled')} className="flex-1 h-10 rounded-md bg-white border border-[#ba1a1a] text-[#ba1a1a] font-semibold text-[13px] flex items-center justify-center">İptal Et</button>
                        <button onClick={() => updateStatus(rez.id, 'arrived')} className="flex-1 h-10 rounded-md bg-[#ba1a1a] text-white font-semibold text-[13px] flex items-center justify-center">Geç Geldi</button>
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
                            <h3 className="font-playfair font-semibold text-[18px] text-[#4A0404]">{rez.name}</h3>
                            <span className="bg-[#4A0404] text-[#D4AF37] px-2 py-0.5 rounded text-xs font-bold">Masa {rez.tableNo}</span>
                          </div>
                          {rez.phone && <span className="font-hanken font-semibold text-[12px] text-[#89726f] mt-1 flex items-center gap-1"><Phone size={12} /> {rez.phone}</span>}
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
                          <h3 className="font-playfair font-semibold text-[18px] text-[#554240] line-through">{rez.name} (Masa {rez.tableNo})</h3>
                          <span className="font-hanken text-[13px] text-[#554240] mt-1 italic">İptal edildi.</span>
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
                <h3 className="font-playfair font-semibold text-[18px] text-[#4A0404] mb-4 border-b border-[#D4AF37]/20 pb-2">KAPALI SALON (V1 - V20)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {currentTables.filter(t => t.area === 'salon').map(table => renderTableCard(table))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-playfair font-semibold text-[18px] text-[#4A0404] mb-4 border-b border-[#D4AF37]/20 pb-2">TERAS (t1 - t16)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {currentTables.filter(t => t.area === 'teras').map(table => renderTableCard(table))}
                </div>
              </div>
            </div>
          )}

          <div className="h-28 md:hidden"></div>
        </section>
      </main>

      <nav className="fixed bottom-0 w-full z-50 rounded-t-xl border-t border-[#D4AF37]/30 bg-[#FDFAF0] flex justify-around items-center h-[72px] pb-safe md:hidden shadow-[0_-4px_24px_rgba(74,4,4,0.06)]">
        <button onClick={() => setActiveTab('feed')} className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl ${activeTab === 'feed' ? 'text-[#4A0404]' : 'text-[#89726f]'}`}><ListOrdered size={24} /><span className="font-hanken font-bold text-[10px] mt-1">LİSTE</span></button>
        <button onClick={() => setActiveTab('new')} className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl ${activeTab === 'new' ? 'text-[#4A0404]' : 'text-[#89726f]'}`}><PlusCircle size={24} /><span className="font-hanken font-bold text-[10px] mt-1">EKLE</span></button>
        <button onClick={() => setActiveTab('salon')} className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl ${activeTab === 'salon' ? 'text-[#4A0404]' : 'text-[#89726f]'}`}><Layers size={24} /><span className="font-hanken font-bold text-[10px] mt-1">SALON</span></button>
        <button onClick={handleShiftReport} className="flex flex-col items-center justify-center px-4 py-1.5 rounded-xl text-[#89726f] hover:text-[#4A0404]"><FileText size={24} /><span className="font-hanken font-bold text-[10px] mt-1">RAPOR</span></button>
      </nav>
    </div>
  );
}
