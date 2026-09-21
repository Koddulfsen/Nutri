'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  format,
  parseISO,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday as checkIsToday,
  isSameDay,
  isValid,
} from 'date-fns';

export interface WeekDay {
  date: string;
  dayName: string;
  dayNumber: number;
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  monthName: string;
}

interface UseDateNavigationOptions {
  initialDate?: string;
}

interface UseDateNavigationReturn {
  selectedDate: string;
  selectedDateObj: Date;
  goToDate: (date: Date | string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToToday: () => void;
  weekDays: WeekDay[];
  isToday: boolean;
  formattedDate: string;
}

function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const parsed = parseISO(dateStr);
  return isValid(parsed);
}

export function useDateNavigation(
  options: UseDateNavigationOptions = {}
): UseDateNavigationReturn {
  const searchParams = useSearchParams();

  const urlDate = searchParams.get('date');
  const initialDate = options.initialDate;

  const selectedDate = useMemo(() => {
    if (urlDate && isValidDateString(urlDate)) {
      return urlDate;
    }
    if (initialDate && isValidDateString(initialDate)) {
      return initialDate;
    }
    return getTodayString();
  }, [urlDate, initialDate]);

  const selectedDateObj = useMemo(() => parseISO(selectedDate), [selectedDate]);

  const goToDate = useCallback(
    (date: Date | string) => {
      const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
      if (!isValidDateString(dateStr)) return;

      const params = new URLSearchParams(searchParams.toString());
      params.set('date', dateStr);
      // Update the URL without a server round trip: Next patches the History
      // API so useSearchParams (and so selectedDate) follows it. router.push
      // re-rendered the whole page on the server for every day click, and
      // nothing changed until that finished.
      window.history.pushState(null, '', `/analysis?${params.toString()}`);
    },
    [searchParams]
  );

  const goToPreviousDay = useCallback(() => {
    goToDate(addDays(selectedDateObj, -1));
  }, [goToDate, selectedDateObj]);

  const goToNextDay = useCallback(() => {
    goToDate(addDays(selectedDateObj, 1));
  }, [goToDate, selectedDateObj]);

  const goToPreviousWeek = useCallback(() => {
    goToDate(addDays(selectedDateObj, -7));
  }, [goToDate, selectedDateObj]);

  const goToNextWeek = useCallback(() => {
    goToDate(addDays(selectedDateObj, 7));
  }, [goToDate, selectedDateObj]);

  const goToToday = useCallback(() => {
    goToDate(getTodayString());
  }, [goToDate]);

  const weekDays = useMemo((): WeekDay[] => {
    const weekStart = startOfWeek(selectedDateObj, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDateObj, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map((day) => ({
      date: format(day, 'yyyy-MM-dd'),
      dayName: format(day, 'EEE'),
      dayNumber: day.getDate(),
      isSelected: isSameDay(day, selectedDateObj),
      isToday: checkIsToday(day),
      isCurrentMonth: day.getMonth() === selectedDateObj.getMonth(),
      monthName: format(day, 'MMM'),
    }));
  }, [selectedDateObj]);

  const isToday = useMemo(() => checkIsToday(selectedDateObj), [selectedDateObj]);

  const formattedDate = useMemo(() => {
    if (isToday) {
      return `Today, ${format(selectedDateObj, 'MMM d')}`;
    }
    return format(selectedDateObj, 'EEE, MMM d');
  }, [selectedDateObj, isToday]);

  return {
    selectedDate,
    selectedDateObj,
    goToDate,
    goToPreviousDay,
    goToNextDay,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    weekDays,
    isToday,
    formattedDate,
  };
}
