import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Table } from 'lucide-react';
import { DatasetRow } from '../types/dataset';

interface DataPreviewProps {
  data: DatasetRow[];
  maxRows?: number;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ data, maxRows = 5 }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(data.length / maxRows);
  
  if (!data || data.length === 0) return null;
  
  const columns = Object.keys(data[0]);
  const startIndex = currentPage * maxRows;
  const visibleData = data.slice(startIndex, startIndex + maxRows);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Table className="w-5 h-5 mr-2" />
          Data Preview
        </h3>
        <span className="text-sm text-gray-600">
          {data.length} rows × {columns.length} columns
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-3 text-sm text-gray-800 border-b border-gray-100 max-w-xs truncate"
                    title={String(row[column] || '')}
                  >
                    {row[column] === null || row[column] === undefined || row[column] === '' ? (
                      <span className="text-gray-400 italic">null</span>
                    ) : (
                      String(row[column])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {totalPages}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};