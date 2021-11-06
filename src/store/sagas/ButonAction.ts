import { put, select } from "@redux-saga/core/effects"
import { getSelectedTab, getWebView } from "../navigationsatateBysaga";

export  function *  goback(){

      const goback: initalStateType = yield select(getSelectedTab);
  const chosenTab: any = goback.navigation1.activeTab;
  const webView = getWebView(chosenTab);
  if (!webView) {
//     return { 
//         type:"goBackOnWebView",
//        resolve: Promise.resolve()};

yield put({type:"go_back"})
  }

  console.log(
    `[goBackOnWebView] Calling goBack() on webView for chosenTab "${goback.navigation1.activeTab}" while canGoBack is: ${webView}`,
  );
  webView.goBack();

     yield put({type:"go_back"})
}



export function * goForward (){
     const goForward: initalStateType = yield select(getSelectedTab);
     const chosenTab: string =  goForward.navigation1.activeTab;
     const webView = getWebView(chosenTab);
     if (!webView) {
          yield put({type:"go_forward"});
     }
   
     console.log(
       `[goForwardOnWebView] Calling goForward() on webView for chosenTab "${chosenTab}" while canGoForward is: ${webView.canGoForward}`,
     );
     webView.goForward();
     yield put({type:"go_forward"});
}



export function * reload (params:type) {
     const reloadWeb: initalStateType = yield select(getSelectedTab);
     const chosenTab: string =  reloadWeb.navigation1.activeTab;
     const webView = getWebView(chosenTab);
     if (!webView) {
          yield put({type:"reload_view"})
     }
   
     console.log(
       `[goBackOnWebView] Calling reload() on webView for chosenTab "${chosenTab}".`,
     );
     webView.reload();

    yield put({type:"reload_view"})
}



export function * stop() {

     const stopWeb: initalStateType = yield select(getSelectedTab);
  const chosenTab: string = tab || stopWeb.navigation1.activeTab;
  const webView = getWebView(chosenTab);
  if (!webView) {
     yield put({type:"Stop_WEB"})
  }

  console.log(
    `[stopWebView] Calling reload() on webView for chosenTab "${chosenTab}".`,
  );
  webView.stopLoading();

  yield put({type:"Stop_WEB"})
     
}