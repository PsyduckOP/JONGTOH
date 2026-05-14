import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  Hash
} from 'lucide-react';

const API_URL = 'http://localhost:3000';
const socket: Socket = io(API_URL);

interface Table {
  id: number;
  number: string;
  status: string;
}

interface Booking {
  id: number;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  specialRequests: string;
  status: string;
  table: { number: string };
  startTime: string;
  createdAt: string;
}

const AdminPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, available: 0, reserved: 0 });

  useEffect(() => {
    document.title = 'backend';
    fetchData();
    socket.on('table_updated', fetchData);
    return () => { socket.off('table_updated'); };
  }, []);

  const fetchData = async () => {
    try {
      const [resTables, resBookings] = await Promise.all([
        axios.get(`${API_URL}/tables`),
        axios.get(`${API_URL}/bookings`)
      ]);
      const data = resTables.data;
      setTables(data);
      setBookings(resBookings.data);
      setStats({
        total: data.length,
        available: data.filter((t: any) => t.status === 'available').length,
        reserved: data.filter((t: any) => t.status === 'reserved').length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clearTable = async (id: number) => {
    try {
      await axios.post(`${API_URL}/tables/${id}/clear`);
      fetchData();
    } catch (error) {
      alert('Error clearing table');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white p-8">
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="text-blue-500" />
            JONGTOH Admin
          </h1>
          <p className="text-gray-500 mt-1">จัดการสถานะโต๊ะและการจองทั้งหมด</p>
        </div>
        <button 
          onClick={fetchData}
          className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'โต๊ะทั้งหมด', value: stats.total, color: 'text-white' },
            { label: 'ว่างอยู่', value: stats.available, color: 'text-emerald-400' },
            { label: 'จองแล้ว', value: stats.reserved, color: 'text-amber-400' }
          ].map((s) => (
            <div key={s.label} className="glass-card p-8 border-white/5">
              <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">{s.label}</p>
              <p className={`text-5xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tables Management */}
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Hash size={20} className="text-blue-500" />
          การจัดการสถานะโต๊ะรายบุคคล
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {tables.map((table) => (
              <motion.div
                key={table.id}
                layout
                className="glass-card p-6 flex justify-between items-center group"
              >
                <div>
                  <h3 className="text-xl font-bold">โต๊ะ {table.number}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      table.status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    <span className="text-sm text-gray-400 capitalize">{table.status}</span>
                  </div>
                </div>

                {table.status !== 'available' && (
                  <button 
                    onClick={() => clearTable(table.id)}
                    className="p-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all duration-300 flex items-center gap-2"
                  >
                    <Trash2 size={20} />
                    <span className="font-bold">เคลียร์โต๊ะ</span>
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Recent Bookings */}
        <div className="mt-16">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <User size={20} className="text-emerald-500" />
            รายละเอียดการจองล่าสุด
          </h2>
          
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5 text-gray-400 text-sm">
                    <th className="p-6 font-bold whitespace-nowrap">เวลาที่จอง</th>
                    <th className="p-6 font-bold whitespace-nowrap">รหัส/โต๊ะ</th>
                    <th className="p-6 font-bold whitespace-nowrap">ข้อมูลลูกค้า</th>
                    <th className="p-6 font-bold whitespace-nowrap">ความต้องการพิเศษ</th>
                    <th className="p-6 font-bold whitespace-nowrap">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-6">
                        <div className="text-sm font-bold">{new Date(booking.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-xs text-gray-500">{new Date(booking.startTime).toLocaleDateString('th-TH')}</div>
                      </td>
                      <td className="p-6">
                        <div className="text-blue-400 font-bold mb-1">{booking.bookingCode}</div>
                        <div className="text-sm text-gray-400">โต๊ะ {booking.table?.number || '-'}</div>
                      </td>
                      <td className="p-6">
                        <div className="font-bold">{booking.customerName}</div>
                        <div className="text-sm text-gray-400">{booking.customerPhone}</div>
                        {booking.customerEmail && <div className="text-xs text-gray-500">{booking.customerEmail}</div>}
                      </td>
                      <td className="p-6">
                        <div className="text-sm text-amber-400 max-w-[200px] truncate" title={booking.specialRequests}>
                          {booking.specialRequests || '-'}
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                          booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        ยังไม่มีข้อมูลการจองในระบบ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-gray-600 text-sm">
        <p>© 2026 JONGTOH Control Center. Authorized Personnel Only.</p>
      </footer>
    </div>
  );
};

export default AdminPage;
