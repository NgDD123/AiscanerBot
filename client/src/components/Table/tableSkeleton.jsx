import { Skeleton } from '@mantine/core';
import React from 'react'
import "../pages/on-board.css"

const TableSkeleton = ({ columns }) => {
  return (
    <table className="  mx-auto flex flex-col gap-y-2 ">
      <thead className=" text-major-text-style ">
        <tr className='w-full flex justify-evenly items-center gap-x-1'>

          {columns.map((column, i) => (
            <th
              key={i}
              className="p-3 font-semibold bg-transparent whitespace-nowrap"
            >
              <Skeleton height={30} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className='w-full'>
        {[...Array(10)].map((_, index) => (
          <tr key={index} className="w-full ">

            {columns.map((column, i) => (
              <td key={i} className="p-2 ">
                <Skeleton height={30} />
              </td>
            ))}
            <Skeleton className='glass_morphism' height={30} />
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableSkeleton;