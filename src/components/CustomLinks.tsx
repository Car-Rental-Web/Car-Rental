import { Link } from "react-router-dom";
import type { CustomLinksTypes, LinksPath } from "../types/types";


 const CustomLinks: React.FC<CustomLinksTypes> = ({
  url,
  className,
  text,
  icon,
  children,
  onclick,
}) => {
  return (
    <Link onClick={onclick} to={url} className={`${className}`}>
      {" "}
      {icon} {text} {children}{" "}
    </Link>
  );
};


const Links : React.FC<LinksPath> = ({
  urlDashBoard,
  urlFolder,
  dashboard,
  folder,
  otherfolder,
  recent,
}) => {
  return (
    <div className="flex gap-2">
      <CustomLinks url={urlDashBoard} className="poppins  text-secondary">
        {dashboard} {">"}
      </CustomLinks>
      <CustomLinks className="text-secondary" url={urlFolder ?? ""}>
        {otherfolder}
      </CustomLinks>
      <span className="text-secondary">
        {folder} {">"}
      </span>
      <span className="text-primary">{recent}</span>
    </div>
  )

}

export default Links