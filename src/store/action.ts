import {SUBMITURLBARTEXTTOWEBVIEW, Watchers} from './types';

export const submitUrlBarTextToWebView = (text: string, tab: string) => {
  return {
    type: Watchers.submitUrlBarTextToWebViewWatcher,
    payload: {
      text,
      tab,
    },
  };
};

export const goBack = (value: object) => {
  return {
    type: 'GOBACK',
    payload: value,
  };
};

export const updateUrlBarText = (
  text: string,
  fromNavigationEvent: boolean,
) => {
  console.log('data', text);
  return {
    type: Watchers.updateUrlWatcher,
    payload: {
      text,
      fromNavigationEvent,
    },
  };
};

export const  setProgressOnWebView = (
  progress: number,
) => {
  return {
    type: Watchers.setProgressOnWebViewWatcher,
    payload:{
        progress,
    }
   
  };
};

export const  setUrlOnWebView = (url: string,) => {
  return {
    type: Watchers.setUrlOnWebViewWatcher,
   payload:{
    url,
   }
  };
};

export const updateWebViewNavigationState = (
  payload:{canGoBack: boolean,
    canGoForward: boolean,}
 
) => {
  return {
    type: Watchers.updateWebViewNavigationStateWatch,
    payload,
  };
};
