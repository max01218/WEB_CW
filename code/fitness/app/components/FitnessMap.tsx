import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Card, Spin } from 'antd';

interface FitnessCenter {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  address: string;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px'
};

// Default center set to Southampton, UK
const defaultCenter = {
  lat: 50.909698,
  lng: -1.404351
};

const markerSize = {
  width: 30,
  height: 30
};

const FitnessMap: React.FC = () => {
  const [userLocation, setUserLocation] = useState(defaultCenter);
  const [loading, setLoading] = useState(true);
  const [fitnessCenters, setFitnessCenters] = useState<FitnessCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<FitnessCenter | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }

    // Mock fitness centers data
    const mockCenters: FitnessCenter[] = [
      {
        id: '1',
        name: 'PureGym Southampton Central',
        position: { lat: 50.905276, lng: -1.404391 },
        address: '21 Vincent\'s Walk, Southampton SO14 7SJ'
      },
      {
        id: '2',
        name: 'The Gym Southampton',
        position: { lat: 50.911657, lng: -1.406492 },
        address: '19-20 Brunswick Pl, Southampton SO15 2AL'
      },
      {
        id: '3',
        name: 'Anytime Fitness Southampton',
        position: { lat: 50.908745, lng: -1.402547 },
        address: '112-113 East St, Southampton SO14 3HD'
      },
      {
        id: '4',
        name: 'Places Gym Southampton',
        position: { lat: 50.920241, lng: -1.395692 },
        address: 'Southampton SO14 0TB'
      },
      {
        id: '5',
        name: 'Snap Fitness 24/7',
        position: { lat: 50.907851, lng: -1.403987 },
        address: '39-41 London Rd, Southampton SO15 2AD'
      }
    ];

    setFitnessCenters(mockCenters);
  }, []);

  const onLoad = (map: google.maps.Map) => {
    setMap(map);
  };

  if (loading) {
    return (
      <div style={{ 
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Spin size="large" tip="Loading map..." />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', minHeight: '400px' }}>
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={userLocation}
          zoom={14}
          onLoad={onLoad}
          options={{
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
        >
          {map && (
            <>
              {/* User location marker */}
              <Marker
                position={userLocation}
                icon={{
                  url: '/images/user-location.png',
                  scaledSize: new window.google.maps.Size(markerSize.width, markerSize.height)
                }}
              />

              {/* Fitness center markers */}
              {fitnessCenters.map((center) => (
                <Marker
                  key={center.id}
                  position={center.position}
                  onClick={() => setSelectedCenter(center)}
                />
              ))}

              {/* Info window */}
              {selectedCenter && (
                <InfoWindow
                  position={selectedCenter.position}
                  onCloseClick={() => setSelectedCenter(null)}
                >
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{selectedCenter.name}</h3>
                    <p style={{ margin: 0 }}>{selectedCenter.address}</p>
                  </div>
                </InfoWindow>
              )}
            </>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default FitnessMap; 