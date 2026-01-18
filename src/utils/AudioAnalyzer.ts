export default class AudioAnalyzer {
  audio: HTMLAudioElement;
  context: AudioContext;
  analyzer: AnalyserNode;
  dataArray: Uint8Array;

  constructor(sourcePath: string) {
    this.audio = new Audio(sourcePath);
    this.audio.crossOrigin = "anonymous";

    this.context = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    this.analyzer = this.context.createAnalyser();

    const source = this.context.createMediaElementSource(this.audio);
    source.connect(this.analyzer);
    this.analyzer.connect(this.context.destination);

    this.analyzer.fftSize = 256;
    const bufferLength = this.analyzer.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }

  // src/utils/AudioAnalyzer.ts
  toggle() {
    if (this.audio.paused) {
      // Luôn đảm bảo context chạy trước khi play
      if (this.context.state === "suspended") this.context.resume();
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  play() {
    if (this.context.state === "suspended") this.context.resume();
    this.audio.play();
  }

  getFrequencyData() {
    // Ép kiểu trực tiếp ở tham số truyền vào
    this.analyzer.getByteFrequencyData(this.dataArray as any);
    return this.dataArray;
  }
}
