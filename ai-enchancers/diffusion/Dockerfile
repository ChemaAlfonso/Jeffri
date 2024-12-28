FROM node:22

# Install Python and necessary tools
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv ffmpeg wget bzip2

# Install Miniconda
RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh && \
	bash /tmp/miniconda.sh -b -p /opt/miniconda && \
	rm /tmp/miniconda.sh

# Add Miniconda to PATH
ENV PATH=/opt/miniconda/bin:$PATH

# Create a working directory for the application
WORKDIR /app

# Create and activate Python environment (name: flux)
RUN conda create --name flux python=3.10

# Ensure conda environment is activated when running further commands
SHELL ["conda", "run", "-n", "flux", "/bin/bash", "-c"]

# Install the Python dependency from GitHub (e.g., diffusers)
RUN pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124 && \
	pip install git+https://github.com/huggingface/diffusers.git accelerate huggingface_hub transformers peft

RUN pip install sentencepiece protobuf

# Copy package.json and package-lock.json to install Node.js dependencies
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

EXPOSE 4025

# Start the Express server
CMD ["node", "src/server.js"]
