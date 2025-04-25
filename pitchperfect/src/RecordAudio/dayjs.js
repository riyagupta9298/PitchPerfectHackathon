// Mock implementation of dayjs
const dayjs = (date) => {
  const dateObj = date ? new Date(date) : new Date();
  
  return {
    startOf: (unit) => {
      const newDate = new Date(dateObj);
      
      if (unit === 'day') {
        newDate.setHours(0, 0, 0, 0);
      }
      
      return {
        add: (value, unit) => {
          const resultDate = new Date(newDate);
          
          if (unit === 'second' || unit === 'seconds') {
            resultDate.setSeconds(resultDate.getSeconds() + value);
          }
          
          return {
            format: (formatStr) => {
              if (formatStr === 'm:ss') {
                const minutes = resultDate.getMinutes();
                const seconds = resultDate.getSeconds();
                return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
              }
              return resultDate.toString();
            }
          };
        }
      };
    }
  };
};

export default dayjs;
