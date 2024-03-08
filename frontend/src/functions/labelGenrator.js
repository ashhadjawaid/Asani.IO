export const generateHourlyLabels = () => {
    const labels = [];
    for (let i = 0; i < 24; i++) {
      labels.push(`${i}:00`);
    }
    return labels;
  };
  
  export const generateDailyLabels = () => {
    const labels = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      labels.unshift(day);
    }
    return labels;
  };
  
  export const generateMonthlyLabels = () => {
    const labels = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      labels.unshift(date.toLocaleDateString('en-US', { month: 'short' }));
    }
    return labels;
  };
  
  export const generateYearlyLabels = () => {
    const labels = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) { // Change to 5 to generate labels for the last 5 years
      const year = today.getFullYear() - i;
      labels.push(year.toString());
    }
    return labels;
  };
  
  
  