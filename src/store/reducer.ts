import {SearchProvider} from '../utils/urlBarTextHandling';
import {SUBMITURLBARTEXTTOWEBVIEW} from './types';

export type initalStateType = {
  activeTab: string;
  tabs: {
    tab0: {
      url: string;
      isSecure: boolean;
      loadProgress: Number;
      canGoBack: boolean;
      canGoForward: boolean;
    };
  };
  urlBarText: string;
  searchProvider: SearchProvider;
};

const initialPage: string = 'https://www.birchlabs.co.uk';

export const initialState: initalStateType = {
  activeTab: 'tab0',
  tabs: {
    tab0: {
      url: initialPage,
      isSecure: true,
      loadProgress: 0,
      canGoBack: false,
      canGoForward: false,
    },
  },
  urlBarText: initialPage,
  searchProvider: SearchProvider.DuckDuckGo,
};

export default function (state = initialState, action:any) {
  switch (action.type) {
    case SUBMITURLBARTEXTTOWEBVIEW:
      {console.log("===>",action.payload);
      const {url,canGoBack,canGoForward} = action.payload;
      return {
        ...state,
        tabs:{
          [action.payload.tab]:{
            ...state.tabs[action.payload.tab],
            url,
            canGoBack,
            canGoForward
          }
        }
        
      };}

    case 'updateurl':
      {if (action.payload.fromNavigationEvent) {
        return {
          ...state,
          tabs: {
            [action.activeTab]: {
              isSecure: action.payload.text.startsWith('https://')
                ? true
                : action.payload.text.startsWith('http://')
                ? false
                : null,
            },
          },
        };
        // state.tabs[state.activeTab].isSecure = text.startsWith("https://") ? true : text.startsWith("http://") ? false : null;
      } else {
        return {
          ...state,
          urlBarText: action.payload.text,
        };
      }}

    case 'updateWebViewNavigationState':
     { const {canGoBack, canGoForward,} = action.payload;
      console.log("updateWebViewNavigationState",action.payload);

      return {
        ...state,
        tabs: {
          [action.payload.tab]: {
            ...state.tabs[action.payload.tab],
            canGoBack,
            canGoForward,
          },
        },
      };}
     case "setUrlOnWebView":
     
        {return {
           ...state,
           tabs:{
            [action.payload.tab]: {
            ...state.tabs[action.payload.tab],
            url: action.payload.url,
            isSecure: action.payload.url.startsWith("https://") ? true : action.payload.url.startsWith("http://") ? false : null,
            loadProgress: 0,}
           }
         }}
     
         case "setProgressOnWebView" :{ 
           
          const { progress,} = action.payload;
         return {
           ...state,
           tabs:{
             [action.payload.tab] :{
                ...state.tabs[action.payload.tab],
              loadProgress:progress
             }
           }
         }}

    default:
      return state;
  }
}
