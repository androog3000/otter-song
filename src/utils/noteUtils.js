export const getNoteByStep = (step, sequence) => {
    return sequence[step] || ""; // Return note or empty string
  };
  
  export const isNoteInSequence = (note, sequence) => {
    return sequence.includes(note);
  };
  