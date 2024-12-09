import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import "./Sampler.css";

const [uploadedSample, setUploadedSample] = useState(null); // Stores the uploaded sample
const samplerRef = useRef(null); // Ref for the Tone.Sampler