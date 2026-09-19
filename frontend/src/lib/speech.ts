/** Speaks announcements via the Web Speech API, ducking any in-page <audio>/<video> playback while talking. */
class Announcer {
  private duckedMedia: HTMLMediaElement[] = []
  private duckToVolume = 0.15

  setDuckVolume(v: number) {
    this.duckToVolume = v
  }

  private mediaElements(): HTMLMediaElement[] {
    return Array.from(document.querySelectorAll('audio, video'))
  }

  private duck() {
    this.duckedMedia = this.mediaElements().filter((el) => !el.paused)
    for (const el of this.duckedMedia) {
      el.dataset.preDuckVolume = String(el.volume)
      el.volume = this.duckToVolume
    }
  }

  private unduck() {
    for (const el of this.duckedMedia) {
      const prev = el.dataset.preDuckVolume
      if (prev !== undefined) {
        el.volume = Number(prev)
        delete el.dataset.preDuckVolume
      }
    }
    this.duckedMedia = []
  }

  speak(text: string) {
    if (!('speechSynthesis' in window)) return
    this.duck()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1.05
    utter.onend = () => this.unduck()
    utter.onerror = () => this.unduck()
    window.speechSynthesis.speak(utter)
  }

  cancel() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    this.unduck()
  }
}

export const announcer = new Announcer()
