import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface ChartProps {
  data:{month:string; count:number}[]
  maxHeight:string
  maxWidth:string
}

const ReactChartLine = ({data ,maxHeight, maxWidth}:ChartProps) => {
  

  return (
    <LineChart
      margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
      data={data}
      responsive
      style={{
        width: "100%",
        maxWidth: maxWidth,
        height: "100%",
        maxHeight: maxHeight,
        aspectRatio: 1.5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" interval={0} />
      <YAxis dataKey="count" tick={{fontSize:12, fill: "#ffffff"}} />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="count" stroke="#8884d8" dot={{ r: 3 }} />
    </LineChart>
  );
};

export default ReactChartLine;
