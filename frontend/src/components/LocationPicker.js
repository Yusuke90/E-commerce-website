import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useToast } from '../context/ToastContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Helper to move map camera when coordinates change
function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

// Helper to handle clicks
function LocationMarker({ position, setPosition, onLocationSelect }) {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      // Call parent immediately here
      if (onLocationSelect) {
        onLocationSelect({ latitude: newPos[0], longitude: newPos[1] });
      }
    },
  });

  return position ? <Marker position={position} /> : null;
}

const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const { error, warning } = useToast();
  // Default: Delhi
  const [position, setPosition] = useState(initialLocation || [28.6139, 77.2090]); 
  const [manualInput, setManualInput] = useState(false);
  const [lat, setLat] = useState(initialLocation?.[0] || '');
  const [lng, setLng] = useState(initialLocation?.[1] || '');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      error('Please enter valid coordinates');
      return;
    }
    
    const newPos = [latNum, lngNum];
    setPosition(newPos);
    setManualInput(false);
    
    // Update parent
    if (onLocationSelect) {
      onLocationSelect({ latitude: latNum, longitude: lngNum });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          
          // Update parent
          if (onLocationSelect) {
            onLocationSelect({ latitude: newPos[0], longitude: newPos[1] });
          }
        },
        (err) => {
          warning('Unable to get location.');
        }
      );
    } else {
      warning('Geolocation is not supported.');
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={getCurrentLocation}
          style={{ padding: '8px 16px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          📍 Use My Location
        </button>
        <button
          type="button"
          onClick={() => setManualInput(!manualInput)}
          style={{ padding: '8px 16px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {manualInput ? 'Hide' : 'Enter'} Coordinates
        </button>
        {position && (
          <span style={{ fontSize: '14px', color: '#666' }}>
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </span>
        )}
      </div>

      {manualInput && (
        <form onSubmit={handleManualSubmit} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
          <input type="number" step="any" placeholder="Lat" value={lat} onChange={(e) => setLat(e.target.value)} style={{padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}} />
          <input type="number" step="any" placeholder="Lng" value={lng} onChange={(e) => setLng(e.target.value)} style={{padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}} />
          <button type="submit" style={{padding:'8px 16px', backgroundColor:'#27ae60', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}>Set</button>
        </form>
      )}

      <div style={{ height: '300px', width: '100%', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
        <MapContainer
          key={`${position[0]}-${position[1]}`} 
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            onLocationSelect={onLocationSelect} 
          />
          
          <MapRecenter lat={position[0]} lng={position[1]} />
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationPicker;