// Styles
import styles from "./test-maps.module.scss";

// Maths
import { vectorMath } from "../helpers/math";

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
  currentStep,
  currentStepObject,
  nextPoint,
  nextPointCoordinates,
  lastPointCoordinates,
  currentStepPointVectors,
  distanceFromLastPoint,
  distanceFromNextPoint,
  distanceToNextStep,
  distanceToDestination,
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

// TEST
const firstSubStep = computed(() => {
  if (currentStepObject.value == null) return null;

  return [carLatLng.value, nextPointCoordinates.value];
});

// Effects
const effects = [
  effect(() => {
    if (displayMode.value === "preview") return;
    if (snapToCurrentLocation.value !== true) return;
    if (carLatLng.value == null) return;

    map?.value?.panTo(carLatLng.value);
  }),

  effect(() => {
    if (dragging.value === true) {
      if (displayMode.value === "preview") return;
      snapToCurrentLocation.value = false;
    }
  }),
  effect(() => {
    if (displayMode.value === "navigate" && map.value !== null) {
      beginNavigation();
    }
    if (displayMode.value === "preview" && map.value !== null) {
      mapOverviewTransition();
    }
  }),
  effect(() => {}),
];

function beginNavigation() {
  map.value.setZoom(20);
  return;
}

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

// COMPONENTS

const CarMarker = () => {
  return <div className={styles.carMarkerContainer}></div>;
};

const StepsPolyline = ({ step, idx }) => {
  // Do not display old steps?
  // if(currentStep.value > idx) return
  const isCurrentStep = idx === currentStep.value;

  if (!isCurrentStep) {
    return (
      <Polyline
        options={{
          map: map.value,
          path: step.points,
          strokeColor: currentStep < idx ? "red" : "gray",
        }}
      />
    );
  }
};

const CurrentStepPolyline = () => {
  if (!(firstSubStep?.value?.[0] && firstSubStep?.value?.[1])) {
    return null;
  }

  let lt = vectorMath.midpoint(firstSubStep.value[0], firstSubStep.value[1]);

  let labelPosition = {
    lat: lt[0],
    lng: lt[1],
  };

  let distance = vectorMath.haversineDistance(
    firstSubStep.value[0],
    firstSubStep.value[1],
    "m"
  );

  return (
    <>
      <OverlayView
        // getPixelPositionOffset={getPixelPositionOffset}
        mapPaneName="overlayLayer"
        position={labelPosition}
      >
        <p>{distanceFromNextPoint}</p>
      </OverlayView>
      <Polyline
        options={{
          map: map.value,
          path: firstSubStep.value,
          strokeColor: "green",
        }}
        // key={idx}
      />
      {currentStepPointVectors.value.map((step, idx) => {
        // console.log({ step, idx });
        return (
          <Polyline
            options={{
              map: map.value,
              path: step,
              strokeColor: nextPoint.value > idx ? "gray" : "blue",
            }}
            key={idx}
          />
        );
      })}
    </>
  );
};

const TestMaps = () => {
  const [search, setSearch] = useState("Turnabout Boxing Dubois PA");
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
    // console.log(response);
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
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  function currentDestinationString() {
    if (previewRoute.value) {
      return previewRoute.value?.legs?.[0]?.end_address || "UNKNOWN";
    }
    return "none";
  }

  function onInitialLoad() {
    map.value.setTilt(45);
    map.value.setZoom(17);
    // console.log(mapCenter.value);
    map.value.setCenter(mapCenter.value);
  }

  function getPixelPositionOffset(ow, oh) {
    return {
      x: -12,
      y: -12,
    };
  }

  const onUnmount = useCallback((_map) => (map.value = null), []);
  const onLoad = useCallback((_map) => {
    map.value = _map;
    onInitialLoad();
  }, []);

  useEffect(() => {
    return () => {
      effects.forEach((_f) => _f());
    };
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", (key) => {
      // console.log(key);

      switch (key.code) {
        case "ArrowUp": {
          return socketRequest("up");
        }
        case "ArrowDown": {
          return socketRequest("down");
        }
        case "ArrowRight": {
          return socketRequest("right");
        }
        case "ArrowLeft": {
          return socketRequest("left");
        }
      }
    });
  }, []);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.sidebar}>
        <div className={styles.nav}>
          <h3>Navigation</h3>
          <p>
            distanceFromLastPoint: <br />
            {distanceFromLastPoint}
          </p>
          <p>
            distanceFromNextPoint: <br />
            {distanceFromNextPoint}
          </p>
          <p>
            distanceToNextStep: <br />
            {distanceToNextStep}
          </p>
          <p>
            distanceToDestination: <br />
            {distanceToDestination}
          </p>
        </div>
        <div className={styles.content}>
          <div>
            <h3>Maps</h3>
            <p className={styles.dest}>
              Destination: {currentDestinationString()}
            </p>
            {/* <p>position: {JSON.stringify(carLatLng)}</p> */}
            <p>
              dragging: {dragging}, snap: {snapToCurrentLocation}, displayMode:{" "}
              {displayMode.value}
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
              {previewRoute.value && (
                <button onClick={clearRoute}>Reset</button>
              )}
              {previewRoute.value && (
                <button onClick={beginNavigation}>Go</button>
              )}
            </div>
            <p className={styles.rtcBtn} onClick={centerView}>
              Center view
            </p>
          </div>
        </div>
      </div>
      {isLoaded ? (
        <div className={styles.test}>
          <GoogleMap
            className={styles.test}
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
              // map.pan
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

            <OverlayView
              getPixelPositionOffset={getPixelPositionOffset}
              mapPaneName="overlayLayer"
              position={carLatLng.value}
            >
              <CarMarker />
            </OverlayView>
            {displayMode.value === "navigate" && <CurrentStepPolyline />}
            {displayMode.value === "navigate" &&
              currentRoute.value.steps.map((step, idx) => {
                return <StepsPolyline step={step} key={idx} idx={idx} />;
              })}
          </GoogleMap>
        </div>
      ) : (
        <h1>loading...</h1>
      )}
    </div>
  );
};

export default TestMaps;
