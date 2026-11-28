# Delivering the film {#deliver}

## Share copy under 30 MiB {#share-copy}

The file-send tool refuses anything over 30 MiB, so a finished MP4 that large gets a smaller share copy beside it:

`ffmpeg -i in.mp4 -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 160k -movflags +faststart share.mp4`

A 20 s clip rarely needs it; a 90 s 1080p one does. A 105 s 1080p film with sound came to 41 to 44 MB before this step, which is why the check is by size, not by length.
