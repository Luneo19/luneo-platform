# USDZ Converter Service

Docker container for converting GLB files to USDZ format with texture optimization.

## Features

- GLB optimization using gltf-pipeline
- Texture optimization (resize, mipmaps, compression)
- Texture hash-based caching support
- Dockerized for easy deployment

## Usage

### As Docker Container

```bash
docker build -t usdz-converter tools/usdz-converter
docker run --rm -v $(pwd):/data usdz-converter \
  python3 converter.py /data/input.glb /data/output.usdz /data/texture1.jpg
```

### As Service (HTTP API)

The converter can be run as an HTTP service (future enhancement).

## Limitations

Full USDZ conversion requires Apple's official `usdz-converter` tool, which only runs on macOS. Options:

1. **macOS CI/CD Runner**: Use GitHub Actions with macOS runners
2. **Cloud Service**: Use AWS Lambda with macOS runtime (if available)
3. **Alternative Library**: Use Python libraries like `pxr` (USD Python bindings)

For now, this service optimizes GLB files and prepares them for conversion.

## Dependencies

- Node.js 20+
- Python 3
- gltf-pipeline (npm)
- Pillow (Python)
- ImageMagick
