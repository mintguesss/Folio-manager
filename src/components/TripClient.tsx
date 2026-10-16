"use client";

import { useState } from "react";
import { SingaporeTrip } from "./trip/SingaporeTrip";
import { JapanTrip } from "./trip/JapanTrip";

export function TripClient() {
  const [showPast, setShowPast] = useState(false);

  return showPast
    ? <JapanTrip onBack={() => setShowPast(false)} />
    : <SingaporeTrip onShowPast={() => setShowPast(true)} />;
}
