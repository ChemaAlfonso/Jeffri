FROM node:22

# Install Python and necessary tools
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv ffmpeg wget bzip2

# Install Miniconda
RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh && \
	bash /tmp/miniconda.sh -b -p /opt/miniconda && \
	rm /tmp/miniconda.sh

# Add Miniconda to PATH
ENV PATH=/opt/miniconda/bin:$PATH

# Create and activate Python environment (name: whisper)
RUN conda create -n whisper python=3.10 -y

# Install `openai-whisper` using Conda environment
RUN /opt/miniconda/bin/conda run -n whisper pip install -U openai-whisper

# Create a working directory for the application
WORKDIR /app

# Copy package.json and package-lock.json to install Node.js dependencies
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

EXPOSE 4024

# Start the Express server
CMD ["node", "src/server.js"]
