import DataTable, { type TableStyles } from "react-data-table-component";
import type { CustomTableProps } from "../types/types";
import { createTheme } from "react-data-table-component";


createTheme("darkBody", {
  background: {
    default: "#011a31",  // ← THIS is the table body background
  },
  text: {
    primary: "white"
  }
});
const customStyles:TableStyles = {
  headCells: {
    style: {
      justifyContent:"center",
      backgroundColor: "#032d44",
      textAlign: "center",
      fontSize: "16px",
      fontWeight: "bolder",
      fontFamily: "'Plus Jakarta Sans', sans-seriff",
      color: "white"
    },
  },
    rows: {
    style: {
      backgroundColor: "#011a31",
      color: "white",        
      fontSize: "14px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      border: "1px solid #032d44",
    },
  },
  cells: {
    style: {
      justifyContent:"center",
      fontSize: "14px",
      textAlign: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      backgroundColor: "#011a31"
    },
  },
 pagination: {
    style: {
      color: "#fff"
    },
    pageButtonsStyle: {
      color: "#ffffff",            // Text color
      fill: "#ffffff",             // SVG arrow color
      backgroundColor: "transparent",
      borderRadius: "50%",
      "&:hover:not(:disabled)": {
        backgroundColor: "#054f6d",
      },
      "&:disabled": {
        color: "#888888",
        fill: "#888888",
      },
    },
  },
};

const TableData = <T,>({ ...props }: CustomTableProps<T>) => {
  return (
    <DataTable
    theme="darkBody"
      progressPending={props.progressPending}
      customStyles={customStyles}
      data={props.data}
      columns={props.columns}
      title={props.title}
      pagination={props.pagination}
      striped={props.striped}
      highlightOnHover={props.highlightOnHover}
      pointerOnHover={props.pointerOnHover}
      dense={props.dense}
      responsive={props.responsive}
      fixedHeader={props.fixedHeader}
      fixedHeaderScrollHeight={props.fixedHeaderScrollHeight}
      subHeader={props.subHeader}
      subHeaderComponent={props.subHeaderComponent}
      subHeaderAlign={props.subHeaderAlign}
      subHeaderWrap={props.subHeaderWrap}
      direction={props.direction}
      selectableRows={props.selectableRows}
    />
  );
};

export default TableData;