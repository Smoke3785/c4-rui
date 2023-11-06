// Styles
import styles from "./test-maps.module.scss";

// Dependencies
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  Marker,
  OverlayView,
} from "@react-google-maps/api";
import { useEffect, useState, useCallback } from "react";
import { signal, effect, computed } from "@preact/signals-react";

// eSignals
import {
  previewRoute,
  carPosition,
  currentRoute,
  carLatLng,
} from "../comms/comms";
import { socketRequest } from "../comms/functions";

// iSignals
const mapCenter = signal({ lat: 0, lng: 0 });
const snapToCurrentLocation = signal(true);
const dragging = signal(false);
const map = signal(null);
const displayMode = computed(() => {
  if (currentRoute.value) return "navigate";
  if (previewRoute.value) return "preview";
  return "idle";
}); // idle, preview, navigate

// Effects
let ae = effect(() => {
  if (displayMode.value === "preview") return;
  if (snapToCurrentLocation.value !== true) return;
  if (carPosition.value == null) return;

  map?.value?.panTo({
    lat: carPosition.value[0],
    lng: carPosition.value[1],
  });
});

let be = effect(() => {
  if (dragging.value === true) {
    if (displayMode.value === "preview") return;
    snapToCurrentLocation.value = false;
  }
});

let de = effect(() => {
  console.log([
    displayMode.value,
    displayMode.value === "preview",
    map.value,
    map.value !== null,
  ]);
  if (displayMode.value === "preview" && map.value !== null) {
    mapOverviewTransition();
  }
});

// effect(() => console.log(["carP!", carPosition.value]));

function mapOverviewTransition() {
  let bounds = previewRoute.value.bounds;
  let { lat: north, lng: east } = bounds.northeast;
  let { lat: south, lng: west } = bounds.southwest;

  map.value.fitBounds({
    north,
    east,
    south,
    west,
  });
}

const CarMarker = () => {
  return <div className={styles.carMarkerContainer}>:)</div>;
};

const TestMaps = () => {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("null");
  const [loading, setLoading] = useState(false);

  // Functions
  async function requestRoute() {
    setLoading(true);
    const response = await socketRequest("requestRoutePreview", 5000, search);
    if (response !== "SUCCESS") {
      setError(response);
    } else {
      setError(null);
    }
    console.log(response);
    setLoading(false);
  }
  async function beginNavigation() {
    const response = await socketRequest("confirmRoutePreview", 5000);
  }
  async function clearRoute() {
    const response = await socketRequest("clearRoutePreview", 5000);
  }
  function centerView() {
    snapToCurrentLocation.value = true;
  }

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyDautE9XHeg_qxSRd-XXMXCU6KQKlyP6uM",
  });

  function currentDestinationString() {
    if (previewRoute.value) {
      return previewRoute.value?.legs?.[0]?.end_address || "UNKNOWN";
    }
    return "none";
  }

  function onInitalLoad() {
    map.value.setTilt(45);
    map.value.setZoom(17);
    console.log(mapCenter.value);
    map.value.setCenter(mapCenter.value);
  }

  const onUnmount = useCallback((_map) => (map.value = null), []);
  const onLoad = useCallback((_map) => {
    map.value = _map;
    onInitalLoad();
  }, []);

  useEffect(() => {
    return () => {
      [ae, be, de].forEach((_f) => _f());
    };
  }, []);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.content}>
        <div>
          <h3>Maps</h3>
          <p className={styles.dest}>
            Destination: {currentDestinationString()}
          </p>
          <p>position: {carPosition}</p>
          <p>
            dragging: {dragging.toString()}, snap:{" "}
            {snapToCurrentLocation.toString()}, displayMode: {displayMode.value}
          </p>
          {error != null && <p>{error}</p>}
        </div>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
          }}
          type="text"
        />
        <div className={styles.controls}>
          <div className={styles.buttons}>
            {!previewRoute.value && (
              <button
                disabled={loading || previewRoute.value}
                onClick={requestRoute}
              >
                Request navigation route
              </button>
            )}
            {previewRoute.value && <button onClick={clearRoute}>Reset</button>}
            {previewRoute.value && (
              <button onClick={beginNavigation}>Go</button>
            )}
          </div>
          <p className={styles.rtcBtn} onClick={centerView}>
            Center view
          </p>
        </div>
      </div>
      {isLoaded ? (
        <GoogleMap
          onCenterChanged={() => {
            console.log("changed");
          }}
          zoom={1}
          mapContainerStyle={{
            width: "100%",
            height: "100%",
          }}
          onDragStart={() => {
            dragging.value = true;
          }}
          onDragEnd={() => {
            dragging.value = false;
          }}
          onLoad={(map) => {
            onLoad(map);
            console.log("LOADED");
          }}
          onUnmount={onUnmount}
          options={{
            gestureHandling: "cooperative",
            draggable: displayMode.value !== "preview",
            disableDefaultUI: true,
          }}
        >
          {displayMode.value === "preview" && (
            <Polyline
              options={{
                map: map.value,
                path: previewRoute.value.decodedOverviewLatLng,
                strokeColor: "red",
              }}
            />
          )}
          {/* <Marker position={carLatLng.value}><CarMarker /></Marker> */}
          <OverlayView mapPaneName="overlayLayer" position={carLatLng.value}>
            <CarMarker />
          </OverlayView>

          <></>
        </GoogleMap>
      ) : (
        <h1>loading...</h1>
      )}
    </div>
  );
};

export default TestMaps;
