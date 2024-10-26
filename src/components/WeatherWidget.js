import React, { useState, useEffect } from 'react';
import './WeatherWidget.css';

function WeatherWidget({ city, userLocation }) {
  const [forecast, setForecast] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [uvIndex, setUvIndex] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [sunPosition, setSunPosition] = useState(0);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const apiKey = process.env.REACT_APP_OPENWEATHERMAP_API_KEY || '5e6894ffbdd60be5486e3a97a369b3d7';
        let forecastUrl, currentUrl;

        if (userLocation) {
          forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${userLocation.lat}&lon=${userLocation.lon}&appid=${apiKey}&units=metric`;
          currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.lat}&lon=${userLocation.lon}&appid=${apiKey}&units=metric`;
        } else if (city) {
          const encodedCity = encodeURIComponent(city.trim());
          forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&appid=${apiKey}&units=metric`;
          currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&units=metric`;
        } else {
          throw new Error("No city or user location provided");
        }

        console.log('Fetching data from URLs:', { forecastUrl, currentUrl });

        const [forecastResponse, currentResponse] = await Promise.all([
          fetch(forecastUrl),
          fetch(currentUrl)
        ]);

        console.log('API Responses:', {
          forecast: forecastResponse.status,
          current: currentResponse.status
        });

        if (!forecastResponse.ok) {
          const errorData = await forecastResponse.json();
          throw new Error(`Forecast API Error: ${errorData.message || forecastResponse.statusText}`);
        }
        if (!currentResponse.ok) {
          const errorData = await currentResponse.json();
          throw new Error(`Current Weather API Error: ${errorData.message || currentResponse.statusText}`);
        }

        const forecastData = await forecastResponse.json();
        const currentData = await currentResponse.json();

        console.log("API Data:", { forecastData, currentData });

        const processedForecast = processForecastData(forecastData);
        setForecast(processedForecast);
        setCurrentWeather(currentData);
        setUvIndex(estimateUVIndex(currentData.weather[0].id, currentData.clouds.all));
        setError(null);
      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError(`Error: ${err.message}`);
        setForecast(null);
        setCurrentWeather(null);
        setUvIndex(null);
      }
    };

    fetchWeatherData();
  }, [city, userLocation]);

  useEffect(() => {
    const updateSunPosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      const percentage = (totalMinutes / 1440) * 100; // 1440 minutes in a day
      setSunPosition(percentage);
    };

    updateSunPosition(); // Initial update
    const interval = setInterval(updateSunPosition, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const processForecastData = (data) => {
    console.log("Raw forecast data:", data);

    if (!data.list || data.list.length === 0) {
      console.error("Forecast data is empty or invalid");
      return null;
    }

    const dailyForecasts = data.list.reduce((acc, item) => {
      const date = new Date(item.dt * 1000);
      const dateString = date.toLocaleDateString('en-US', { weekday: 'long' });

      if (!acc[dateString]) {
        acc[dateString] = {
          temp: { min: item.main.temp, max: item.main.temp },
          feels_like: item.main.feels_like,
          humidity: item.main.humidity,
          wind_speed: item.wind.speed,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          date: date,
          hourly: []
        };
      }

      acc[dateString].hourly.push({
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        temp: Math.round(item.main.temp),
        icon: item.weather[0].icon,
        description: item.weather[0].description
      });

      acc[dateString].temp.min = Math.min(acc[dateString].temp.min, item.main.temp);
      acc[dateString].temp.max = Math.max(acc[dateString].temp.max, item.main.temp);

      return acc;
    }, {});

    console.log("Processed daily forecasts:", dailyForecasts);

    const processedForecast = {
      city: data.city.name,
      days: Object.entries(dailyForecasts).map(([key, data]) => ({
        day: key,
        date: data.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        temp: {
          min: Math.round(data.temp.min),
          max: Math.round(data.temp.max)
        },
        feels_like: Math.round(data.feels_like),
        humidity: data.humidity,
        wind_speed: data.wind_speed,
        description: data.description,
        icon: data.icon,
        hourly: data.hourly
      }))
    };

    console.log("Final processed forecast:", processedForecast);
    return processedForecast;
  };

  const estimateUVIndex = (weatherId, cloudCover) => {
    // Estimate UV index based on weather conditions
    // This is a simplified estimation and may not be accurate
    if (weatherId >= 200 && weatherId < 300) {
      // Thunderstorm
      return Math.max(2, cloudCover / 10);
    } else if (weatherId >= 300 && weatherId < 400) {
      // Drizzle
      return Math.max(1, cloudCover / 20);
    } else if (weatherId >= 500 && weatherId < 600) {
      // Rain
      return Math.max(1, cloudCover / 10);
    } else if (weatherId >= 700 && weatherId < 800) {
      // Atmosphere
      return Math.max(1, cloudCover / 20);
    } else if (weatherId === 800) {
      // Clear
      return Math.max(1, cloudCover / 30);
    } else {
      // Clouds
      return Math.max(1, cloudCover / 15);
    }
  };

  const toggleDaySelection = (index) => {
    setSelectedDay(selectedDay === index ? null : index);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const getUVIndexDescription = (uvi) => {
    if (uvi <= 2) return 'Low';
    if (uvi <= 5) return 'Moderate';
    if (uvi <= 7) return 'High';
    if (uvi <= 10) return 'Very High';
    return 'Extreme';
  };

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!forecast || !currentWeather) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="weather-widget">
      <h2>{forecast.city}</h2>
      
      {/* Current Weather Section */}
      <div className="current-weather">
        <h3>Current Weather</h3>
        <div className="current-weather-main">
          <img 
            src={`http://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`} 
            alt={currentWeather.weather[0].description}
          />
          <div className="current-temp">{Math.round(currentWeather.main.temp)}°C</div>
          <div className="current-description">{currentWeather.weather[0].description}</div>
        </div>
        <div className="current-weather-widgets">
          <div className="widget">
            <span className="widget-label">Feels Like</span>
            <span className="widget-value">{Math.round(currentWeather.main.feels_like)}°C</span>
          </div>
          <div className="widget">
            <span className="widget-label">Humidity</span>
            <span className="widget-value">{currentWeather.main.humidity}%</span>
          </div>
          <div className="widget">
            <span className="widget-label">Wind Speed</span>
            <span className="widget-value">{(currentWeather.wind.speed * 3.6).toFixed(1)} km/h</span>
          </div>
          <div className="widget">
            <span className="widget-label">Pressure</span>
            <span className="widget-value">{currentWeather.main.pressure} hPa</span>
          </div>
          <div className="widget">
            <span className="widget-label">Visibility</span>
            <span className="widget-value">{(currentWeather.visibility / 1000).toFixed(1)} km</span>
          </div>
          <div className="widget uv-index">
            <span className="widget-label">UV Index</span>
            <span className="widget-value">
              {uvIndex !== null ? (
                <>
                  <span className="uv-value">{uvIndex.toFixed(1)}</span>
                  <span className="uv-description">{getUVIndexDescription(uvIndex)}</span>
                </>
              ) : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Updated Sunrise/Sunset Module */}
      <div className="sunrise-sunset-module">
        <div className="sun-path">
          <div 
            className="sun-cursor" 
            style={{ 
              left: `${sunPosition}%`,
              bottom: `${Math.sin((sunPosition / 100) * Math.PI) * 100}%`,
              animation: 'none' // Disable the CSS animation
            }}
          ></div>
        </div>
        <span className="time-label sunrise-label">
          Sunrise: {currentWeather && formatTime(currentWeather.sys.sunrise)}
        </span>
        <span className="time-label sunset-label">
          Sunset: {currentWeather && formatTime(currentWeather.sys.sunset)}
        </span>
      </div>

      {/* Forecast Section */}
      <div className="forecast-section">
        <h3>5-Day Forecast</h3>
        <div className="forecast-nav">
          {forecast.days.map((day, index) => (
            <div 
              key={index} 
              className={`forecast-nav-item ${selectedDay === index ? 'selected' : ''}`}
              onClick={() => toggleDaySelection(index)}
            >
              <p>{day.day.slice(0, 3)}</p>
              <img 
                src={`http://openweathermap.org/img/wn/${day.icon}.png`} 
                alt={day.description}
              />
              <p>{day.temp.max}°C / {day.temp.min}°C</p>
            </div>
          ))}
        </div>
        {selectedDay !== null && (
          <div className="selected-day-details">
            <h3>{forecast.days[selectedDay].day} - {forecast.days[selectedDay].date}</h3>
            <div className="details">
              <p>Feels like: {forecast.days[selectedDay].feels_like}°C</p>
              <p>Humidity: {forecast.days[selectedDay].humidity}%</p>
              <p>Wind speed: {forecast.days[selectedDay].wind_speed.toFixed(1)} m/s</p>
            </div>
            <h4>3-Hour Forecast</h4>
            <div className="hourly-forecast">
              {forecast.days[selectedDay].hourly.map((hour, hourIndex) => (
                <div key={hourIndex} className="hourly-item">
                  <p>{hour.time}</p>
                  <img 
                    src={`http://openweathermap.org/img/wn/${hour.icon}.png`} 
                    alt={hour.description}
                  />
                  <p>{hour.temp}°C</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WeatherWidget;