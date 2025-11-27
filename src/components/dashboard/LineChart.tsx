// LineChart.jsx
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

// register once
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const fineData = {
  labels: [
    "2025-05-01",
    "2025-05-02",
    "2025-05-03",
    "2025-05-04",
    "2025-05-05",
    "2025-05-06",
    "2025-05-07",
    "2025-05-08",
    "2025-05-09",
    "2025-05-10",
    "2025-05-11",
    "2025-05-12",
    "2025-05-13",
    "2025-05-14",
  ],
  datasets: [
    {
      label: "Fine Collected (₹)",
      data: [1200, 950, 1650, 1800, 2100, 900, 1450, 1750, 2000, 1300, 2200, 1900, 2500, 2300],
      fill: true,
      borderColor: "rgba(255,99,132,1)",
      backgroundColor: "rgba(255,99,132,0.12)",
      tension: 0.3,
      pointRadius: 3,
    },
  ],
};

export const lineOptions = {
  responsive: true,
  maintainAspectRatio: false, // critical so chart fills parent's height
  plugins: {
    legend: { position: "top" },
    title: { display: true, text: "Fines Trends" },
  },
  scales: {
    x: { ticks: { maxRotation: 45, minRotation: 45 } },
    y: { beginAtZero: false },
  },
};

const LineChart = () => {
  // style here is forwarded to the <canvas> element by react-chartjs-2
  return <Line data={fineData} options={lineOptions} style={{ width: "100%", height: "100%" }} />;
};

export default LineChart;
