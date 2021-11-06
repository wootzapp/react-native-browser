import {
  put,
  select,
  fork,
  all,
  takeEvery,
  take
} from 'redux-saga/effects';
import {
  convertTextToSearchQuery,
  isValidUrl,
} from '../utils/urlBarTextHandling';

import {initalStateType} from './reducer';
import * as React from 'react';
import {SUBMITURLBARTEXTTOWEBVIEW, Types, Watchers} from './types';
import { goback, goForward, reload, stop } from './sagas/ButonAction';

type WebView = any;
type WebViewId = string;
export type TabStateRecord = Record<
  string,
  {url: string; loadProgress: number}
>;

export const webViews = new Map<WebViewId, React.RefObject<WebView>>([
  ['tab0', React.createRef<WebView>()],
]);

export function getWebView(tab: string) {
  const webViewRef = webViews.get(tab);
  console.log('webViewRef', webViewRef);
  if (!webViewRef) {
    console.error(`Unable to find webViewRef for tab "${tab}".`);
    return null;
  }
  if (!webViewRef.current) {
    console.error(`webViewRef for tab "${tab}" wasn't populated.`);
    return null;
  }

  if ((webViewRef.current as any).getNode) {
    console.log(
      `webViewRef for tab "${tab}" is an Reanimated component; calling getNode() on it.`,
    );
    return (webViewRef.current as any).getNode();
  }

  return webViewRef.current!;
}

export const getSelectedTab = (state: initalStateType) => state;

export function* submitUrlBarTextToWebViewaction(action: {
  payload: {text: string; tab: string};
}) {
  console.log('action submit url', action);
  const {text, tab} = action.payload;
  const selectedTab: initalStateType = yield select(getSelectedTab);

  const chosenTab: string = tab || selectedTab.navigation1.activeTab;
  console.log(
    '=====>submitUrlBarTextToWebViewtab',
    tab,
    chosenTab,
    selectedTab,
  );
  const webView = getWebView(chosenTab);
  console.log('=====>submitUrlBarTextToWebViewtab', webView);
  if (!webView) {
    return Promise.resolve();
  }

  const trimmedText: string = text.trim();

  if (trimmedText.length === 0) {
    return Promise.resolve();
  }

  let url: string;
  let protocol: string | null = null;

  if (trimmedText.startsWith('//')) {
    // We won't support protocol-relative URLs.
    // TODO: reject
    return Promise.resolve();
  }

  // https://stackoverflow.com/questions/2824302/how-to-make-regular-expression-into-non-greedy
  const protocolMatchArr: RegExpMatchArray | null =
    trimmedText.match(/.*?:\/\//);
  const lacksWhitespace: boolean = !/\s+/.test(trimmedText); // This is a cheap test, so we do it in preference of isValidUrl().
  if (
    protocolMatchArr === null ||
    protocolMatchArr.length === 0 ||
    trimmedText.indexOf(protocolMatchArr[0]) !== 0
  ) {
    /* No protocol at start of string. Possible Cases:
     * "bbc.co.uk", "foo bar", "what does https:// mean?", "bbc.co.uk#https://" (Safari fails this one as invalid) */
    if (lacksWhitespace && isValidUrl(trimmedText)) {
      protocol = 'http'; // It's now the server's responsibility to redirect us to HTTPS if available.
      url = `${protocol}://${trimmedText}`;
    } else {
      protocol = 'https'; // All our search engines use HTTPS
      url = convertTextToSearchQuery(trimmedText, selectedTab.searchProvider);
    }
  } else {
    // Has a protocol at start ("https://bbc.co.uk").
    protocol = protocolMatchArr[0].slice(0, -'://'.length);
    url = trimmedText;
  }

  if (protocol === 'file') {
    // We won't support file browsing (can rethink this later).
    // TODO: reject
    return Promise.resolve();
  }

  if (webView.src === url) {
    console.log(
      `[setUrlOnWebView] Setting URL on webView for chosenTab "${chosenTab}" as same as before, so reloading: ${url}`,
    );
    webView.reload();
  } else {
    console.log(
      `[setUrlOnWebView] Setting URL on webView for chosenTab "${chosenTab}" as: ${url}`,
    );
    webView.src = url;
  }

  console.log(
    `[setUrlOnWebView] Dispatching action to set url for chosenTab "${chosenTab}" as: "${url}"`,
  );
  //    return put({type:submitUrlBarTextToWebView})

  console.log("webView.canGoBack",webView.canGoBack)

  yield put({
    type: SUBMITURLBARTEXTTOWEBVIEW,
    payload: {
      url,
      canGoBack: webView.canGoBack,
      canGoForward: webView.canGoForward,
      tab: chosenTab,
    },
  });

  // return dispatch(navigationSlice.actions.setUrlOnWebView({ url, canGoBack: webView.canGoBack, canGoForward: webView.canGoForward, tab: chosenTab }));
}

export function goBackOnWebView(){
  

return {
    type:"goBackOnWebView",
    action:{}
}

  // return dispatch(navigationSlice.actions.goBackOnWebView());
  // yield put(goBack)
}

export function goForwardOnWebView() {
  
  return {
      type:"goForwardOnWebView"
  }
}

export function reloadWebView() {
  
   
  return {
    type:"reloadWebView",
}
  // return dispatch(navigationSlice.actions.reloadWebView());
}

export function stopWebView() {
  
  return {
      type:"stopweb",
  }
}

export function* updateWebViewNavigationStateaction(action:{ payload:{canGoBack: boolean,
    canGoForward: boolean,}}) {
  const tabactive: initalStateType = yield select(getSelectedTab);
  const tab = tabactive.navigation1.activeTab;
  console.log("this updateWebViewNavigationStateaction",action.payload,tab)
const  {canGoBack,canGoForward} = action.payload;
  yield put({ type: "updateWebViewNavigationState", payload:{canGoBack, canGoForward, tab}});
}

export function* setUrlOnWebViewaction(payload:{url:string}) {
     const {url} = payload;
  const tabactive: initalStateType = yield select(getSelectedTab);
  const tab = tabactive.navigation1.activeTab;
  yield put({
    type: "setUrlOnWebView",
   payload:{
    url,
    tab,
   }});
}

export function* setProgressOnWebViewaction(progress: number) {
  const tabactive: initalStateType = yield select(getSelectedTab);
  console.log("progress1234",progress.payload.progress)
  const tab = tabactive.navigation1.activeTab;
  yield put({
    type: 'setProgressOnWebView',
   payload:{
    tab,
    progress :progress.payload.progress
   },
  });
}

export function* updateUrlBarTextaction(action: {
  text: string;
  fromNavigationEvent: boolean;
}) {
  console.log('urltext', action.payload);
  yield put({type: 'updateurl', payload: action.payload});
}

function* watchupdateUrlBarText() {
  //@ts-ignore
  yield takeEvery(Watchers.updateUrlWatcher, updateUrlBarTextaction);
}

function* watchnsubmitUrlBarTextToWebView() {
  yield takeEvery(
    Watchers.submitUrlBarTextToWebViewWatcher,
    submitUrlBarTextToWebViewaction,
  );
}

function* watchsetProgressOnWebView() {
  yield takeEvery(
    Watchers.setProgressOnWebViewWatcher,
    setProgressOnWebViewaction,
  );
}

function * watchsetUrlOnWebView(){
    yield takeEvery(Watchers.setUrlOnWebViewWatcher,setUrlOnWebViewaction)
}

function * watchupdateWebViewNavigationState(){
      yield takeEvery(Watchers.updateWebViewNavigationStateWatch,updateWebViewNavigationStateaction)
}

function * watchstopWebView(){
    yield takeEvery("stopWebView",stop);
}

function * watchgoBackOnWebView(){
    yield takeEvery("goBackOnWebView",goback)
}

function * watchreloadWebView(){
    yield takeEvery("reloadWebView",reload)
}

function * watchgoForwardOnWebView(){
    yield takeEvery("goForwardOnWebView",goForward);
}



export default function* root() {
  yield all([
    fork(watchnsubmitUrlBarTextToWebView),
    fork(watchupdateUrlBarText),
    fork(watchsetProgressOnWebView),
    fork(watchsetUrlOnWebView),
    fork(watchupdateWebViewNavigationState),
    fork(watchstopWebView),
    fork(watchgoBackOnWebView),
    fork(watchreloadWebView),
    fork(watchgoForwardOnWebView)
    // fork(goForwardOnWebView),
    // fork(reloadWebView),
    // fork(stopWebView),
    // fork(setUrlOnWebView),
    // fork(setProgressOnWebView),
    // fork(updateWebViewNavigationState),
    // fork(goBackOnWebView)
  ]);
}
