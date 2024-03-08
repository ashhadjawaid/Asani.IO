import React, { useState, useEffect } from "react";
import "./cardscomponent.css"

const CardsComponent = () => {
  const [powerData, setPowerData] = useState({});
  const [currentData, setCurrentData] = useState({});
  const [energyData, setEnergyData] = useState({});
  const [voltageData, setVoltageData] = useState({});
  const [frequencyData, setFrequencyData] = useState({});
  const [pfData, setPfData] = useState({});

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000"); // Connect to WebSocket server

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received WebSocket message:", data);

      if (data.PowerData) {
        setPowerData(data.PowerData);
      }
      if (data.PowerData) {
        setEnergyData(data.EnergyData);
      }
      if (data.VoltageData) {
        setCurrentData(data.CurrentData);
      }
      if (data.VoltageData) {
        setVoltageData(data.VoltageData);
      }
      if (data.FrequencyData) {
        setFrequencyData(data.FrequencyData);
      }
      if (data.FrequencyData) {
        setPfData(data.PfData);
      }
    };

    return () => {
      ws.close(); // Close WebSocket connection when component unmounts
    };
  }, []); // Run effect only once on component mount

  return (
    <div className="cards-container">
      <div className="column">
        <div className="card">
          <h3>Power Data</h3>
          {/* Display Power Data */}
          <p>Power1: {powerData && powerData.Power1}</p>
        </div>
        <div className="card">
          <h3>Energy Data</h3>
          {/* Display Current Data */}
          <p>Energy1: {powerData && powerData.Energy1}</p>
        </div>
        <div className="card">
          <h3>Current Data</h3>
          {/* Display Energy Data */}
          <p>Current1: {voltageData && voltageData.Current1}</p>
        </div>
      </div>
      <div className="column">
        <div className="card">
          <h3>Voltage Data</h3>
          {/* Display Voltage Data */}
          <p>Volt1: {voltageData && voltageData.Volt1}</p>
        </div>
        <div className="card">
          <h3>Frequency Data</h3>
          {/* Display Frequency Data */}
          <p>Freq1: {frequencyData && frequencyData.Freq1}</p>
        </div>
        <div className="card">
          <h3>Pf Data</h3>
          {/* Display Pf Data */}
          <p>Pf1: {frequencyData && frequencyData.Pf1}</p>
        </div>
      </div>
    </div>
  );
};

export default CardsComponent;
