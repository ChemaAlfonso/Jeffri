import gc
from datetime import datetime
import time
import os
import sys
import torch
import json
import traceback
from diffusers import FluxPipeline, AutoencoderKL
from diffusers.image_processor import VaeImageProcessor
from transformers import T5EncoderModel, T5TokenizerFast, CLIPTokenizer, CLIPTextModel
from huggingface_hub import snapshot_download

# ----------------------
# Workflow Overview
# ----------------------
# 1. [Configuration]: Initial configurations are defined, such as the pretrained model and the devices where it will run (GPU).

# 2. [Embeddings generation from the prompt]:
# The prompt goes through two text models (CLIP and T5), which generate numerical representations (embeddings).
# These embeddings will guide the model in generating an image according to the provided text.

# 3. [Denoising / Latents generation]:
# The pipeline uses the prompt embeddings to generate latents, which are compressed representations of the image.
# The denoising process adjusts and refines these latents through several steps, leading to a representation ready to be decoded.

#  Prompting aspects:
# Subject: The main focus of the image.
# Style: The artistic approach or visual aesthetic.
# Composition: How elements are arranged within the frame.
# Lighting: The type and quality of light in the scene.
# Color Palette: The dominant colors or color scheme.
# Mood/Atmosphere: The emotional tone or ambiance of the image.
# Technical Details: Camera settings, perspective, or specific visual techniques.
# Additional Elements: Supporting details or background information.


# ----------------------
# Helpers
# ----------------------
def flush():
    """
    Flushes the memory and resets memory statistics for the GPU.

    This function performs the following operations:
    1. Calls `gc.collect()` to free up any unused memory.
    2. Calls `torch.cuda.empty_cache()` to release GPU memory.
    3. Calls `torch.cuda.reset_max_memory_allocated()` to reset the maximum memory allocated on the GPU.
    4. Calls `torch.cuda.reset_peak_memory_stats()` to reset the peak memory statistics on the GPU.

    This function is useful when you want to clear the memory and reset memory statistics on the GPU.

    Returns:None
    """
    gc.collect()
    torch.cuda.empty_cache()
    torch.cuda.reset_max_memory_allocated()
    torch.cuda.reset_peak_memory_stats()


def get_model(model_name):
    """
    Retrieves the local path of a model, downloading it if it does not already exist locally.

    Args:
            model_name (str): The name of the model to retrieve.

    Returns:
            str: The local path to the model.

    Note:
            The model will be downloaded to the /app/models/ directory if it does not already exist.
    """

    local_model_path = f"/app/models/{model_name.replace('/', '_')}"

    # Download model if not exists
    if not os.path.exists(local_model_path):
        snapshot_download(repo_id=model_name, local_dir=local_model_path)

    return local_model_path


def load_loras_in_pipeline(pipeline):
    print("Loding LORAs into the pipeline...")

    loras = []

    loras_path = "/app/loras"
    if not os.path.exists(loras_path):
        os.makedirs(loras_path)

    # ----------------------
    # Local loras
    # ----------------------
    local_loras = []

    for lora in local_loras:
        dirname = lora["id"].replace("/", "_")
        lora_local_dir = f"{loras_path}/{dirname}"
        loras.append(
            {
                "name": lora["name"],
                "dir": lora_local_dir,
                "file": lora["file"],
                "wheight": lora["wheight"],
            }
        )

    # ----------------------
    # Remote loras
    # ----------------------
    remote_loras = []

    # Download loras if not exists
    for lora in remote_loras:
        dirname = lora["id"].replace("/", "_")
        lora_local_dir = f"{loras_path}/{dirname}"

        if not os.path.exists(lora_local_dir):
            snapshot_download(repo_id=lora["id"], local_dir=lora_local_dir)

        loras.append(
            {
                "name": lora["name"],
                "dir": lora_local_dir,
                "file": lora["file"],
                "wheight": lora["wheight"],
            }
        )

    loras_count_to_apply = len(loras) if len(loras) > 0 else 0
    print(f"Applying {loras_count_to_apply} LoRAs to the pipeline.")

    if len(loras) == 0:
        return

    # ----------------------
    # Load loras
    # ----------------------
    for lora in loras:
        pipeline.load_lora_weights(
            lora["dir"], weight_name=lora["file"], adapter_name=lora["name"]
        )

    lora_names = [lora["name"] for lora in loras]
    lora_weights = [lora["wheight"] for lora in loras]

    pipeline.set_adapters(lora_names, adapter_weights=lora_weights)


# ----------------------
# Encodings (Generate embeds)
# ----------------------
def encode(*, model, precision, prompt):
    print("Encoding prompts.")

    # CLIPTextModel:
    # CLIP is used to transform the text of the prompt into a numerical representation (embedding).
    # It is a model trained to associate text with images, so it translates the content of the prompt
    # into tensors that are then related to visual features.
    text_encoder = CLIPTextModel.from_pretrained(
        model, subfolder="text_encoder", torch_dtype=precision
    )
    tokenizer = CLIPTokenizer.from_pretrained(model, subfolder="tokenizer")

    # T5EncoderModel:
    # This is a language model that understands the deeper semantic context of the text.
    # T5 helps to disambiguate and enrich the meaning of the prompt.
    # This is useful for more complex prompts or more abstract contexts, where the model needs to understand more than just the basic tokens.
    text_encoder_2 = T5EncoderModel.from_pretrained(
        model, subfolder="text_encoder_2", torch_dtype=precision
    )
    tokenizer_2 = T5TokenizerFast.from_pretrained(model, subfolder="tokenizer_2")

    pipeline = FluxPipeline.from_pretrained(
        model,
        text_encoder=text_encoder,
        text_encoder_2=text_encoder_2,
        tokenizer=tokenizer,
        tokenizer_2=tokenizer_2,
        transformer=None,
        vae=None,
    ).to("cuda")

    with torch.no_grad():
        prompt_embeds, pooled_prompt_embeds, text_ids = pipeline.encode_prompt(
            prompt=prompt, prompt_2=None, max_sequence_length=256
        )

    # Clear memory
    del text_encoder
    del text_encoder_2
    del tokenizer
    del tokenizer_2
    del pipeline
    flush()

    return prompt_embeds, pooled_prompt_embeds, text_ids


# ----------------------
# Denoising
# ----------------------
def denoise(
    *,
    model,
    precision,
    inference_steps,
    prompt_embeds,
    pooled_prompt_embeds,
    image_height,
    image_width,
    seed,
):
    print("Running denoising.")

    # The pipeline uses the prompt embeddings to generate latents,
    # which are compressed representations of the image.
    # The denoising process adjusts and refines these latents through several steps,
    # leading to a representation ready to be decoded.
    pipeline = FluxPipeline.from_pretrained(
        model,
        text_encoder=None,
        text_encoder_2=None,
        tokenizer=None,
        tokenizer_2=None,
        vae=None,
        torch_dtype=precision,
    ).to("cuda")

    load_loras_in_pipeline(pipeline)

    # No need to wrap it up under `torch.no_grad()` as pipeline
    # internal call method is already wrapped under that.
    latents = pipeline(
        prompt_embeds=prompt_embeds,
        pooled_prompt_embeds=pooled_prompt_embeds,
        num_inference_steps=inference_steps,
        guidance_scale=0.0,
        height=image_height,
        width=image_width,
        output_type="latent",
        generator=torch.manual_seed(seed),
    ).images

    print(f"{latents.shape=}")

    # Clear memory
    del pipeline.transformer
    del pipeline
    flush()

    return latents


# ----------------------
# Decoding
# ----------------------
def decode(*, model, precision, latents, image_height, image_width, file_name):
    # Uses the latents generated in the previous step to decode the image and generate the final result.

    # ❔ The latents are a representation in a space that the model has learned,
    # which can generate not only the original image but also new images if the latents are modified.
    # Decoding in this context implies that the model uses the patterns it has learned during its training
    # to reconstruct or create images from this abstract representation.

    print("Running decoding.")

    # The VAE converts the latents back to the pixel space (real image),
    # based on the structure and features learned during training.
    vae = AutoencoderKL.from_pretrained(
        model, revision="refs/pr/1", subfolder="vae", torch_dtype=precision
    ).to("cuda")
    vae_scale_factor = 2 ** (len(vae.config.block_out_channels))
    image_processor = VaeImageProcessor(vae_scale_factor=vae_scale_factor)

    with torch.no_grad():
        latents = FluxPipeline._unpack_latents(
            latents, image_height, image_width, vae_scale_factor
        )
        latents = (latents / vae.config.scaling_factor) + vae.config.shift_factor

        image = vae.decode(latents, return_dict=False)[0]
        image = image_processor.postprocess(image, output_type="pil")

        image[0].save(file_name)


if __name__ == "__main__":
    # ----------------------
    # Config
    # ----------------------
    filepath = sys.argv[1]
    prompt = sys.argv[2]
    image_height = (
        int(sys.argv[3]) if sys.argv[3].isnumeric() and int(sys.argv[3]) > 0 else 768
    )
    image_width = (
        int(sys.argv[4]) if sys.argv[4].isnumeric() and int(sys.argv[4]) > 0 else 1360
    )
    seed = int(sys.argv[5]) if sys.argv[5].isnumeric() else int(time.time())
    model = get_model("black-forest-labs/FLUX.1-schnell")
    precision = torch.bfloat16
    inference_steps = 4

    try:

        # ----------------------
        # Workflow
        # ----------------------
        start_time = time.time()
        flush()

        # 1. Encode
        prompt_embeds, pooled_prompt_embeds, text_ids = encode(
            model=model, precision=precision, prompt=prompt
        )

        # 2. Denoise
        latents = denoise(
            model=model,
            precision=precision,
            inference_steps=inference_steps,
            prompt_embeds=prompt_embeds,
            pooled_prompt_embeds=pooled_prompt_embeds,
            image_height=image_height,
            image_width=image_width,
            seed=seed,
        )

        # 3. Decode
        decode(
            model=model,
            precision=precision,
            latents=latents,
            image_height=image_height,
            image_width=image_width,
            file_name=filepath,
        )

        # ----------------------
        # Output
        # ----------------------
        end_time = time.time()
        elapsed_time = end_time - start_time
        print("----------------- Generation summary -----------------")
        print(f"Generation took {elapsed_time:.2f} seconds to complete.")
        print(f"Using prompt: {prompt}")
        print(f"Using seed: {seed}")
        print("------------------------------------------------------")

        response = {"status": "ok"}
    except Exception as e:

        response = {"status": "error"}
        print(f"Error: {e}")
        traceback.print_exc()

    result_output = f"<<<script_result={json.dumps(response)}>>>"
    print(result_output)
