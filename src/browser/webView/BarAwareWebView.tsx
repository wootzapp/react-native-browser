import * as React from 'react';
import {connect} from 'react-redux';
// import {WholeStoreState} from '../../store/store';
import {
  webViews,
  // updateUrlBarText,
  TabStateRecord,
  
} from '../../store/navigationsatateBysaga';
import {ViewProps, Platform, ViewStyle, View} from 'react-native';
import {WebView} from 'react-native-webview';
import {
  IOSWebViewProps,
  WebViewNavigationEvent,
  WebViewProgressEvent,
} from 'react-native-webview/lib/WebViewTypes';
import Animated from 'react-native-reanimated';
import {HeaderConfig} from '../browserConfig';
import {
  DEFAULT_HEADER_RETRACTED_HEIGHT,
  DEFAULT_HEADER_REVEALED_HEIGHT,
} from '../header/TabLocationView';
import {useNavigation} from '@react-navigation/native';
import { updateUrlBarText,setProgressOnWebView,updateWebViewNavigationState } from '../../store/action';

import { NavigationContext} from '@react-navigation/native-stack';

export type BarAwareWebViewType = (
  props: BarAwareWebViewOwnProps,
) => React.ReactNode;

export interface BarAwareWebViewOwnProps {
  headerConfig: HeaderConfig;
  scrollY: Animated.Value<number>;
  scrollEndDragVelocity: Animated.Value<number>;
}
export interface BarAwareWebViewConnectedProps {
  updateUrlBarText: typeof updateUrlBarText;
  setProgressOnWebView: typeof setProgressOnWebView;
  updateWebViewNavigationState: typeof updateWebViewNavigationState;
  activeTab: string;
  tabs: TabStateRecord;
}
export type BarAwareWebViewProps = BarAwareWebViewOwnProps &
  BarAwareWebViewConnectedProps;

const IosWebView = WebView as React.ComponentClass<IOSWebViewProps>;
const AnimatedIosWebView = Animated.createAnimatedComponent(
  IosWebView,
) as React.ComponentClass<Animated.AnimateProps<ViewStyle, IOSWebViewProps>>;

export const DefaultBarAwareWebView: BarAwareWebViewType = (
  props: BarAwareWebViewOwnProps,
) => <BarAwareWebViewConnected {...props} />;

export class BarAwareWebView extends React.Component<
  BarAwareWebViewProps & ViewProps,
  {}
> {

     
  constructor(props:any){
       super(props)
  }


  

  componentDidMount() {
    // this.props.navigation.addListener('didFocus', payload => {
    //   this.forceUpdate();
    // });
   const contextdata = NavigationContext;
    console.log("this,.props",contextdata)
  }
  componentWillUnmount() {
    // this.props.navigation.removeListener('didFocus');
  }

  private readonly onLoadStarted = (event: WebViewNavigationEvent) => {
    const {url, navigationType, canGoBack, canGoForward} = event.nativeEvent;
    // console.log('canGoBack', canGoBack, canGoForward,url);
    console.log("event",event.nativeEvent);
    if (canGoBack) {
      // this.props.navigation.goBack();
      return;
    }
    //TODO: Navigation code goes to here...........
   // TODO: 1. check previous route = new route if yes then dont do any thing else push to another page

    if (url === 'https://www.birchlabs.co.uk/') {
      this.props.navigation.navigate('Home');
    } else if (url === 'https://birchlabs.co.uk/games') {
      this.props.navigation.navigate('Games', {URL: url});
    } else if (url === 'https://birchlabs.co.uk/experiments') {
      this.props.navigation.navigate('Experiments');
    } else if (url === 'https://birchlabs.co.uk/blog/') {
      this.props.navigation.navigate('Blog');
    } else if (url === 'https://birchlabs.co.uk/music') {
      this.props.navigation.navigate('Music');
    } else if (url === 'https://birchlabs.co.uk/about') {
      this.props.navigation.navigate('About');
    } else {
      this.props.navigation.navigate('Home');
    }

    // //TODO: handle errors
    this.props.updateWebViewNavigationState({
      canGoBack,
      canGoForward,
      // tab: this.props.activeTab,
    });
  };

  private readonly onLoadCommitted = (event: WebViewNavigationEvent) => {
    // const {url, navigationType, canGoBack, canGoForward} = event.nativeEvent;
    // console.log(
    //   `[WebView onLoadCommitted] url ${url} navigationType ${navigationType}`,
    // );
    // if (Platform.OS === 'ios' || Platform.OS === 'macos') {
    //   /* iOS seems to fire loading events on the non-main frame, so onLoadCommitted event is the best one on which to update the main-frame URL.
    //    * This event doesn't exist on Android to my knowledge, so I haven't hooked it up in BetterWebView. */
    //   this.props.updateUrlBarText({text: url, fromNavigationEvent: true});
    // }
    // this.props.updateWebViewNavigationState({
    //   canGoBack,
    //   canGoForward,
    //   tab: this.props.activeTab,
    // });
  };

  private readonly onLoadFinished = (event: WebViewNavigationEvent) => {
    // const {url, navigationType, canGoBack, canGoForward} = event.nativeEvent;

    // console.log(
    //   `[WebView onLoadFinished] url ${url} navigationType ${navigationType}`,
    // );

    // if (url === 'https://www.birchlabs.co.uk/') {
    //   this.props.navigation.navigate('Home');
    // } else if (url === 'https://birchlabs.co.uk/games') {
    //   this.props.navigation.navigate('Games', {URL: url});
    // } else if (url === 'https://birchlabs.co.uk/experiments') {
    //   this.props.navigation.navigate('Experiments');
    // } else if (url === 'https://birchlabs.co.uk/blog/') {
    //   this.props.navigation.navigate('Blog');
    // } else if (url === 'https://birchlabs.co.uk/music') {
    //   this.props.navigation.navigate('Music');
    // } else {
    //   this.props.navigation.navigate('About');
    // }

    // TODO: handle errors

    // if (Platform.OS === 'android') {
    //   /* TODO: check whether Android fires onLoadFinished at sensible moments for updating the URL bar text. */
    //   this.props.updateUrlBarText({text: url, fromNavigationEvent: true});
    // }
    // this.props.updateWebViewNavigationState({
    //   canGoBack,
    //   canGoForward,
    //   tab: this.props.activeTab,
    // });
  };

  private readonly onProgress = (event: WebViewProgressEvent) => {
    const {url, progress, canGoBack, canGoForward} = event.nativeEvent;
    console.log(`[WebView onLoadProgress] progress ${progress}`);

    this.props.setProgressOnWebView(progress);
    this.props.updateWebViewNavigationState(
      {canGoBack,
      canGoForward,}
      // tab: this.props.activeTab,
    );
  };

  // const MyWebView = ({ children, ...rest }) => React.createElement(WebView, props, children);

  render() {
    const { headerConfig, activeTab, tabs, style, children, ...rest } = this.props;
     console.log(" activeTab, tabs", activeTab, tabs)
    return (
      <AnimatedIosWebView
        // source={{
        //   uri: this.props.URL,
        // }}
        source={{
          uri: tabs[activeTab].url,
      }}
        // TODO: will have to solve how best to build one webView for each tab, give it a unique ref, and allow animation between tabs.
        // ref={webViews}
        ref={webViews.get(activeTab)}
        // onScroll={Animated.event(
        //   [
        //     {
        //       nativeEvent: {
        //         panGestureTranslationInWebView: {
        //           // y: this.props.scrollY,
        //           y: y => {
        //             return Animated.block([
        //               Animated.cond(
        //                 /* We won't update scrollY if there was no panGesture movement.
        //                  * This is necessary because onScroll is called without gestures
        //                  * sometimes, e.g. due to autolayout when first initialising. */
        //                 Animated.neq(y, 0),

        //                 /* We always receive a gesture relative to 0.
        //                  * e.g. when panning down (scrolling up): +3, 9, 12, 20.
        //                  * It needs to be added to the current this.props.scrollY to make sense. */
        //                 Animated.set(
        //                   this.props.scrollY,
        //                   Animated.max(
        //                     -HEADER_RETRACTION_DISTANCE,
        //                     Animated.min(
        //                       HEADER_RETRACTION_DISTANCE,
        //                       Animated.add(this.props.scrollY, y),
        //                     ),
        //                   ),
        //                 ),
        //               ),
        //               Animated.call([y], r => {
        //                 // console.log(`Reanimated got arg`, r[0]);
        //               }),
        //             ]);
        //           },
        //         },
        //       },
        //     },
        //   ],
        //   {
        //     useNativeDriver: true,
        //   },
        // )}
        // onScrollEndDrag={Animated.event(
        //   [
        //     {
        //       nativeEvent: {
        //         velocity: {
        //           y: this.props.scrollEndDragVelocity,
        //         },
        //       },
        //     },
        //   ],
        //   {
        //     useNativeDriver: true,
        //   },
        // )}
        onLoadStart={this.onLoadStarted}    //--1
        // onLoadCommit={this.onLoadCommitted}
        // onLoadEnd={this.onLoadFinished}
        onLoadProgress={this.onProgress}
      />
    );
  }
}





const mapStateToprops = (state)=>({
  activeTab: state.navigation1.activeTab,
  tabs: state.navigation1.tabs,
})





export const BarAwareWebViewConnected = connect(
  mapStateToprops,
  {
    updateUrlBarText,
    setProgressOnWebView,
    updateWebViewNavigationState,
  },
)(BarAwareWebView);
function retun(children: any) {
  throw new Error('Function not implemented.');
}

