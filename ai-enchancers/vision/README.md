# Jeffri Enchancer - Vision service

![Python](https://img.shields.io/badge/Python-language-yellow?color=%23FFD43B) ![Express](https://img.shields.io/badge/Express-API-blue?color=%23404D59) ![Docker](https://img.shields.io/badge/Docker-containerization-blue?color=%2302496D) ![Florence 2](https://img.shields.io/badge/Florence--2-Vision-orange?color=%23E95F28) ![NVIDIA](https://img.shields.io/badge/NVIDIA-GPU-green?color=%2376B900)

> ⚠️ This package is not pretended in production environments, but is a working example and a starting point for a more complex vision service.

## Overview

The service is pretended to use with **nvidia gpus**, if using a different hardware, the docker-compose file should be modified to use adapted configurations.

The package is a simple express server that **runs locally available for all LAN devices** and uses the **python commands** to run the vision model.

The server consists of only 2 endpoints:

-   `/status`: Returns the status of the server.
-   `/describe`: Returns the description of the image as `{text: "The description"}`.

## Requirements

-   Docker
-   NVIDIA GPU
-   NVIDIA Container Toolkit

> Follow the official [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) installation instructions.

## Usage

1. Rename the `.env.example` file to `.env` and set the desired env.

2. Build the docker image:

```bash
docker-compose up
```

Ther server will be available for all LAN devices at `http://localhost:[specified-port]`.

# License

MIT
