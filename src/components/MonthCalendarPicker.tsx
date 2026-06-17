import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

// 辅助函数（移到组件外避免闭包问题）
const isSameDate = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isSameMonth = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth();
};

const markSelectedDates = (days: DayInfo[], start: Date, end: Date) => {
  const compare = (d: Date) => {
    return d.getFullYear() === start.getFullYear() &&
           d.getMonth() === start.getMonth() &&
           d.getDate() === start.getDate();
  };

  const compareEnd = (d: Date) => {
    return d.getFullYear() === end.getFullYear() &&
           d.getMonth() === end.getMonth() &&
           d.getDate() === end.getDate();
  };

  for (const day of days) {
    if (day.date) {
      if (compare(day.date)) {
        day.isSelectedStart = true;
      }
      if (compareEnd(day.date)) {
        day.isSelectedEnd = true;
      }
      if (day.date > start && day.date < end) {
        day.isSelectedRange = true;
      }
    }
  }
};

interface MonthCalendarPickerProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

interface DayInfo {
  date: Date | null;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelectedStart: boolean;
  isSelectedEnd: boolean;
  isSelectedRange: boolean;
}

interface MonthView {
  days: DayInfo[];
  monthName: string;
  year: number;
}

export default function MonthCalendarPicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: MonthCalendarPickerProps) {
  // 确保初始日期有效
  const initialDate = (startDate && !isNaN(startDate.getTime())) ? startDate : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 生成两个月的日历数据
  const calendarData = useMemo(() => {
    const months: MonthView[] = [];
    
    for (let i = 0; i < 2; i++) {
      const current = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1);
      const year = current.getFullYear();
      const month = current.getMonth();
      
      // 获取当月第一天是星期几 (0-6)
      const firstDay = new Date(year, month, 1);
      const startDayOfWeek = firstDay.getDay();
      
      // 获取当月天数
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // 计算上月剩余天数
      const daysInPrevMonth = new Date(year, month, 0).getDate();
      
      const days: DayInfo[] = [];
      
      // 添加上个月的尾部日期
      for (let j = startDayOfWeek - 1; j >= 0; j--) {
        const dayNum = daysInPrevMonth - j;
        const date = new Date(year, month - 1, dayNum);
        days.push({
          date,
          dayOfMonth: dayNum,
          isCurrentMonth: false,
          isToday: isSameDate(date, today),
          isSelectedStart: false,
          isSelectedEnd: false,
          isSelectedRange: false,
        });
      }
      
      // 添加本月日期
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        days.push({
          date,
          dayOfMonth: d,
          isCurrentMonth: true,
          isToday: isSameDate(date, today),
          isSelectedStart: false,
          isSelectedEnd: false,
          isSelectedRange: false,
        });
      }
      
      // 填充下个月的头部日期（补齐 6 行）
      const totalDays = days.length;
      const remainingSlots = 42 - totalDays;
      for (let k = 1; k <= remainingSlots; k++) {
        const date = new Date(year, month + 1, k);
        days.push({
          date,
          dayOfMonth: k,
          isCurrentMonth: false,
          isToday: isSameDate(date, today),
          isSelectedStart: false,
          isSelectedEnd: false,
          isSelectedRange: false,
        });
      }
      
      months.push({
        days,
        monthName: `${year}年${month + 1}月`,
        year,
      });
    }
    
    // 标记选中日期
    if (startDate.getTime()) {
      markSelectedDates(months[0].days, startDate, endDate);
      if (!isSameMonth(startDate, endDate)) {
        markSelectedDates(months[1].days, startDate, endDate);
      }
    }
    
    return months;
  }, [currentMonth, startDate, endDate]);

  const handleDayPress = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) return;

    const clickedDate = new Date(date);
    clickedDate.setHours(0, 0, 0, 0);

    const hasValidStartDate = startDate && !isNaN(startDate.getTime());
    const hasValidEndDate = endDate && !isNaN(endDate.getTime());
    
    if (!hasValidStartDate || (hasValidEndDate && (clickedDate < startDate || clickedDate > endDate))) {
      onStartDateChange(clickedDate);
      onEndDateChange(clickedDate);
      return;
    }

    if (!hasValidStartDate) {
      onStartDateChange(clickedDate);
      return;
    }

    if (hasValidStartDate && !hasValidEndDate) {
      if (clickedDate >= startDate) {
        onEndDateChange(clickedDate);
      } else {
        onStartDateChange(clickedDate);
      }
    }
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <View style={styles.container}>
      {/* 月份切换按钮 */}
      <View style={styles.monthHeader}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => {
            const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
            setCurrentMonth(prev);
          }}
        >
          <Text style={styles.navButtonText}>◀</Text>
        </TouchableOpacity>
        
        <Text style={styles.currentMonthText}>{calendarData[0].monthName}</Text>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => {
            const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
            setCurrentMonth(next);
          }}
        >
          <Text style={styles.navButtonText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* 两个月份的日历 */}
      <View style={styles.monthsContainer}>
        {calendarData.map((month, index) => (
          <View key={index} style={styles.monthWrapper}>
            {/* 星期标题 */}
            <View style={styles.weekDaysRow}>
              {weekDays.map((day, i) => (
                <View key={i} style={styles.weekDayCell}>
                  <Text style={[styles.weekDayText, i === 0 && styles.weekDayTextRed]}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* 日期网格 */}
            <View style={styles.daysGrid}>
              {month.days.map((day, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    !day.isCurrentMonth && styles.dayCellOtherMonth,
                    day.isSelectedStart && styles.dayCellSelectedStart,
                    day.isSelectedEnd && styles.dayCellSelectedEnd,
                    day.isSelectedRange && styles.dayCellSelectedRange,
                    day.isToday && !day.isSelectedStart && !day.isSelectedEnd && !day.isSelectedRange && styles.dayCellToday,
                  ]}
                  onPress={() => handleDayPress(day.date)}
                  disabled={!day.isCurrentMonth && false}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      !day.isCurrentMonth && styles.dayNumberOtherMonth,
                      day.isSelectedStart && styles.dayNumberSelected,
                      day.isSelectedEnd && styles.dayNumberSelected,
                      day.isSelectedRange && styles.dayNumberInRange,
                      day.isToday && !day.isSelectedStart && !day.isSelectedEnd && !day.isSelectedRange && styles.dayNumberToday,
                    ]}
                  >
                    {day.dayOfMonth}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* 月份标题 */}
            <Text style={styles.monthTitle}>{month.monthName}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#f5f6fa',
  },
  navButtonText: {
    fontSize: 18,
    color: '#5b6abf',
    fontWeight: 'bold',
  },
  currentMonthText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginHorizontal: 12,
  },
  monthsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthWrapper: {
    width: '48%',
  },
  monthTitle: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#5b6abf',
    marginTop: 8,
    marginBottom: 4,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  weekDayTextRed: {
    color: '#ff4757',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 7 列
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
  },
  dayCellOtherMonth: {
    backgroundColor: '#fafafa',
  },
  dayCellSelectedStart: {
    backgroundColor: '#ff4757',
  },
  dayCellSelectedEnd: {
    backgroundColor: '#2ed573',
  },
  dayCellSelectedRange: {
    backgroundColor: '#ede9ff',
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: '#5b6abf',
  },
  dayNumber: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  dayNumberOtherMonth: {
    color: '#ccc',
  },
  dayNumberSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  dayNumberInRange: {
    color: '#5b6abf',
  },
  dayNumberToday: {
    color: '#5b6abf',
    fontWeight: '700',
  },
});
