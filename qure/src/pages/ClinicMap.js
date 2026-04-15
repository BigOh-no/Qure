import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

// Auto-fit map to results
function FitBounds({ clinics }) {
  const map = useMap();

  useEffect(() => {
    if (!clinics || clinics.length === 0) return;

    const validPoints = clinics
        .filter( (clinic) =>
            clinic.lat !== null &&
            clinic.long !== null &&
            !isNaN(Number(clinic.lat)) &&
            !isNaN(Number(clinic.lon))    
        )
        .map((c) => [
            Number(c.lat),
            Number(c.lon),
        ]);

    if (validPoints.length === 0) return;

    map.fitBounds(validPoints, {
      padding: [50, 50],
    });
  }, [clinics, map]);

  return null;
}

// Fly to selected clinic
function FlyToClinic({ clinic }) {
  const map = useMap();

  useEffect(() => {
    if (clinic) {
      map.flyTo(
        [Number(clinic.lat), Number(clinic.lon)],
        15
      );
    }
  }, [clinic, map]);

  return null;
}

export default function ClinicMap({ clinics, selectedClinic }) {
  const defaultCenter = [-26.2041, 28.0473]; // Johannesburg

  return (
    <MapContainer
      center={defaultCenter}
      zoom={10}
      style={{ height: "400px", width: "100%", marginTop: "20px" }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds clinics={clinics} />
      <FlyToClinic clinic={selectedClinic} />

      {clinics
      .filter( (clinic) =>
        clinic.lat !== null &&
        clinic.lon !== null &&
        !isNaN(Number(clinic.lat)) &&
        !isNaN(Number(clinic.lon))    
    )
      .map((clinic) => (
        <Marker
          key={clinic.id}
          position={[
            Number(clinic.lat),
            Number(clinic.lon),
          ]}
        >
          <Popup>
            <strong>{clinic.facility_name}</strong>
            <br />
            {clinic.admin1}
            <br />
            {clinic.facility_type}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}