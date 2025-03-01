'use client'; // IMPORTANT for client-side libraries like Mapbox

import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

// Replace with your own Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoic3RldmVucWllIiwiYSI6ImNtMzk2MHRlcjB6aXAya3B3ZnMwZmp0eWcifQ.LZpQC7xRtVKDfD56Up-3zQ';

export default function Map({ listings = [] }) {
    const [map, setMap] = useState(null);
  
    useEffect(() => {
      // Initialize the map
      const mapInstance = new mapboxgl.Map({
        container: 'map', // ID in our return() below
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-98.35, 39.5], // Fallback center (USA)
        zoom: 3,               // Fallback zoom
      });
  
      setMap(mapInstance);
  
      // Attempt to get the user's current location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // If successful, center and zoom in on the user's location
            const { latitude, longitude } = position.coords;
            mapInstance.setCenter([longitude, latitude]);
            mapInstance.setZoom(12);
          },
          (error) => {
            console.error('Error getting user location:', error);
            // You could show a notification or fallback to a default location
            window.alert("Could not retrieve your location, falling back to New York City.");
            // Fallback to New York City
            mapInstance.setCenter([-74.0060, 40.7128]);
            mapInstance.setZoom(12);
          },
          {
            enableHighAccuracy: false,
            timeout: 5000, // 5 seconds
            maximumAge: 0,
          }
        );
      }
  
      // Cleanup when component unmounts
      return () => mapInstance.remove();
    }, []);
  
    useEffect(() => {
      // Add markers once the map is ready and listings are available
      if (!map) return;
  
      listings.forEach(({ lat, lon, title }) => {
        new mapboxgl.Marker()
          .setLngLat([lon, lat])
          .setPopup(new mapboxgl.Popup().setText(title))
          .addTo(map);
      });
    }, [map, listings]);
  
    return (
      <div
        id="map"
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    );
  }