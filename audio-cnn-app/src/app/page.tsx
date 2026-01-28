"use client";

import React, { useState } from "react";
import ColorScale from "~/components/ColorScale";
import FeatureMap from "~/components/FeatureMap";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import Waveform from "~/components/Waveform";

interface Prediction {
  class: string;
  confidence: number;
}

interface LayerData {
  shape: number[];
  values: number[][];
}

type VisualizationData = Record<string, LayerData>;

interface WaveformData {
  sample_rate: number;
  values: number[];
  duration: number;
}

interface ApiResponse {
  predictions: Prediction[];
  visualization: VisualizationData;
  input_spectrogram: LayerData
  waveform: WaveformData;
}

const ESC50_EMOJI_MAP: Record<string, string> = {
  dog: "🐕",
  rain: "🌧️",
  crying_baby: "👶",
  door_wood_knock: "🚪",
  helicopter: "🚁",
  rooster: "🐓",
  sea_waves: "🌊",
  sneezing: "🤧",
  mouse_click: "🖱️",
  chainsaw: "🪚",
  pig: "🐷",
  crackling_fire: "🔥",
  clapping: "👏",
  keyboard_typing: "⌨️",
  siren: "🚨",
  cow: "🐄",
  crickets: "🦗",
  breathing: "💨",
  door_wood_creaks: "🚪",
  car_horn: "📯",
  frog: "🐸",
  chirping_birds: "🐦",
  coughing: "😷",
  can_opening: "🥫",
  engine: "🚗",
  cat: "🐱",
  water_drops: "💧",
  footsteps: "👣",
  washing_machine: "🧺",
  train: "🚂",
  hen: "🐔",
  wind: "💨",
  laughing: "😂",
  vacuum_cleaner: "🧹",
  church_bells: "🔔",
  insects: "🦟",
  pouring_water: "🚰",
  brushing_teeth: "🪥",
  clock_alarm: "⏰",
  airplane: "✈️",
  sheep: "🐑",
  toilet_flush: "🚽",
  snoring: "😴",
  clock_tick: "⏱️",
  fireworks: "🎆",
  crow: "🐦‍⬛",
  thunderstorm: "⛈️",
  drinking_sipping: "🥤",
  glass_breaking: "🔨",
  hand_saw: "🪚",
};

const getEmojiForClass = (className: string): string => {
  return ESC50_EMOJI_MAP[className] ?? "❓";
}

function splitLayers(visualization: VisualizationData) {
  const mainLayers: [string, LayerData][] = [];
  const blockLayers: Record<string, [string, LayerData][]> = {};

  for (const [name, data] of Object.entries(visualization)) {
    // Main layer outputs (conv1, layer1, layer2, layer3, layer4)
    // These are the summary outputs after each major layer
    if (!name.includes('.')) {
      mainLayers.push([name, data]);
    } else {
      // Block-level details (layer1.block0.conv, layer1.block0.relu, etc.)
      const [parent] = name.split('.');
      if (parent === undefined) continue;

      blockLayers[parent] ??= [];
      blockLayers[parent].push([name, data]);
    }
  }

  // Sort main layers in logical order
  const layerOrder = ['conv1', 'layer1', 'layer2', 'layer3', 'layer4'];
  mainLayers.sort((a, b) => {
    const aIndex = layerOrder.indexOf(a[0]);
    const bIndex = layerOrder.indexOf(b[0]);
    return aIndex - bIndex;
  });

  return { mainLayers, blockLayers };
}

export default function HomePage() {

  const [isLoading, setIsLoading] = useState(false);
  const [vizData, setVizData] = useState<ApiResponse | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setError(null);
    setVizData(null);

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const base64String = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
          ),
        );

        const response = await fetch(
          "https://leonard383boma--audio-cnn-inference-fastapi-app.modal.run/inference",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio_data: base64String }),
          },
        );

        if (!response.ok) {
          throw new Error(`API Error ${response.statusText}`);
        }

        const data = await response.json() as ApiResponse;
        setVizData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown Error");
      } finally {
        setIsLoading(false);
      }
    }

    reader.onerror = () => {
      setError("Error reading file");
      setIsLoading(false);
    };
  };

  const { mainLayers, blockLayers } = vizData
    ? splitLayers(vizData.visualization)
    : { mainLayers: [], blockLayers: {} };

  return (
    <main className="min-h-screen bg-stone-50 p-8">
      <div className="mx-auto max-w-full ">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-light tracking-tight text-stone-900">
            CNN Audio Visualizer
          </h1>
          <p className="mb-8 text-md text-stone-600">
            Upload a WAV file to see the model predictions and feature maps
          </p>

          <div className="flex flex-col items-center">
            <div className="relative inline-block">
              <input
                type="file"
                accept=".wav"
                id="file-upload"
                onChange={handleFileChange}
                disabled={isLoading}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
              <Button
                className="border-stone-300"
                variant="outline"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Analysing..." : "Choose File"}
              </Button>
            </div>

            {fileName && (
              <Badge
                variant="secondary"
                className="mt-4 bg-stone-200 text-stone-700"
              >
                {fileName}
              </Badge>
            )}
          </div>
        </div>

        {error && (
          <Card className="mb-8 border-red-600 bg-red-50">
            <CardContent>
              <p className="text-red-600">Error:</p> {error}
            </CardContent>
          </Card>
        )}

        {vizData && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-stone-900">Top Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vizData.predictions.slice(0, 3).map((pred, index) => (
                    <div key={pred.class} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-md font-medium text-stone-700">
                          {getEmojiForClass(pred.class)}{" "}
                          <span>{pred.class.replaceAll("_", " ")}</span>
                        </div>
                        <Badge variant={index == 0 ? "default" : "secondary"}>
                          {(pred.confidence * 100).toFixed(2)}%
                        </Badge>
                      </div>
                      <Progress
                        value={pred.confidence * 100}
                        className="h-2 rounded-md"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="flex flex-col">
                <CardHeader className="text-stone-900">
                  <CardTitle className="text-stone-900">Input Spectrogram</CardTitle>
                  <p className="text-sm text-stone-500">
                    Visual representation of audio frequencies over time
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  {/* Axis Labels */}
                  <div className="relative flex-1">
                    {/* Y-axis label */}
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-stone-500">
                      Frequency (Mel)
                    </div>
                    {/* Feature Map*/}
                    <div className="ml-2">
                      <FeatureMap
                        data={vizData.input_spectrogram.values}
                        title=""
                        spectrogram
                      />
                    </div>
                    {/* X-axis label */}
                    <div className="mt-1 text-center text-xs font-medium text-stone-500">
                      Time →
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="mt-4 rounded-lg bg-stone-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-stone-600">
                        <span className="font-medium">Shape:</span> {vizData.input_spectrogram.shape.join(" × ")} 
                        <span className="ml-2 text-stone-400">(128 mel bands × time frames)</span>
                      </div>
                      <ColorScale width={150} height={12} min={-1} max={1} />
                    </div>
                    <p className="mt-2 text-xs text-stone-500">
                      🔵 Blue = High energy | ⚪ White = Low energy | 🟠 Orange = Negative values
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-stone-900">Audio Waveform</CardTitle>
                  <p className="text-sm text-stone-500">
                    Raw amplitude of the sound signal over time
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="relative flex-1">
                    {/* Y-axis label */}
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-stone-500">
                      Amplitude
                    </div>
                    <div className="ml-2">
                      <Waveform
                        data={vizData.waveform.values}
                        title=""
                      />
                    </div>
                    {/* X-axis label */}
                    <div className="mt-1 text-center text-xs font-medium text-stone-500">
                      Time →
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="mt-4 rounded-lg bg-stone-50 p-3">
                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <div>
                        <span className="font-medium">Duration:</span> {vizData.waveform.duration.toFixed(2)}s
                      </div>
                      <div>
                        <span className="font-medium">Sample Rate:</span> {vizData.waveform.sample_rate.toLocaleString()} Hz
                      </div>
                      <div>
                        <span className="font-medium">Samples:</span> {vizData.waveform.values.length.toLocaleString()}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-stone-500">
                      📈 Shows how loud the sound is at each moment. Center line = silence.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Maps */}
            <Card>
              <CardHeader>
                <CardTitle>Convolutional Layer Outputs</CardTitle>
                <p className="text-sm text-stone-500">
                  What the CNN &quot;sees&quot; at each layer — from simple patterns to complex features
                </p>
              </CardHeader>
              <CardContent>
                {mainLayers.length > 0 ? (
                  <>
                    <div className="grid grid-cols-5 gap-6">
                      {mainLayers.map(([layerName, layerData]) => (
                        <div key={layerName} className="space-y-4">
                          <div>
                            <h4 className="mb-2 font-medium text-stone-700">{layerName}</h4>
                            <FeatureMap
                              data={layerData.values}
                              title={`${layerData.shape.join(" x ")}`}
                            />
                          </div>

                          {blockLayers[layerName] && (
                            <div className="h-80 overflow-y-auto rounded border border-stone-200 bg-stone-50 p-2">
                              <div className="space-y-2">
                                {blockLayers[layerName]
                                  .sort(([a]: [string, LayerData], [b]: [string, LayerData]) => a.localeCompare(b))
                                  .map(([blockName, blockData]: [string, LayerData]) => (
                                    <FeatureMap
                                      key={blockName}
                                      data={blockData.values}
                                      title={blockName.replace(`${layerName}.`, "")}
                                      internal={true}
                                    />
                                  ))
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex justify-end">
                      <ColorScale
                        width={200}
                        height={16}
                        min={-1}
                        max={1}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-stone-500">No convolutional layer outputs available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
