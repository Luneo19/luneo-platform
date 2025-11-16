FROM node:20-alpine

# Install system dependencies for image processing and USDZ conversion
RUN apk add --no-cache \
    python3 \
    py3-pip \
    imagemagick \
    libpng-dev \
    libjpeg-turbo-dev \
    git \
    make \
    g++ \
    && pip3 install --upgrade pip

# Install gltf-pipeline globally
RUN npm install -g gltf-pipeline

# Install usdz-converter (Python tool)
# Note: Apple's official usdz-converter requires macOS, so we use an alternative
# For production, consider using a macOS-based runner or cloud service
RUN pip3 install \
    pillow \
    numpy \
    requests

# Create working directory
WORKDIR /app

# Copy converter script
COPY converter.py /app/
COPY package.json /app/

# Install Node.js dependencies if needed
RUN npm install || true

# Expose port for HTTP API (optional, for service mode)
EXPOSE 3002

# Default command runs the converter script
CMD ["python3", "converter.py"]
