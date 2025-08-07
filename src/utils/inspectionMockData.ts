// utils/inspectionMockData.ts
import dayjs from "dayjs";
import type { InspectionRecord } from "../types/inspection";

const zones = ["North", "South", "East", "West"];
const areas = ["Residential", "Commercial", "Industrial"];
const obstacleSources = [
  "Construction",
  "Parked Vehicle",
  "Natural Obstacle",
  "Road Work",
  "Utility Work",
  "Other",
];
const paymentDevices = [
  "Meter #1234",
  "Meter #5678",
  "Kiosk #A1",
  "Kiosk #B2",
  "Mobile Zone 1",
  "Mobile Zone 2",
];
const users = [
  "Ali Ahmed",
  "Fatima Khan",
  "John Doe",
  "Jane Smith",
  "Yusuf Ibrahim",
  "Aisha Al Mansoori",
];
const commentExamples = [
  "Construction materials blocking lane",
  "Vehicle parked in no-parking zone",
  "Tree fallen on road",
  "Pothole causing obstruction",
  "Temporary road closure",
  "Equipment left on roadway",
];

// Main UAE cities coordinates
const cityCoordinates = [
  { lat: 25.276987, lng: 55.296249 }, // Dubai
  { lat: 24.453884, lng: 54.377342 }, // Abu Dhabi
  { lat: 25.346266, lng: 55.420933 }, // Sharjah
  { lat: 25.382436, lng: 55.483902 }, // Ajman
  { lat: 25.13253, lng: 56.341602 }, // Fujairah
  { lat: 25.689531, lng: 55.793087 }, // Ras Al Khaimah
];

export const generateInspectionData = (count: number): InspectionRecord[] => {
  const data: InspectionRecord[] = [];

  for (let i = 0; i < count; i++) {
    const statusIndex = i % 3;
    const status: "Open" | "Resolved" | "Pending" =
      statusIndex === 0 ? "Open" : statusIndex === 1 ? "Resolved" : "Pending";

    const baseCity = cityCoordinates[i % cityCoordinates.length];
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;

    data.push({
      key: `${i + 1}`,
      obstacleNumber: `OBST-${1000 + i}`,
      zone: zones[i % zones.length],
      area: areas[i % areas.length],
      obstacleSource: obstacleSources[i % obstacleSources.length],
      paymentDevice: paymentDevices[i % paymentDevices.length],
      status: status,
      date: dayjs()
        .add(Math.floor(Math.random() * 30) - 15, "day")
        .format("DD-MM-YYYY"),
      addedBy: users[i % users.length],
      priority: i % 4 === 0,
      comments: commentExamples[i % commentExamples.length],
      location: {
        lat: baseCity.lat + latOffset,
        lng: baseCity.lng + lngOffset,
      },
      photo:
        i % 3 === 0 ? `https://picsum.photos/200/200?random=${i}` : undefined,
    });
  }

  return data;
};
