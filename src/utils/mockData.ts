import type { WhitelistRecord } from "../types";
import dayjs from "dayjs";

const names = [
  "ABC Traders",
  "XYZ Logistics",
  "EFG Corp",
  "Dubai Solutions",
  "Global Exports",
  "Innovate Tech",
];

const users = [
  "Ali Ahmed",
  "Fatima Khan",
  "John Doe",
  "Jane Smith",
  "Yusuf Ibrahim",
  "Aisha Al Mansoori",
];

const cityCoordinates = [
  { lat: 25.276987, lng: 55.296249 },
  { lat: 24.453884, lng: 54.377342 },
  { lat: 25.346266, lng: 55.420933 },
  { lat: 25.382436, lng: 55.483902 },
  { lat: 25.13253, lng: 56.341602 },
  { lat: 25.689531, lng: 55.793087 },
];

export const generateWhitelistData = (count: number): WhitelistRecord[] => {
  const data: WhitelistRecord[] = [];
  for (let i = 0; i < count; i++) {
    const status = i % 5 === 0 ? "Expired" : i % 3 === 0 ? "Pending" : "Active";
    const baseCity = cityCoordinates[i % cityCoordinates.length];

    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;

    data.push({
      key: `${i + 1}`,
      tradeLicenseName: `${names[i % names.length]} #${i + 1}`,
      licenseNumber: `TLN${Math.floor(10000000 + Math.random() * 90000000)}`,
      date: dayjs()
        .add(Math.floor(Math.random() * 365) - 60, "day")
        .format("DD-MM-YYYY"),
      location: {
        lat: baseCity.lat + latOffset,
        lng: baseCity.lng + lngOffset,
      },
      status: status,
      type: i % 2 === 0 ? "Trade" : "Plate",
      addedBy: users[i % users.length],
      priority: i % 2 === 0,
    });
  }
  return data;
};
