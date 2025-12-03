const figureImage = document.querySelector('.figure__image');
const figureCaption = document.querySelector('.figure__caption');
const steps = document.querySelectorAll('.scrolly .step');
const screenBlocks = document.querySelectorAll('.screen-block');

const setActiveStep = targetStep => {
  steps.forEach(step => {
    step.classList.toggle('is-active', step === targetStep);
  });
};

const updateFigure = step => {
  const bg = step.getAttribute('data-bg');
  const caption = step.getAttribute('data-caption');
  if (bg) {
    figureImage.style.backgroundImage = `url(${bg})`;
  }
  if (caption) {
    figureCaption.textContent = caption;
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
  // Set your Mapbox access token
  mapboxgl.accessToken = "pk.eyJ1Ijoia3VoaWthIiwiYSI6ImNtaGR2anRheDA3YTAycXBpZnNwZ2I1bTMifQ.zifNwpp3S5WlAUvhxJgyZw";

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [-77.8, 8.0], // temporary center before fitBounds
    zoom: 6
  });

  map.addControl(new mapboxgl.NavigationControl(), "top-right");

  map.on("load", () => {
    // Load GeoJSON from external file
    fetch("data/geojson/darien-gap.geojson")
      .then(res => res.json())
      .then(geojson => {
        // Add as a source
        map.addSource("territory", {
          type: "geojson",
          data: geojson
        });

        // Fill layer
        map.addLayer({
          id: "territory-fill",
          type: "fill",
          source: "territory",
          paint: {
            "fill-color": "#ff6600",
            "fill-opacity": 0.35
          }
        });

        // Outline layer
        map.addLayer({
          id: "territory-outline",
          type: "line",
          source: "territory",
          paint: {
            "line-color": "#ff6600",
            "line-width": 2
          }
        });

        // Compute bounds and fit
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
          map.fitBounds(bounds, { padding: 40 });
        }
      })
      .catch(err => {
        console.error("Error loading GeoJSON:", err);
      });
  });

  // Optional interactions
  map.on("click", "territory-fill", (e) => {
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML("<strong>Territory</strong>")
      .addTo(map);
  });

  map.on("mouseenter", "territory-fill", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "territory-fill", () => {
    map.getCanvas().style.cursor = "";
  });
} else if (mapContainer) {
  mapContainer.textContent = "Map failed to load. Please retry once the page finishes loading.";
}

