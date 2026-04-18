import React from "react";
import { render, screen } from "@testing-library/react";
import ClinicMap from "../pages/ClinicMap";

// ---------------- MOCK react-leaflet ----------------
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position }) => (
    <div data-testid="marker">{JSON.stringify(position)}{children}</div>
  ),
  Popup: ({ children }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => ({
    fitBounds: jest.fn(),
    flyTo: jest.fn(),
  }),
}));

// ---------------- TEST HELPERS ----------------
const renderComponent = (clinics = [], selectedClinic = null) =>
  render(
    <ClinicMap clinics={clinics} selectedClinic={selectedClinic} />
  );

// ---------------- TESTS ----------------
describe("ClinicMap", () => {
  test("renders map container", () => {
    renderComponent();

    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.getByTestId("tile-layer")).toBeInTheDocument();
  });

  test("renders markers for valid clinics only", () => {
    const clinics = [
      {
        id: "1",
        facility_name: "Valid Clinic",
        admin1: "Gauteng",
        facility_type: "Clinic",
        lat: "-26.2",
        lon: "28.0",
      },
      {
        id: "2",
        facility_name: "Invalid Clinic",
        admin1: "Gauteng",
        facility_type: "Clinic",
        lat: null,
        lon: null,
      },
    ];

    renderComponent(clinics);

    const markers = screen.getAllByTestId("marker");

    // only 1 valid clinic should render marker
    expect(markers).toHaveLength(1);
    expect(markers[0]).toHaveTextContent("Valid Clinic");
  });

  test("filters out invalid coordinates", () => {
    const clinics = [
      {
        id: "1",
        facility_name: "Bad Lat",
        lat: "NaN",
        lon: "28.0",
      },
      {
        id: "2",
        facility_name: "Good Clinic",
        lat: "-26.2",
        lon: "28.0",
      },
    ];

    renderComponent(clinics);

    const markers = screen.getAllByTestId("marker");

    expect(markers).toHaveLength(1);
    expect(markers[0]).toHaveTextContent("Good Clinic");
  });

  test("renders popup content inside marker", () => {
    const clinics = [
      {
        id: "1",
        facility_name: "Popup Clinic",
        admin1: "Gauteng",
        facility_type: "Clinic",
        lat: "-26.2",
        lon: "28.0",
      },
    ];

    renderComponent(clinics);

    expect(screen.getByTestId("popup")).toBeInTheDocument();
    expect(screen.getByTestId("marker")).toHaveTextContent(
      "Popup Clinic"
    );
  });

  test("handles empty clinic list gracefully", () => {
    renderComponent([]);

    expect(screen.queryAllByTestId("marker")).toHaveLength(0);
  });
});