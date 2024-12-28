FROM node:22

# Install Python and necessary tools
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

# Install Miniconda
RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh && \
	bash /tmp/miniconda.sh -b -p /opt/miniconda && \
	rm /tmp/miniconda.sh

# Add Miniconda to PATH
ENV PATH=/opt/miniconda/bin:$PATH

# Create and activate Python environment (name: llm-vision)
RUN conda create -n llm-vision python=3.12 -y

# Install `llm-vision` using Conda environment
RUN /opt/miniconda/bin/conda run -n llm-vision pip install transformers
RUN /opt/miniconda/bin/conda run -n llm-vision pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124 
RUN /opt/miniconda/bin/conda run -n llm-vision pip install timm einops

# Create a working directory for the application
WORKDIR /app

# Copy package.json and package-lock.json to install Node.js dependencies
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

EXPOSE 4026

# Start the Express server
CMD ["node", "src/server.js"]
