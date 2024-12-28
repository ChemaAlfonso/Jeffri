# Jeffri Enchancer - Transcription service

![Python](https://img.shields.io/badge/Python-language-yellow?color=%23FFD43B) ![Express](https://img.shields.io/badge/Express-API-blue?color=%23404D59) ![Docker](https://img.shields.io/badge/Docker-containerization-blue?color=%2302496D) ![Whisper](https://img.shields.io/badge/Whisper-Transcription-black?color=%23232323) ![NVIDIA](https://img.shields.io/badge/NVIDIA-GPU-green?color=%2376B900)

> ⚠️ This package is not pretended in production environments, but is a working example and a starting point for a more complex transcription service.

## Overview

The package is a simple express server that **runs locally available for all LAN devices** and uses the **python commands** to run the transcription model.

The server consists of only 2 endpoints:

-   `/status`: Returns the status of the server.
-   `/transcribe`: Returns the transcription of the audio as `{text: "The transcription"}`.

## Requirements

-   Docker

> ⚠️ The default configuration uses NVIDIA GPU for transcription, if you want to use CPU, you should comment the specified lines in docker-compose file.

## Usage

1. Rename the `.env.example` file to `.env` and set the desired env.

2. Build the docker image:

```bash
docker-compose up
```

Ther server will be available for all LAN devices at `http://localhost:[specified-port]`.

# License

MIT
