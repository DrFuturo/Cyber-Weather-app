import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import WeatherWidget from './components/WeatherWidget';
import './App.css';

function App() {
  const [city, setCity] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    document.body.style.background = darkMode
      ? 'linear-gradient(135deg, #090227 0%, #3a0068 100%)'
      : 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.classList.toggle('dark-mode', darkMode);
    getUserLocation();
  }, [darkMode]);

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
        },
        error => {
          console.error("Error getting user location:", error);
        }
      );
    } else {
      console.log("Geolocation is not available in this browser.");
    }
  };

  const handleSearch = (searchCity) => {
    setCity(searchCity);
    setUserLocation(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Weather Forecast</h1>
        <button onClick={toggleDarkMode} className="mode-toggle">
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
      <SearchBar onSearch={handleSearch} />
      <WeatherWidget city={city} userLocation={userLocation} />
    </div>
  );
}

export default App;
