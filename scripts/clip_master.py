"""
clip_master.py - Lightweight, High-Performance Video Clipping & Editing CLI
Uses local FFmpeg / FFprobe without ingesting heavy video payloads into context.
"""

import argparse
import json
import os
import subprocess
import sys

def run_cmd(cmd):
    print(f"[RUN] {' '.join(cmd)}")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        print(f"[ERROR] {result.stderr}", file=sys.stderr)
        sys.exit(result.returncode)
    return result.stdout

def probe_file(file_path):
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        file_path
    ]
    out = run_cmd(cmd)
    data = json.loads(out)
    return data

def cmd_info(args):
    data = probe_file(args.input)
    fmt = data.get("format", {})
    video_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), None)
    audio_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), None)
    
    print("\n=== MEDIA METRICS ===")
    print(f"File: {args.input}")
    print(f"Duration: {float(fmt.get('duration', 0)):.2f}s")
    print(f"Size: {int(fmt.get('size', 0)) / (1024 * 1024):.2f} MB")
    print(f"Bitrate: {int(fmt.get('bit_rate', 0)) // 1000} kbps")
    if video_stream:
        print(f"Resolution: {video_stream.get('width')}x{video_stream.get('height')}")
        print(f"Video Codec: {video_stream.get('codec_name')}")
        print(f"Frame Rate: {video_stream.get('avg_frame_rate')}")
    if audio_stream:
        print(f"Audio Codec: {audio_stream.get('codec_name')}")
        print(f"Sample Rate: {audio_stream.get('sample_rate')} Hz")
        print(f"Channels: {audio_stream.get('channels')}")

def cmd_trim(args):
    # Accurate trimming with re-encode or fast stream-copy
    cmd = ["ffmpeg", "-y"]
    if args.start:
        cmd.extend(["-ss", str(args.start)])
    if args.end:
        cmd.extend(["-to", str(args.end)])
    elif args.duration:
        cmd.extend(["-t", str(args.duration)])
    
    cmd.extend(["-i", args.input])
    
    if args.copy:
        cmd.extend(["-c", "copy"])
    else:
        cmd.extend(["-c:v", "libx264", "-preset", "fast", "-crf", "18", "-c:a", "aac", "-b:a", "192k"])
    
    cmd.append(args.output)
    run_cmd(cmd)
    print(f"\n[SUCCESS] Trimmed clip saved to: {args.output}")

def cmd_crop_vertical(args):
    # Convert 16:9 to 9:16 vertical
    # Mode: 'center' crops to 9:16 center; 'blur' creates blurred background with centered video
    cmd = ["ffmpeg", "-y", "-i", args.input]
    if args.mode == "center":
        filter_str = "crop=ih*(9/16):ih"
        cmd.extend(["-vf", filter_str, "-c:v", "libx264", "-crf", "18", "-c:a", "copy", args.output])
    elif args.mode == "blur":
        filter_str = (
            "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:5[bg];"
            "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg];"
            "[bg][fg]overlay=(W-w)/2:(H-h)/2"
        )
        cmd.extend(["-filter_complex", filter_str, "-c:v", "libx264", "-crf", "18", "-c:a", "copy", args.output])
    run_cmd(cmd)
    print(f"\n[SUCCESS] Vertical clip saved to: {args.output}")

def cmd_concat(args):
    # Concat list of video files
    with open("concat_list.tmp", "w", encoding="utf-8") as f:
        for item in args.inputs:
            clean_path = os.path.abspath(item).replace("\\", "/")
            f.write(f"file '{clean_path}'\n")
    
    cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "concat_list.tmp", "-c", "copy", args.output]
    try:
        run_cmd(cmd)
    finally:
        if os.path.exists("concat_list.tmp"):
            os.remove("concat_list.tmp")
    print(f"\n[SUCCESS] Concatenated video saved to: {args.output}")

def cmd_extract_audio(args):
    cmd = ["ffmpeg", "-y", "-i", args.input, "-vn"]
    if args.output.endswith(".wav"):
        cmd.extend(["-acodec", "pcm_s16le", "-ar", "44100"])
    else:
        cmd.extend(["-acodec", "libmp3lame", "-q:a", "2"])
    cmd.append(args.output)
    run_cmd(cmd)
    print(f"\n[SUCCESS] Audio extracted to: {args.output}")

def cmd_speed(args):
    # Adjust video speed (e.g., 0.5, 1.25, 1.5, 2.0)
    speed = float(args.speed)
    pts = 1.0 / speed
    atempo = speed
    # ffmpeg atempo supports 0.5 to 2.0 per filter instance
    cmd = [
        "ffmpeg", "-y", "-i", args.input,
        "-filter_complex", f"[0:v]setpts={pts}*PTS[v];[0:a]atempo={atempo}[a]",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-crf", "18",
        args.output
    ]
    run_cmd(cmd)
    print(f"\n[SUCCESS] Retimed clip saved to: {args.output}")

def main():
    parser = argparse.ArgumentParser(description="Solo Living Stills - Video Clipper CLI")
    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    # Info
    p_info = subparsers.add_parser("info", help="Inspect video metadata safely via ffprobe")
    p_info.add_argument("input", help="Path to input video")

    # Trim
    p_trim = subparsers.add_parser("trim", help="Cut a clip with start/end or duration")
    p_trim.add_argument("input", help="Input video")
    p_trim.add_argument("output", help="Output video")
    p_trim.add_argument("--start", "-s", help="Start time (seconds or HH:MM:SS)")
    p_trim.add_argument("--end", "-e", help="End time (seconds or HH:MM:SS)")
    p_trim.add_argument("--duration", "-d", help="Duration (seconds or HH:MM:SS)")
    p_trim.add_argument("--copy", action="store_true", help="Stream copy without re-encoding (ultra-fast)")

    # Vertical Crop
    p_crop = subparsers.add_parser("crop_vertical", help="Convert 16:9 landscape to 9:16 vertical")
    p_crop.add_argument("input", help="Input video")
    p_crop.add_argument("output", help="Output video")
    p_crop.add_argument("--mode", choices=["center", "blur"], default="blur", help="Center crop or blur background")

    # Concat
    p_cat = subparsers.add_parser("concat", help="Stitch multiple clips together")
    p_cat.add_argument("inputs", nargs="+", help="Input video files in order")
    p_cat.add_argument("--output", "-o", required=True, help="Output video")

    # Audio extract
    p_aud = subparsers.add_parser("extract_audio", help="Extract audio track to MP3 or WAV")
    p_aud.add_argument("input", help="Input video")
    p_aud.add_argument("output", help="Output audio file (.mp3 or .wav)")

    # Speed
    p_speed = subparsers.add_parser("speed", help="Adjust speed (0.5x to 2.0x)")
    p_speed.add_argument("input", help="Input video")
    p_speed.add_argument("output", help="Output video")
    p_speed.add_argument("--speed", type=float, default=1.0, help="Playback speed factor (e.g. 1.25, 1.5, 0.75)")

    args = parser.parse_args()
    if args.subcommand == "info":
        cmd_info(args)
    elif args.subcommand == "trim":
        cmd_trim(args)
    elif args.subcommand == "crop_vertical":
        cmd_crop_vertical(args)
    elif args.subcommand == "concat":
        cmd_concat(args)
    elif args.subcommand == "extract_audio":
        cmd_extract_audio(args)
    elif args.subcommand == "speed":
        cmd_speed(args)

if __name__ == "__main__":
    main()
