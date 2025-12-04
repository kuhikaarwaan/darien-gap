const figureImage = document.querySelector('.figure__image');
const figureCaption = document.querySelector('.figure__caption');
const figureMap = document.querySelector('.figure__map');
const steps = document.querySelectorAll('.scrolly .step');
const screenBlocks = document.querySelectorAll('.screen-block');
const articleBackgroundBlocks = document.querySelectorAll('article[data-bg]');

const SLIDE_DURATION = 900;
let backgroundSlideTimeout = null;
let slideRequestToken = 0;

let mapInstance = null;
let mapLoaded = false;
let pendingMapView = null;

const setFigureBackground = imagePath => {
  if (!figureImage) return;
  if (imagePath) {
    figureImage.style.backgroundImage = `url(${imagePath})`;
    figureImage.dataset.currentBg = imagePath;
  } else {
    figureImage.style.backgroundImage = '';
    delete figureImage.dataset.currentBg;
  }
};

const finishSlideTransition = () => {
  if (!figureImage) return;
  if (backgroundSlideTimeout) {
    clearTimeout(backgroundSlideTimeout);
    backgroundSlideTimeout = null;
  }
  if (figureImage.dataset.pendingBg) {
    setFigureBackground(figureImage.dataset.pendingBg);
    delete figureImage.dataset.pendingBg;
  }
  figureImage.classList.remove('is-sliding');
  figureImage.style.removeProperty('--next-background');
};

const clearFigureBackground = () => {
  slideRequestToken += 1;
  finishSlideTransition();
  setFigureBackground('');
};

const preloadImage = (src, callback) => {
  const img = new Image();
  const done = () => callback();
  img.onload = done;
  img.onerror = done;
  img.src = src;
};

const beginSlideAnimation = (imagePath, token) => {
  if (!figureImage || token !== slideRequestToken) return;
  finishSlideTransition();

  figureImage.dataset.pendingBg = imagePath;
  figureImage.style.setProperty('--next-background', `url(${imagePath})`);

  void figureImage.offsetWidth;
  requestAnimationFrame(() => {
    if (!figureImage || token !== slideRequestToken) return;
    figureImage.classList.add('is-sliding');
  });

  backgroundSlideTimeout = window.setTimeout(() => {
    if (!figureImage || figureImage.dataset.pendingBg !== imagePath) {
      return;
    }
    setFigureBackground(imagePath);
    delete figureImage.dataset.pendingBg;
    figureImage.classList.remove('is-sliding');
    figureImage.style.removeProperty('--next-background');
    backgroundSlideTimeout = null;
  }, SLIDE_DURATION);
};

const transitionBackgroundImage = imagePath => {
  if (!figureImage || !imagePath) return;
  const currentBg = figureImage.dataset.currentBg;

  if (!currentBg) {
    setFigureBackground(imagePath);
    return;
  }

  if (currentBg === imagePath) {
    return;
  }

  slideRequestToken += 1;
  const token = slideRequestToken;
  preloadImage(imagePath, () => beginSlideAnimation(imagePath, token));
};

articleBackgroundBlocks.forEach(block => {
  const bg = block.dataset.bg;
  if (!bg) return;
  block.style.setProperty('--article-bg-image', `url(${bg})`);
});

const toggleMapBackground = isActive => {
  if (figureMap) {
    figureMap.classList.toggle('is-active', isActive);
  }
  if (figureImage) {
    figureImage.classList.toggle('figure__image--map', isActive);
  }
  document.body.classList.toggle('map-active', isActive);
};

const parseCenterAttr = attr => {
  if (!attr) return null;
  const [lng, lat] = attr.split(',').map(value => parseFloat(value.trim()));
  if ([lng, lat].every(coord => Number.isFinite(coord))) {
    return [lng, lat];
  }
  return null;
};

const buildCameraOptions = (view, instant = false) => {
  const options = {};
  if (view.center) options.center = view.center;
  if (typeof view.zoom === 'number') options.zoom = view.zoom;
  if (typeof view.bearing === 'number') options.bearing = view.bearing;
  if (typeof view.pitch === 'number') options.pitch = view.pitch;
  if (!instant) {
    options.duration = view.duration ?? 1600;
    options.essential = true;
  }
  return options;
};

const getMapViewFromStep = step => {
  if (!step || !step.classList.contains('step--map')) {
    return null;
  }
  const view = {};
  const center = parseCenterAttr(step.getAttribute('data-map-center'));
  const zoom = parseFloat(step.getAttribute('data-map-zoom'));
  const bearing = parseFloat(step.getAttribute('data-map-bearing'));
  const pitch = parseFloat(step.getAttribute('data-map-pitch'));

  if (center) view.center = center;
  if (Number.isFinite(zoom)) view.zoom = zoom;
  if (Number.isFinite(bearing)) view.bearing = bearing;
  if (Number.isFinite(pitch)) view.pitch = pitch;

  return Object.keys(view).length ? view : null;
};

const flyToMapView = view => {
  if (!view) return;
  pendingMapView = view;
  if (mapInstance && mapLoaded) {
    mapInstance.flyTo(buildCameraOptions(view));
    pendingMapView = null;
  }
};

const applyPendingMapView = () => {
  if (pendingMapView && mapInstance && mapLoaded) {
    mapInstance.jumpTo(buildCameraOptions(pendingMapView, true));
    pendingMapView = null;
  }
};

const setActiveStep = targetStep => {
  steps.forEach(step => {
    step.classList.toggle('is-active', step === targetStep);
  });
};

const updateFigure = step => {
  if (!step) return;
  const bg = step.getAttribute('data-bg');
  const caption = step.getAttribute('data-caption');
  const isMapStep = step.classList.contains('step--map');

  if (isMapStep) {
    toggleMapBackground(true);
    if (figureImage) {
      clearFigureBackground();
    }
    flyToMapView(getMapViewFromStep(step));
  } else {
    toggleMapBackground(false);
    if (bg && figureImage) {
      transitionBackgroundImage(bg);
    }
  }

  if (figureCaption) {
    figureCaption.textContent = caption || '';
  }
  setActiveStep(step);
};

if (steps.length) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updateFigure(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  steps.forEach(step => observer.observe(step));
}

if (screenBlocks.length) {
  const firstWithMedia =
    Array.from(screenBlocks).find(block => block.dataset.bg) || screenBlocks[0];
  if (firstWithMedia) {
    updateFigure(firstWithMedia);
    firstWithMedia.classList.add('is-active');
  }

  const blockObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          screenBlocks.forEach(block => block.classList.remove('is-active'));
          entry.target.classList.add('is-active');
          if (entry.target.dataset.bg || entry.target.dataset.caption) {
            updateFigure(entry.target);
          }
        }
      });
    },
    { threshold: 0.6}
  );

  screenBlocks.forEach(block => blockObserver.observe(block));
}

const mapContainer = document.getElementById("map");

if (mapContainer && window.mapboxgl) {
  mapboxgl.accessToken = "pk.eyJ1Ijoia3VoaWthIiwiYSI6ImNtaGR2anRheDA3YTAycXBpZnNwZ2I1bTMifQ.zifNwpp3S5WlAUvhxJgyZw";

  mapInstance = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [-77.8, 8.0],
    zoom: 6
  });

  mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");
  mapInstance.scrollZoom.disable();

  mapInstance.on("load", () => {
    mapLoaded = true;
    applyPendingMapView();

    fetch("data/geojson/darien-gap.geojson")
      .then(res => res.json())
      .then(geojson => {
        mapInstance.addSource("territory", {
          type: "geojson",
          data: geojson
        });

        mapInstance.addLayer({
          id: "territory-fill",
          type: "fill",
          source: "territory",
          paint: {
            "fill-color": "#228B22",
            "fill-opacity": 0.25
          }
        });

        mapInstance.addLayer({
          id: "territory-outline",
          type: "line",
          source: "territory",
          paint: {
            "line-color": "#006400",
            "line-width": 2
          }
        });

        const bounds = new mapboxgl.LngLatBounds();
        const features = geojson.features || [];

        features.forEach(f => {
          const geom = f.geometry;
          if (!geom) return;

          if (geom.type === "Polygon") {
            geom.coordinates[0].forEach(c => bounds.extend(c));
          } else if (geom.type === "MultiPolygon") {
            geom.coordinates.forEach(poly => {
              poly[0].forEach(c => bounds.extend(c));
            });
          }
        });

        if (!bounds.isEmpty()) {
          mapInstance.fitBounds(bounds, { padding: 40 });
        }
      })
      .catch(err => {
        console.error("Error loading GeoJSON:", err);
      });
  });

  mapInstance.on("click", "territory-fill", e => {
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML("<strong>Territory</strong>")
      .addTo(mapInstance);
  });

  mapInstance.on("mouseenter", "territory-fill", () => {
    mapInstance.getCanvas().style.cursor = "pointer";
  });

  mapInstance.on("mouseleave", "territory-fill", () => {
    mapInstance.getCanvas().style.cursor = "";
  });
} else if (mapContainer) {
  mapContainer.textContent = "Map failed to load. Please retry once the page finishes loading.";
}

