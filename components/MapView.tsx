import React, { useEffect, useRef } from 'react';
import { db } from '../services/db';
import { useDbData } from '../hooks/useGeolocation';
import { HealthStatus } from '../types';

// Since leaflet is loaded from a script tag, we need to tell TypeScript it exists on the window
declare global {
    interface Window { L: any; }
}

const statusColorsLeaflet: { [key in HealthStatus]: string } = {
    [HealthStatus.HEALTHY]: '#27AE60',
    [HealthStatus.NEEDS_WATER]: '#F1C40F',
    [HealthStatus.DAMAGED]: '#E67E22',
    [HealthStatus.LOST]: '#E74C3C',
};

const MapView: React.FC = () => {
    const allSaplings = useDbData(db.getAllSaplings);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null); // To hold the map instance
    const markersLayerRef = useRef<any>(null); // To hold the layer group for markers

    // Initialize map
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current && window.L) {
            mapRef.current = window.L.map(mapContainerRef.current).setView([28.6139, 77.2090], 11); // Delhi coordinates

            // Use a more modern, dark-friendly tile layer if possible, or style the default one
            window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(mapRef.current);
            
            markersLayerRef.current = window.L.layerGroup().addTo(mapRef.current);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update markers when sapling data changes
    useEffect(() => {
        if (!mapRef.current || !markersLayerRef.current || !window.L) return;

        markersLayerRef.current.clearLayers();

        allSaplings.forEach(sapling => {
            const latestUpdate = sapling.updates.length > 0 ? sapling.updates[sapling.updates.length - 1] : null;
            const latestStatus = latestUpdate?.status || HealthStatus.HEALTHY;
            const color = statusColorsLeaflet[latestStatus];

            const marker = window.L.circleMarker([sapling.location.lat, sapling.location.lng], {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            });

            marker.bindPopup(`<b>${sapling.species}</b><br>${sapling.id}<br>Status: ${latestStatus}`);
            markersLayerRef.current.addLayer(marker);
        });
    }, [allSaplings]);

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Sapling Map View</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Visualizing sapling locations and health status in real-time.</p>

            <div className="bg-glass p-2 rounded-xl shadow-lg w-full h-[calc(100vh-20rem)] border-2 border-gray-200/50 dark:border-[#4A6572]/50">
                <div ref={mapContainerRef} className="w-full h-full rounded-md" />
            </div>
        </div>
    );
};

export default MapView;
