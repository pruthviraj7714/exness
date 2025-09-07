"use client"

import { useState } from "react"
import { InstrumentList } from "./instrument-list"
import { TradeForm } from "./trade-form"
import { TradingChart } from "./trading-chart"

function TradingInterface() {
    const [selectedInstrument, setSelectedInstrument] = useState("BTC")
  
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <InstrumentList onSelectInstrument={setSelectedInstrument} selectedInstrument={selectedInstrument} />
        </div>
  
        <div className="lg:col-span-2 space-y-6">
          <TradingChart instrument={selectedInstrument} />
          <TradeForm instrument={selectedInstrument} />
        </div>
      </div>
    )
  }

  export default TradingInterface;