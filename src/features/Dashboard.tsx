import icons from "../constants/icon";
import ReactChartLine from "../components/ReactChartLine";
import Calendar from "../components/Calendar";
import Card from "../components/Card";


const Dashboard = () => {
  return (
    <div className=" w-full h-full">
      <div className="h-full overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col pl-6 pt-6 items-start">
          <p className="text-5xl font-semibold text-gray-600 tracking-wide ">
            Overview
          </p>
          <p className="text-gray-400">Monitor Monthly Status</p>
        </div>
        <div className="flex flex-col">
          <div className="w-full flex">
            <div className="flex flex-col w-8/12 p-2">
              <div className=" w-full  flex gap-3 pl-5 pt-5">
                <Card
                  className="menu-bg"
                  title="Renters"
                  linkText="view"
                  icon={
                    <icons.person className="w-12 h-12 mt-2 -mb-12 text-white" />
                  }
                  linkIcon={
                    <icons.rightArrow className="text-2xl text-start mt-1" />
                  }
                  url="/admin/renterhistory"
                  amount="200"
                  description="Monthly Renters"
                />
                <Card
                  className="secondary-box-bg"
                  title="Bookings"
                  linkText="view"
                  linkIcon={
                    <icons.rightArrow className="text-2xl text-start mt-1" />
                  }
                  icon={
                    <icons.book className="w-12 h-12 mt-2 -mb-12 text-white" />
                  }
                  url="/admin/bookings"
                  amount="200"
                  description="Monthly Bookings"
                />
              </div>
              <div className="pl-5 pt-2">
                <div className=" border border-gray-400 rounded p-4">
                  <p className="text-gray-400">Monthly Renters</p>
                  <ReactChartLine />
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between w-2/6 pt-7 py-2 gap-2 pr-5">
              <div className=" rounded border border-gray-400 px-2 py-2">
                <Calendar />
              </div>
              {/* w-full h-full  flex flex-col justify-around items-center tertiray-box-bg py-4 px-4 */}
                 <Card
                className="w-full h-full  flex flex-col justify-around  tertiray-box-bg py-4 px-4"
                title="Revenue"
                url={""}
                topIcon={<icons.money className="text-4xl text-white text-start mt-1"/>}
                amount="20,000"
                amountIcon ={<icons.peso className="text-6xl text-center"/>}
                description="Monthly Revenue"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
