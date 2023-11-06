import logo from "./logo.svg";
import "./App.css";

import useSyncedState from "./hooks/usedSyncedState";
import socketIOClient from "socket.io-client";
import { withState } from "./context/appContext";

import TestSpeedometer from "./components/TestSpeedometer";
import TestVoltage from "./components/TestVoltage";

import { lastLatency, averageLatency } from "./comms/comms";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        <TestSpeedometer />
        <p>{/* Edit <code>src/App.js</code> and save to reload. */}</p>
        {/* <p>Speed: {fakeSpeed}</p> */}
        <p
          style={{
            marginTop: "2rem",
          }}
        >
          Avg. Latency {averageLatency}ms ({lastLatency}ms)
        </p>
        <TestVoltage />
      </header>
    </div>
  );
}

export default App;
