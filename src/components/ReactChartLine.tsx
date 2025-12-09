import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);
const options = {
  responsive:true,
  maintainAspectRaio:false,
  plugins: {
    legend: {
      labels: {
        color: '#032d44',        
      },
    },
  },
  scales: {
    x: {
      ticks: { color: 'white' },  
      grid: { color: 'gray' },    
    },
    y: {
      ticks: { color: 'white' },   
      grid: { color: 'gray' },    
    },
  },
};
const lineChartData = {
  labels: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  datasets: [
    {
      label: "2024",
      data: [100, 200, 300, 50, 150, 90, 120, 300, 400, 12, 20, 45],
      tension: 0.4, // ← THIS softens the line
       borderColor: '#36A2EB',
      backgroundColor: '#032d44',
      
    },
    
  ],
};

const ReactChartLine = () => {

  return (
      <Line  options={options} data={lineChartData}></Line>
  )
  
};

export default ReactChartLine;
