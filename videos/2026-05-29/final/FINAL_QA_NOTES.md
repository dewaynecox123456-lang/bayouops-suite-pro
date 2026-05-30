# BayouOps Operational Readiness Demo - Final QA Notes

Date: 2026-05-29

## Source

- File: `/var/home/dewaynecox/Videos/5_29_2026/copy_B05CC8D0-0516-494B-9ADA-C3823493AD2B.mov`
- Runtime: 00:00:15.14
- Resolution: 360x640 vertical
- Video: H.264 Main, 30 fps, ~814 kb/s
- Audio: AAC LC, stereo, 44.1 kHz, ~107 kb/s
- Container bitrate: ~930 kb/s

## Final Outputs

### BayouOps_Operational_Readiness_Demo_FINAL_v1.mp4

- Path: `videos/2026-05-29/final/BayouOps_Operational_Readiness_Demo_FINAL_v1.mp4`
- Runtime: 00:00:17.13
- Resolution: 360x640 vertical
- Video: H.264 High, 30 fps, ~198 kb/s
- Audio: AAC LC, stereo, 48 kHz, ~171 kb/s
- Container bitrate: ~378 kb/s
- File size: 792 KB

### BayouOps_Operational_Readiness_Demo_FINAL_LinkedIn_v1.mp4

- Path: `videos/2026-05-29/final/BayouOps_Operational_Readiness_Demo_FINAL_LinkedIn_v1.mp4`
- Runtime: 00:00:17.13
- Resolution: 1080x1920 vertical
- Video: H.264 High, 30 fps, ~781 kb/s
- Audio: AAC LC, stereo, 48 kHz, ~171 kb/s
- Container bitrate: ~961 kb/s
- File size: 2.0 MB

## Cleanup Actions Performed

- Converted the source MOV to MP4 with H.264/AAC for broad playback compatibility.
- Preserved original pacing through the main demo section.
- Normalized narration from approximately -22.9 LUFS to -16.0 LUFS with a -1.5 dBTP ceiling.
- Applied light brightness, contrast, saturation, and sharpening adjustments for dashboard/caption readability.
- Added a roughly 2 second final-card hold so the ending remains readable.
- Added a subtle final fade out after the hold.
- Added `+faststart` metadata layout for easier web and LinkedIn playback.
- Created a LinkedIn-ready 1080x1920 vertical version using Lanczos upscale to reduce platform recompression softness.

## Subtitle And Caption Notes

- No separate subtitle or caption stream was present in the source MOV.
- Captions appear to be burned into the video, so text timing could not be independently retimed without the edit project or transcript assets.
- Readability was improved through the final-card hold and light image treatment only.

## QA Checks

- `ffprobe` was run against the source MOV and both final MP4 files.
- Silence check found the intended silent final-card hold from approximately 15.12s to 17.13s.
- Source contained one short internal quiet section around 9.15s to 9.65s; it was preserved to avoid disrupting pacing.
- Black-frame detection found brief 0.2s dark transition points at approximately 5.97s, 9.77s, and 14.17s; these appear to be existing transition beats rather than export errors.
- Tail-frame inspection confirmed the ending card remains visible before fade out.

## Remaining Issues / Recommendations

- The source is only 360x640, so dashboard and caption sharpness is limited by the original capture resolution.
- The CapCut watermark is present in the source and remains visible in the final exports.
- For a stronger customer-facing deliverable, export a clean source from the edit project at 1080x1920 with no watermark and separate caption assets.
