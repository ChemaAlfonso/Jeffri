import whisper
import sys
import io


# Size	Parameters	English-only model	Multilingual model	Required VRAM	Relative speed
# tiny		39 M	tiny.en				tiny				~1 GB			~10x
# base		74 M	base.en				base				~1 GB			~7x
# small		244 M	small.en			small				~2 GB			~4x
# medium	769 M	medium.en			medium				~5 GB			~2x
# large		1550 M	N/A					large				~10 GB			1x
# turbo		809 M	N/A					turbo				~6 GB			~8x


def transcribe(filepath, language):

    try:
        old_stdout = sys.stdout
        sys.stdout = io.StringIO()

        model = whisper.load_model("turbo", download_root="/app/models")
        result = model.transcribe(filepath, language=language)

        return result["text"]
    except Exception as e:
        return None
    finally:
        sys.stdout = old_stdout


if __name__ == "__main__":
    audio_filepath = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "es"
    transcription = transcribe(audio_filepath, language)

    if transcription is not None:
        print(transcription)
