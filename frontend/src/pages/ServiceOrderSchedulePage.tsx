import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  RefreshCw, 
  Clock, 
  Edit, 
  Maximize2,
  Calendar as CalendarIcon,
  Filter,
  X
} from 'lucide-react';

// --- Types ---

interface ServiceOrder {
  id: string;
  osNumber: number;
  clientName: string;
  subject: string;
  address: string;
  details: string;
  reservationDate: string;
  periodLabel: string; // e.g., "Qualquer", "Tarde"
  periodColor: 'blue' | 'gray';
}

interface Driver {
  id: string;
  name: string;
  role: string; // e.g., "(terceirizado)"
}

interface Appointment {
  id: string;
  orderId: string;
  driverId: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  clientName: string;
  address: string;
  serviceType: string;
  status: 'pending' | 'completed' | 'conflict';
}

// --- Mock Data (Based on the image) ---

const MOCK_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Alex Sandro Dos Santos', role: '(terceirizado)' },
  { id: 'd2', name: 'GRACILIANO', role: '(terceirizado)' },
  { id: 'd3', name: 'David Martins', role: '(terceirizado)' },
  { id: 'd4', name: 'Matheus Telles', role: '(terceirizados)' },
];

const INITIAL_UNASSIGNED: ServiceOrder[] = [
  {
    id: 'os1',
    osNumber: 53291,
    clientName: 'TEREZA CRISTINA DE ALBERGARIA',
    subject: 'Instalação fibra (Externo)',
    address: 'Aventureiro 89225-195 Rua Araraquara Apartamento 16, 122',
    details: 'Sem reserva',
    reservationDate: 'Sem reserva',
    periodLabel: 'Qualquer',
    periodColor: 'gray'
  },
  {
    id: 'os2',
    osNumber: 55534,
    clientName: 'MARCELO CESAR PEREIRA',
    subject: 'Instalação fibra (Externo)',
    address: 'Comasa 89228-200 Rua João Ebert, 1089',
    details: 'Data Reserva: 02/03/2020',
    reservationDate: '02/03/2020',
    periodLabel: 'Tarde',
    periodColor: 'blue'
  },
  {
    id: 'os3',
    osNumber: 55411,
    clientName: 'JUSCILENE ARAUJO CRUZ',
    subject: 'Instalação fibra (Externo)',
    address: 'Jardim Iririú 89224-045 Rua Professor Alfredo Moreira, 834',
    details: 'Data Reserva: 02/03/2020',
    reservationDate: '02/03/2020',
    periodLabel: 'Manhã',
    periodColor: 'gray'
  }
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  // Alex Sandro's items
  {
    id: 'apt1',
    orderId: 'existing1',
    driverId: 'd1',
    startTime: '08:30',
    endTime: '10:00',
    clientName: 'LAILA JULIANA DA SILVA',
    address: 'Aventureiro 89226-020 Rua David Thomas Pereira, 850',
    serviceType: 'Instalação rádio (Externo)',
    status: 'pending'
  },
  {
    id: 'apt2',
    orderId: 'existing2',
    driverId: 'd1',
    startTime: '10:30',
    endTime: '12:00',
    clientName: 'LUCIA',
    address: 'Jardim Iririú 89224-490 Rua Doutor Alisson Magno Cidral',
    serviceType: 'Instalação rádio (Externo)',
    status: 'pending'
  },
  {
    id: 'apt3',
    orderId: 'existing3',
    driverId: 'd1',
    startTime: '14:00',
    endTime: '15:30',
    clientName: 'MARISTELA STEIL DA SILVA',
    address: 'Iriú 89227-045 Rua Iririú, 3513',
    serviceType: 'Migração',
    status: 'pending'
  },
  // Graciliano's items
  {
    id: 'apt4',
    orderId: 'existing4',
    driverId: 'd2',
    startTime: '08:30',
    endTime: '10:00',
    clientName: 'JANETE MARIA SOARES',
    address: 'Comasa 89228-450 Rua Marítima, 39',
    serviceType: 'Instalação fibra (Externo)',
    status: 'pending'
  },
  {
    id: 'apt5',
    orderId: 'existing5',
    driverId: 'd2',
    startTime: '14:00',
    endTime: '18:00',
    clientName: 'MARCIO HOLZ JUNIOR',
    address: 'Comasa 89228-261 Rua Ataulfo Alves, 1050',
    serviceType: 'Instalação fibra (Externo)',
    status: 'pending'
  },
   // David's items
   {
    id: 'apt6',
    orderId: 'existing6',
    driverId: 'd3',
    startTime: '08:30',
    endTime: '10:00',
    clientName: 'VALDIR DE JESUS DOS SANTOS',
    address: 'Jardim Iririú 89224-391 Rua Evanildo de Oliveira',
    serviceType: 'Migração',
    status: 'pending'
  },
  {
    id: 'apt7',
    orderId: 'existing7',
    driverId: 'd3',
    startTime: '10:30',
    endTime: '12:00',
    clientName: 'JULIANO VICENTE DA SILVA',
    address: 'Aventureiro 89225-835 Rua Ubirajara Araújo, 218',
    serviceType: 'Instalação fibra (Externo)',
    status: 'conflict' // Just to show different styling
  },
  // Matheus's items
  {
    id: 'apt8',
    orderId: 'existing8',
    driverId: 'd4',
    startTime: '08:30',
    endTime: '10:00',
    clientName: 'GILSOMAR DE ALMEIDA',
    address: 'Jardim Iririú 89224-071 Rua Frontin, 2022',
    serviceType: 'Instalação fibra (Externo)',
    status: 'pending'
  },
  {
    id: 'apt9',
    orderId: 'existing9',
    driverId: 'd4',
    startTime: '10:30',
    endTime: '12:00',
    clientName: 'ORLANDO FERNANDES DIAS',
    address: 'Jardim Iririú 89224-025 Rua Uruguaiana, 975',
    serviceType: 'Instalação fibra (Externo)',
    status: 'pending'
  }
];

// --- Helper Functions ---

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Assuming grid starts at 06:00 and each hour is 80px height
const START_HOUR = 6;
const PIXELS_PER_HOUR = 100;

const calculatePosition = (startTime: string, endTime: string) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const gridStartMinutes = START_HOUR * 60;

  const top = ((startMinutes - gridStartMinutes) / 60) * PIXELS_PER_HOUR;
  const height = ((endMinutes - startMinutes) / 60) * PIXELS_PER_HOUR;

  return { top, height };
};

export default function ServiceOrderSchedulePage() {
  const [unassignedOrders, setUnassignedOrders] = useState<ServiceOrder[]>(INITIAL_UNASSIGNED);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [draggedOrder, setDraggedOrder] = useState<ServiceOrder | null>(null);

  // --- Drag & Drop Logic ---

  const handleDragStart = (e: React.DragEvent, order: ServiceOrder) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
    // Create a ghost image if desired, but default is usually fine
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, driverId: string, hour: number) => {
    e.preventDefault();
    if (!draggedOrder) return;

    // Default duration 1.5 hours for dropped items
    const startH = hour < 10 ? `0${hour}` : `${hour}`;
    const endHVal = hour + 1; 
    const endMinVal = 30; // 1.5h duration
    const endH = Math.floor(hour + 1.5) < 10 ? `0${Math.floor(hour + 1.5)}` : `${Math.floor(hour + 1.5)}`;
    const endM = (hour + 1.5) % 1 === 0.5 ? '30' : '00';

    const newAppointment: Appointment = {
      id: `new_${Date.now()}`,
      orderId: draggedOrder.id,
      driverId,
      startTime: `${startH}:00`,
      endTime: `${endH}:${endM}`,
      clientName: draggedOrder.clientName,
      address: draggedOrder.address,
      serviceType: draggedOrder.subject,
      status: 'pending'
    };

    setAppointments([...appointments, newAppointment]);
    setUnassignedOrders(unassignedOrders.filter(o => o.id !== draggedOrder.id));
    setDraggedOrder(null);
  };

  // Generate hours for the grid sidebar (06:00 to 18:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + START_HOUR);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 text-slate-700 font-sans overflow-hidden">
      
      {/* --- Top Bar --- */}
      <header className="flex-none bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-2">
           <button className="bg-slate-400 text-white px-3 py-1 rounded text-sm font-medium hover:bg-slate-500">Hoje</button>
           <button className="p-1 rounded hover:bg-slate-100 text-slate-500"><ChevronLeft size={20}/></button>
           <h1 className="text-xl font-bold text-slate-500 mx-4">2 de março de 2020</h1>
           <button className="p-1 rounded hover:bg-slate-100 text-slate-500"><ChevronRight size={20}/></button>
        </div>

        <div className="flex bg-slate-100 rounded-md p-0.5">
            <button className="px-3 py-1 text-sm font-medium text-slate-500 rounded hover:bg-white hover:shadow-sm">Dia/Hora</button>
            <button className="px-3 py-1 text-sm font-medium bg-[#3b5975] text-white rounded shadow-sm">Dia/Colaborador</button>
            <button className="px-3 py-1 text-sm font-medium text-slate-500 rounded hover:bg-white hover:shadow-sm">3 dias</button>
            <button className="px-3 py-1 text-sm font-medium text-slate-500 rounded hover:bg-white hover:shadow-sm">Semana</button>
            <button className="px-3 py-1 text-sm font-medium text-slate-500 rounded hover:bg-white hover:shadow-sm">Mês</button>
        </div>

        <button className="text-slate-400 hover:text-slate-600">
            <X size={20} />
        </button>
      </header>

      {/* --- Main Content Area --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* --- Left Sidebar (Order List) --- */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-10 shadow-lg">
          
          {/* Filters */}
          <div className="flex flex-col">
            <div className="border-b border-slate-100 p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50">
              <span className="font-bold text-slate-500 text-sm">Filtro Calendário</span>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
            <div className="border-b border-slate-100 p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50">
              <span className="font-bold text-slate-500 text-sm">Filtro O.S</span>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
          </div>

          {/* Hint */}
          <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
             <p className="text-xs text-slate-500 font-medium">Dica : Para agendar, arraste uma O.S</p>
             <RefreshCw size={14} className="text-slate-400 cursor-pointer hover:rotate-180 transition-transform" />
          </div>

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
                  Endereço: {order.address}
                </div>
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
                    Nenhuma O.S. disponível.
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
                
                {MOCK_DRIVERS.map(driver => (
                    <div key={driver.id} className="w-64 flex-shrink-0 p-3 border-r border-slate-100 text-center bg-slate-50">
                        <div className="font-bold text-slate-600 text-sm uppercase truncate">{driver.name}</div>
                        <div className="text-xs text-slate-400 font-medium">{driver.role}</div>
                    </div>
                ))}
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
                {MOCK_DRIVERS.map(driver => (
                    <div 
                        key={driver.id} 
                        className="w-64 flex-shrink-0 border-r border-slate-100 relative bg-slate-50/30"
                        onDragOver={handleDragOver}
                    >
                         {/* Background Grid Lines */}
                        {hours.map(hour => (
                            <div 
                                key={hour} 
                                className="border-b border-slate-100 w-full hover:bg-blue-50 transition-colors"
                                style={{ height: PIXELS_PER_HOUR }}
                                onDrop={(e) => handleDrop(e, driver.id, hour)}
                            ></div>
                        ))}

                        {/* Appointments */}
                        {appointments.filter(apt => apt.driverId === driver.id).map(apt => {
                            const { top, height } = calculatePosition(apt.startTime, apt.endTime);
                            // Visual variation for conflicts or specific status
                            const isConflict = apt.status === 'conflict';
                            const bgColor = isConflict ? 'bg-slate-300' : 'bg-[#eef6fc]';
                            const borderColor = isConflict ? 'border-slate-400' : 'border-[#4a90e2]';
                            
                            return (
                                <div 
                                    key={apt.id}
                                    className={`absolute left-1 right-1 rounded border-l-4 shadow-sm p-1.5 overflow-hidden text-xs flex flex-col group hover:z-30 hover:shadow-md transition-all cursor-pointer ${bgColor} ${borderColor}`}
                                    style={{ top: `${top}px`, height: `${height - 2}px` }} // -2 for margin
                                >
                                    <div className="flex items-center text-slate-500 font-bold mb-0.5">
                                        <Clock size={10} className="mr-1" />
                                        {apt.startTime} - {apt.endTime}
                                    </div>
                                    <div className="text-slate-600 leading-tight mb-0.5 truncate">
                                        {apt.address}
                                    </div>
                                    <div className="text-slate-500 mb-0.5 truncate">
                                        {apt.serviceType}::{apt.clientName}
                                    </div>
                                    
                                    {/* Hover Actions (Optional polish) */}
                                    <div className="hidden group-hover:flex absolute top-1 right-1 bg-white/80 rounded p-0.5">
                                        <Maximize2 size={12} className="text-slate-600" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Floating Action Button (Optional, seen in some kanbans) */}
            <div className="absolute bottom-6 right-6 z-40">
                <button className="bg-[#5e6e7d] hover:bg-[#4a5a69] text-white p-3 rounded shadow-lg">
                    <Maximize2 size={20} />
                </button>
            </div>
        </main>
      </div>
    </div>
  );
}
