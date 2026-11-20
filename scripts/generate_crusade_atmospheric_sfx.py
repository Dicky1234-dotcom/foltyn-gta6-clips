#!/usr/bin/env python3
"""
Atmospheric SFX Generator for 'The Dark Truth Behind the Children's Crusade (1212)'
Generates museum-grade, high-craft acoustic SFX matching the Living Stills aesthetic:
1. Low D-minor cello drone / tension drone (sfx_d_minor_cello_tension_drone.wav)
2. Dry gravel footsteps cadence (sfx_dry_gravel_footsteps_cadence.wav)
3. Monastic funeral chant resonance (sfx_monastic_funeral_chant_resonance.wav)
4. Ambient dry summer wind (sfx_ambient_dry_summer_wind.wav)
5. Heavy wooden plow drop impact (sfx_heavy_wooden_plow_drop_impact.wav)
"""

import os
import math
import numpy as np
from pathlib import Path
from scipy.io import wavfile
from scipy.signal import butter, lfilter

FS = 44100  # 44.1 kHz Studio Master

def butter_lowpass_filter(data, cutoff, fs=FS, order=2):
    nyq = 0.5 * fs
    normal_cutoff = min(max(cutoff / nyq, 0.001), 0.99)
    b, a = butter(order, normal_cutoff, btype='low', analog=False)
    return lfilter(b, a, data)

def butter_highpass_filter(data, cutoff, fs=FS, order=2):
    nyq = 0.5 * fs
    normal_cutoff = min(max(cutoff / nyq, 0.001), 0.99)
    b, a = butter(order, normal_cutoff, btype='high', analog=False)
    return lfilter(b, a, data)

def butter_bandpass_filter(data, lowcut, highcut, fs=FS, order=2):
    nyq = 0.5 * fs
    low = max(lowcut / nyq, 0.001)
    high = min(highcut / nyq, 0.99)
    b, a = butter(order, [low, high], btype='band', analog=False)
    return lfilter(b, a, data)

def create_stereo_reverb(stereo_audio, fs=FS, decay=0.6, delay_ms=160, damp_freq=3200):
    """Cinematic multi-tap stereo reverb chamber simulating stone cathedral / outdoor acoustic space."""
    delay_samples = int(fs * (delay_ms / 1000.0))
    reverb_audio = np.copy(stereo_audio)
    
    taps = [
        (int(delay_samples * 0.71), 0.42 * decay, -0.40),
        (int(delay_samples * 1.13), 0.32 * decay,  0.35),
        (int(delay_samples * 1.77), 0.24 * decay, -0.20),
        (int(delay_samples * 2.59), 0.18 * decay,  0.25),
        (int(delay_samples * 3.65), 0.12 * decay, -0.15),
        (int(delay_samples * 4.90), 0.08 * decay,  0.10),
    ]
    
    for d, gain, pan in taps:
        if d < len(stereo_audio):
            delayed = np.zeros_like(stereo_audio)
            delayed[d:] = stereo_audio[:-d] * gain
            delayed[:, 0] *= (1.0 - pan)
            delayed[:, 1] *= (1.0 + pan)
            delayed[:, 0] = butter_lowpass_filter(delayed[:, 0], damp_freq, fs)
            delayed[:, 1] = butter_lowpass_filter(delayed[:, 1], damp_freq, fs)
            reverb_audio += delayed
            
    return reverb_audio

def save_wav_16bit(filepath: Path, stereo_data: np.ndarray, fs=FS):
    filepath.parent.mkdir(parents=True, exist_ok=True)
    # Peak normalize to -1.0 dB (0.89)
    max_val = np.max(np.abs(stereo_data))
    if max_val > 1e-5:
        norm_data = stereo_data * (0.89 / max_val)
    else:
        norm_data = stereo_data
    int16_data = (norm_data * 32767).astype(np.int16)
    wavfile.write(str(filepath), fs, int16_data)
    print(f"  [+] Saved: {filepath} ({len(stereo_data)/fs:.2f}s, {filepath.stat().st_size} bytes)")


# -------------------------------------------------------------
# 1. LOW D-MINOR CELLO DRONE / TENSION DRONE
# -------------------------------------------------------------
def generate_d_minor_cello_drone(duration=18.0) -> np.ndarray:
    """Deep, brooding D-minor cello tension drone with rich harmonic bowing and subtle vibrato."""
    n_samples = int(FS * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # D-minor chord frequencies: D1(36.71), D2(73.42), A2(110.0), F2(87.31), D3(146.83)
    notes = [
        (36.71, 0.45, 0.0),   # Sub bass D1
        (73.42, 0.85, -0.15), # Root D2
        (73.42 * 1.002, 0.65, 0.15), # Detuned unison
        (87.31, 0.50, -0.20), # Minor 3rd F2
        (110.0, 0.55, 0.20),  # 5th A2
        (146.83, 0.35, 0.05), # Octave D3
    ]
    
    stereo = np.zeros((n_samples, 2))
    
    # Slow LFO for bow expression / breathing
    swell_lfo = 0.8 + 0.2 * np.sin(2 * np.pi * 0.18 * t)
    
    for f0, weight, pan in notes:
        # Cello string harmonic series (bowed string = sawtooth/harmonics)
        tone = np.zeros(n_samples)
        # Slow vibrato
        vibrato = 1.0 + 0.0035 * np.sin(2 * np.pi * 4.4 * t)
        inst_freq = f0 * vibrato
        phase = 2 * np.pi * np.cumsum(inst_freq) / FS
        
        for h in range(1, 9):
            h_amp = (1.0 / (h ** 1.15))
            # Even vs odd harmonics for cello timbre
            if h % 2 == 0:
                h_amp *= 0.75
            tone += h_amp * np.sin(h * phase)
            
        # Subtle rosin bow friction noise
        bow_noise = np.random.uniform(-1, 1, n_samples)
        bow_filtered = butter_bandpass_filter(bow_noise, 800, 2400, FS) * 0.04
        
        note_audio = (tone + bow_filtered) * weight * swell_lfo
        # Cello body warmth filter
        note_audio = butter_lowpass_filter(note_audio, min(f0 * 6.0, 1100), FS)
        
        stereo[:, 0] += note_audio * (1.0 - pan)
        stereo[:, 1] += note_audio * (1.0 + pan)
        
    # Fade in / fade out envelope
    fade_in = int(FS * 2.0)
    fade_out = int(FS * 2.5)
    env = np.ones(n_samples)
    env[:fade_in] = np.linspace(0, 1, fade_in) ** 1.5
    env[-fade_out:] = np.linspace(1, 0, fade_out) ** 1.5
    stereo[:, 0] *= env
    stereo[:, 1] *= env
    
    # Lush dark-room cello reverb
    stereo = create_stereo_reverb(stereo, FS, decay=0.65, delay_ms=180, damp_freq=2200)
    return stereo


# -------------------------------------------------------------
# 2. DRY GRAVEL FOOTSTEPS CADENCE
# -------------------------------------------------------------
def generate_dry_gravel_footsteps_cadence(duration=14.0) -> np.ndarray:
    """Rhythmic weary footsteps on baked gravel and dried summer road."""
    n_samples = int(FS * duration)
    stereo = np.zeros((n_samples, 2))
    
    bpm = 64  # Weary, exhausted marching pace (~1.07 steps per sec)
    step_interval = 60.0 / bpm
    step_times = np.arange(0.6, duration - 1.0, step_interval)
    
    for i, t_step in enumerate(step_times):
        start_idx = int(t_step * FS)
        pan = -0.22 if i % 2 == 0 else 0.22  # Alternating left / right foot
        
        # Step components:
        step_len = int(FS * 0.42)
        if start_idx + step_len >= n_samples:
            break
            
        t_sub = np.linspace(0, 0.42, step_len, endpoint=False)
        
        # A. Heel strike low thud (impact on hardened earth)
        thud_freq = 110.0 * np.exp(-t_sub * 25.0)
        thud_phase = 2 * np.pi * np.cumsum(thud_freq) / FS
        thud = np.sin(thud_phase) * np.exp(-t_sub * 22.0) * 0.65
        thud = butter_lowpass_filter(thud, 220, FS)
        
        # B. Multiple micro-crunches of gravel grains shifting
        gravel_noise = np.random.uniform(-1, 1, step_len)
        # Cluster of 3 tiny pressure peaks (heel -> ball -> toe)
        p1 = np.exp(-((t_sub - 0.02) ** 2) / 0.0004) * 0.9
        p2 = np.exp(-((t_sub - 0.07) ** 2) / 0.0008) * 1.0
        p3 = np.exp(-((t_sub - 0.13) ** 2) / 0.0012) * 0.65
        grain_env = p1 + p2 + p3
        
        crunch = butter_bandpass_filter(gravel_noise, 1100, 5200, FS) * grain_env * 0.85
        
        # C. Fine sand / dust drag tail
        sand_tail = butter_bandpass_filter(gravel_noise, 2500, 7500, FS) * np.exp(-t_sub * 9.0) * 0.25
        
        step_sound = thud + crunch + sand_tail
        stereo[start_idx:start_idx + step_len, 0] += step_sound * (1.0 - pan)
        stereo[start_idx:start_idx + step_len, 1] += step_sound * (1.0 + pan)
        
    # Gentle open-air reverb
    stereo = create_stereo_reverb(stereo, FS, decay=0.35, delay_ms=90, damp_freq=3800)
    return stereo


# -------------------------------------------------------------
# 3. MONASTIC FUNERAL CHANT RESONANCE
# -------------------------------------------------------------
def generate_monastic_funeral_chant_resonance(duration=16.0) -> np.ndarray:
    """Haunting solemn medieval monk chant in D minor with deep cathedral acoustics."""
    n_samples = int(FS * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    stereo = np.zeros((n_samples, 2))
    
    # Low monk voices: D2 (73.4 Hz), A2 (110 Hz), F2 (87.3 Hz), D3 (146.8 Hz)
    voices = [
        (73.42, 0.9, -0.25),  # Abbot / Lead Bass
        (73.55, 0.75, 0.25),  # 2nd Bass slightly detuned
        (110.0, 0.65, -0.10), # Baritone 5th
        (87.31, 0.50, 0.15),  # Minor 3rd
        (146.83, 0.40, 0.0),  # Tenor Octave
    ]
    
    # Formants for deep resonant Latin vowel "O / Requiem / Domine"
    # F1 ~ 400Hz, F2 ~ 800Hz, F3 ~ 2400Hz
    for f0, weight, pan in voices:
        # Vocal cord glottal pulse (pulse train with subtle vibrato)
        vib = 1.0 + 0.004 * np.sin(2 * np.pi * 4.6 * t + pan * 2)
        inst_f = f0 * vib
        phase = 2 * np.pi * np.cumsum(inst_f) / FS
        
        pulse = np.zeros(n_samples)
        for h in range(1, 14):
            pulse += (1.0 / (h ** 0.9)) * np.sin(h * phase)
            
        # Apply vocal tract formant shaping (bandpass resonance filters)
        formant1 = butter_bandpass_filter(pulse, 340, 520, FS) * 1.2
        formant2 = butter_bandpass_filter(pulse, 720, 980, FS) * 0.8
        formant3 = butter_bandpass_filter(pulse, 2100, 2600, FS) * 0.35
        vocal = (formant1 + formant2 + formant3) * weight
        
        # Soft breathiness
        breath = butter_bandpass_filter(np.random.uniform(-1, 1, n_samples), 600, 1800, FS) * 0.03
        
        track = vocal + breath
        stereo[:, 0] += track * (1.0 - pan)
        stereo[:, 1] += track * (1.0 + pan)
        
    # Long swell & decay envelope
    fade_in = int(FS * 3.0)
    fade_out = int(FS * 4.0)
    env = np.ones(n_samples)
    env[:fade_in] = np.linspace(0, 1, fade_in) ** 2.0
    env[-fade_out:] = np.linspace(1, 0, fade_out) ** 1.8
    stereo[:, 0] *= env
    stereo[:, 1] *= env
    
    # Massive Gothic abbey stone reverb (Saint-Denis acoustics)
    stereo = create_stereo_reverb(stereo, FS, decay=0.82, delay_ms=220, damp_freq=2800)
    return stereo


# -------------------------------------------------------------
# 4. AMBIENT DRY SUMMER WIND
# -------------------------------------------------------------
def generate_ambient_dry_summer_wind(duration=15.0) -> np.ndarray:
    """Atmospheric dry summer wind rustling over scorched French plains and abandoned wheat fields."""
    n_samples = int(FS * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # Layer 1: Low atmospheric air pressure rumble (35 - 110 Hz)
    noise_raw = np.random.uniform(-1, 1, n_samples)
    low_rumble = butter_lowpass_filter(noise_raw, 95, FS, order=2) * 1.4
    
    # Layer 2: Dynamic wind gusts (sweeping bandpass filter)
    # LFO modulates gust intensity
    gust_lfo = (
        0.5 + 
        0.3 * np.sin(2 * np.pi * 0.12 * t) + 
        0.2 * np.sin(2 * np.pi * 0.27 * t + 1.2)
    )
    mid_wind = butter_bandpass_filter(noise_raw, 180, 750, FS) * gust_lfo * 1.2
    
    # Layer 3: Dry dead wheat / grass rustle (whispering top end)
    high_rustle = butter_bandpass_filter(noise_raw, 2400, 5800, FS) * (gust_lfo ** 1.5) * 0.35
    
    left = low_rumble * 0.9 + mid_wind * 0.85 + high_rustle * 0.7
    right = low_rumble * 0.95 + mid_wind * 0.8 + high_rustle * 0.9
    
    # Subtle stereo panning drift
    pan_lfo = np.sin(2 * np.pi * 0.15 * t) * 0.15
    left *= (1.0 - pan_lfo)
    right *= (1.0 + pan_lfo)
    
    stereo = np.column_stack([left, right])
    
    # Smooth loopable / seamless fade
    f_len = int(FS * 1.5)
    env = np.ones(n_samples)
    env[:f_len] = np.linspace(0, 1, f_len)
    env[-f_len:] = np.linspace(1, 0, f_len)
    stereo[:, 0] *= env
    stereo[:, 1] *= env
    
    return stereo


# -------------------------------------------------------------
# 5. HEAVY WOODEN PLOW DROP IMPACT
# -------------------------------------------------------------
def generate_heavy_wooden_plow_drop_impact(duration=3.2) -> np.ndarray:
    """Heavy peasant oak plow falling sideways and slamming into furrowed dry earth."""
    n_samples = int(FS * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    stereo = np.zeros((n_samples, 2))
    
    # Impact occurs at t = 0.15s
    t_hit = 0.15
    hit_idx = int(t_hit * FS)
    decay_t = np.maximum(0, t - t_hit)
    hit_mask = (t >= t_hit).astype(float)
    
    # Layer A: Sub-bass earth concussion (earth shuddering)
    sub_pitch = 65.0 * np.exp(-decay_t * 18.0)
    sub_phase = 2 * np.pi * np.cumsum(sub_pitch) / FS
    sub_thud = np.sin(sub_phase) * np.exp(-decay_t * 14.0) * hit_mask * 1.4
    sub_thud = butter_lowpass_filter(sub_thud, 140, FS)
    
    # Layer B: Heavy oak timber body slap & resonance (hollow wooden ard beam)
    wood_modes = [(165.0, 1.0), (280.0, 0.7), (440.0, 0.45), (620.0, 0.25)]
    wood_clatter = np.zeros(n_samples)
    for freq, w in wood_modes:
        wood_clatter += w * np.sin(2 * np.pi * freq * decay_t) * np.exp(-decay_t * (freq / 6.5)) * hit_mask
    wood_clatter = butter_lowpass_filter(wood_clatter, 900, FS) * 0.95
    
    # Layer C: Baked soil displacement & gravel scatter
    noise = np.random.uniform(-1, 1, n_samples)
    dirt_impact = butter_bandpass_filter(noise, 250, 2200, FS) * np.exp(-decay_t * 35.0) * hit_mask * 1.2
    gravel_scatter = butter_bandpass_filter(noise, 1400, 6000, FS) * np.exp(-decay_t * 8.0) * hit_mask * 0.45
    
    # Layer D: Dull iron plowshare ring (cast iron tip striking a stone furrow)
    iron_ring = np.sin(2 * np.pi * 780.0 * decay_t) * np.exp(-decay_t * 28.0) * hit_mask * 0.35
    
    composite = sub_thud + wood_clatter + dirt_impact + gravel_scatter + iron_ring
    
    # Stereo placement: slight right-of-center
    stereo[:, 0] = composite * 0.92
    stereo[:, 1] = composite * 1.08
    
    # Earth impact reverb
    stereo = create_stereo_reverb(stereo, FS, decay=0.45, delay_ms=110, damp_freq=2400)
    return stereo


def main():
    sfx_dir = Path("remotion/public/childrens_crusade/audio/sfx").resolve()
    sfx_dir.mkdir(parents=True, exist_ok=True)
    print(f"[*] Synthesizing 5 Master Atmospheric SFX into: {sfx_dir}")
    
    # 1. Cello tension drone
    print("1. Generating Low D-minor cello drone...")
    cello_drone = generate_d_minor_cello_drone(duration=18.0)
    save_wav_16bit(sfx_dir / "sfx_d_minor_cello_tension_drone.wav", cello_drone)
    
    # 2. Dry gravel footsteps
    print("2. Generating Dry gravel footsteps cadence...")
    footsteps = generate_dry_gravel_footsteps_cadence(duration=14.0)
    save_wav_16bit(sfx_dir / "sfx_dry_gravel_footsteps_cadence.wav", footsteps)
    
    # 3. Monastic funeral chant resonance
    print("3. Generating Monastic funeral chant resonance...")
    monks = generate_monastic_funeral_chant_resonance(duration=16.0)
    save_wav_16bit(sfx_dir / "sfx_monastic_funeral_chant_resonance.wav", monks)
    
    # 4. Ambient dry summer wind
    print("4. Generating Ambient dry summer wind...")
    summer_wind = generate_ambient_dry_summer_wind(duration=15.0)
    save_wav_16bit(sfx_dir / "sfx_ambient_dry_summer_wind.wav", summer_wind)
    
    # 5. Heavy wooden plow drop impact
    print("5. Generating Heavy wooden plow drop impact...")
    plow_drop = generate_heavy_wooden_plow_drop_impact(duration=3.2)
    save_wav_16bit(sfx_dir / "sfx_heavy_wooden_plow_drop_impact.wav", plow_drop)
    
    print("\n[+] All 5 atmospheric SFX generated successfully!")

if __name__ == "__main__":
    main()
