import { BsThreeDots } from "react-icons/bs";
import Card from "../components/Card";
import icons from "../constants/icon";
import type { DataRenterProps } from "../types/types";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "../utils/useDebounce";
import { filterData } from "../utils/FilterData";
import TableData from "../components/TableData";
import SearchBar from "../components/SearchBar";

const staticData: DataRenterProps[] = [
  {
    id: 1,
    name: "Vince David",
    license: "D12-34-567890",
    lastDateRented: new Date(),
    timesRented: "8",
    feedBack: "This Driver is on time, makes a good customer",
    action: <BsThreeDots />,
  },
  {
    id: 2,
    name: "Marvin",
    license: "D12-34-567890",
    lastDateRented: new Date(),
    timesRented: "2",
    feedBack: "This Driver is on time, makes a good customer",
    action: <BsThreeDots />,
  },
  {
    id: 3,
    name: "Martin",
    license: "D12-34-567890",
    lastDateRented: new Date(),
    timesRented: "8",
    feedBack: "This Driver is on time, makes a good customer",
    action: <BsThreeDots />,
  },
  {
    id: 4,
    name: "Em Boss",
    license: "D12-34-567890",
    lastDateRented: new Date(),
    timesRented: "8",
    feedBack: "This Driver is on time, makes a good customer",
    action: <BsThreeDots />,
  },
  {
    id: 5,
    name: "Em Boss",
    license: "D12-34-567890",
    lastDateRented: new Date(),
    timesRented: "1",
    feedBack: "This Driver is on time, makes a good customer",
    action: <BsThreeDots />,
  },
  {
    id: 6,
    name: "Em Boss",
    license: "D12-34-567890",
    lastDateRented: new Date(),
    timesRented: "8",
    feedBack: "This Driver is on time, makes a good customer",
    action: <BsThreeDots />,
  },
  {
    id: 7,
    name: "Marthy Gomez",
    license: "D12-34-567890",
    lastDateRented: new Date(),
    timesRented: "8",
    feedBack: "This Driver is on time, makes a good customer",
    action: <BsThreeDots />,
  },
  {
    id: 8,
    name: "Marthy Gomez",
    license: "D12-34-567890",
    lastDateRented: new Date(),
    timesRented: "8",
    feedBack: "This Driver is on time, makes a good customer",
    action: <BsThreeDots />,
  },
  {
    id: 9,
    name: "Marthy Gomez",
    license: "D12-34-567890",
    lastDateRented: new Date(),
    timesRented: "4",
    feedBack: "This Driver is on time, makes a good customer",
    action: <BsThreeDots />,
  },
  {
    id: 10,
    name: "Marthy Gomez",
    license: "D12-34-567890",
    lastDateRented: new Date(),
    timesRented: "2",
    feedBack: "This Driver is on time, makes a good customer",
    action: <BsThreeDots />,
  },
];

const columns = [
  {
    name: "No.",
    cell: (row: DataRenterProps) => <div className="text-center">{row.id}</div>,
  },
  {
    name: "Name",
    cell: (row: DataRenterProps) => (
      <div className="text-center">{row.name}</div>
    ),
  },
  {
    name: "License #",
    cell: (row: DataRenterProps) => (
      <div className="text-center">{row.license}</div>
    ),
  },
  {
    name: "Last Date Rented",
    cell: (row: DataRenterProps) => (
      <div className=" w-full text-center">
        {new Date(row.lastDateRented).toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        })}
      </div>
    ),
  },
  {
    name: "Times Rented",
    cell: (row: DataRenterProps) => (
      <div className="text-center w-full">{row.timesRented}</div>
    ),
  },
  {
    name: "Feedback",
    cell: (row: DataRenterProps) => (
      <div className="text-center  w-full">{row.feedBack}</div>
    ),
  },
  {
    name: "Action",
    cell: (row: DataRenterProps) => <div className=" ">{row.action}</div>,
  },
];

const RenterHistory = () => {
  const [records, setRecords] = useState(staticData);
  const [searchTerm, setSearchTerm] = useState("");

  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);

  useEffect(() => {
    const result = filterData(debounceSearchTerm, staticData, [
      "id",
      "name",
      "license",
      "lastDateRented",
      "timesRented",
      "feedBack",
    ]);
    setRecords(result);
  }, [debounceSearchTerm]);

  return (
    <div className="w-full  overflow-y-auto flex flex-col gap-5  pt-12 px-6 bg-body">
      <div className="">
        <p className="text-5xl font-semibold text-gray-600 tracking-wide mb-5">
          Renter History
        </p>
        <div className="flex flex-col xl:flex-row gap-2">
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">Renters</span>}
            url={""}
            amount={<span className="text-6xl">200</span>}
            description="Total Renters"
            topIcon={<icons.person className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={
              <span className="text-md xl:text-2xl"> Active Renters</span>
            }
            url={""}
            amount={<span className="text-6xl">200</span>}
            description="Total Active Renters"
            topIcon={<icons.person className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={
              <span className="text-md xl:text-2xl">
                Inactive Renters
              </span>
            }
            url={""}
            amount={<span className="text-6xl">200</span>}
            description="Total Inactive Service"
            topIcon={<icons.person className="text-white text-2xl" />}
          />
        </div>
      </div>
      <div className="w-full flex flex-col px-6 border border-[#055783] py-4 rounded">
        <div className="justify-end flex">
          <SearchBar
            onClear={() => setSearchTerm("")}
            value={searchTerm}
            className=" absolute bg-gray-100 rounded py-2 w-60 "
            placeholder="Search"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <TableData
            progressPending={false}
            title={<span className="font-bold">Renter History</span>}
            data={records}
            columns={columns}
            pagination={true}
            fixedHeader={true}
            responsive={true}
            fixedHeaderScrollHeight="400px"
          />
        </div>
      </div>
    </div>
  );
};

export default RenterHistory;
