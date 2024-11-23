import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

const startSequence = () => {
    Tone.start(); // Ensure AudioContext is started
    setCounter(1);
    activeStepRef.current = 0; // Reset the active step
    setIsRunning(true);

    // Schedule the transport to run the sequencer
    transport.scheduleRepeat((time) => {
      const currentStep = activeStepRef.current;
      const note = sequence[currentStep];

      // Stop any currently playing note
      synthRef.current?.triggerRelease();

      // Play the note if the step contains one
      if (note) {
        synthRef.current.triggerAttackRelease(note, "8n", time);
      }

      // Update the active step and counter
      activeStepRef.current = (currentStep + 1) % sequence.length;
      setCounter(activeStepRef.current + 1); // Update UI for beat count
    }, "8n"); // Steps align with eighth notes

    transport.start();
  };