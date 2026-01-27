import { useState } from "react";
import icons from "../constants/icon";
import { filterData } from "../utils/FilterData";
import { useDebouncedValue } from "../utils/useDebounce";
import SearchBar from "./SearchBar";

interface TrashTableProps {
  title: string;
  data: any[];
  columns: {
    header: string;
    key: string;
    render?: (row: any) => React.ReactNode;
  }[];
  onRestore: (id: number) => void;
  onDelete: (id: number) => void;
  searchKeys: string[];
}

const TrashTable = ({
  title,
  data,
  columns,
  onRestore,
  onDelete,
  searchKeys,
}: TrashTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchTerm, 200);

  // 1. Filter Logic
  const filteredData = filterData(debouncedSearch, data, searchKeys);

  // 2. Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="mb-12 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="font-bold text-slate-700 text-lg">{title}</h3>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="p-2 border rounded-lg text-sm bg-slate-50 outline-none"
          >
            {[5, 10, 15, 20].map((val) => (
              <option key={val} value={val}>
                Show {val}
              </option>
            ))}
          </select>
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${title}...`}
            className="w-full py-2.5 px-4 border border-slate-200 bg-slate-50 text-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left table-fixed">
          <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
            <tr>
              <th className="p-4 text-center">No</th>
              {columns.map((col, i) => (
                <th key={i} className="p-4">
                  {col.header}
                </th>
              ))}
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.length > 0 ? (
              currentItems.map((row, index) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 text-center text-xs text-slate-400">
                    {indexOfFirstItem + index + 1}
                  </td>
                  {columns.map((col, i) => (
                    <td key={i} className="p-4 text-xs">
                      {col.render ? col.render(row) : row[col.key] || "N/A"}
                    </td>
                  ))}
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => onRestore(row.id)}
                        className="text-emerald-600 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <icons.restore size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(row.id)}
                        className="text-red-500 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <icons.trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="p-10 text-center text-slate-400 text-sm"
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashTable;
