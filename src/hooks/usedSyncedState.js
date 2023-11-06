import { useState, useEffect, useMemo } from "react";

import { stateUpdateListener } from "../App";

function useSyncedState(defaultValue) {
  const [internalState, setInternalState] = useState(defaultValue);

  const [mInternalState, mSetInternalState] = useMemo(
    () => [internalState, setInternalState],
    [internalState]
  );

  async function updateState() {}

  return [mInternalState, updateState, mSetInternalState];
}

export default useSyncedState;
