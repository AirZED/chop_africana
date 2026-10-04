"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  OverlayView,
  OverlayViewF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { SearchIcon } from "./icons";

// Swap in real coordinates + photos. Put images in /public/food/stores/
const STORES = [
  {
    id: "greenway",
    name: "Greenway Supermarket",
    address: "88 Mile End Road, London",
    image: "/food/stores/greenway.jpg",
    position: { lat: 51.5224, lng: -0.05 },
  },
  {
    id: "afro-foods",
    name: "Afro Foods Market",
    address: "5 Whitechapel Road, London",
    image: "/food/stores/afro-foods.jpg",
    position: { lat: 51.517, lng: -0.064 },
  },
];

const CENTER = { lat: 51.5195, lng: -0.058 };

// Mint land, blue water, soft roads, like the design
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#D3F5E1" }] },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#BDEBCF" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#A8D5F2" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#F6FCF8" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#FFFFFF" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#A9B7DB" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

function StoreThumb({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border-[3px] border-white bg-emerald-100 ${className}`}
    >
      {failed ? (
        <span className="text-2xl" aria-hidden>
          🏬
        </span>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="72px"
          onError={() => setFailed(true)}
          className="object-cover"
        />
      )}
    </span>
  );
}

export default function StoreLocator() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded } = useJsApiLoader({
    id: "google-maps-script",
    googleMapsApiKey: apiKey,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      STORES.filter((s) =>
        `${s.name} ${s.address}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const focusStore = (id: string) => {
    setActiveId(id);
    const store = STORES.find((s) => s.id === id);
    if (store && mapRef.current) {
      mapRef.current.panTo(store.position);
      mapRef.current.setZoom(15);
    }
  };

  return (
    <section
      id="find-in-store"
      data-nav-bg="light"
      className="relative bg-[#D3F5E1]"
    >
      {/* Full-bleed map */}
      <div className="relative h-[520px] w-full md:h-[820px]">
        {apiKey && isLoaded ? (
          <GoogleMap
            mapContainerClassName="size-full"
            center={CENTER}
            zoom={14}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            onUnmount={() => {
              mapRef.current = null;
            }}
            options={{
              styles: MAP_STYLES,
              disableDefaultUI: true,
              clickableIcons: false,
              gestureHandling: "cooperative",
            }}
          >
            {filtered.map((store) => (
              <OverlayViewF
                key={store.id}
                position={store.position}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h / 2 })}
              >
                <button
                  type="button"
                  aria-label={store.name}
                  onClick={() => focusStore(store.id)}
                  className={`block rounded-2xl shadow-lg transition-transform ${
                    activeId === store.id ? "scale-125" : "hover:scale-110"
                  }`}
                >
                  <StoreThumb
                    src={store.image}
                    alt={store.name}
                    className="size-14 rounded-2xl md:size-[72px]"
                  />
                </button>
              </OverlayViewF>
            ))}
          </GoogleMap>
        ) : !apiKey ? (
          // Fallback if no API key is set (no custom pins or styling)
          <iframe
            title="Store locator map"
            src={`https://www.google.com/maps?q=${encodeURIComponent(
              "Whitechapel, London",
            )}&output=embed`}
            className="absolute inset-0 size-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : null}
      </div>

      {/* Floating card: overlays the map on desktop, sits below it on mobile */}
      <div className="relative z-10 mx-4 -mt-16 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-xl md:absolute md:left-9 md:top-16 md:mx-0 md:mt-0 md:max-h-[calc(100%-8rem)] md:w-[460px] md:overflow-y-auto md:rounded-[2.5rem] md:p-8">
        <h2 className="font-serif text-2xl font-semibold text-stone-900 md:text-[1.75rem]">
          Find In A Store
        </h2>

        <label className="mt-6 flex items-center gap-3 rounded-full bg-[#F3EFEC] px-5 py-3.5">
          <SearchIcon className="size-4 shrink-0 text-stone-900" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Map"
            className="w-full bg-transparent text-base outline-none placeholder:text-stone-400"
          />
        </label>

        <p className="mt-8 text-base text-stone-700">Stores Around You.</p>

        <div className="mt-4 flex flex-col gap-3">
          {filtered.map((store) => (
            <button
              key={store.id}
              type="button"
              onClick={() => focusStore(store.id)}
              className={`tap-press flex w-full items-center gap-4 rounded-3xl bg-[#D3F5E1] p-3 text-left transition-shadow ${
                activeId === store.id ? "ring-2 ring-emerald-400" : ""
              }`}
            >
              <StoreThumb
                src={store.image}
                alt=""
                className="size-16 rounded-2xl md:size-[72px]"
              />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-stone-800 md:text-lg">
                  {store.name}
                </span>
                <span className="block truncate text-sm text-stone-600 md:text-base">
                  {store.address}
                </span>
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="py-2 text-sm text-stone-400">
              No stores match &ldquo;{query}&rdquo;.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
