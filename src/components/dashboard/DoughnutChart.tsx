// DoughnutChart.jsx
import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

// register once
ChartJS.register(ArcElement, Tooltip, Legend);

const inspectors = [
  { id: 301, name: "Ahmed Al-Harbi", active: true },
  { id: 302, name: "Fahad Al-Anazi", active: false },
  { id: 303, name: "Mohammed Al-Ghamdi", active: true },
  { id: 304, name: "Saad Al-Malki", active: true },
  { id: 305, name: "Abdullah Al-Shammari", active: false },
  { id: 306, name: "Noura Al-Subaie", active: true },
  { id: 307, name: "Reem Al-Harbi", active: true },
  { id: 308, name: "Khalid Al-Otaibi", active: false },
  { id: 309, name: "Sultan Al-Dossary", active: true },
  { id: 310, name: "Hind Al-Qahtani", active: true },
  { id: 311, name: "Yousef Al-Balawi", active: false },
  { id: 312, name: "Mishal Al-Ruwaili", active: true },
];

const activeCount = inspectors.filter((i) => i.active).length;
const inactiveCount = inspectors.length - activeCount;

const data = {
  labels: ["Active", "Inactive"],
  datasets: [
    {
      label: "Inspector Status",
      data: [activeCount, inactiveCount],
      backgroundColor: ["rgba(75,192,192,0.85)", "rgba(255,99,132,0.85)"],
      borderColor: ["rgba(75,192,192,1)", "rgba(255,99,132,1)"],
      borderWidth: 1,
    },
  ],
};

export const donutOptions = {
  responsive: true,
  maintainAspectRatio: false, // critical so chart fills parent's height
  plugins: {
    legend: { position: "bottom" },
  },
};

const DoughnutChart = () => {
  // style forwarded to canvas; using 100%/100% makes canvas fill the wrapper
  return <Doughnut data={data} options={donutOptions} style={{ width: "100%", height: "100%" }} />;
};

export default DoughnutChart;
