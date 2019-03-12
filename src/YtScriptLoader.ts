enum YtScriptStatus {
  initial,
  loading,
  ready,
}

export default class YtScriptLoader {
  public status: YtScriptStatus = YtScriptStatus.initial;
  protected callbacks: Array<() => void> = [];
  protected elScript = document.createElement('script');

  public constructor () {
    this.setUpGlobalCallback();
  }

  public load () {
    if (this.status !== YtScriptStatus.initial) {
      // throw new Error('status');
      return;
    }
    this.status = YtScriptStatus.loading;

    this.elScript.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(this.elScript);
  }

  public addCallback (callback: () => void) {
    if (this.status === YtScriptStatus.ready) {
      callback();
      return;
    }

    this.callbacks.push(callback);
    this.load();
  }

  public destroy () {
    this.callbacks.length = 0;
    window.onYouTubeIframeAPIReady = undefined;

    if (this.status !== YtScriptStatus.initial) {
      document.body.removeChild(this.elScript);
    }
  }

  protected setUpGlobalCallback () {
    // https://developers.google.com/youtube/iframe_api_reference#Requirements
    if (window.onYouTubeIframeAPIReady) {
      throw new Error(
        'YtScriptLoader (or any competitors) can be created only once in a document',
      );
    }

    window.onYouTubeIframeAPIReady = () => this.onYouTubeIframeAPIReady();
  }

  protected onYouTubeIframeAPIReady () {
    this.callbacks.forEach((f) => f());
    this.callbacks.length = 0;
    this.status = YtScriptStatus.ready;
  }
}
