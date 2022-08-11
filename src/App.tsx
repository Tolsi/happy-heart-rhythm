import React, {useEffect} from 'react';
import heart from './heart-loving-svgrepo-com.svg';
import './App.css';
// @ts-ignore
import * as Dot from 'dot-audio'

import styled, {keyframes} from "styled-components"

// todo move to css?
const PulseAnimation = keyframes`
    0% { transform: scale3d(1, 1, 1); }
    30% { transform: scale3d(1.25, 0.75, 1); }
    40% { transform: scale3d(0.75, 1.25, 1); }
    50% { transform: scale3d(1.15, 0.85, 1); }
    65% { transform: scale3d(0.95, 1.05, 1); }
    75% { transform: scale3d(1.05, 0.95, 1); }
    100% { transform: scale3d(1, 1, 1); }
`;
const PulseDiv = styled.div`
  animation: infinite 1s ${PulseAnimation};
`;

const play = require('audio-play');
const load = require('audio-loader');

var teoria = require('teoria'),
    teoriaChordProgression = require('teoria-chord-progression');

function App() {
    // todo save to state?
    let isInitStarted = false
    let isInitFinished = false
    let synth: any = null
    let AC: any = null
    let audioBuffers: any = null

    async function initAudio() {
        AC = new AudioContext()

        // Create polyphonic synth
        synth = new Dot.PolySynth(
            AC,
            {
                waveform: 'square',
                filterFrequency: 0,
                filterAmount: 1000,
                filterDecay: 1,
                filterSustain: 0.2,
                // gainSustain: 100,
            }
        )

        // Create chorus and reverb effects for a nice lush sound
        const chorus = new Dot.Chorus(AC, {amount: 0.4})
        const reverb = new Dot.Reverb(AC, {amount: 0.25})
        const stereoPanner = new Dot.StereoPanner(AC, {amount: 0.25})

        // Create a limiter to tame the output
        const limiter = new Dot.Limiter(AC, {gain: 0.08})

        // Connect all nodes together
        Dot.chain(synth, stereoPanner, chorus, reverb, limiter, AC.destination)

        await load({background: 'background1-short.mp3', heartbeat: 'heartbeat.mp3'}).then((buffers: any) => {
            console.log('!')
            audioBuffers = buffers
            isInitFinished = true
            console.log(audioBuffers['background'])
            play(audioBuffers['background'], {
                loop: true,
                context: AC,
                volume: 1,
                start: randomNumber(0, audioBuffers['background'].duration)
            })
        });
    }

    function randomNumber(from = 0, to = 1) {
        return from + Math.floor(Math.random() * to)
    }

    function addChar(c: string, i: number) {
        return String.fromCharCode(c.charCodeAt(0) + i);
    }

    function randomNoteIndex(scale: any) {
        return randomNumber(0, scale.scale.length - 1);
    }

    function randomNoteSequence(): any {
        try {
            let randomScale = teoria.Scale.KNOWN_SCALES[randomNumber(0, teoria.Scale.KNOWN_SCALES.length)]
            let scaleWithNote = teoria.scale(addChar('c', randomNumber(0, 6)), randomScale);
            return teoriaChordProgression(scaleWithNote, [randomNoteIndex(scaleWithNote), randomNoteIndex(scaleWithNote), randomNoteIndex(scaleWithNote), randomNoteIndex(scaleWithNote)], 4).simple()
        } catch (e) {
            return randomNoteSequence()
        }
    }

    let sequence = randomNoteSequence()
    let currentSequenceStep = 0

    function playSound() {
        const prevStep = Math.max(0, currentSequenceStep - 1)
        const currentStep = currentSequenceStep
        synth.noteOff(sequence[prevStep])
        synth.noteOn(sequence[currentStep])
        currentSequenceStep = (currentStep + 1) % sequence.length
        play(audioBuffers['heartbeat'], {context: AC, volume: 0.5})
    }

    function onClick() {
        if (isInitFinished) {
            if (AC.state === 'suspended') {
                AC.resume().then(function () {
                    playSound()
                })
            } else {
                playSound()
            }
        } else if (!isInitStarted) {
            isInitStarted = true
            console.log('please, wait')
            initAudio().then(() =>
                onClick()
            )
        }
    }

    return (
        <div className="App" onClick={onClick}>
            <header className="App-header">
                <PulseDiv>
                    <img src={heart} className="App-logo" alt="logo"/>
                </PulseDiv>
                <p>
                    Every heart is worthy to beat happily!
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
            </header>
        </div>
    );
}

export default App;
