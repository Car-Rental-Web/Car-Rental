import DataTable, { type TableStyles } from "react-data-table-component";
import type { CustomTableProps } from "../types/types";


const customStyles:TableStyles = {
  headCells: {
    style: {
      justifyContent:"center",
      backgroundColor: "#F3F4F6",
      textAlign: "center",
      fontSize: "16px",
      fontWeight: "bolder",
      fontFamily: "'Plus Jakarta Sans', sans-seriff",
    },
  },
  cells: {
    style: {
      justifyContent:"center",
      fontSize: "14px",
      textAlign: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
  },
};

const TableData = <T,>({ ...props }: CustomTableProps<T>) => {
  return (
    <DataTable
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