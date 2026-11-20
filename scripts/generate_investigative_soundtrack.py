import os
import math
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

def butter_lowpass_filter(data, cutoff, fs, order=2):
    nyq = 0.5 * fs
    normal_cutoff = min(max(cutoff / nyq, 0.001), 0.99)
    b, a = butter(order, normal_cutoff, btype='low', analog=False)
    return lfilter(b, a, data)

def butter_highpass_filter(data, cutoff, fs, order=2):
    nyq = 0.5 * fs
    normal_cutoff = min(max(cutoff / nyq, 0.001), 0.99)
    b, a = butter(order, normal_cutoff, btype='high', analog=False)
    return lfilter(b, a, data)

def butter_bandpass_filter(data, lowcut, highcut, fs, order=2):
    nyq = 0.5 * fs
    low = max(lowcut / nyq, 0.001)
    high = min(highcut / nyq, 0.99)
    b, a = butter(order, [low, high], btype='band', analog=False)
    return lfilter(b, a, data)

def create_reverb(stereo_audio, fs, decay=0.6, delay_ms=140):
    """Lush, cinematic dark-room reverb chamber with multi-tap stereo reflections"""
    delay_samples = int(fs * (delay_ms / 1000.0))
    reverb_audio = np.copy(stereo_audio)
    
    taps = [
        (int(delay_samples * 0.73), 0.38, -0.35),
        (int(delay_samples * 1.15), 0.28,  0.30),
        (int(delay_samples * 1.82), 0.20, -0.15),
        (int(delay_samples * 2.65), 0.14,  0.25),
        (int(delay_samples * 3.70), 0.09, -0.10),
    ]
    
    for d, gain, pan in taps:
        if d < len(stereo_audio):
            delayed = np.zeros_like(stereo_audio)
            delayed[d:] = stereo_audio[:-d] * gain
            # apply stereo pan
            delayed[:, 0] *= (1.0 - pan)
            delayed[:, 1] *= (1.0 + pan)
            # Soft lowpass damping on reflections to mimic acoustic wall absorption
            delayed[:, 0] = butter_lowpass_filter(delayed[:, 0], 3500, fs)
            delayed[:, 1] = butter_lowpass_filter(delayed[:, 1], 3500, fs)
            reverb_audio += delayed
            
    return reverb_audio

def synthesize_clock_tick(fs, is_tock=False, wooden=False):
    """
    Forensic mechanical clockwork tick.
    Combines tiny metallic escapement click + resonant clock case body.
    """
    duration = 0.065
    n_samples = int(fs * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # 1. Metallic transient click (highpass noise burst)
    noise = np.random.uniform(-1, 1, n_samples)
    click_env = np.exp(-t * 220.0) # ultra-fast snap
    if wooden:
        click = butter_bandpass_filter(noise, 1200, 4200, fs) * click_env * 0.7
    else:
        click = butter_bandpass_filter(noise, 2800, 8500, fs) * click_env * 0.9
        
    # 2. Case resonance (damped sinusoidal mode)
    freq = 1380.0 if not is_tock else 1050.0
    if wooden:
        freq *= 0.75
    res_env = np.exp(-t * 85.0)
    resonance = np.sin(2 * np.pi * freq * t) * res_env * 0.4
    
    tick = click + resonance
    return tick

def synthesize_sub_thump(fs, duration=1.2, start_freq=75.0, end_freq=28.0):
    """
    Deep cinematic heartbeat / sub thump marking narrative phrase boundaries.
    """
    n_samples = int(fs * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # Exponential pitch dive
    pitch_env = end_freq + (start_freq - end_freq) * np.exp(-t * 8.0)
    phase = 2 * np.pi * np.cumsum(pitch_env) / fs
    
    sub = np.sin(phase) + 0.25 * np.sin(phase * 2.0)
    amp_env = np.exp(-t * 3.8)
    thump = sub * amp_env
    
    # Warm analog saturation
    thump = np.tanh(thump * 1.5)
    thump = butter_lowpass_filter(thump, 140, fs)
    return thump

def synthesize_felt_piano_note(fs, freq, duration=3.5, velocity=0.8):
    """
    Solitary, muted felt piano note with warm harmonic decay.
    High harmonics decay rapidly, leaving a pure, lonely fundamental.
    """
    n_samples = int(fs * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # Fundamental + warm overtones
    harmonics = [
        (1.0, 1.0, 1.2),   # Fundamental (slowest decay)
        (2.0, 0.45, 2.5),  # 2nd harmonic
        (3.0, 0.22, 4.0),  # 3rd harmonic
        (4.0, 0.10, 6.0),  # 4th harmonic
        (5.0, 0.04, 8.5),  # 5th harmonic
    ]
    
    tone = np.zeros(n_samples)
    for mult, weight, decay_rate in harmonics:
        h_freq = freq * mult
        if h_freq < fs * 0.45:
            # Slight detuning for acoustic warmth
            detune = 1.0 + np.random.uniform(-0.0015, 0.0015)
            h_phase = 2 * np.pi * (h_freq * detune) * t
            h_env = np.exp(-t * decay_rate)
            tone += weight * np.sin(h_phase) * h_env
            
    # Soft hammer strike thump (low-frequency impulse)
    hammer_noise = np.random.uniform(-1, 1, n_samples)
    hammer = butter_lowpass_filter(hammer_noise, 320, fs) * np.exp(-t * 50.0) * 0.35
    
    piano_raw = (tone + hammer) * velocity
    # Lowpass to simulate thick wool felt dampener
    piano_filtered = butter_lowpass_filter(piano_raw, min(freq * 3.8, 2800), fs)
    return piano_filtered

def synthesize_eerie_glass_chime(fs, freq, duration=4.5):
    """
    High, crystalline bowed metallic / glass chime resonance for cold-case revelation moments.
    """
    n_samples = int(fs * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    modes = [freq, freq * 1.414, freq * 2.02, freq * 2.78]
    weights = [0.6, 0.3, 0.15, 0.08]
    
    chime = np.zeros(n_samples)
    for m, w in zip(modes, weights):
        if m < fs * 0.45:
            # Subtle vibrato on metallic modes
            lfo = 1.0 + 0.004 * np.sin(2 * np.pi * 3.2 * t)
            phase = 2 * np.pi * m * lfo * t
            decay = np.exp(-t * (m / 900.0))
            chime += w * np.sin(phase) * decay
            
    # Soft bell attack
    attack_samples = int(fs * 0.015)
    env = np.ones(n_samples)
    env[:attack_samples] = np.linspace(0, 1, attack_samples)
    return chime * env

def synthesize_dark_synth_pad(fs, freqs, duration=6.0, attack=1.5, release=1.8):
    """
    Subtle, warm investigative chord pad (C minor / Ab tension).
    """
    n_samples = int(fs * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    pad = np.zeros(n_samples)
    for f in freqs:
        # 3 micro-detuned oscillators for lush warmth
        osc1 = np.sin(2 * np.pi * f * t)
        osc2 = np.sin(2 * np.pi * (f * 1.003) * t)
        osc3 = np.sin(2 * np.pi * (f * 0.997) * t)
        pad += (0.45 * osc1 + 0.3 * osc2 + 0.25 * osc3)
        
    # Attack-Sustain-Release envelope
    att_len = int(fs * attack)
    rel_len = int(fs * release)
    sus_len = max(0, n_samples - att_len - rel_len)
    
    env = np.concatenate([
        np.linspace(0, 1, att_len)**1.8,
        np.ones(sus_len),
        np.linspace(1, 0, rel_len)**1.8
    ])
    
    # Pad filter: dark, below vocal clarity threshold
    pad_out = pad * env
    pad_out = butter_lowpass_filter(pad_out, 580, fs)
    return pad_out

def synthesize_low_bass_pulse(fs, freq, duration=0.35):
    """
    Muted spiccato synth bass pulse driving the investigative momentum.
    """
    n_samples = int(fs * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # Sawtooth with fast filter decay
    saw = np.zeros(n_samples)
    for h in range(1, 6):
        saw += (1.0 / h) * np.sin(2 * np.pi * freq * h * t)
        
    attack = int(fs * 0.01)
    decay = n_samples - attack
    env = np.concatenate([
        np.linspace(0, 1, attack),
        np.exp(-np.linspace(0, 5.0, decay))
    ])
    
    bass = saw * env
    bass = butter_lowpass_filter(bass, 380, fs)
    return bass

def main():
    fs = 44100
    bpm = 80 # Cold-case investigative cadence
    sec_per_beat = 60.0 / bpm            # 0.75s
    sec_per_8th  = sec_per_beat / 2.0     # 0.375s
    sec_per_16th = sec_per_beat / 4.0     # 0.1875s
    
    # 20 bars = exactly 60.0 seconds (matches strict 3.0s cut-cadence)
    total_duration = 60.0
    total_samples = int(fs * total_duration)
    
    left_track = np.zeros(total_samples)
    right_track = np.zeros(total_samples)
    
    print(f"Composing Cold-Case Investigative Theme ({total_duration}s at {bpm} BPM)...")
    
    # Helper to mix clips into stereo field
    def add_clip(track_l, track_r, clip, start_sample, pan=0.0, gain=1.0):
        length = len(clip)
        if start_sample >= total_samples:
            return
        end_sample = min(start_sample + length, total_samples)
        clip_slice = clip[:end_sample - start_sample] * gain
        l_gain = np.clip(1.0 - pan, 0, 1.4)
        r_gain = np.clip(1.0 + pan, 0, 1.4)
        track_l[start_sample:end_sample] += clip_slice * l_gain
        track_r[start_sample:end_sample] += clip_slice * r_gain

    # -------------------------------------------------------------
    # 1. CONTINUOUS BROODING SUB-DRONE (Binaural Tension & Room Air)
    # -------------------------------------------------------------
    print("Generating brooding binaural sub-drone...")
    t_full = np.linspace(0, total_duration, total_samples, endpoint=False)
    
    # C1 (32.70 Hz) fundamental with subtle 0.35 Hz binaural drift between ears
    c1_left  = 32.70
    c1_right = 33.05
    c2_freq  = 65.41
    g1_freq  = 49.00
    
    # Breathing LFO modulation (0.09 Hz slow wave)
    drone_lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.09 * t_full)
    
    drone_l = (
        0.55 * np.sin(2 * np.pi * c1_left * t_full) +
        0.35 * np.sin(2 * np.pi * c2_freq * t_full) +
        0.20 * np.sin(2 * np.pi * g1_freq * t_full)
    ) * (0.28 + 0.12 * drone_lfo)
    
    drone_r = (
        0.55 * np.sin(2 * np.pi * c1_right * t_full) +
        0.35 * np.sin(2 * np.pi * c2_freq * t_full) +
        0.20 * np.sin(2 * np.pi * g1_freq * t_full)
    ) * (0.28 + 0.12 * drone_lfo)
    
    # Master fade envelope (in over 3s, fade out last 5s)
    fade_in = np.clip(t_full / 3.0, 0, 1)
    fade_out = 1.0 - np.clip((t_full - 55.0) / 5.0, 0, 1)
    drone_master_env = fade_in * fade_out
    
    left_track += butter_lowpass_filter(drone_l * drone_master_env, 190, fs) * 0.65
    right_track += butter_lowpass_filter(drone_r * drone_master_env, 190, fs) * 0.65
    
    # -------------------------------------------------------------
    # 2. SUB-THUMP IMPACTS (Marking Major Narrative Sections)
    # -------------------------------------------------------------
    sub_thump_snd = synthesize_sub_thump(fs, duration=1.4)
    # Downbeats at Bar 1 (0s), Bar 5 (12s), Bar 9 (24s), Bar 11 (30s), Bar 15 (42s)
    thump_times = [0.0, 12.0, 24.0, 30.0, 42.0]
    for tt in thump_times:
        s_idx = int(tt * fs)
        add_clip(left_track, right_track, sub_thump_snd, s_idx, pan=0.0, gain=0.85)

    # -------------------------------------------------------------
    # 3. MECHANICAL CLOCKWORK SEQUENCER (Ticks, Tocks & Escapements)
    # -------------------------------------------------------------
    print("Sequencing forensic mechanical clockwork...")
    tick_metal_snd = synthesize_clock_tick(fs, is_tock=False, wooden=False)
    tock_metal_snd = synthesize_clock_tick(fs, is_tock=True,  wooden=False)
    tick_wood_snd  = synthesize_clock_tick(fs, is_tock=False, wooden=True)
    tock_wood_snd  = synthesize_clock_tick(fs, is_tock=True,  wooden=True)
    
    total_16ths = int(total_duration / sec_per_16th)
    
    for step in range(total_16ths):
        step_time = step * sec_per_16th
        sample_idx = int(step_time * fs)
        beat_idx = step % 16
        
        # --- PHASE 1 (0s - 12s): Solitary 8th-note pocket watch ---
        if step_time < 12.0:
            if step % 2 == 0:
                is_tock = (step % 4 == 2)
                clip = tock_metal_snd if is_tock else tick_metal_snd
                # Slight organic humanization in velocity
                vel = 0.38 + np.random.uniform(-0.03, 0.03)
                add_clip(left_track, right_track, clip, sample_idx, pan=-0.22, gain=vel)
                
        # --- PHASE 2 (12s - 30s): Dual-layered ticking (metal L, wood R) ---
        elif 12.0 <= step_time < 30.0:
            # Primary metal tick on 8th notes
            if step % 2 == 0:
                is_tock = (step % 4 == 2)
                clip = tock_metal_snd if is_tock else tick_metal_snd
                vel = 0.42 + np.random.uniform(-0.04, 0.04)
                add_clip(left_track, right_track, clip, sample_idx, pan=-0.28, gain=vel)
            # Secondary subtle wooden escapement syncopated on upbeats
            if step % 2 == 1 and beat_idx in [1, 5, 9, 13]:
                add_clip(left_track, right_track, tick_wood_snd, sample_idx, pan=0.32, gain=0.25)
                
        # --- PHASE 3 (30s - 48s): Heightened 16th-note forensic tension ---
        elif 30.0 <= step_time < 48.0:
            # Running 16th-note clockwork
            is_downbeat_8th = (step % 2 == 0)
            if is_downbeat_8th:
                is_tock = (step % 4 == 2)
                clip = tock_metal_snd if is_tock else tick_metal_snd
                vel = 0.48 if beat_idx % 4 == 0 else 0.35
                add_clip(left_track, right_track, clip, sample_idx, pan=-0.25, gain=vel)
            else:
                # Ghost ticks in opposite ear
                clip = tock_wood_snd if (step % 4 == 3) else tick_wood_snd
                add_clip(left_track, right_track, clip, sample_idx, pan=0.25, gain=0.22)
                
        # --- PHASE 4 (48s - 60s): Lingering, dissolving clock ---
        elif 48.0 <= step_time < 57.0:
            # Fade down to slow solitary tick
            if step % 4 == 0:
                vel = max(0.08, 0.35 * (1.0 - (step_time - 48.0) / 9.0))
                add_clip(left_track, right_track, tick_metal_snd, sample_idx, pan=-0.15, gain=vel)

    # -------------------------------------------------------------
    # 4. DARK ATMOSPHERIC PADS (Chords of Suspense)
    # -------------------------------------------------------------
    print("Layering atmospheric mystery pads...")
    # Frequencies (Hz):
    # Cm9:  C2(65.41), Eb3(155.56), G3(196.00), Bb3(233.08), D4(293.66)
    # Abmaj7: Ab2(103.83), C3(130.81), Eb3(155.56), G3(196.00)
    # Fm9:  F2(87.31), Ab2(103.83), C3(130.81), Eb3(155.56), G3(196.00)
    # G7b9: G2(98.00), B2(123.47), D3(146.83), F3(174.61), Ab3(207.65)
    
    pad_c_m9  = synthesize_dark_synth_pad(fs, [65.41, 155.56, 196.00, 233.08, 293.66], duration=6.5, attack=1.8, release=2.0)
    pad_ab_m7 = synthesize_dark_synth_pad(fs, [103.83, 130.81, 155.56, 196.00], duration=6.5, attack=1.8, release=2.0)
    pad_fm9   = synthesize_dark_synth_pad(fs, [87.31, 103.83, 130.81, 155.56], duration=6.5, attack=1.8, release=2.0)
    pad_g7b9  = synthesize_dark_synth_pad(fs, [98.00, 123.47, 146.83, 207.65], duration=6.5, attack=1.8, release=2.0)
    
    pad_events = [
        (12.0, pad_c_m9,  0.0, 0.42),
        (18.0, pad_ab_m7, 0.0, 0.40),
        (24.0, pad_fm9,   0.0, 0.40),
        (30.0, pad_c_m9,  0.0, 0.45),
        (36.0, pad_ab_m7, 0.0, 0.42),
        (42.0, pad_g7b9,  0.0, 0.44),
        (48.0, pad_c_m9,  0.0, 0.35),
    ]
    for p_time, p_audio, p_pan, p_gain in pad_events:
        add_clip(left_track, right_track, p_audio, int(p_time * fs), pan=p_pan, gain=p_gain)

    # -------------------------------------------------------------
    # 5. EERIE REVERBERATED FELT PIANO MOTIF
    # -------------------------------------------------------------
    print("Composing felt piano investigative motifs...")
    # Note pitches (Hz)
    C3 = 130.81
    G3 = 196.00
    C4 = 261.63
    D4 = 293.66
    Eb4 = 311.13
    F4 = 349.23
    G4 = 392.00
    Ab4 = 415.30
    Bb4 = 466.16
    C5 = 523.25
    
    # Pre-synthesize needed notes
    piano_notes = {
        'C3': synthesize_felt_piano_note(fs, C3, duration=4.5, velocity=0.85),
        'G3': synthesize_felt_piano_note(fs, G3, duration=4.5, velocity=0.80),
        'C4': synthesize_felt_piano_note(fs, C4, duration=4.0, velocity=0.75),
        'D4': synthesize_felt_piano_note(fs, D4, duration=4.0, velocity=0.72),
        'Eb4': synthesize_felt_piano_note(fs, Eb4, duration=4.0, velocity=0.75),
        'F4': synthesize_felt_piano_note(fs, F4, duration=3.5, velocity=0.70),
        'G4': synthesize_felt_piano_note(fs, G4, duration=4.0, velocity=0.78),
        'Ab4': synthesize_felt_piano_note(fs, Ab4, duration=4.0, velocity=0.72),
        'Bb4': synthesize_felt_piano_note(fs, Bb4, duration=3.5, velocity=0.70),
        'C5': synthesize_felt_piano_note(fs, C5, duration=4.5, velocity=0.80),
    }
    
    # Timed solitary melodic notes:
    # (time_sec, note_key, pan, gain)
    piano_timeline = [
        # Phase 1: Solitary curiosity
        (3.0,  'G4',   0.15, 0.72),
        (6.75, 'Eb4', -0.15, 0.68),
        (9.75, 'D4',   0.10, 0.65),
        
        # Phase 2: Theme introduction
        (13.5, 'C4',  -0.18, 0.70),
        (15.0, 'Eb4', -0.10, 0.65),
        (16.5, 'G4',   0.15, 0.75),
        (19.5, 'Ab4',  0.22, 0.70),
        (22.5, 'G4',   0.12, 0.68),
        (25.5, 'Eb4', -0.15, 0.65),
        (27.75,'D4',  -0.10, 0.62),
        
        # Phase 3: Revelation cadence (High octave bell tone)
        (31.5, 'C5',   0.00, 0.82),
        (34.5, 'G4',   0.18, 0.75),
        (36.75,'Ab4',  0.20, 0.72),
        (39.0, 'F4',  -0.18, 0.68),
        (42.0, 'Eb4', -0.15, 0.72),
        (44.25,'D4',  -0.10, 0.70),
        (46.5, 'C4',   0.00, 0.75),
        
        # Phase 4: Lingering question
        (51.0, 'G3',  -0.12, 0.75),
        (53.25,'Eb4',  0.15, 0.65),
    ]
    
    for pt, pnote, ppan, pgain in piano_timeline:
        add_clip(left_track, right_track, piano_notes[pnote], int(pt * fs), pan=ppan, gain=pgain)

    # -------------------------------------------------------------
    # 6. PULSING BASSLINE (Phase 3 Momentum, 30s - 48s)
    # -------------------------------------------------------------
    print("Generating investigative bass ostinato for Phase 3...")
    bass_c2  = synthesize_low_bass_pulse(fs, 65.41, duration=sec_per_8th * 1.2)
    bass_bb1 = synthesize_low_bass_pulse(fs, 58.27, duration=sec_per_8th * 1.2)
    bass_ab1 = synthesize_low_bass_pulse(fs, 51.91, duration=sec_per_8th * 1.2)
    bass_g1  = synthesize_low_bass_pulse(fs, 49.00, duration=sec_per_8th * 1.2)
    
    # 8th-note pulsing pattern during the revelation phase
    bass_steps = [
        # Bar 11 - 12 (30s - 36s): C minor pulse
        (30.0, bass_c2), (30.75, bass_c2), (31.5, bass_c2), (32.25, bass_c2),
        (33.0, bass_c2), (33.75, bass_c2), (34.5, bass_c2), (35.25, bass_bb1),
        # Bar 13 - 14 (36s - 42s): Ab -> Fm pulse
        (36.0, bass_ab1),(36.75, bass_ab1),(37.5, bass_ab1),(38.25, bass_ab1),
        (39.0, bass_ab1),(39.75, bass_ab1),(40.5, bass_ab1),(41.25, bass_g1),
        # Bar 15 - 16 (42s - 48s): G -> C resolution
        (42.0, bass_g1), (42.75, bass_g1), (43.5, bass_g1), (44.25, bass_g1),
        (45.0, bass_c2), (45.75, bass_c2), (46.5, bass_c2), (47.25, bass_c2),
    ]
    for bt, bsnd in bass_steps:
        add_clip(left_track, right_track, bsnd, int(bt * fs), pan=0.0, gain=0.55)

    # -------------------------------------------------------------
    # 7. EERIE METALLIC GLASS CHIMES (Climactic Clue Discovery)
    # -------------------------------------------------------------
    glass_chime_1 = synthesize_eerie_glass_chime(fs, 1175.0, duration=5.0) # D6 mode
    glass_chime_2 = synthesize_eerie_glass_chime(fs, 1568.0, duration=4.5) # G6 mode
    
    # Place at key dramatic turning points
    add_clip(left_track, right_track, glass_chime_1, int(18.0 * fs), pan=0.35, gain=0.28)
    add_clip(left_track, right_track, glass_chime_2, int(31.5 * fs), pan=-0.35, gain=0.32)
    add_clip(left_track, right_track, glass_chime_1, int(43.5 * fs), pan=0.25, gain=0.25)

    # -------------------------------------------------------------
    # 8. SPATIAL ACOUSTIC REVERBERATION & DUCKING FREQUENCY CARVE
    # -------------------------------------------------------------
    print("Applying dark stone hall reverberation & acoustic staging...")
    stereo_raw = np.column_stack((left_track, right_track))
    
    # 140ms multi-tap chamber reverb
    reverb_mix = create_reverb(stereo_raw, fs, decay=0.55, delay_ms=145)
    
    # 78% dry / 22% wet balance (keeps transients razor-crisp while adding expansive depth)
    wet_balanced = stereo_raw * 0.78 + reverb_mix * 0.22
    
    # Mid-range frequency carve (1.8 kHz to 3.2 kHz vocal clarity pocket)
    # Allows the narrator's Charon BOP voice to sit effortlessly on top
    print("Carving vocal dialogue pocket (1.8 kHz - 3.2 kHz) for Cold-Case narration...")
    # Extract mid band to slightly attenuate
    mid_band_l = butter_bandpass_filter(wet_balanced[:, 0], 1800, 3200, fs)
    mid_band_r = butter_bandpass_filter(wet_balanced[:, 1], 1800, 3200, fs)
    wet_balanced[:, 0] -= mid_band_l * 0.35 # -3.7 dB reduction in speech presence pocket
    wet_balanced[:, 1] -= mid_band_r * 0.35
    
    # -------------------------------------------------------------
    # 9. MASTER ANALOG TAPE SATURATION & BRICKWALL LIMITING
    # -------------------------------------------------------------
    print("Mastering via analog tape saturation & ceiling limiter...")
    mastered = np.tanh(wet_balanced * 1.35)
    
    max_peak = np.max(np.abs(mastered))
    if max_peak > 0:
        # Normalize to -0.8 dBFS ceiling to prevent any digital inter-sample clipping
        mastered = (mastered / max_peak) * 0.91
        
    out_16bit = (mastered * 32767).astype(np.int16)
    
    out_dir = os.path.join("assets", "audio", "music")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "cold_case_investigative_theme.wav")
    
    wavfile.write(out_path, fs, out_16bit)
    file_size = os.path.getsize(out_path)
    print(f"SUCCESS: Cold-Case Mystery soundtrack generated at: {out_path} ({file_size:,} bytes)")

if __name__ == "__main__":
    main()
