class SoundSynth {
    constructor() {
        this.synth = new Tone.PolySynth().toDestination();
        this.notes = {
            'open_palm': 'C4',
            'fist': 'D4',
            'peace': 'E4',
            'point': 'F4',
            'thumbs_up': 'G4',
            'thumbs_down': 'A4',
            'three': 'B4',
            'four': 'C5',
            'rock_on': 'D5'
        };
        this.isPlaying = false;
    }

    async init() {
        await Tone.start();
        //console.log('Audio engine initialized');
    }

    playGestureSound(gesture, handIndex) {
        if (!gesture || gesture === 'unknown') return;
        const note = this.notes[gesture];
        if (note) {
            // Adjust pitch based on which hand
            const adjustedNote = Tone.Frequency(note)
                .transpose(handIndex * 12)  // Offset second hand by an octave
                .toNote();
            this.synth.triggerAttackRelease(adjustedNote, "8n");
        }
    }
    // playGestureSound(gesture) {
    //     if (!gesture || gesture === 'unknown') return;
        
    //     const note = this.notes[gesture];
    //     if (note) {
    //         this.synth.triggerAttackRelease(note, "8n");
    //     }
    // }

    cleanup() {
        this.synth.dispose();
    }
}