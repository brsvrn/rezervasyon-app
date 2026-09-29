import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  Info,
  Layers,
  ListOrdered,
  Mail,
  MapPin,
  MessageCircle,
  PlusCircle,
  Phone,
  Search,
  Trash2,
  User,
  Users,
  Utensils,
  XCircle,
} from 'lucide-react';

const TOTAL_TABLES = 36;
const TABLES = [
  ...Array.from({ length: 20 }, (_, i) => ({ id: `V${i + 1}`, no: `V${i + 1}`, area: 'salon' })),
  ...Array.from({ length: 16 }, (_, i) => ({ id: `T${i + 1}`, no: `T${i + 1}`, area: 'teras' })),
];

const RESERVATION_NOTE_OPTIONS = [
  { id: 'decoration', label: 'Süsleme', emoji: '🎈' },
  { id: 'proposal', label: 'Evlilik Teklifi', emoji: '💍' },
  { id: 'birthday', label: 'Doğum Günü', emoji: '🎂' },
  { id: 'dessert_candle', label: 'Tatlıya Mum', emoji: '🕯️' },
];

const STORAGE_KEY = 'maitre_reservations_v4';
const LEGACY_STORAGE_KEY = 'maitre_reservations_v3';

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function prettyDate(value) {
  return value.split('-').reverse().join('.');
}

function inferArea(tableNo = '') {
  return tableNo.toUpperCase().startsWith('T') ? 'teras' : 'salon';
}

function emptyForm(date) {
  return {
    name: '',
    email: '',
    phone: '',
    date,
    time: '19:30',
    pax: 2,
    area: 'salon',
    tableNo: 'V1',
    specialNotes: [],
    notes: '',
  };
}

function normalizeReservation(item) {
  const tableNo = String(item.tableNo || 'V1').toUpperCase();
  return {
    ...item,
    email: item.email || '',
    tableNo,
    area: item.area || inferArea(tableNo),
    pax: Number(item.pax) || 1,
    specialNotes: Array.isArray(item.specialNotes)
      ? item.specialNotes.filter((id) => RESERVATION_NOTE_OPTIONS.some((option) => option.id === id))
      : [],
    notes: item.notes || '',
    status: item.status || 'pending',
  };
}

export default function App() {
  const today = localDateString();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedDate, setSelectedDate] = useState(today);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(() => emptyForm(today));
  const [formError, setFormError] = useState('');
  const [crmInfo, setCrmInfo] = useState(null);
  const [reservations, setReservations] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!saved) return [];
    try {
      return JSON.parse(saved).map(normalizeReservation);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const dayReservations = useMemo(
    () => reservations.filter((r) => r.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [reservations, selectedDate],
  );

  const activeDayReservations = useMemo(
    () => dayReservations.filter((r) => r.status !== 'cancelled'),
    [dayReservations],
  );

  const occupiedTableSet = useMemo(
    () => new Set(activeDayReservations.map((r) => r.tableNo)),
    [activeDayReservations],
  );

  const specialNoteCounts = Object.fromEntries(
    RESERVATION_NOTE_OPTIONS.map((option) => [
      option.id,
      activeDayReservations.filter((reservation) => reservation.specialNotes?.includes(option.id)).length,
    ]),
  );

  const dashboard = {
    totalTables: TOTAL_TABLES,
    occupiedTables: occupiedTableSet.size,
    emptyTables: TOTAL_TABLES - occupiedTableSet.size,
    totalPax: activeDayReservations.reduce((sum, r) => sum + Number(r.pax || 0), 0),
    specialNoteCounts,
  };

  const displayReservations = useMemo(() => {
    const q = searchTerm.trim().toLocaleLowerCase('tr-TR');
    if (!q) return dayReservations;
    return dayReservations.filter((r) =>
      [r.name, r.email, r.phone, r.tableNo]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('tr-TR').includes(q)),
    );
  }, [dayReservations, searchTerm]);

  const currentTables = useMemo(() => TABLES.map((table) => {
    const tableReservations = activeDayReservations.filter((r) => r.tableNo === table.no);
    if (!tableReservations.length) return { ...table, status: 'empty', info: 'Müsait', count: 0 };

    const arrived = tableReservations.find((r) => r.status === 'arrived');
    const first = arrived || tableReservations[0];
    return {
      ...table,
      status: arrived ? 'occupied' : 'reserved',
      info: `${first.time} · ${first.name}`,
      count: tableReservations.length,
    };
  }), [activeDayReservations]);

  const availableAreaTables = currentTables.filter((table) => table.area === formData.area);

  const checkIsLate = (reservation) => {
    if (reservation.status !== 'pending') return false;
    const [hours, minutes] = reservation.time.split(':').map(Number);
    const reservationDate = new Date(`${reservation.date}T00:00:00`);
    reservationDate.setHours(hours, minutes, 0, 0);
    return currentTime > reservationDate;
  };

  const changeDate = (days) => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() + days);
    const next = localDateString(date);
    setSelectedDate(next);
    if (!editingId) setFormData((prev) => ({ ...prev, date: next }));
  };

  const selectDate = (date) => {
    setSelectedDate(date);
    if (!editingId) setFormData((prev) => ({ ...prev, date }));
  };

  const handlePhoneChange = (event) => {
    const phone = event.target.value;
    setFormData((prev) => ({ ...prev, phone }));
    setFormError('');

    if (editingId || phone.replace(/\D/g, '').length < 8) {
      setCrmInfo(null);
      return;
    }

    const normalizedPhone = phone.replace(/\D/g, '');
    const history = reservations.filter((r) => r.phone?.replace(/\D/g, '') === normalizedPhone);
    if (!history.length) {
      setCrmInfo(null);
      return;
    }

    const latest = [...history].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0];
    setCrmInfo({
      name: latest.name,
      visits: history.filter((r) => r.status === 'arrived').length,
      reservations: history.length,
    });

    setFormData((prev) => ({
      ...prev,
      name: prev.name || latest.name,
      email: prev.email || latest.email || '',
    }));
  };

  const handleAreaChange = (area) => {
    const firstTable = TABLES.find((table) => table.area === area)?.no || 'V1';
    setFormData((prev) => ({ ...prev, area, tableNo: firstTable }));
    setFormError('');
  };

  const handleFormDateChange = (date) => {
    setFormData((prev) => ({ ...prev, date }));
    setSelectedDate(date);
    setFormError('');
  };

  const handlePaxChange = (amount) => {
    setFormData((prev) => ({ ...prev, pax: Math.max(1, Math.min(100, Number(prev.pax) + amount)) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setFormError('İsim, e-posta ve telefon bilgileri zorunludur.');
      return;
    }

    if (!editingId && formData.date < today) {
      setFormError('Geçmiş bir tarihe yeni rezervasyon oluşturulamaz.');
      return;
    }

    const conflict = reservations.find((r) =>
      r.id !== editingId &&
      r.status !== 'cancelled' &&
      r.date === formData.date &&
      r.time === formData.time &&
      r.tableNo === formData.tableNo,
    );

    if (conflict) {
      setFormError(`${formData.tableNo} masasında ${formData.time} saatinde zaten ${conflict.name} adına rezervasyon var.`);
      return;
    }

    if (editingId) {
      setReservations((prev) => prev.map((reservation) =>
        reservation.id === editingId
          ? { ...reservation, ...formData, pax: Number(formData.pax) }
          : reservation,
      ));
      setEditingId(null);
    } else {
      setReservations((prev) => [
        ...prev,
        {
          ...formData,
          id: Date.now(),
          pax: Number(formData.pax),
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    setCrmInfo(null);
    setFormData(emptyForm(selectedDate));
    setActiveTab('feed');
  };

  const handleEdit = (reservation) => {
    setEditingId(reservation.id);
    setSelectedDate(reservation.date);
    setFormData({
      name: reservation.name,
      email: reservation.email || '',
      phone: reservation.phone || '',
      date: reservation.date,
      time: reservation.time,
      pax: Number(reservation.pax) || 1,
      area: reservation.area || inferArea(reservation.tableNo),
      tableNo: reservation.tableNo,
      specialNotes: Array.isArray(reservation.specialNotes) ? reservation.specialNotes : [],
      notes: reservation.notes || '',
    });
    setFormError('');
    setActiveTab('new');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyForm(selectedDate));
    setFormError('');
    setActiveTab('feed');
  };

  const updateStatus = (id, status) => {
    setReservations((prev) => prev.map((reservation) =>
      reservation.id === id ? { ...reservation, status } : reservation,
    ));
  };

  const deleteReservation = (reservation) => {
    if (!window.confirm(`${reservation.name} adına olan rezervasyon silinsin mi?`)) return;
    setReservations((prev) => prev.filter((item) => item.id !== reservation.id));
  };

  const handleSendMenu = (phone) => {
    if (!phone) return;
    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('0')) cleanedPhone = `90${cleanedPhone.slice(1)}`;
    else if (cleanedPhone.length === 10) cleanedPhone = `90${cleanedPhone}`;
    const message = 'Merhaba, Vertice Restaurant rezervasyonunuz alınmıştır. Bizi tercih ettiğiniz için teşekkür ederiz. Güncel menümüze buradan ulaşabilirsiniz: https://menu.verticerestaurant.com.tr/?k=392';
    window.open(`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShiftReport = () => {
    const arrived = dayReservations.filter((r) => r.status === 'arrived');
    const cancelled = dayReservations.filter((r) => r.status === 'cancelled');
    const pending = dayReservations.filter((r) => r.status === 'pending');
    const arrivedPax = arrived.reduce((sum, r) => sum + Number(r.pax || 0), 0);
    const pendingPax = pending.reduce((sum, r) => sum + Number(r.pax || 0), 0);

    const reservationDetailLines = dayReservations
      .filter((reservation) => reservation.status !== 'cancelled')
      .map((reservation) => {
        const selectedNotes = RESERVATION_NOTE_OPTIONS
          .filter((option) => reservation.specialNotes?.includes(option.id))
          .map((option) => `${option.emoji} ${option.label}`);
        if (reservation.notes?.trim()) selectedNotes.push(`Not: ${reservation.notes.trim()}`);
        const noteText = selectedNotes.length ? ` · ${selectedNotes.join(' · ')}` : '';
        return `• ${reservation.tableNo} · ${reservation.time} · ${reservation.name} · ${reservation.pax} kişi${noteText}`;
      })
      .join('\n');

    const report = `📊 *${prettyDate(selectedDate)} - REZERVASYON RAPORU*\n\n✅ Geldi: ${arrived.length} masa / ${arrivedPax} kişi\n⏳ Beklenen: ${pending.length} rezervasyon / ${pendingPax} kişi\n❌ İptal: ${cancelled.length} rezervasyon\n🪑 Kullanılan/Rezerve masa: ${dashboard.occupiedTables}/${TOTAL_TABLES}${reservationDetailLines ? `\n\n📝 *MASA / NOT DETAYI*\n${reservationDetailLines}` : ''}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
  };

  const startReservationForTable = (table) => {
    setEditingId(null);
    setFormData({ ...emptyForm(selectedDate), area: table.area, tableNo: table.no });
    setFormError('');
    setActiveTab('new');
  };

  const dashboardCards = [
    { label: 'Toplam Masa', value: dashboard.totalTables, icon: <Layers size={20} /> },
    { label: 'Boş Masa', value: dashboard.emptyTables, icon: <CheckCircle2 size={20} /> },
    { label: 'Dolu / Rezerve', value: dashboard.occupiedTables, icon: <Utensils size={20} /> },
    { label: 'Toplam Kişi', value: dashboard.totalPax, icon: <Users size={20} /> },
  ];

  const specialDashboardCards = RESERVATION_NOTE_OPTIONS.map((option) => ({
    label: option.label,
    value: dashboard.specialNoteCounts[option.id] || 0,
    icon: <span className="text-lg leading-none">{option.emoji}</span>,
  }));

  const renderTableCard = (table) => {
    const style = table.status === 'empty'
      ? 'bg-white border-[#D4AF37]/35 text-[#4A0404]'
      : table.status === 'occupied'
        ? 'bg-[#4A0404] border-[#4A0404] text-white shadow-md'
        : 'bg-[#FDFAF0] border-[#D4AF37] border-dashed text-[#4A0404]';

    return (
      <button
        key={table.id}
        type="button"
        onClick={() => startReservationForTable(table)}
        className={`min-h-[112px] rounded-xl border-2 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${style}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] opacity-60">{table.area === 'salon' ? 'Salon' : 'Teras'}</span>
            <span className="font-playfair text-2xl font-bold">{table.no}</span>
          </div>
          {table.count > 1 && <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold">{table.count} kayıt</span>}
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-[12px] font-semibold leading-tight">
          {table.status === 'empty' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
          <span className="line-clamp-2">{table.info}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#fcf9ef] pb-[84px] font-hanken text-[#1c1c16] md:pb-0">
      <header className="sticky top-0 z-50 border-b border-[#D4AF37]/20 bg-[#fcf9ef]/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between gap-3 px-4 md:px-8">
          <div className="min-w-0">
            <h1 className="truncate font-playfair text-xl font-semibold text-[#4A0404] md:text-2xl">Vertice Rezervasyon</h1>
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-[#89726f] sm:block">Masa & Misafir Yönetimi</p>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-[#dcc0bd] bg-[#f1eee4] p-1">
            <button type="button" onClick={() => changeDate(-1)} className="rounded-full p-1.5 text-[#554240] hover:bg-white"><ChevronLeft size={18} /></button>
            <label className="relative flex items-center">
              <Calendar size={14} className="pointer-events-none absolute left-2 text-[#4A0404]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => selectDate(e.target.value)}
                className="h-8 w-[132px] rounded-full bg-white pl-7 pr-2 text-[12px] font-bold text-[#4A0404] outline-none sm:w-[148px]"
              />
            </label>
            <button type="button" onClick={() => changeDate(1)} className="rounded-full p-1.5 text-[#554240] hover:bg-white"><ChevronRight size={18} /></button>
          </div>

          <div className="hidden h-9 w-9 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#FDFAF0] text-[#4A0404] sm:flex"><User size={18} /></div>
        </div>
      </header>

      <section className="mx-auto max-w-[1480px] px-4 pt-4 md:px-8 md:pt-6">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#89726f]">Dashboard</p>
            <h2 className="font-playfair text-xl font-semibold text-[#4A0404]">{selectedDate === today ? 'Bugünün Durumu' : prettyDate(selectedDate)}</h2>
          </div>
          {selectedDate !== today && (
            <button type="button" onClick={() => selectDate(today)} className="text-xs font-bold text-[#4A0404] underline underline-offset-4">Bugüne dön</button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {dashboardCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-[#D4AF37]/25 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-[#89726f]">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{card.label}</span>
                <span className="text-[#D4AF37]">{card.icon}</span>
              </div>
              <strong className="font-playfair text-3xl font-semibold text-[#4A0404]">{card.value}</strong>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {specialDashboardCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-[#4A0404]/10 bg-[#FDFAF0] p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2 text-[#89726f]">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{card.label}</span>
                {card.icon}
              </div>
              <strong className="font-playfair text-2xl font-semibold text-[#4A0404]">{card.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-[1480px] flex-col items-start gap-6 p-4 md:flex-row-reverse md:p-8 md:pt-6">
        <aside className={`w-full flex-shrink-0 rounded-xl border border-[#D4AF37]/30 bg-white p-5 shadow-sm md:sticky md:top-[88px] md:block md:w-[390px] ${activeTab === 'new' ? 'block' : 'hidden'}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#89726f]">{editingId ? 'Rezervasyon' : 'Yeni Kayıt'}</p>
              <h2 className="font-playfair text-2xl font-semibold text-[#4A0404]">{editingId ? 'Rezervasyonu Düzenle' : 'Rezervasyon Oluştur'}</h2>
            </div>
            {editingId && <button type="button" onClick={cancelEdit} className="text-xs font-bold text-[#554240] underline">Vazgeç</button>}
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tarih">
                <input type="date" min={editingId ? undefined : today} value={formData.date} onChange={(e) => handleFormDateChange(e.target.value)} className="field-input" required />
              </Field>
              <Field label="Saat">
                <input type="time" value={formData.time} onChange={(e) => setFormData((p) => ({ ...p, time: e.target.value }))} className="field-input" required />
              </Field>
            </div>

            <Field label="Misafir Adı Soyadı">
              <input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className="field-input" placeholder="Ad Soyad" required />
            </Field>

            <Field label="Telefon">
              <input type="tel" value={formData.phone} onChange={handlePhoneChange} className="field-input" placeholder="05xx xxx xx xx" required />
            </Field>

            {crmInfo && !editingId && (
              <div className="flex gap-2 rounded-lg border border-[#D4AF37]/35 bg-[#FDFAF0] p-3 text-[12px] text-[#554240]">
                <Info size={16} className="mt-0.5 shrink-0 text-[#D4AF37]" />
                <span><b className="text-[#4A0404]">{crmInfo.name}</b> daha önce {crmInfo.reservations} rezervasyon yaptı, {crmInfo.visits} kez geldi.</span>
              </div>
            )}

            <Field label="E-posta">
              <input type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} className="field-input" placeholder="ornek@mail.com" required />
            </Field>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#554240]">Alan</label>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#f6f4ea] p-1">
                <button type="button" onClick={() => handleAreaChange('salon')} className={`flex h-11 items-center justify-center gap-2 rounded-md text-sm font-bold ${formData.area === 'salon' ? 'bg-white text-[#4A0404] shadow-sm' : 'text-[#89726f]'}`}><Layers size={16} /> Salon</button>
                <button type="button" onClick={() => handleAreaChange('teras')} className={`flex h-11 items-center justify-center gap-2 rounded-md text-sm font-bold ${formData.area === 'teras' ? 'bg-white text-[#4A0404] shadow-sm' : 'text-[#89726f]'}`}><MapPin size={16} /> Teras</button>
              </div>
            </div>

            <Field label="Masa Ataması">
              <select value={formData.tableNo} onChange={(e) => setFormData((p) => ({ ...p, tableNo: e.target.value }))} className="field-input font-bold text-[#4A0404]" required>
                {availableAreaTables.map((table) => (
                  <option key={table.no} value={table.no}>{table.no}{table.status !== 'empty' ? ` · ${table.info}` : ' · Müsait'}</option>
                ))}
              </select>
            </Field>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#554240]">Kişi Sayısı</label>
              <div className="flex h-12 items-center justify-between rounded-md border border-[#dcc0bd] bg-white">
                <button type="button" onClick={() => handlePaxChange(-1)} className="h-full w-14 text-xl font-bold text-[#554240]">−</button>
                <span className="text-lg font-bold text-[#4A0404]">{formData.pax}</span>
                <button type="button" onClick={() => handlePaxChange(1)} className="h-full w-14 text-xl font-bold text-[#554240]">+</button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#554240]">Rezervasyon Notları</label>
              <div className="grid grid-cols-2 gap-2">
                {RESERVATION_NOTE_OPTIONS.map((option) => {
                  const selected = formData.specialNotes.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFormData((previous) => ({
                        ...previous,
                        specialNotes: selected
                          ? previous.specialNotes.filter((id) => id !== option.id)
                          : [...previous.specialNotes, option.id],
                      }))}
                      className={`flex min-h-[44px] items-center gap-2 rounded-md border px-3 text-left text-xs font-bold transition ${selected ? 'border-[#4A0404] bg-[#4A0404] text-white' : 'border-[#dcc0bd] bg-white text-[#554240] hover:border-[#D4AF37]'}`}
                      aria-pressed={selected}
                    >
                      <span className="text-base leading-none">{option.emoji}</span>
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Manuel Not">
              <textarea value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} className="field-input min-h-[88px] resize-none py-3" placeholder="Alerji, masa tercihi veya diğer özel istekleri yaz..." />
            </Field>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] font-semibold text-red-700">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {formError}
              </div>
            )}

            <button type="submit" className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-md bg-[#4A0404] px-4 text-base font-bold text-white shadow-md hover:bg-[#2b0202]">
              {editingId ? <><Edit size={18} /> Rezervasyonu Güncelle</> : <><PlusCircle size={18} /> Rezervasyonu Kaydet</>}
            </button>
          </form>
        </aside>

        <section className={`w-full flex-1 ${activeTab === 'new' ? 'hidden md:block' : 'block'}`}>
          <div className="mb-4 rounded-xl border border-[#D4AF37]/20 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex rounded-lg bg-[#f1eee4] p-1">
                <button type="button" onClick={() => setActiveTab('feed')} className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold sm:flex-none ${activeTab === 'feed' ? 'bg-white text-[#4A0404] shadow-sm' : 'text-[#89726f]'}`}><ListOrdered size={16} /> Rezervasyonlar</button>
                <button type="button" onClick={() => setActiveTab('tables')} className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold sm:flex-none ${activeTab === 'tables' ? 'bg-white text-[#4A0404] shadow-sm' : 'text-[#89726f]'}`}><Layers size={16} /> Masalar</button>
              </div>
              <button type="button" onClick={handleShiftReport} className="hidden items-center gap-2 rounded-full bg-[#4A0404] px-4 py-2 text-xs font-bold text-white md:flex"><FileText size={14} /> Gün Raporu</button>
            </div>

            {activeTab === 'feed' && (
              <div className="relative mt-3">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#89726f]" />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="İsim, telefon, e-posta veya masa ara..." className="h-11 w-full rounded-lg border border-[#dcc0bd] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#D4AF37]" />
              </div>
            )}
          </div>

          {activeTab === 'feed' && (
            <div className="flex flex-col gap-3">
              {displayReservations.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-[#D4AF37]/40 bg-white text-center text-[#89726f]">
                  <Calendar size={42} className="mb-3 opacity-30" />
                  <p className="font-playfair text-xl font-semibold text-[#4A0404]">Bu tarihte rezervasyon yok</p>
                  <p className="mt-1 text-sm">Yeni rezervasyon ekleyebilir veya ileri bir tarih seçebilirsin.</p>
                </div>
              ) : displayReservations.map((reservation) => {
                const late = checkIsLate(reservation);
                return (
                  <article key={reservation.id} className={`relative rounded-xl border bg-white p-4 shadow-sm ${reservation.status === 'cancelled' ? 'border-[#dcc0bd] opacity-60' : late ? 'border-red-300' : 'border-[#D4AF37]/30'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`font-playfair text-xl font-semibold ${reservation.status === 'cancelled' ? 'line-through text-[#89726f]' : 'text-[#4A0404]'}`}>{reservation.name}</h3>
                          <span className="rounded bg-[#4A0404] px-2 py-0.5 text-[11px] font-bold text-[#D4AF37]">{reservation.tableNo}</span>
                          <span className="rounded bg-[#f1eee4] px-2 py-0.5 text-[10px] font-bold uppercase text-[#554240]">{reservation.area === 'teras' ? 'Teras' : 'Salon'}</span>
                          {late && reservation.status === 'pending' && <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">GEÇ KALDI</span>}
                        </div>

                        <div className="mt-3 grid gap-2 text-[13px] text-[#554240] sm:grid-cols-2">
                          <span className="flex items-center gap-2"><Phone size={14} /> {reservation.phone}</span>
                          <span className="flex items-center gap-2"><Mail size={14} /> {reservation.email || 'E-posta yok'}</span>
                          <span className="flex items-center gap-2"><Clock size={14} /> {reservation.time}</span>
                          <span className="flex items-center gap-2"><Users size={14} /> {reservation.pax} kişi</span>
                        </div>

                        {reservation.specialNotes?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {RESERVATION_NOTE_OPTIONS
                              .filter((option) => reservation.specialNotes.includes(option.id))
                              .map((option) => (
                                <span key={option.id} className="rounded-full border border-[#D4AF37]/35 bg-[#FDFAF0] px-2.5 py-1 text-[11px] font-bold text-[#4A0404]">
                                  {option.emoji} {option.label}
                                </span>
                              ))}
                          </div>
                        )}
                        {reservation.notes && <div className="mt-2 flex items-start gap-2 rounded-lg bg-[#FDFAF0] p-2.5 text-[12px] text-[#554240]"><Info size={15} className="mt-0.5 shrink-0 text-[#D4AF37]" /><span><b>Not:</b> {reservation.notes}</span></div>}
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => handleEdit(reservation)} className="rounded-full p-2 text-[#89726f] hover:bg-[#f1eee4] hover:text-[#4A0404]" title="Düzenle"><Edit size={16} /></button>
                        <button type="button" onClick={() => deleteReservation(reservation)} className="rounded-full p-2 text-[#89726f] hover:bg-red-50 hover:text-red-700" title="Sil"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    {reservation.status === 'pending' && (
                      <div className="mt-4 flex gap-2 border-t border-[#f1eee4] pt-3">
                        <button type="button" onClick={() => updateStatus(reservation.id, 'arrived')} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#4A0404] text-sm font-bold text-white"><CheckCircle2 size={17} /> Geldi</button>
                        <button type="button" onClick={() => handleSendMenu(reservation.phone)} className="flex h-10 w-11 items-center justify-center rounded-md border border-[#25D366] text-[#25D366]" title="WhatsApp"><MessageCircle size={17} /></button>
                        <button type="button" onClick={() => updateStatus(reservation.id, 'cancelled')} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-[#dcc0bd] text-sm font-bold text-[#554240]"><XCircle size={17} /> İptal</button>
                      </div>
                    )}

                    {reservation.status === 'arrived' && <div className="mt-3 text-xs font-bold text-green-700">✓ Misafir geldi</div>}
                    {reservation.status === 'cancelled' && <div className="mt-3 text-xs font-bold text-red-700">Rezervasyon iptal edildi</div>}
                  </article>
                );
              })}
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="space-y-7">
              <div className="flex flex-wrap gap-4 rounded-xl border border-[#D4AF37]/25 bg-white p-4 text-xs font-semibold text-[#554240] shadow-sm">
                <span className="flex items-center gap-2"><i className="h-3.5 w-3.5 rounded border border-[#D4AF37]/40 bg-white" /> Boş</span>
                <span className="flex items-center gap-2"><i className="h-3.5 w-3.5 rounded border border-[#D4AF37] bg-[#FDFAF0]" /> Rezerve</span>
                <span className="flex items-center gap-2"><i className="h-3.5 w-3.5 rounded bg-[#4A0404]" /> Geldi / Dolu</span>
                <span className="ml-auto text-[#89726f]">Masaya dokunarak rezervasyon başlatabilirsin.</span>
              </div>

              <TableSection title="SALON · V1 — V20" tables={currentTables.filter((t) => t.area === 'salon')} renderTableCard={renderTableCard} />
              <TableSection title="TERAS · T1 — T16" tables={currentTables.filter((t) => t.area === 'teras')} renderTableCard={renderTableCard} />
            </div>
          )}
        </section>
      </main>

      <nav className="fixed bottom-0 z-50 flex h-[72px] w-full items-center justify-around border-t border-[#D4AF37]/30 bg-[#FDFAF0] shadow-[0_-4px_24px_rgba(74,4,4,0.06)] md:hidden">
        <MobileNavButton active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} icon={<ListOrdered size={23} />} label="LİSTE" />
        <MobileNavButton active={activeTab === 'new'} onClick={() => { setEditingId(null); setFormData(emptyForm(selectedDate)); setActiveTab('new'); }} icon={<PlusCircle size={23} />} label="EKLE" />
        <MobileNavButton active={activeTab === 'tables'} onClick={() => setActiveTab('tables')} icon={<Layers size={23} />} label="MASALAR" />
        <MobileNavButton active={false} onClick={handleShiftReport} icon={<FileText size={23} />} label="RAPOR" />
      </nav>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#554240]">{label}</span>
      {children}
    </label>
  );
}

function TableSection({ title, tables, renderTableCard }) {
  return (
    <section>
      <h3 className="mb-3 border-b border-[#D4AF37]/20 pb-2 font-playfair text-lg font-semibold text-[#4A0404]">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {tables.map(renderTableCard)}
      </div>
    </section>
  );
}

function MobileNavButton({ active, onClick, icon, label }) {
  return (
    <button type="button" onClick={onClick} className={`flex flex-col items-center justify-center px-3 py-1 text-[10px] font-bold ${active ? 'text-[#4A0404]' : 'text-[#89726f]'}`}>
      {icon}
      <span className="mt-1">{label}</span>
    </button>
  );
}
