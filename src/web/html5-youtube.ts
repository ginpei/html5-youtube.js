import Html5YouTube from '../Html5YouTube';

declare global {
  // tslint:disable-next-line:interface-name
  interface Window {
    Html5YouTube: any;
  }
}

window.Html5YouTube = Html5YouTube;
