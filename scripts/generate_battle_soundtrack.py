import os
import math
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

def butter_lowpass_filter(data, cutoff, fs, order=2):
    nyq = 0.5 * fs
    normal_cutoff = min(cutoff / nyq, 0.99)
    b, a = butter(order, normal_cutoff, btype='low', analog=False)
    return lfilter(b, a, data)

def butter_bandpass_filter(data, lowcut, highcut, fs, order=2):
    nyq = 0.5 * fs
    low = max(lowcut / nyq, 0.001)
    high = min(highcut / nyq, 0.99)
    b, a = butter(order, [low, high], btype='band', analog=False)
    return lfilter(b, a, data)

def create_reverb(stereo_audio, fs, decay=0.5, delay_ms=120):
    """Simple high-performance stereo echo/reverb chamber"""
    delay_samples = int(fs * (delay_ms / 1000.0))
    reverb_audio = np.copy(stereo_audio)
    
    # 3 multi-tap delays for lush cinematic hall space
    taps = [
        (int(delay_samples * 0.8), 0.35, 0.2),
        (int(delay_samples * 1.3), 0.25, -0.2),
        (int(delay_samples * 2.1), 0.18, 0.0),
        (int(delay_samples * 3.4), 0.10, 0.3),
    ]
    
    for d, gain, pan in taps:
        if d < len(stereo_audio):
            delayed = np.zeros_like(stereo_audio)
            delayed[d:] = stereo_audio[:-d] * gain
            # apply simple stereo pan
            delayed[:, 0] *= (1.0 - pan)
            delayed[:, 1] *= (1.0 + pan)
            reverb_audio += delayed
            
    return reverb_audio

def synthesize_taiko_drum(fs, duration=1.5, pitch_start=120, pitch_end=38, punch=1.0):
    """Synthesize a massive war drum / taiko strike"""
    n_samples = int(fs * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # Pitch drop envelope (exponential)
    pitch_env = pitch_end + (pitch_start - pitch_end) * np.exp(-t * 18.0)
    phase = 2 * np.pi * np.cumsum(pitch_env) / fs
    
    # Fundamental body
    sub_body = np.sin(phase)
    harmonic = 0.4 * np.sin(phase * 2.0) + 0.15 * np.sin(phase * 3.0)
    body = (sub_body + harmonic) * np.exp(-t * 3.5)
    
    # Skin transient attack (filtered noise)
    noise = np.random.uniform(-1, 1, n_samples)
    noise_env = np.exp(-t * 60.0)
    filtered_noise = butter_bandpass_filter(noise, 200, 1800, fs) * noise_env * 0.8
    
    drum = (body + filtered_noise) * punch
    # Subtle soft clipping for analog warmth/weight
    drum = np.tanh(drum * 1.6)
    return drum

def synthesize_war_snare(fs, duration=0.4, pitch=180):
    """Crisp military field snare / rim shot"""
    n_samples = int(fs * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # Head tone
    tone = np.sin(2 * np.pi * pitch * np.exp(-t * 25.0) * t) * np.exp(-t * 18.0)
    
    # Snare rattle (highpassed noise)
    noise = np.random.uniform(-1, 1, n_samples)
    noise_env = np.exp(-t * 12.0)
    filtered_noise = butter_bandpass_filter(noise, 800, 6500, fs) * noise_env
    
    snare = (tone * 0.4 + filtered_noise * 0.9)
    return snare

def synthesize_spiccato_cello(fs, freq, duration=0.25):
    """Aggressive low-string spiccato ostinato (D minor driving pulse)"""
    n_samples = int(fs * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # Sawtooth wave approximation with harmonics
    saw = np.zeros(n_samples)
    for h in range(1, 9):
        saw += (1.0 / h) * np.sin(2 * np.pi * freq * h * t)
        
    # Spiccato pluck envelope (fast attack, bite, fast decay)
    attack = int(fs * 0.008)
    decay = n_samples - attack
    env = np.concatenate([
        np.linspace(0, 1, attack),
        np.exp(-np.linspace(0, 4.5, decay))
    ])
    
    raw = saw * env
    # Warm lowpass cello body
    filtered = butter_lowpass_filter(raw, min(freq * 4.5, 2200), fs)
    return filtered

def synthesize_brass_horn(fs, freq, duration=2.5):
    """Dramatic cinematic war horn swell (braaam style)"""
    n_samples = int(fs * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # Detuned brass oscillators
    osc1 = np.sin(2 * np.pi * freq * t)
    osc2 = np.sin(2 * np.pi * (freq * 1.006) * t)
    osc3 = np.sin(2 * np.pi * (freq * 0.5) * t) # sub-octave
    horn_raw = 0.5 * osc1 + 0.4 * osc2 + 0.3 * osc3
    
    # Heavy swell envelope
    attack = int(fs * 0.35)
    sustain_len = int(fs * 1.2)
    release = n_samples - attack - sustain_len
    env = np.concatenate([
        np.linspace(0, 1, attack)**1.5,
        np.ones(sustain_len),
        np.linspace(1, 0, release)**2.0
    ])
    
    horn = horn_raw * env
    horn = np.tanh(horn * 1.8) # rich brass overtones
    horn = butter_lowpass_filter(horn, 1200, fs)
    return horn

def synthesize_anvil_strike(fs, duration=1.2):
    """Metallic shield/anvil battle accent"""
    n_samples = int(fs * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # Inharmonic metallic frequencies
    modes = [680, 1140, 1780, 2450, 3900]
    metal = np.zeros(n_samples)
    for m in modes:
        metal += np.sin(2 * np.pi * m * t) * np.exp(-t * (m / 250.0))
        
    noise = np.random.uniform(-1, 1, n_samples) * np.exp(-t * 30.0)
    strike = (metal * 0.7 + noise * 0.3)
    return strike

def main():
    fs = 44100
    bpm = 108
    sec_per_beat = 60.0 / bpm
    sec_per_16th = sec_per_beat / 4.0
    
    total_duration = 55.0 # ~55 seconds cinematic battle cue
    total_samples = int(fs * total_duration)
    
    left_track = np.zeros(total_samples)
    right_track = np.zeros(total_samples)
    
    print(f"Composing History Channel Battle Scene Cue ({total_duration}s at {bpm} BPM)...")
    
    # -------------------------------------------------------------
    # 1. CONTINUOUS BATTLE DRONE (The Looming Dread / Atmosphere)
    # -------------------------------------------------------------
    t_full = np.linspace(0, total_duration, total_samples, endpoint=False)
    # D1 (36.71 Hz) + D2 (73.42 Hz) + A1 (55.0 Hz)
    drone_lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.15 * t_full)
    drone = (
        0.5 * np.sin(2 * np.pi * 36.71 * t_full) +
        0.35 * np.sin(2 * np.pi * 73.42 * t_full) +
        0.25 * np.sin(2 * np.pi * 55.00 * t_full)
    ) * (0.2 + 0.15 * drone_lfo)
    
    # Slow dynamic growth across the cue
    drone_master_env = np.clip(t_full / 8.0, 0, 1) * (1.0 - np.clip((t_full - 50.0) / 5.0, 0, 1))
    drone = butter_lowpass_filter(drone * drone_master_env, 280, fs)
    left_track += drone * 0.6
    right_track += drone * 0.6
    
    # -------------------------------------------------------------
    # 2. SEQUENCING RHYTHM & THEMES
    # Timeline:
    # 0.0s - 13.0s: Phase 1 - "The Standoff" (Heartbeat war drums, tension horn)
    # 13.0s - 31.0s: Phase 2 - "The Advance" (Driving Cello ostinato, field snare march)
    # 31.0s - 48.0s: Phase 3 - "The Clash" (Full taiko thunder, galloping rhythm, brass roars, anvils)
    # 48.0s - 55.0s: Phase 4 - "The Aftermath" (Decaying echoes, final war horn strike)
    # -------------------------------------------------------------
    
    # Prepare sound templates
    taiko_heavy = synthesize_taiko_drum(fs, duration=1.6, pitch_start=110, pitch_end=36, punch=1.3)
    taiko_mid   = synthesize_taiko_drum(fs, duration=1.0, pitch_start=140, pitch_end=48, punch=0.9)
    field_snare = synthesize_war_snare(fs, duration=0.35)
    anvil       = synthesize_anvil_strike(fs, duration=1.2)
    
    # Cello pitches for D minor ostinato:
    D2 = 73.42
    Eb2 = 77.78
    F2 = 87.31
    E2 = 82.41
    C2 = 65.41
    
    cello_notes = {
        'D': synthesize_spiccato_cello(fs, D2, duration=sec_per_16th * 1.5),
        'Eb': synthesize_spiccato_cello(fs, Eb2, duration=sec_per_16th * 1.5),
        'F': synthesize_spiccato_cello(fs, F2, duration=sec_per_16th * 1.5),
        'E': synthesize_spiccato_cello(fs, E2, duration=sec_per_16th * 1.5),
        'C': synthesize_spiccato_cello(fs, C2, duration=sec_per_16th * 1.5),
    }
    
    total_16ths = int(total_duration / sec_per_16th)
    
    # Helper to overlay audio
    def add_clip(track_l, track_r, clip, start_sample, pan=0.0, gain=1.0):
        length = len(clip)
        end_sample = min(start_sample + length, total_samples)
        clip_slice = clip[:end_sample - start_sample] * gain
        l_gain = np.clip(1.0 - pan, 0, 1.4)
        r_gain = np.clip(1.0 + pan, 0, 1.4)
        track_l[start_sample:end_sample] += clip_slice * l_gain
        track_r[start_sample:end_sample] += clip_slice * r_gain

    # Brass Horns Swells at strategic story moments
    horn_moments = [
        (4.0, D2 * 1.5, 3.2, 0.7),    # Initial warning horn
        (13.2, D2, 3.5, 0.85),        # Army steps forward
        (31.0, D2 * 1.5, 4.0, 1.1),   # THE CLASH - high braaam
        (39.8, D2 * 1.33, 3.8, 1.0),  # Minor harmonic tension
        (48.5, D2, 5.0, 0.9),         # Final aftermath horn
    ]
    for start_t, h_freq, h_dur, h_gain in horn_moments:
        horn_sample = int(start_t * fs)
        horn_snd = synthesize_brass_horn(fs, h_freq, duration=h_dur)
        add_clip(left_track, right_track, horn_snd, horn_sample, pan=0.0, gain=h_gain)

    # Anvil/Sword clashes at climatic impacts
    anvil_moments = [31.0, 33.2, 35.4, 39.8, 42.1, 44.3, 48.7]
    for a_t in anvil_moments:
        if a_t < total_duration:
            add_clip(left_track, right_track, anvil, int(a_t * fs), pan=np.random.uniform(-0.4, 0.4), gain=0.6)

    # 16th-note step sequencer
    ostinato_pattern = ['D', 'D', 'D', 'Eb', 'D', 'D', 'F', 'E', 'D', 'D', 'D', 'Eb', 'D', 'C', 'D', 'D']
    
    for step in range(total_16ths):
        step_time = step * sec_per_16th
        sample_idx = int(step_time * fs)
        beat_idx = step % 16
        
        # --- PHASE 1: STANDOFF (0s - 13s) ---
        if step_time < 13.0:
            # Slow, measured heartbeat war drums on every 2 beats
            if step % 8 == 0:
                add_clip(left_track, right_track, taiko_heavy, sample_idx, pan=-0.2, gain=0.85)
            elif step % 8 == 6:
                add_clip(left_track, right_track, taiko_mid, sample_idx, pan=0.25, gain=0.45)
                
        # --- PHASE 2: THE ADVANCE (13s - 31s) ---
        elif 13.0 <= step_time < 31.0:
            # Driving Cello Ostinato kicks in
            note = ostinato_pattern[beat_idx]
            cello_gain = 0.55 if beat_idx % 4 == 0 else 0.42
            add_clip(left_track, right_track, cello_notes[note], sample_idx, pan=-0.15, gain=cello_gain)
            
            # War Drums (Driving 4/4 martial cadence)
            if step % 4 == 0:
                add_clip(left_track, right_track, taiko_heavy, sample_idx, pan=-0.25, gain=0.9)
            elif step % 4 == 2:
                add_clip(left_track, right_track, taiko_mid, sample_idx, pan=0.3, gain=0.6)
            
            # Galloping military field snare (triplet cadence on the backbeats)
            if beat_idx in [4, 7, 10, 12, 14, 15]:
                sn_gain = 0.4 if beat_idx == 4 or beat_idx == 12 else 0.25
                add_clip(left_track, right_track, field_snare, sample_idx, pan=0.15, gain=sn_gain)
                
        # --- PHASE 3: THE CLASH (31s - 48s) ---
        elif 31.0 <= step_time < 48.0:
            # Full aggressive double-layered ostinato
            note = ostinato_pattern[beat_idx]
            add_clip(left_track, right_track, cello_notes[note], sample_idx, pan=-0.3, gain=0.65)
            add_clip(left_track, right_track, cello_notes[note], sample_idx, pan=0.3, gain=0.65)
            
            # Relentless War Drums: Heavy downbeats, syncopated rolls
            if step % 4 == 0:
                add_clip(left_track, right_track, taiko_heavy, sample_idx, pan=-0.2, gain=1.2)
            elif step % 4 == 1 and beat_idx in [5, 13]:
                add_clip(left_track, right_track, taiko_mid, sample_idx, pan=0.35, gain=0.7)
            elif step % 4 == 2:
                add_clip(left_track, right_track, taiko_heavy, sample_idx, pan=0.2, gain=0.95)
            elif step % 4 == 3:
                add_clip(left_track, right_track, taiko_mid, sample_idx, pan=-0.35, gain=0.7)
                
            # Intense marching snare accents (running 16ths in battle rush)
            if beat_idx in [2, 4, 6, 8, 10, 12, 14, 15]:
                accent = 0.55 if beat_idx in [4, 12] else 0.35
                add_clip(left_track, right_track, field_snare, sample_idx, pan=0.2, gain=accent)
                
        # --- PHASE 4: AFTERMATH (48s - 55s) ---
        else:
            # Single echoing final battle pulse
            if step_time < 49.0 and step % 4 == 0:
                add_clip(left_track, right_track, taiko_heavy, sample_idx, pan=0.0, gain=1.1)

    # Combine into stereo matrix
    stereo = np.column_stack((left_track, right_track))
    
    # -------------------------------------------------------------
    # 3. SPATIAL REVERB & CINEMATIC MASTERING
    # -------------------------------------------------------------
    print("Applying epic battlefield spatial reverberation...")
    wet_mix = create_reverb(stereo, fs, decay=0.45, delay_ms=135)
    final_mix = stereo * 0.75 + wet_mix * 0.35
    
    # Master analog tape saturation & limiter
    print("Mastering & normalizing peak dynamics...")
    final_mix = np.tanh(final_mix * 1.3)
    max_peak = np.max(np.abs(final_mix))
    if max_peak > 0:
        final_mix = (final_mix / max_peak) * 0.94  # -0.5 dB ceiling
        
    out_16bit = (final_mix * 32767).astype(np.int16)
    
    out_path = os.path.join("assets", "audio", "music", "history_channel_battle_theme.wav")
    wavfile.write(out_path, fs, out_16bit)
    print(f"SUCCESS: Battle soundtrack generated at: {out_path} ({os.path.getsize(out_path):,} bytes)")

if __name__ == "__main__":
    main()
