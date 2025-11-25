import Card from "../components/Card";
import icons from "../constants/icon";

const AvailableVehicles = () => {
  return (
    <div className="w-full px-6 mt-12">
      <p className=" text-5xl font-semibold text-gray-600 tracking-wide mb-5 ">
        Vehicles
      </p>
      <div className="flex w-full gap-5">
        <Card
            className="on-service"
            title="On Service"
            url={""}
            amount="5"
            description="Total On Service"
            topIcon={<icons.onService className="text-white text-2xl" />}
          />
          <Card
            className="on-reservation"
            title="Reservations"
            url={""}
            amount="5"
            description="Total Reservations"
            topIcon={<icons.onReserve className="text-white text-2xl" />}
          />
          <Card
            className="on-ended"
            title="Maintenance"
            url={""}
            amount="5"
            description="Total Maintenance"
            topIcon={<icons.onMaintenance className="text-white text-2xl" />}
          />
          <Card
            className="on-service"
            title="Available"
            url={""}
            amount="5"
            description="Total Available"
            topIcon={<icons.onAvailable className="text-white text-2xl" />}
          />

      </div>


    </div>
  );
};

export default AvailableVehicles;
