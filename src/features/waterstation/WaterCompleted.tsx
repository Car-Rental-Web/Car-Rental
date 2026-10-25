import React from 'react'
import WaterOrderTable from './components/Waterordetable';

const WaterHistory = () => {
  return (
   <WaterOrderTable title="Water Station" statuses={["Completed"]}/>
  )
}

export default WaterHistory