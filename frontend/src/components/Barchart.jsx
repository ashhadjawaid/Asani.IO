import React, { useState, useEffect } from "react";
import Chart from "chart.js/auto";
import axios from 'axios';
import { generateDailyLabels, generateHourlyLabels, generateMonthlyLabels, generateYearlyLabels } from "../functions/labelGenrator";

const DynamicBarChart = () => {
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    fetchChartData('day', 'power');
  }, []);

  const fetchChartData = async (timeFrame, valueType) => {
    try {
      const response = await axios.get(`http://localhost:5000/data/${timeFrame}/${valueType}`);
      console.log('Response from API:', response.data); // Log data to check format
  
      let dataPoints;
      switch (valueType) {
        case 'power':
          dataPoints = response.data.map(item => item.Power1);
          break;
        case 'energy':
          dataPoints = response.data.map(item => item.Energy1);
          break;
        case 'voltage':
          dataPoints = response.data.map(item => item.Volt1);
          break;
        case 'current':
          dataPoints = response.data.map(item => item.Current1);
          break;
        case 'frequency':
          dataPoints = response.data.map(item => item.Freq1);
          break;
        default:
          console.error('Invalid valueType:', valueType);
          return;
      }
  
      setData(dataPoints);
  
      let newLabels;
      switch (timeFrame) {
        case 'day':
          newLabels = generateHourlyLabels(); // Generate hourly labels
          break;
        case 'week':
          newLabels = generateDailyLabels(); // Generate daily labels
          break;
        case 'month':
          newLabels = generateMonthlyLabels(); // Generate weekly labels
          break;
        case 'year':
          newLabels = generateYearlyLabels(); // Generate monthly labels
          break;
        default:
          console.error('Invalid timeFrame:', timeFrame);
          return;
      }
      setLabels(newLabels);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  

  useEffect(() => {
    const ctx = document.getElementById("myChart");
    const newChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Data",
            data: data,
            backgroundColor: "#0026ff",
            borderColor: "#0026ff",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
    return () => {
      newChartInstance.destroy();
    };
  }, [data, labels]);

  const handleTimeIntervalChange = (e) => {
    const timeInterval = e.target.value;
    fetchChartData(timeInterval, 'power');
  };

  const handleValueTypeChange = (e) => {
    const valueType = e.target.value;
    fetchChartData('day', valueType);
  };

  return (
    <div>
      <div>
        <select onChange={handleTimeIntervalChange}>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
        <select onChange={handleValueTypeChange}>
          <option value="power">Power</option>
          <option value="energy">Energy</option>
          <option value="voltage">Voltage</option>
          <option value="current">Current</option>
          <option value="frequency">Frequency</option>
        </select>
      </div>
      <canvas id="myChart" style={{ width: "1500px", height: "100px" }}></canvas>
    </div>
  );
};

export default DynamicBarChart;
