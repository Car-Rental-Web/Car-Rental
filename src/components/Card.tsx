import { Link } from "react-router-dom";

interface CardProps {
  className: string;
  topIcon?:React.ReactNode
  title: React.ReactNode;
  linkText?: string | React.ReactNode
  linkIcon?: React.ReactNode;
  icon?: React.ReactNode;
  url: string;
  amountIcon?: React.ReactNode;
  amount: React.ReactNode;
  description: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ ...CardProps }) => {
  return (
    <div
      className={`flex flex-col justify-around  rounded  py-4 px-4 ${CardProps.className}`}
    >
      <div className="flex justify-between px-4">
        <div className="flex flex-col items-center">
          <p className="text-white text-2xl">{CardProps.title}</p>
          <p>{CardProps.icon}</p>
        </div>
        <div>
          <Link
            className=" flex items-center text-white text-xl"
            to={CardProps.url}
          >
            {CardProps.linkText} {CardProps.linkIcon}
          </Link>
          <p>{CardProps.topIcon}</p>
        </div>
      </div>
      <p className="text-center  text-white pb-2 font-extrabold flex justify-center items-center">
        {CardProps.amountIcon}
        {CardProps.amount}
      </p>
      <p className="text-center text-white">{CardProps.description}</p>
    </div>
  );
};

export default Card;
