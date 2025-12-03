import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Clock,
  Edit,
  Maximize2,
  X
} from 'lucide-react';
import {
  fetchDeliveryOrders,
  fetchDrivers,
  fetchUsers,
  updateDeliveryOrder,
  AppUser,
  Driver as ApiDriver,
  DeliveryOrder as ApiDeliveryOrder
} from '../lib/api';

// --- Types ---

interface ServiceOrder {
  id: number;
  osNumber: number;
  clientName: string;
  subject: string;
  address: string;
  reservationDate: string;
  periodLabel: string;
  periodColor: 'blue' | 'gray';
  driverId?: number | null;
  driverName?: string | null;
}

interface Driver {
  id: number;
  name: string;
  role: string;
}

interface Appointment {
  id: number | string;
  orderId: number;
  driverId: number;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  clientName: string;
  address: string;
  serviceType: string;
  status: 'pending' | 'completed' | 'conflict';
  dayOffset?: number;
  durationMinutes?: number;
}

type ViewMode = 'dayHour' | 'dayDriver' | 'threeDays' | 'week' | 'month';

interface Column {
  id: string;
  driverId: number | null;
}

// --- Helper Functions ---

const timeToMinutes = (time: string) => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Assuming grid starts at 06:00 and each hour is 80px height
const START_HOUR = 6;
const PIXELS_PER_HOUR = 100;
const MIN_DURATION = 30; // minutes
const MAX_DURATION = 780; // 13 hours * 60 min (matches grid height)

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const addDays = (date: Date, amount: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
};

const calculatePosition = (startTime: string, endTime: string) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const gridStartMinutes = START_HOUR * 60;

  const top = ((startMinutes - gridStartMinutes) / 60) * PIXELS_PER_HOUR;
  const height = ((endMinutes - startMinutes) / 60) * PIXELS_PER_HOUR;

  return { top, height };
};

const formatStatusLabel = (status?: string) => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'in_transit':
      return 'Em rota';
    case 'delivered':
      return 'Entregue';
    case 'cancelled':
      return 'Cancelada';
    default:
      return 'Ordem';
  }
};

const formatDriverStatus = (status?: string) => {
  switch (status) {
    case 'available':
      return 'Disponivel';
    case 'on_route':
      return 'Em rota';
    case 'unavailable':
      return 'Indisponivel';
    default:
      return '(terceirizado)';
  }
};

const formatRangeLabel = (start: Date, end: Date, rangeDays: number) => {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: rangeDays === 1 ? 'numeric' : undefined
  });

  if (rangeDays === 1) {
    return formatter.format(start);
  }

  const shortFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short'
  });
  return `${shortFormatter.format(start)} - ${shortFormatter.format(end)}`;
};

const getRangeDays = (viewMode: ViewMode) => {
  switch (viewMode) {
    case 'threeDays':
      return 3;
    case 'week':
      return 7;
    case 'month':
      return 30;
    default:
      return 1;
  }
};

const getPeriodBadge = (deadline?: string) => {
  if (!deadline) return { label: 'Qualquer', color: 'gray' as const };
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return { label: 'Qualquer', color: 'gray' as const };

  const hours = date.getHours();
  if (hours < 12) return { label: 'Manha', color: 'blue' as const };
  if (hours < 18) return { label: 'Tarde', color: 'blue' as const };
  return { label: 'Noite', color: 'gray' as const };
};

const formatTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const formatAddress = (order: ApiDeliveryOrder) => {
  const coords = order.dropoff_location?.coordinates;
  if (Array.isArray(coords) && coords.length === 2) {
    const [lon, lat] = coords;
    if (typeof lat === 'number' && typeof lon === 'number') {
      return `Lat ${lat.toFixed(5)}, Lon ${lon.toFixed(5)}`;
    }
  }
  return 'Endereco nao informado';
};

export default function ServiceBoardPage() {
  const navigate = useNavigate();
  const [deliveryOrders, setDeliveryOrders] = useState<ApiDeliveryOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [draggedOrder, setDraggedOrder] = useState<ServiceOrder | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>('dayDriver');
  const [loading, setLoading] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [showCalendarFilter, setShowCalendarFilter] = useState(false);
  const [showOsFilter, setShowOsFilter] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [durationByOrder, setDurationByOrder] = useState<Record<number, number>>(() => {
    try {
      const stored = localStorage.getItem('sb_durations');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [resizing, setResizing] = useState<{
    orderId: number;
    startY: number;
    startDuration: number;
    currentDuration: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersResponse, driversResponse, ordersResponse] = await Promise.all([
        fetchUsers(),
        fetchDrivers(),
        fetchDeliveryOrders()
      ]);

      const users = usersResponse.results || [];
      const apiDrivers = driversResponse.results || [];
      const apiOrders = ordersResponse.results || [];

      const driverData = apiDrivers.map((driver: ApiDriver) => {
        const user = users.find((u: AppUser) => u.id === driver.user);
        const fullName = `${(user?.first_name || '').trim()} ${(user?.last_name || '').trim()}`.trim();
        return {
          id: driver.id,
          name: fullName || user?.username || `Motorista #${driver.id}`,
          role: formatDriverStatus(driver.current_status)
        };
      });

      setDrivers(driverData);
      setDeliveryOrders(apiOrders);
      setColumns(prev => prev.length ? prev : driverData.map(d => ({ id: `col-${d.id}`, driverId: d.id })));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Falha ao carregar dados do quadro.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rangeDays = useMemo(() => getRangeDays(viewMode), [viewMode]);
  const rangeDates = useMemo(() => {
    const start = startOfDay(selectedDate);
    const end = endOfDay(addDays(start, rangeDays - 1));
    return { start, end };
  }, [selectedDate, rangeDays]);

  const filteredOrders = useMemo(() => {
    const search = filterSearch.trim().toLowerCase();
    const hasDateFilter = !!filterStartDate || !!filterEndDate;
    const startFilter = filterStartDate ? startOfDay(new Date(filterStartDate)) : rangeDates.start;
    const endFilter = filterEndDate ? endOfDay(new Date(filterEndDate)) : rangeDates.end;

    return deliveryOrders.filter(order => {
      // Date filter
      if (order.deadline) {
        const deadlineDate = new Date(order.deadline);
        if (!Number.isNaN(deadlineDate.getTime())) {
          if (hasDateFilter) {
            if (deadlineDate < startFilter || deadlineDate > endFilter) return false;
          } else if (deadlineDate < rangeDates.start || deadlineDate > rangeDates.end) {
            return false;
          }
        }
      } else if (hasDateFilter) {
        return false;
      }

      // Search filter
      if (search) {
        const text = `${order.client_name || ''} ${order.id} ${order.status || ''}`.toLowerCase();
        if (!text.includes(search)) return false;
      }
      return true;
    });
  }, [deliveryOrders, filterEndDate, filterSearch, filterStartDate, rangeDates.end, rangeDates.start]);

  // Mostra O.S. (com ou sem motorista) no painel esquerdo, respeitando filtros aplicados
  const unassignedOrders = useMemo<ServiceOrder[]>(() => {
    return filteredOrders
      .map(order => {
        const badge = getPeriodBadge(order.deadline);
        const reservationDate = order.deadline
          ? new Date(order.deadline).toLocaleDateString('pt-BR')
          : 'Sem prazo';
        const driverInfo = order.driver ? drivers.find(d => d.id === order.driver) : null;
        const driverName = driverInfo?.name;

        return {
          id: order.id,
          osNumber: order.id,
          clientName: order.client_name || 'Cliente',
          subject: `Assunto: ${formatStatusLabel(order.status)}`,
          address: formatAddress(order),
          reservationDate,
          periodLabel: badge.label,
          periodColor: badge.color,
          driverId: order.driver || null,
          driverName: driverName || (order.driver ? `Motorista #${order.driver}` : null)
        };
      });
  }, [drivers, filteredOrders]);

  const appointments = useMemo<Appointment[]>(() => {
    return filteredOrders
      .filter(order => order.driver)
      .map(order => {
        const deadline = order.deadline ? new Date(order.deadline) : startOfDay(rangeDates.start);
        if (!order.deadline) {
          deadline.setHours(8, 0, 0, 0);
        }
        const duration = durationByOrder[order.id] ?? 90;
        const endDate = new Date(deadline.getTime() + duration * 60 * 1000);
        const dayOffset = Math.max(
          0,
          Math.floor((startOfDay(deadline).getTime() - rangeDates.start.getTime()) / (1000 * 60 * 60 * 24))
        );

        let status: Appointment['status'] = 'pending';
        if (order.status === 'delivered') status = 'completed';
        if (order.status === 'cancelled') status = 'conflict';

        return {
          id: order.id,
          orderId: order.id,
          driverId: order.driver!,
          startTime: formatTime(deadline),
          endTime: formatTime(endDate),
          clientName: order.client_name,
          address: formatAddress(order),
          serviceType: `Ordem #${order.id} - ${formatStatusLabel(order.status)}`,
          status,
          dayOffset,
          durationMinutes: duration
        };
      });
  }, [durationByOrder, filteredOrders, rangeDates.start]);

  // --- Drag & Drop Logic ---

  const handleDragStart = (e: React.DragEvent, order: ServiceOrder) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAppointmentDragStart = (e: React.DragEvent, orderId: number) => {
    const order = deliveryOrders.find(o => o.id === orderId);
    if (!order) return;
    const badge = getPeriodBadge(order.deadline);
    const reservationDate = order.deadline
      ? new Date(order.deadline).toLocaleDateString('pt-BR')
      : 'Sem prazo';
    const driverInfo = order.driver ? drivers.find(d => d.id === order.driver) : null;

    setDraggedOrder({
      id: order.id,
      osNumber: order.id,
      clientName: order.client_name || 'Cliente',
      subject: `Assunto: ${formatStatusLabel(order.status)}`,
      address: formatAddress(order),
      reservationDate,
      periodLabel: badge.label,
      periodColor: badge.color,
      driverId: order.driver || null,
      driverName: driverInfo?.name || (order.driver ? `Motorista #${order.driver}` : null)
    });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleResizeStart = (e: React.MouseEvent, apt: Appointment) => {
    e.preventDefault();
    e.stopPropagation();
    const duration = apt.durationMinutes ?? 90;
    setResizing({
      orderId: apt.orderId,
      startY: e.clientY,
      startDuration: duration,
      currentDuration: duration
    });
  };

  const handleDurationChange = useCallback((orderId: number, minutes: number) => {
    setDurationByOrder(prev => {
      const next = { ...prev, [orderId]: minutes };
      try {
        localStorage.setItem('sb_durations', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!resizing) return;

    const handleMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizing.startY;
      const minutesDelta = Math.round(((deltaY / PIXELS_PER_HOUR) * 60) / 15) * 15;
      const nextDuration = Math.min(
        MAX_DURATION,
        Math.max(MIN_DURATION, resizing.startDuration + minutesDelta)
      );
      setResizing(prev => (prev ? { ...prev, currentDuration: nextDuration } : prev));
      setDurationByOrder(prev => ({ ...prev, [resizing.orderId]: nextDuration }));
    };

    const handleUp = () => {
      const finalDuration = resizing.currentDuration;
      setResizing(null);
      handleDurationChange(resizing.orderId, finalDuration);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp, { once: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [handleDurationChange, resizing]);

  const handleDrop = async (e: React.DragEvent, driverId: number | null, hour: number) => {
    e.preventDefault();
    if (!draggedOrder) return;

    const orderId = draggedOrder.id;
    const previousOrders = deliveryOrders;
    const startDate = startOfDay(selectedDate);
    startDate.setHours(hour, 0, 0, 0);
    const startIso = startDate.toISOString();

    setSavingOrderId(orderId);
    setDeliveryOrders(prev =>
      prev.map(order => (order.id === orderId ? { ...order, driver: driverId || null, deadline: startIso } : order))
    );

    try {
      await updateDeliveryOrder(orderId, { driver: driverId, deadline: startIso });
      await fetchData();
      setError(null);
    } catch (err) {
      console.error('Failed to update order:', err);
      setDeliveryOrders(previousOrders);
      setError('Nao foi possivel salvar a atribuicao.');
    } finally {
      setSavingOrderId(null);
      setDraggedOrder(null);
    }
  };

  const goToToday = () => setSelectedDate(startOfDay(new Date()));
  const goToPreviousDay = () => setSelectedDate(prev => startOfDay(addDays(prev, -1)));
  const goToNextDay = () => setSelectedDate(prev => startOfDay(addDays(prev, 1)));
  const handleViewChange = (mode: ViewMode) => setViewMode(mode);
  const handleClose = () => navigate('/dashboard');
  const handleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Generate hours for the grid sidebar (06:00 to 18:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + START_HOUR);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 text-slate-700 font-sans overflow-hidden">
      
      {/* --- Top Bar --- */}
      <header className="flex-none bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-2">
           <button
             onClick={goToToday}
             className="bg-slate-400 text-white px-3 py-1 rounded text-sm font-medium hover:bg-slate-500"
           >
             Hoje
           </button>
           <button
             onClick={goToPreviousDay}
             className="p-1 rounded hover:bg-slate-100 text-slate-500"
             aria-label="Dia anterior"
           >
             <ChevronLeft size={20}/>
           </button>
           <h1 className="text-xl font-bold text-slate-500 mx-4">
             {formatRangeLabel(rangeDates.start, rangeDates.end, rangeDays)}
           </h1>
           <button
             onClick={goToNextDay}
             className="p-1 rounded hover:bg-slate-100 text-slate-500"
             aria-label="Proximo dia"
           >
             <ChevronRight size={20}/>
           </button>
        </div>

        <div className="flex bg-slate-100 rounded-md p-0.5">
            <button
              onClick={() => handleViewChange('dayHour')}
              className={`px-3 py-1 text-sm font-medium rounded hover:bg-white hover:shadow-sm ${
                viewMode === 'dayHour' ? 'bg-[#3b5975] text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Dia/Hora
            </button>
            <button
              onClick={() => handleViewChange('dayDriver')}
              className={`px-3 py-1 text-sm font-medium rounded hover:bg-white hover:shadow-sm ${
                viewMode === 'dayDriver' ? 'bg-[#3b5975] text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Dia/Colaborador
            </button>
            <button
              onClick={() => handleViewChange('threeDays')}
              className={`px-3 py-1 text-sm font-medium rounded hover:bg-white hover:shadow-sm ${
                viewMode === 'threeDays' ? 'bg-[#3b5975] text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              3 dias
            </button>
            <button
              onClick={() => handleViewChange('week')}
              className={`px-3 py-1 text-sm font-medium rounded hover:bg-white hover:shadow-sm ${
                viewMode === 'week' ? 'bg-[#3b5975] text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => handleViewChange('month')}
              className={`px-3 py-1 text-sm font-medium rounded hover:bg-white hover:shadow-sm ${
                viewMode === 'month' ? 'bg-[#3b5975] text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Mes
            </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setColumns(prev => [...prev, { id: `col-${Date.now()}`, driverId: null }])}
            className="px-3 py-1 text-sm font-medium bg-slate-100 text-slate-600 rounded hover:bg-white hover:shadow-sm"
          >
            + Coluna
          </button>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
          </button>
        </div>
      </header>

      {/* --- Main Content Area --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* --- Left Sidebar (Order List) --- */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-10 shadow-lg">
          
          {/* Filters */}
          <div className="flex flex-col">
            <button
              onClick={() => setShowCalendarFilter(prev => !prev)}
              className="border-b border-slate-100 p-3 flex justify-between items-center hover:bg-slate-50 text-left"
            >
              <span className="font-bold text-slate-500 text-sm">Filtro Calendario</span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${showCalendarFilter ? 'rotate-180' : ''}`} />
            </button>
            {showCalendarFilter && (
              <div className="border-b border-slate-100 px-3 py-2 space-y-2 bg-slate-50">
                <label className="text-xs text-slate-500 font-semibold flex flex-col gap-1">
                  Data inicio
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="text-xs border border-slate-200 rounded px-2 py-1"
                  />
                </label>
                <label className="text-xs text-slate-500 font-semibold flex flex-col gap-1">
                  Data fim
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="text-xs border border-slate-200 rounded px-2 py-1"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                    className="flex-1 text-xs bg-white border border-slate-200 rounded px-2 py-1 hover:bg-slate-100"
                  >
                    Limpar datas
                  </button>
                  <button
                    onClick={() => setSelectedDate(filterStartDate ? startOfDay(new Date(filterStartDate)) : startOfDay(new Date()))}
                    className="flex-1 text-xs bg-[#3b5975] text-white rounded px-2 py-1 hover:bg-[#304a62]"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowOsFilter(prev => !prev)}
              className="border-b border-slate-100 p-3 flex justify-between items-center hover:bg-slate-50 text-left"
            >
              <span className="font-bold text-slate-500 text-sm">Filtro O.S</span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${showOsFilter ? 'rotate-180' : ''}`} />
            </button>
            {showOsFilter && (
              <div className="border-b border-slate-100 px-3 py-2 bg-slate-50 space-y-2">
                <label className="text-xs text-slate-500 font-semibold flex flex-col gap-1">
                  Buscar (cliente, status, ID)
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Ex: Maria, pending, 12"
                    className="text-xs border border-slate-200 rounded px-2 py-1"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterSearch('')}
                    className="flex-1 text-xs bg-white border border-slate-200 rounded px-2 py-1 hover:bg-slate-100"
                  >
                    Limpar filtro
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hint */}
          <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
             <p className="text-xs text-slate-500 font-medium">Dica : Para agendar, arraste uma O.S</p>
             <RefreshCw
               onClick={fetchData}
               size={14}
               className={`text-slate-400 cursor-pointer transition-transform ${loading ? 'animate-spin' : 'hover:rotate-180'}`}
             />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-medium px-3 py-2 border-b border-red-200">
              {error}
            </div>
          )}

          {savingOrderId && (
            <div className="bg-slate-50 text-slate-500 text-[11px] px-3 py-1 border-b border-slate-200">
              Salvando ordem #{savingOrderId}...
            </div>
          )}

          {/* List of Orders */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-[#f0f4f8]">
            {unassignedOrders.map(order => (
              <div 
                key={order.id}
                draggable
                onDragStart={(e) => handleDragStart(e, order)}
                className="bg-white p-3 rounded shadow-sm border-l-4 border-l-[#3b5975] border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative group"
              >
                <div className="text-xs font-bold text-slate-500 mb-1">
                  ID: <span className="text-slate-700">{order.osNumber}</span> Nome: <span className="uppercase text-slate-700 font-bold">{order.clientName}</span>
                </div>
                <div className="text-xs text-slate-600 mb-1 font-semibold">
                  Assunto: <span className="font-normal">{order.subject}</span>
                </div>
                <div className="text-xs text-slate-500 mb-2 truncate leading-tight">
                  Endereco: {order.address}
                </div>
                {order.driverName && (
                  <div className="text-[11px] text-slate-500 mb-2">
                    Motorista: <span className="font-semibold">{order.driverName}</span>
                  </div>
                )}
                <div className="text-xs text-slate-500 mb-2">
                  Data Reserva: <span className="font-semibold">{order.reservationDate}</span>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded text-white text-xs ${order.periodColor === 'blue' ? 'bg-[#5e7e9b]' : 'bg-[#7a8ca0]'}`}>
                    <Clock size={12} />
                    <span>{order.periodLabel}</span>
                  </div>
                  <button className="text-slate-400 hover:text-blue-600">
                    <Edit size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {unassignedOrders.length === 0 && (
                <div className="p-4 text-center text-slate-400 text-sm italic">
                    Nenhuma O.S. disponivel.
                </div>
            )}

            {loading && (
              <div className="p-3 text-center text-slate-400 text-xs">
                Atualizando dados...
              </div>
            )}
          </div>
        </aside>

        {/* --- Right Content (Scheduler Grid) --- */}
        <main className="flex-1 overflow-auto bg-white relative flex flex-col">
            
            {/* Header Row (Drivers) */}
            <div className="flex border-b border-slate-200 sticky top-0 bg-white z-20 min-w-max">
                {/* Time gutter header placeholder */}
                <div className="w-10 border-r border-slate-100 flex-shrink-0 bg-slate-50"></div>
                
                {columns.map(col => {
                  const driver = col.driverId ? drivers.find(d => d.id === col.driverId) : null;
                  return (
                    <div key={col.id} className="w-64 flex-shrink-0 p-3 border-r border-slate-100 text-center bg-slate-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-600 text-sm uppercase truncate">
                            {driver ? driver.name : 'Coluna vazia'}
                          </span>
                          <button
                            className="text-slate-400 hover:text-red-500 text-xs"
                            onClick={() => setColumns(prev => prev.filter(c => c.id !== col.id))}
                            title="Remover coluna"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <select
                          value={col.driverId ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newId = val ? Number(val) : null;
                            setColumns(prev => prev.map(c => c.id === col.id ? { ...c, driverId: newId } : c));
                          }}
                          className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-600 focus:outline-none"
                        >
                          <option value="">Sem motorista</option>
                          {drivers.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        <div className="text-xs text-slate-400 font-medium mt-1">{driver ? driver.role : ''}</div>
                    </div>
                  );
                })}
            </div>

            {/* Grid Body */}
            <div className="flex relative min-w-max" style={{ height: hours.length * PIXELS_PER_HOUR }}>
                
                {/* Time Columns (Gutter) */}
                <div className="w-10 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col text-xs text-slate-400 font-bold sticky left-0 z-10">
                    {hours.map(hour => (
                        <div key={hour} className="border-b border-slate-100 flex items-start justify-center pt-1" style={{ height: PIXELS_PER_HOUR }}>
                           {hour < 10 ? `0${hour}` : hour}
                        </div>
                    ))}
                </div>

                {/* Driver Columns */}
                {columns.map(col => {
                    const driver = col.driverId ? drivers.find(d => d.id === col.driverId) : null;
                    return (
                    <div 
                        key={col.id} 
                        className="w-64 flex-shrink-0 border-r border-slate-100 relative bg-slate-50/30"
                        onDragOver={handleDragOver}
                    >
                         {/* Background Grid Lines */}
                        {hours.map(hour => (
                            <div 
                                key={hour} 
                                className="border-b border-slate-100 w-full hover:bg-blue-50 transition-colors"
                                style={{ height: PIXELS_PER_HOUR }}
                                onDrop={(e) => handleDrop(e, driver ? driver.id : null, hour)}
                            ></div>
                        ))}

                        {/* Appointments */}
                        {driver &&
                          appointments.filter(apt => apt.driverId === driver.id).map(apt => {
                            const { top, height } = calculatePosition(apt.startTime, apt.endTime);
                            const isConflict = apt.status === 'conflict';
                            const isDone = apt.status === 'completed';
                            const bgColor = isConflict ? 'bg-red-50' : isDone ? 'bg-green-50' : 'bg-[#eef6fc]';
                            const borderColor = isConflict ? 'border-red-400' : isDone ? 'border-green-500' : 'border-[#4a90e2]';
                            
                            return (
                                <div 
                                    key={apt.id}
                                    draggable
                                    onDragStart={(e) => handleAppointmentDragStart(e, apt.orderId)}
                                    className={`absolute left-1 right-1 rounded border-l-4 shadow-sm p-1.5 overflow-hidden text-xs flex flex-col group hover:z-30 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${bgColor} ${borderColor}`}
                                    style={{ top: `${top}px`, height: `${height - 2}px` }} // -2 for margin
                                >
                                    <div className="flex items-center text-slate-500 font-bold mb-0.5">
                                        <Clock size={10} className="mr-1" />
                                        {apt.startTime} - {apt.endTime}
                                    </div>
                                    {apt.dayOffset !== undefined && apt.dayOffset > 0 && (
                                      <div className="text-[10px] text-slate-500 font-semibold mb-0.5">
                                        D+{apt.dayOffset}
                                      </div>
                                    )}
                                    <div className="text-slate-600 leading-tight mb-0.5 truncate">
                                        {apt.address}
                                    </div>
                                    <div className="text-slate-500 mb-0.5 truncate">
                                        {apt.serviceType}::{apt.clientName}
                                    </div>
                                    {/* Drag handle to resize duration */}
                                    <div
                                      className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize bg-slate-400/30 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onMouseDown={(e) => handleResizeStart(e, apt)}
                                      title="Arraste para ajustar a duração"
                                    ></div>
                                </div>
                            );
                          })}
                    </div>
                )})}
            </div>

            {/* Floating Action Button (Optional, seen in some kanbans) */}
            <div className="absolute bottom-6 right-6 z-40">
                <button
                  onClick={handleFullscreen}
                  className="bg-[#5e6e7d] hover:bg-[#4a5a69] text-white p-3 rounded shadow-lg"
                  title="Expandir grade"
                >
                    <Maximize2 size={20} />
                </button>
            </div>
        </main>
      </div>
    </div>
  );
}
