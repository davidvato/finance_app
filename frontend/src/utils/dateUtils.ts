/**
 * Returns the budget cycle start, end dates, and cycle id based on a base month and start day.
 * @param baseDate A Date object representing the month the user is viewing (e.g. Sept 1, 2026).
 * @param startDay The day of the month the budget starts (1-31).
 * @returns { startDate: string, endDate: string, cycleId: string, label: string }
 */
export const getCycleDates = (baseDate: Date, startDay: number) => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth(); // 0-11

  // Start date
  // e.g. baseDate = Sept 2026. month = 8. startDay = 10.
  // startDate = 2026-09-10
  const startDateObj = new Date(year, month, Math.min(startDay, new Date(year, month + 1, 0).getDate()));
  const startDateStr = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;

  // End date
  // endDate = 2026-10-09 (next month, day - 1)
  const nextMonthDate = new Date(year, month + 1, 1);
  const nextMonth = nextMonthDate.getMonth();
  const nextYear = nextMonthDate.getFullYear();
  
  // To handle if startDay is 31 and next month has 30 days
  let endDay = startDay - 1;
  if (endDay === 0) {
    // If startDay is 1, end is the last day of the SAME month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const endDateObj = new Date(year, month, lastDayOfMonth);
    const endDateStr = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;
    
    // Cycle ID is just the year_month of the baseDate
    const cycleId = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    // Label
    const monthName = baseDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    
    return { startDate: startDateStr, endDate: endDateStr, cycleId, label: monthName };
  } else {
    // startDay > 1, so end date is in the NEXT month
    const maxDaysNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    endDay = Math.min(endDay, maxDaysNextMonth);
    const endDateObj = new Date(nextYear, nextMonth, endDay);
    const endDateStr = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;

    // Cycle ID is the year_month of the START date
    const cycleId = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}`;
    
    // Label e.g. "Sep 10 - Oct 9"
    const startMonthShort = startDateObj.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
    const endMonthShort = endDateObj.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
    const label = `${startMonthShort} ${startDateObj.getDate()} - ${endMonthShort} ${endDateObj.getDate()}`;
    
    return { startDate: startDateStr, endDate: endDateStr, cycleId, label };
  }
};
