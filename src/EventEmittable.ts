import * as ee from 'event-emitter';

export default class EventEmittable {
  protected eventEmitter = ee();

  /**
   * Attach an event handler function.
   * The `listener` function will be invoked without `this` bindings.
   * @param type A event type like `"play"`, '"timeupdate"` or `"onReady"`.
   * @param listener A function to execute when the event is triggered.
   * @see #removeEventListener
   */
  public addEventListener (type: string, listener: (event: Event) => void) {
    this.eventEmitter.on(type, listener);
  }

  /**
   * Detach an event handler function.
   * @see #addEventListener
   */
  public removeEventListener (type: string, listener: (event: Event) => void) {
    this.eventEmitter.off(type, listener);
  }

  /**
   * A shortcut for `addEventListener` and returns `this`.
   * You can use method chaining.
   */
  public on (type: string, listener: (event: Event) => void) {
    this.addEventListener(type, listener);
    return this;
  }

  /**
   * A shortcut for `removeEventListener` and returns `this`.
   * You can use method chaining.
   */
  public off (type: string, listener: (event: Event) => void) {
    this.removeEventListener(type, listener);
    return this;
  }

  /**
   * Trigger an event.
   * @param type A event type like `"play"`, '"timeupdate"` or `"onReady"`.
   */
  public emit (type: string, ...args: any[]) {
    this.eventEmitter.emit(type, ...args);
    return this;
  }
}
