import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useToast } from '../context/ToastContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const { error, warning } = useToast();
  const [position, setPosition] = useState(initialLocation || [28.6139, 77.2090]); // Default: Delhi, India
  const [manualInput, setManualInput] = useState(false);
  const [lat, setLat] = useState(initialLocation?.[0] || '');
  const [lng, setLng] = useState(initialLocation?.[1] || '');

  useEffect(() => {
    if (position && onLocationSelect) {
      onLocationSelect({ latitude: position[0], longitude: position[1] });
    }
  }, [position, onLocationSelect]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      error('Please enter valid coordinates');
      return;
    }
    
    setPosition([latNum, lngNum]);
    setManualInput(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosition([position.coords.latitude, position.coords.longitude]);
        },
        (err) => {
          warning('Unable to get your location. Please select on map or enter manually.');
        }
      );
    } else {
      warning('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={getCurrentLocation}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📍 Use My Location
        </button>
        <button
          type="button"
          onClick={() => setManualInput(!manualInput)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {manualInput ? 'Hide' : 'Enter'} Coordinates
        </button>
        {position && (
          <span style={{ fontSize: '14px', color: '#666' }}>
            Selected: {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </span>
        )}
      </div>

      {manualInput && (
        <form onSubmit={handleManualSubmit} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            style={{ padding: '8px', width: '150px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            style={{ padding: '8px', width: '150px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Set Location
          </button>
        </form>
      )}

      <div style={{ height: '300px', width: '100%', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
        Click on the map to select your shop location
      </p>
    </div>
  );
};

export default LocationPicker;

