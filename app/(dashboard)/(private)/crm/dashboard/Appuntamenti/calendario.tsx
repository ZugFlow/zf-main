import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function Calendar() {
    const handleDateClick = (info: { dateStr: string }) => {
        alert(`Clicked on: ${info.dateStr}`);
    };

    return (
        <div className="container mx-auto p-4">
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                editable={true}
                selectable={true}
                events={[
                    { title: 'Evento 1', date: '2025-01-15' },
                    { title: 'Evento 2', date: '2025-01-20' },
                ]}
                dateClick={handleDateClick}
            />
        </div>
    );
}
