// Styles
import styles from './test-maps.module.scss';

// Maths
import { vectorMath } from '../helpers/math';

// Dependencies
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  Marker,
  OverlayView,
} from '@react-google-maps/api';
import { useEffect, useState, useCallback } from 'react';
import { signal, effect, computed } from '@preact/signals-react';

// eSignals
import {
  previewRoute,
  carPosition,
  currentRoute,
  carLatLng,
  currentStep,
} from '../comms/comms';
import { socketRequest } from '../comms/functions';

// iSignals
const mapCenter = signal({ lat: 0, lng: 0 });
const snapToCurrentLocation = signal(true);
const dragging = signal(false);
const map = signal(null);
const displayMode = computed(() => {
  if (currentRoute.value) return 'navigate';
  if (previewRoute.value) return 'preview';
  return 'idle';
}); // idle, preview, navigate

// TEST
const firstSubStep = computed(() => {
  if (currentStep.value == null) return null;

  return [carLatLng.value, currentStep.value.latLng[0]];
});

const subSteps = computed(() => {
  if (currentStep.value == null) return null;
  let temp = currentStep.value.latLng;
  temp.shift();

  // Group temp into pairs
  let pairs = [];
  for (let i = 0; i < temp.length; i++) {
    let c = temp[i];
    let n = temp[i + 1];
    if (!n) continue;
    pairs.push([c, n]);
  }

  return pairs;
});

// Effects
const effects = [
  effect(() => {
    if (displayMode.value === 'preview') return;
    if (snapToCurrentLocation.value !== true) return;
    if (carPosition.value == null) return;

    map?.value?.panTo({
      lat: carPosition.value[0],
      lng: carPosition.value[1],
    });
  }),

  effect(() => {
    if (dragging.value === true) {
      if (displayMode.value === 'preview') return;
      snapToCurrentLocation.value = false;
    }
  }),
  effect(() => {
    // console.log([
    //   displayMode.value,
    //   displayMode.value === "preview",
    //   map.value,
    //   map.value !== null,
    // ]);
    if (displayMode.value === 'navigate' && map.value !== null) {
      beginNavigation();
    }
    if (displayMode.value === 'preview' && map.value !== null) {
      mapOverviewTransition();
    }
  }),
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

const StepsPolyline = ({ latLng, ...props }) => {
  return (
    <Polyline
      options={{
        map: map.value,
        path: latLng,
        strokeColor: 'red',
        ...props,
      }}
    />
  );
};

const CurrentStepPolyline = () => {
  let stepsToRender = currentStep.value.latLng;

  function atv(a) {
    return {
      lat: a[0],
      lng: a[1],
    };
  }

  function vta(v) {
    return [v.lat, v.lng];
  }
  console.log({
    stepsToRender,
    a: stepsToRender.length,
    subSteps: subSteps.value,
    firstSubStep: firstSubStep.value,
  });

  let lt = vectorMath.midpoint(
    [firstSubStep.value[0].lat, firstSubStep.value[0].lng],
    [firstSubStep.value[1].lat, firstSubStep.value[1].lng]
  );

  let labelPosition = {
    lat: lt[0],
    lng: lt[1],
  };

  console.log({
    a: firstSubStep.value[0],
    b: firstSubStep.value[1],
    labelPosition,
  });

  let distance = vectorMath.distance(
    vta(firstSubStep.value[0]),
    vta(firstSubStep.value[1])
  );

  console.log({ distance });

  return (
    <>
      <OverlayView
        // getPixelPositionOffset={getPixelPositionOffset}
        mapPaneName='overlayLayer'
        position={labelPosition}
      >
        <p>{distance}</p>
      </OverlayView>
      <Polyline
        options={{
          map: map.value,
          path: firstSubStep.value,
          strokeColor: 'green',
        }}
        // key={idx}
      />
      {subSteps.value.map((step, idx) => {
        // console.log({ step, idx });
        return (
          <Polyline
            options={{
              map: map.value,
              path: step,
              strokeColor: 'blue',
            }}
            key={idx}
          />
        );
      })}
    </>
  );
};

const TestMaps = () => {
  const [search, setSearch] = useState('white house');
  const [error, setError] = useState('null');
  const [loading, setLoading] = useState(false);

  // Functions
  async function requestRoute() {
    setLoading(true);
    const response = await socketRequest('requestRoutePreview', 5000, search);
    if (response !== 'SUCCESS') {
      setError(response);
    } else {
      setError(null);
    }
    console.log(response);
    setLoading(false);
  }
  async function beginNavigation() {
    const response = await socketRequest('confirmRoutePreview', 5000);
  }
  async function clearRoute() {
    const response = await socketRequest('clearRoutePreview', 5000);
  }
  function centerView() {
    snapToCurrentLocation.value = true;
  }

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  function currentDestinationString() {
    if (previewRoute.value) {
      return previewRoute.value?.legs?.[0]?.end_address || 'UNKNOWN';
    }
    return 'none';
  }

  function onInitialLoad() {
    map.value.setTilt(45);
    map.value.setZoom(17);
    console.log(mapCenter.value);
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

  return (
    <div className={styles.mainContainer}>
      <div className={styles.sidebar}>
        <div className={styles.nav}>
          <h3>Navigation</h3>
        </div>
        <div className={styles.content}>
          <div>
            <h3>Maps</h3>
            <p className={styles.dest}>
              Destination: {currentDestinationString()}
            </p>
            <p>position: {carPosition}</p>
            <p>
              dragging: {dragging}, snap: {snapToCurrentLocation}, displayMode:{' '}
              {displayMode.value}
            </p>
            {error != null && <p>{error}</p>}
          </div>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
            }}
            type='text'
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
        <GoogleMap
          onCenterChanged={() => {
            console.log('changed');
          }}
          zoom={1}
          mapContainerStyle={{
            width: '100%',
            height: '100%',
          }}
          onDragStart={() => {
            dragging.value = true;
          }}
          onDragEnd={() => {
            dragging.value = false;
          }}
          onLoad={(map) => {
            onLoad(map);
            console.log('LOADED');
          }}
          onUnmount={onUnmount}
          options={{
            gestureHandling: 'cooperative',
            draggable: displayMode.value !== 'preview',
            disableDefaultUI: true,
          }}
        >
          {displayMode.value === 'preview' && (
            <Polyline
              options={{
                map: map.value,
                path: previewRoute.value.decodedOverviewLatLng,
                strokeColor: 'red',
              }}
            />
          )}

          <OverlayView
            getPixelPositionOffset={getPixelPositionOffset}
            mapPaneName='overlayLayer'
            position={carLatLng.value}
          >
            <CarMarker />
          </OverlayView>
          {displayMode.value === 'navigate' && <CurrentStepPolyline />}
          {displayMode.value === 'navigate' &&
            currentRoute.value.legs[0].steps.map((step, idx) => {
              return <StepsPolyline latLng={step.latLng} key={idx} />;
            })}
        </GoogleMap>
      ) : (
        <h1>loading...</h1>
      )}
    </div>
  );
};

export default TestMaps;
