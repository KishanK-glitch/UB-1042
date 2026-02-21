import librosa
import numpy as np

try:
    import tensorflow as tf
    import tensorflow_hub as hub
    # Attempt to load real YAMNet if tensorflow is installed
    print("Loading YAMNet model...")
    yamnet_model = hub.load('https://tfhub.dev/google/yamnet/1')
    
    # Generate class names map
    class_map_path = yamnet_model.class_map_path().numpy().decode('utf-8')
    class_names = []
    with tf.io.gfile.GFile(class_map_path) as csvfile:
        import csv
        reader = csv.DictReader(csvfile)
        for row in reader:
            class_names.append(row['display_name'])
            
    print("YAMNet loaded successfully.")
    YAMNET_AVAILABLE = True
except ImportError:
    print("TensorFlow not detected. YAMNet audio engine will run in heuristic simulation mode.")
    YAMNET_AVAILABLE = False
except Exception as e:
    print(f"Error loading YAMNet: {e}. Falling back to heuristic simulation mode.")
    YAMNET_AVAILABLE = False


def run_yamnet_inference(audio_path: str):
    """
    Processes the audio track using the real TensorFlow Hub YAMNet model.
    """
    y, sr = librosa.load(audio_path, sr=16000) # YAMNet explicitly requires 16kHz
    scores, embeddings, spectrogram = yamnet_model(y)
    
    # average scores across all frames
    class_scores = tf.reduce_mean(scores, axis=0) 
    
    # Get top 3 predicted classes
    top_class_indices = tf.argsort(class_scores, direction='DESCENDING')[:3]
    
    detections = set()
    highest_conf = 0.0
    
    for i in top_class_indices:
        idx = int(i)
        score = float(class_scores[idx])
        name = class_names[idx].lower()
        
        # Add to detections if confidence is decent
        if score > 0.05:
            detections.add(name)
            highest_conf = max(highest_conf, score)
            
    return list(detections), round(highest_conf, 2)


def run_heuristic_simulation(audio_path: str):
    """
    Analyzes an audio file for sudden violent spikes in acoustic energy.
    This simulates detecting a gunshot, scream, or crash in a CCTV environment.
    """
    # Load the audio file (keep duration short for fast processing)
    y, sr = librosa.load(audio_path, sr=22050, duration=10.0)
    
    # Calculate the Root Mean Square (RMS) energy
    rms = librosa.feature.rms(y=y)[0]
    
    mean_energy = np.mean(rms)
    max_energy = np.max(rms)
    
    # Threshold logic
    spike_ratio = max_energy / (mean_energy + 1e-6) 
    
    detections = set()
    confidence = 0.0
    
    if spike_ratio > 3.0 and max_energy > 0.05:
        # Extreme spike -> Highly likely gunshot/explosion
        confidence = min(0.99, round(float(max_energy) * 2, 2))
        detections.add("gunshot")
    elif spike_ratio > 1.8 and max_energy > 0.02:
        # Loud spike -> Screaming or fire alarm
        confidence = min(0.85, round(float(max_energy) * 1.5, 2))
        detections.add("screaming")
        
    return list(detections), confidence


def analyze_audio_anomaly(audio_path: str):
    """
    Dynamic routing for audio processing based on system dependencies.
    """
    try:
        if YAMNET_AVAILABLE:
            return run_yamnet_inference(audio_path)
        else:
            return run_heuristic_simulation(audio_path)
    except Exception as e:
        print(f"Audio Processing Error: {e}")
        return [], 0.0


if __name__ == "__main__":
    # Test block
    import os
    test_audio = "data/blindspot_audio.wav"
    if os.path.exists(test_audio):
        labels, conf = analyze_audio_anomaly(test_audio)
        print(f"AUDIO DETECTIONS: {labels} | Confidence: {conf}")
    else:
        print("Provide a valid audio file to test locally.")