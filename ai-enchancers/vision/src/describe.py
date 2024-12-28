import sys
import io
import torch
from PIL import Image
from transformers import AutoModelForCausalLM, AutoProcessor


def describe(filepath):

    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

    model_id = "microsoft/Florence-2-large"
    model = AutoModelForCausalLM.from_pretrained(
        model_id, torch_dtype=torch_dtype, trust_remote_code=True
    ).to(device)
    processor = AutoProcessor.from_pretrained(model_id, trust_remote_code=True)

    try:
        old_stdout = sys.stdout
        sys.stdout = io.StringIO()

        text_input = None
        task_prompt = "<MORE_DETAILED_CAPTION>"

        image = Image.open(filepath)
        if image.format != "JPEG" and image.format != "JPG":
            image = image.convert("RGB")
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG")
            buffer.seek(0)
            image = Image.open(buffer)

        if text_input is None:
            prompt = task_prompt
        else:
            prompt = task_prompt + text_input

        inputs = processor(text=prompt, images=image, return_tensors="pt").to(
            "cuda", torch.float16
        )

        generated_ids = model.generate(
            input_ids=inputs["input_ids"].cuda(),
            pixel_values=inputs["pixel_values"].cuda(),
            max_new_tokens=1024,
            early_stopping=False,
            do_sample=False,
            num_beams=3,
        )

        generated_text = processor.batch_decode(
            generated_ids, skip_special_tokens=False
        )[0]
        parsed_answer = processor.post_process_generation(
            generated_text, task=task_prompt, image_size=(image.width, image.height)
        )

        return parsed_answer["<MORE_DETAILED_CAPTION>"]
    except Exception as e:
        return None
    finally:
        sys.stdout = old_stdout


if __name__ == "__main__":
    image_filepath = sys.argv[1]
    description = describe(image_filepath)

    if description is not None:
        print(description)
