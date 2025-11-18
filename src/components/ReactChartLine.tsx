import {Line} from 'react-chartjs-2'
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'


ChartJS.register(
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
    Legend,
)

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
            data:[100, 200, 300, 50, 150, 90, 120,300,400, 12, 20,45],
            borderColor: "red",
        },
        {
            label: "2024",
            data:[50, 26, 275, 50, 70, 20, 85, 400, 200, 45, 80, 225],
            borderColor: "blue",
        }
    ]
}

const ReactChartLine = () => {

    const options = {}

  return (
    <Line options={options} data={lineChartData} ></Line>
  )
}

export default ReactChartLine