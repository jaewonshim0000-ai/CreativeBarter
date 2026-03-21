'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths (broken in Next.js/webpack)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon with brand colors
function createUserIcon(specialty: string) {
  const colors: Record<string, string> = {
    visual_arts: '#ec4899',
    music: '#8b5cf6',
    writing: '#06b6d4',
    film: '#f59e0b',
    photography: '#10b981',
    design: '#f97316',
    web_dev: '#3b82f6',
    game_dev: '#ef4444',
    animation: '#a855f7',
    crafts: '#84cc16',
    other: '#6b7280',
  };

  const color = colors[specialty] || colors.other;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px; height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

interface MapUser {
  id: string;
  name: string;
  profileImageUrl?: string;
  bio?: string;
  specialty: string;
  city?: string;
  region?: string;
  latitude: number;
  longitude: number;
  avgRating: number;
  totalReviews: number;
  skills: { skill: { name: string } }[];
}

// Auto-fit the map to show all markers
function FitBounds({ users }: { users: MapUser[] }) {
  const map = useMap();

  useEffect(() => {
    if (users.length === 0) return;

    const bounds = L.latLngBounds(
      users.map((u) => [u.latitude, u.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }, [users, map]);

  return null;
}

export default function CommunityMap({ users }: { users: MapUser[] }) {
  // Default center (world view) if no users
  const defaultCenter: [number, number] = [20, 0];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={2}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {users.length > 0 && <FitBounds users={users} />}

      {users.map((user) => (
        <Marker
          key={user.id}
          position={[user.latitude, user.longitude]}
          icon={createUserIcon(user.specialty)}
        >
          <Popup maxWidth={280}>
            <div style={{ minWidth: 200 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#44403c', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', color: '#f9a825', fontSize: 16,
                }}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: '#a8a29e', textTransform: 'capitalize' }}>
                    {user.specialty.replace('_', ' ')}
                    {user.city && ` • ${user.city}`}
                  </div>
                </div>
              </div>

              {/* Rating */}
              {user.avgRating > 0 && (
                <div style={{ fontSize: 11, color: '#a8a29e', marginBottom: 6 }}>
                  ⭐ {user.avgRating.toFixed(1)} ({user.totalReviews} reviews)
                </div>
              )}

              {/* Bio */}
              {user.bio && (
                <p style={{ fontSize: 12, color: '#d6d3d1', marginBottom: 8, lineHeight: 1.4 }}>
                  {user.bio.length > 100 ? user.bio.slice(0, 100) + '...' : user.bio}
                </p>
              )}

              {/* Skills */}
              {user.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {user.skills.map((us, i) => (
                    <span key={i} style={{
                      fontSize: 10, background: '#44403c', color: '#92400e',
                      padding: '2px 8px', borderRadius: 12, fontWeight: 500,
                    }}>
                      {us.skill.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 6 }}>
                <a
                  href={`/profile/${user.id}`}
                  style={{
                    fontSize: 12, background: '#f09a44', color: 'white',
                    padding: '6px 12px', borderRadius: 8, textDecoration: 'none',
                    fontWeight: 500, display: 'inline-block',
                  }}
                >
                  View Profile
                </a>
                <a
                  href={`/messages?user=${user.id}&name=${encodeURIComponent(user.name)}`}
                  style={{
                    fontSize: 12, background: '#57534e', color: '#fafaf9',
                    padding: '6px 12px', borderRadius: 8, textDecoration: 'none',
                    fontWeight: 500, display: 'inline-block',
                  }}
                >
                  💬 Message
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
