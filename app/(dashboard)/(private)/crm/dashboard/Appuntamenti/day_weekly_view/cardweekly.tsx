import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';

const supabase = createClient();

interface Order {
  id: string;
  nome: string;
  orarioInizio: string;
  orarioFine: string;
  data: string;
  color_card: string | null;
  prefer_card_style: string | null;
  team_id: string | null;
}

interface CardWeeklyProps {
  currentDate?: Date;
  teamMembers?: any[];
  selectedTeamMemberIds?: string[];
  hourHeight?: number;
}

const CardWeekly: React.FC<CardWeeklyProps> = ({ 
  currentDate = new Date(),
  teamMembers = [],
  selectedTeamMemberIds = [],
  hourHeight = 176
}) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      // Calculate start and end of the week for the current date
      const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday as start of week
      const endDate = endOfWeek(currentDate, { weekStartsOn: 1 }); // Sunday as end of week
      
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      console.log(`Fetching orders from ${formattedStartDate} to ${formattedEndDate}`);
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, nome, orarioInizio, orarioFine, data, color_card, prefer_card_style, team_id')
          .gte('data', formattedStartDate)
          .lte('data', formattedEndDate);

        if (error) {
          console.error('Error fetching orders:', error.message);
          return;
        }

        console.log(`Fetched ${data?.length || 0} orders:`, data);
        
        // Filter by selected team members if provided
        const filteredOrders = selectedTeamMemberIds.length > 0 
          ? data?.filter(order => order.team_id && selectedTeamMemberIds.includes(order.team_id))
          : data;
          
        console.log('Filtered orders:', filteredOrders);
        setOrders(filteredOrders || []);
      } catch (err) {
        console.error('Unexpected error:', err);
      }
    };

    fetchOrders();
  }, [currentDate, selectedTeamMemberIds]);

  // Calculate position for each order based on date and time
  const renderCards = () => {
    if (orders.length === 0) {
      console.log('No orders to display');
      return null;
    }

    // Group orders by day
    const ordersByDay = orders.reduce((acc, order) => {
      const day = order.data;
      if (!acc[day]) acc[day] = [];
      acc[day].push(order);
      return acc;
    }, {} as Record<string, Order[]>);

    // Get the week days
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array(7).fill(0).map((_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return format(date, 'yyyy-MM-dd');
    });

    // Header height and time column width
    const headerHeight = 60; // Approx header height in pixels
    const timeColWidth = 80; // Width of time column in pixels

    return (
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {weekDays.map((day, dayIndex) => {
          const dayOrders = ordersByDay[day] || [];
          
          // Calculate column width and position
          const columnWidth = `calc(100% / 7)`; // Equal width for 7 days
          
          return (
            <div 
              key={day} 
              className="absolute h-full pointer-events-none" 
              style={{
                width: columnWidth,
                left: `calc(${dayIndex} * (100% / 7) + ${dayIndex === 0 ? timeColWidth : 0}px)`,
                top: `${headerHeight}px`, // Start below the header
              }}
            >
              {dayOrders.map(order => {
                // Parse time values safely
                const startHour = parseInt(order.orarioInizio?.split(':')[0] || '0');
                const startMinute = parseInt(order.orarioInizio?.split(':')[1] || '0');
                const endHour = parseInt(order.orarioFine?.split(':')[0] || (startHour + 1).toString());
                const endMinute = parseInt(order.orarioFine?.split(':')[1] || '0');
                
                // Calculate position based on hourHeight
                const startTotalMinutes = startHour * 60 + startMinute;
                const endTotalMinutes = endHour * 60 + endMinute;
                
                // Position calculations
                const topPosition = (startTotalMinutes / 60) * hourHeight;
                const heightValue = ((endTotalMinutes - startTotalMinutes) / 60) * hourHeight;
                
                const teamMember = teamMembers.find(m => m.id === order.team_id);
                
                return (
                  <div
                    key={order.id}
                    style={{
                      position: 'absolute',
                      top: `${topPosition}px`,
                      height: `${heightValue}px`,
                      left: '5%',
                      width: '85%',
                      backgroundColor: order.color_card || '#4361ee',
                      border: order.prefer_card_style === 'neutral' ? '1px solid #ccc' : 'none',
                      borderRadius: '4px',
                      padding: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      overflow: 'hidden',
                      zIndex: 50,
                      pointerEvents: 'auto',
                    }}
                    className="order-card"
                  >
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                      {order.nome}
                    </h3>
                    <p style={{ margin: '0', fontSize: '12px', color: '#fff' }}>
                      {order.orarioInizio} - {order.orarioFine || ''}
                    </p>
                    {teamMember && (
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', fontStyle: 'italic', color: '#fff' }}>
                        {teamMember.name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="weekly-cards-container" style={{ 
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 25
    }}>
      {renderCards()}
    </div>
  );
};

export default CardWeekly;