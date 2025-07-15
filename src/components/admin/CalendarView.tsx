'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dayjsLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '@/styles/calendar.css';
import { 
  DocumentTextIcon,
  RocketLaunchIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

// Set up the localizer and drag-and-drop
const localizer = dayjsLocalizer(dayjs);
const DnDCalendar = withDragAndDrop(Calendar);

// Extend the ScheduledPost interface to include newsletter and recurring content
export interface ScheduledContentItem {
  id: string;
  title: string;
  slug: string;
  scheduledDate: string;
  status: 'scheduled' | 'published' | 'failed';
  type: 'post' | 'project' | 'newsletter';
  author: string;
  excerpt?: string;
  recurringRuleId?: string;
  isRecurring?: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ScheduledContentItem;
  type: 'post' | 'project' | 'newsletter';
  isRecurring?: boolean;
}

interface CalendarViewProps {
  scheduledContent: ScheduledContentItem[];
  onReschedule: (contentId: string, newDate: string) => void;
  onEditContent: (content: ScheduledContentItem) => void;
  onDeleteContent: (contentId: string) => void;
  onPublishNow: (contentId: string) => void;
  onScheduleContent: (selectedDate?: Date) => void;
  loading?: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  scheduledContent,
  onReschedule,
  onEditContent,
  onDeleteContent,
  onPublishNow,
  onScheduleContent,
  loading = false
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeFilters, setActiveFilters] = useState({
    post: true,
    project: true,
    newsletter: true
  });

  // Convert scheduled content to calendar events
  const convertToEvents = useCallback((content: ScheduledContentItem[]): CalendarEvent[] => {
    return content.map(item => {
      const startDate = new Date(item.scheduledDate);
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes duration
      
      return {
        id: item.id,
        title: item.title,
        start: startDate,
        end: endDate,
        resource: item,
        type: item.type,
        isRecurring: item.isRecurring || false
      };
    });
  }, []);

  // Update events when scheduled content changes
  useEffect(() => {
    const calendarEvents = convertToEvents(scheduledContent);
    setEvents(calendarEvents);
    setFilteredEvents(calendarEvents);
  }, [scheduledContent, convertToEvents]);

  // Apply filters
  useEffect(() => {
    const filtered = events.filter(event => activeFilters[event.type]);
    setFilteredEvents(filtered);
  }, [events, activeFilters]);

  // Handle drag and drop event move
  const handleEventDrop = useCallback(async ({ event, start, end }: any) => {
    const contentItem = event.resource as ScheduledContentItem;
    const newDate = new Date(start);
    const now = new Date();
    
    // Validation: Can't schedule in the past
    if (newDate < now) {
      alert('Cannot schedule content in the past');
      return;
    }

    // Validation: Minimum 1 day notice
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (newDate < oneDayFromNow) {
      alert('Content must be scheduled at least 1 day in advance');
      return;
    }

    // Update the event immediately for UI feedback
    const updatedEvents = events.map(e => 
      e.id === event.id 
        ? { ...e, start: newDate, end: new Date(newDate.getTime() + 30 * 60 * 1000) }
        : e
    );
    setEvents(updatedEvents);

    // Call the parent handler to update the backend
    await onReschedule(contentItem.id, newDate.toISOString());
  }, [events, onReschedule]);

  // Handle event resize (optional - for adjusting event duration)
  const handleEventResize = useCallback(({ event, start, end }: any) => {
    const updatedEvents = events.map(e => 
      e.id === event.id 
        ? { ...e, start: new Date(start), end: new Date(end) }
        : e
    );
    setEvents(updatedEvents);
  }, [events]);

  // Handle slot selection (clicking on empty calendar slot)
  const handleSelectSlot = useCallback(({ start }: any) => {
    const selectedDate = new Date(start);
    const now = new Date();
    
    // Only allow scheduling in the future
    if (selectedDate >= now) {
      onScheduleContent(selectedDate);
    }
  }, [onScheduleContent]);

  // Handle event selection (clicking on existing event)
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    onEditContent(event.resource);
  }, [onEditContent]);

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const getEventStyle = (type: string, isRecurring: boolean = false) => {
      const baseStyles = 'text-white text-xs font-medium rounded px-1 py-0.5 flex items-center gap-1';
      const recurringIcon = isRecurring ? <ArrowPathIcon className="h-3 w-3" /> : null;
      
      switch (type) {
        case 'post':
          return {
            className: `${baseStyles} bg-blue-600`,
            icon: <DocumentTextIcon className="h-3 w-3" />,
            recurringIcon
          };
        case 'project':
          return {
            className: `${baseStyles} bg-green-600`,
            icon: <RocketLaunchIcon className="h-3 w-3" />,
            recurringIcon
          };
        case 'newsletter':
          return {
            className: `${baseStyles} bg-purple-600`,
            icon: <EnvelopeIcon className="h-3 w-3" />,
            recurringIcon
          };
        default:
          return {
            className: `${baseStyles} bg-gray-600`,
            icon: <DocumentTextIcon className="h-3 w-3" />,
            recurringIcon
          };
      }
    };

    const { className, icon, recurringIcon } = getEventStyle(event.type, event.isRecurring);
    
    return (
      <div className={className} title={`${event.title} - ${event.resource.status}`}>
        {icon}
        {recurringIcon}
        <span className="truncate">{event.title}</span>
      </div>
    );
  };

  // Filter toggle handlers
  const handleFilterToggle = (type: 'post' | 'project' | 'newsletter') => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Custom toolbar component
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    const label = () => {
      const date = dayjs(toolbar.date);
      return date.format('MMMM YYYY');
    };

    return (
      <div className="flex justify-between items-center mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {label()}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToBack}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              ←
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              Today
            </button>
            <button
              onClick={goToNext}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              →
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Content Type Filters */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-4 w-4 text-gray-500" />
            <button
              onClick={() => handleFilterToggle('post')}
              className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                activeFilters.post
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <DocumentTextIcon className="h-3 w-3" />
              Posts
            </button>
            <button
              onClick={() => handleFilterToggle('project')}
              className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                activeFilters.project
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <RocketLaunchIcon className="h-3 w-3" />
              Projects
            </button>
            <button
              onClick={() => handleFilterToggle('newsletter')}
              className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                activeFilters.newsletter
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <EnvelopeIcon className="h-3 w-3" />
              Newsletters
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 h-96 rounded-lg mb-4"></div>
        <div className="bg-gray-200 dark:bg-gray-700 h-8 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <DnDCalendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={Views.MONTH}
          views={[Views.MONTH]}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          selectable
          resizable
          dragFromOutsideItem={() => ({})}
          components={{
            event: EventComponent,
            toolbar: CustomToolbar
          }}
          eventPropGetter={(event) => ({
            className: 'calendar-event',
            style: {
              backgroundColor: 'transparent',
              border: 'none',
              padding: 0,
              margin: '1px 0'
            }
          })}
          dayPropGetter={(date) => {
            const today = new Date();
            const isToday = dayjs(date).isSame(today, 'day');
            const isPast = dayjs(date).isBefore(today, 'day');
            
            return {
              className: `calendar-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}`,
              style: {
                backgroundColor: isToday 
                  ? 'rgba(59, 130, 246, 0.1)' 
                  : isPast 
                  ? 'rgba(156, 163, 175, 0.1)' 
                  : 'transparent'
              }
            };
          }}
        />
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Legend</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
              <DocumentTextIcon className="h-2.5 w-2.5 text-white" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Posts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center">
              <RocketLaunchIcon className="h-2.5 w-2.5 text-white" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Projects</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-600 rounded flex items-center justify-center">
              <EnvelopeIcon className="h-2.5 w-2.5 text-white" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Newsletters</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Recurring Content</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          Calendar Instructions
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Click on any event to edit its details</li>
          <li>• Click on empty date slots to schedule new content</li>
          <li>• Drag and drop events to reschedule them</li>
          <li>• Use the filter buttons to show/hide content types</li>
          <li>• Content cannot be scheduled in the past or with less than 1 day notice</li>
        </ul>
      </div>
    </div>
  );
};

export default CalendarView; 