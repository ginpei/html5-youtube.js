import Html5YouTube, { IOptions } from './Html5YouTube';

declare global {
  // tslint:disable-next-line:interface-name
  interface Window {
    Html5YouTube: any;
    youtube: (options: IOptions) => Html5YouTube;
  }
}

window.Html5YouTube = Html5YouTube;
window.youtube = (options: IOptions) => {
  return new Html5YouTube(options);
};
