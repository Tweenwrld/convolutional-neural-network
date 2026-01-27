"""
Audio CNN - Environmental Sound Classification

A deep learning system for audio classification using
Convolutional Neural Networks with a ResNet-18 inspired architecture.
"""

from .model import AudioCNN, ResidualBlock

__version__ = "1.0.0"
__all__ = ["AudioCNN", "ResidualBlock"]
