import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminPage from './AdminPage';
import { 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar, 
  ChevronRight,
  Coffee,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';

const API_URL = 'http://localhost:3000';
const socket: Socket = io(API_URL);

interface Table {
  id: number;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'pending';
}

const CustomerPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [activeBooking, setActiveBooking] = useState<{ id: number; tableNumber: string } | null>(null);

  // Modal & Form States
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('11:00');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    document.title = 'frontend';
    
    // Get or create Device ID
    let id = localStorage.getItem('jongtoh_device_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('jongtoh_device_id', id);
    }
    setDeviceId(id);

    // Get active booking from storage
    const savedBooking = localStorage.getItem('jongtoh_active_booking');
    if (savedBooking) {
      setActiveBooking(JSON.parse(savedBooking));
    }

    fetchTables();

    socket.on('table_updated', ({ tableId, status }) => {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status } : t))
      );
    });

    socket.on('booking_confirmed', (booking) => {
      if (booking.deviceId === localStorage.getItem('jongtoh_device_id')) {
        const bookingData = { id: booking.id, tableNumber: booking.table.number };
        setActiveBooking(bookingData);
        localStorage.setItem('jongtoh_active_booking', JSON.stringify(bookingData));
      }
      setBookingMessage(`จองโต๊ะ ${booking.table.number} สำเร็จแล้ว! รหัสของคุณคือ ${booking.bookingCode}`);
      setTimeout(() => setBookingMessage(null), 8000);
    });

    return () => {
      socket.off('table_updated');
      socket.off('booking_confirmed');
    };
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tables`);
      setTables(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError('ไม่สามารถดึงข้อมูลโต๊ะได้ กรุณาตรวจสอบการเชื่อมต่อกับระบบหลังบ้าน');
    } finally {
      setLoading(false);
    }
  };

  const openBookingModal = (table: Table) => {
    if (activeBooking) {
      setBookingMessage('คุณมีการจองโต๊ะอยู่แล้ว ไม่สามารถจองเพิ่มได้');
      setTimeout(() => setBookingMessage(null), 5000);
      return;
    }
    if (table.status !== 'available') return;
    setSelectedTable(table);
    setShowModal(true);
  };

  const closeBookingModal = () => {
    setShowModal(false);
    setSelectedTable(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setSpecialRequests('');
    setBookingDate(new Date().toISOString().split('T')[0]);
    setBookingTime('11:00');
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;

    const tableId = selectedTable.id;
    const startDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 90 * 60000); // +1.5h

    setShowModal(false);

    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status: 'pending' } : t))
    );

    try {
      await axios.post(`${API_URL}/bookings`, {
        tableId,
        customerName,
        customerPhone,
        customerEmail,
        specialRequests,
        deviceId,
        startTime: startDateTime,
        endTime: endDateTime,
      });
      closeBookingModal();
    } catch (error: any) {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: 'available' } : t))
      );
      setBookingMessage(error.response?.data?.message || 'การจองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      setTimeout(() => setBookingMessage(null), 5000);
    }
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeBooking) return;

    try {
      await axios.post(`${API_URL}/bookings/${activeBooking.id}/cancel`, { deviceId });
      setActiveBooking(null);
      localStorage.removeItem('jongtoh_active_booking');
      setBookingMessage('ยกเลิกการจองเรียบร้อยแล้ว');
      setTimeout(() => setBookingMessage(null), 3000);
      fetchTables();
    } catch (error: any) {
      setBookingMessage(error.response?.data?.message || 'ไม่สามารถยกเลิกการจองได้');
      setTimeout(() => setBookingMessage(null), 5000);
    }
  };

  return (
    <div className="min-h-screen text-white selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Coffee size={28} className="text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                JONGTOH
              </h1>
            </div>
            <p className="text-gray-400 text-lg max-w-md">
              จองโต๊ะร้านอาหารที่คุณชอบได้ง่ายๆ แบบเรียลไทม์ พร้อมระบบคิวอัจฉริยะ
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-wrap gap-6 bg-white/5 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10"
          >
            {[
              { label: 'ว่าง', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/40' },
              { label: 'จองแล้ว', color: 'bg-amber-500', shadow: 'shadow-amber-500/40' },
              { label: 'ไม่ว่าง', color: 'bg-red-500', shadow: 'shadow-red-500/40' }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color} ${item.shadow} shadow-sm`} />
                <span className="text-sm font-medium text-gray-300">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </header>

        {/* Notifications */}
        <AnimatePresence>
          {bookingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 glass-card px-8 py-5 flex items-center gap-4 border-blue-500/30 shadow-2xl min-w-[320px]"
            >
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Sparkles className="text-blue-400" size={20} />
              </div>
              <p className="text-white font-medium pr-4">{bookingMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        <main>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <RefreshCw className="animate-spin text-blue-500 mb-6" size={48} />
              <p className="text-gray-400 text-xl font-medium">กำลังเตรียมแผนผังโต๊ะ...</p>
            </div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-16 text-center max-w-2xl mx-auto border-red-500/20"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <AlertCircle className="text-red-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">เกิดข้อผิดพลาด</h2>
              <p className="text-gray-400 mb-10 text-lg leading-relaxed">{error}</p>
              <button 
                onClick={fetchTables}
                className="px-10 py-4 bg-white text-black font-bold rounded-2xl hover:bg-blue-500 hover:text-white transition-all duration-300 active:scale-95 flex items-center gap-3 mx-auto"
              >
                <RefreshCw size={20} />
                ลองใหม่อีกครั้ง
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {tables.map((table, index) => (
                  <motion.div
                    key={table.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={table.status === 'available' ? { y: -8 } : {}}
                    onClick={() => openBookingModal(table)}
                    className={`glass-card p-8 group relative ${
                      table.status === 'available' && !activeBooking ? 'cursor-pointer' : 'cursor-not-allowed grayscale-[0.5]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-10">
                      <div className="relative">
                        <span className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1 block">TABLE</span>
                        <h3 className="text-4xl font-black text-white">{table.number}</h3>
                      </div>
                      
                      <div className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-tighter shadow-lg ${
                        table.status === 'available' ? 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/10' :
                        table.status === 'reserved' ? 'bg-amber-500/20 text-amber-400 shadow-amber-500/10' :
                        table.status === 'pending' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                        'bg-red-500/20 text-red-400 shadow-red-500/10'
                      }`}>
                        {table.status === 'available' ? 'ว่าง' :
                         table.status === 'reserved' ? 'จองแล้ว' :
                         table.status === 'pending' ? 'กำลังจอง' :
                         'ไม่ว่าง'}
                      </div>
                    </div>

                    <div className="space-y-4 mb-10">
                      <div className="flex items-center gap-3 text-gray-400">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <Users size={16} />
                        </div>
                        <span className="font-medium">{table.capacity} ที่นั่ง</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <Clock size={16} />
                        </div>
                        <span className="font-medium">จำกัด 1.5 ชม.</span>
                      </div>
                    </div>

                    {table.status === 'available' && !activeBooking ? (
                      <div className="flex items-center justify-between group-hover:text-blue-400 transition-colors">
                        <span className="text-sm font-bold uppercase tracking-wider">กดเพื่อจองโต๊ะ</span>
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    ) : activeBooking && activeBooking.tableNumber === table.number ? (
                      <button 
                        onClick={handleCancel}
                        className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl transition-all border border-red-500/20 flex items-center justify-center gap-2"
                      >
                        <AlertCircle size={18} />
                        ยกเลิกการจอง
                      </button>
                    ) : (
                      <div className="h-5" /> // Spacer
                    )}

                    {/* Gradient Overlay for hover */}
                    {table.status === 'available' && (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>

        {/* Booking Modal */}
        <AnimatePresence>
          {showModal && selectedTable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
              onClick={closeBookingModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-card w-full max-w-xl p-8 relative max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={closeBookingModal}
                  className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>

                <div className="mb-8">
                  <h2 className="text-3xl font-black text-white mb-2">จองโต๊ะ {selectedTable.number}</h2>
                  <p className="text-gray-400">กรุณากรอกข้อมูลเพื่อยืนยันการจอง</p>
                </div>

                <form onSubmit={submitBooking} className="space-y-6">
                  {/* Date & Time Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-300">วันที่</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="date" 
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-300">เวลา (ระบุช่วงเวลาว่าง)</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                          required
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                        >
                          <option value="11:00">11:00 - 12:30</option>
                          <option value="12:30">12:30 - 14:00</option>
                          <option value="14:00">14:00 - 15:30</option>
                          <option value="17:00">17:00 - 18:30</option>
                          <option value="18:30">18:30 - 20:00</option>
                          <option value="20:00">20:00 - 21:30</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-300">ชื่อผู้จอง <span className="text-red-400">*</span></label>
                      <input 
                        type="text" 
                        required
                        placeholder="ชื่อ-นามสกุล"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-300">เบอร์โทรศัพท์ <span className="text-red-400">*</span></label>
                        <input 
                          type="tel" 
                          required
                          placeholder="08X-XXX-XXXX"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-300">อีเมล</label>
                        <input 
                          type="email" 
                          placeholder="example@email.com (ไม่บังคับ)"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-300">ความต้องการพิเศษ</label>
                    <textarea 
                      rows={3}
                      placeholder="เช่น แพ้อาหารทะเล, ขอเก้าอี้เด็ก, ต้องการวีลแชร์"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 mt-4 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all active:scale-[0.98]"
                  >
                    ยืนยันการจองโต๊ะ
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ระบบเชื่อมต่อเรียลไทม์ปกติ</span>
          </div>
          <p>© 2026 JONGTOH Premium Reservation System.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">ข้อกำหนดการใช้งาน</a>
            <a href="#" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
