import * as React from "react";
import { URLBarView } from "./URLBarView";
import { TopTabsViewController } from "./TopTabsViewController";
import { Header, RetractibleHeaderConnected } from "./Header";
import { TabToolbar } from "./TabToolbar";
import { connect } from "react-redux";
import { WholeStoreState } from "~/store/store";
import { webViews, updateUrlBarText, TabStateRecord, setProgressOnWebView } from "~/store/navigationState";
import { setBarsRetraction, RetractionState } from "~/store/barsState";
import { View, Text, ViewProps, StyleSheet, TouchableWithoutFeedback, TouchableWithoutFeedbackProps, ScrollView, SafeAreaView, Platform, findNodeHandle } from "react-native";
import { WebView } from 'react-native-webview';
import { IOSWebViewProps, WebViewNavigationEvent, WebViewProgressEvent } from 'react-native-webview/lib/WebViewTypes';
import { SafeAreaProvider, SafeAreaConsumer, EdgeInsets } from 'react-native-safe-area-context';
import { GradientProgressBarConnected } from "~/Widgets/GradientProgressBar";
import Animated, { not } from "react-native-reanimated";
import { FooterConnected } from "./Footer";
import { HEADER_RETRACTED_HEIGHT, HEADER_REVEALED_HEIGHT, HEADER_RETRACTION_DISTANCE } from "./TabLocationView";
const { diffClamp, interpolate, event: reanimatedEvent, multiply, add, cond, lessThan, neq, Clock, Extrapolate, clockRunning, set, startClock, spring, sub, stopClock, eq } = Animated;

const BrowserViewControllerUX = {
    ShowHeaderTapAreaHeight: 0,
    BookmarkStarAnimationDuration: 0.5,
    BookmarkStarAnimationOffset: 80,
}

// https://github.com/cliqz/user-agent-ios/blob/develop/Client/Frontend/Browser/BrowserViewController.swift#L128
class TopTabsContainer extends React.Component<{}, {}> {
    render(){
        return (
            // UIView()
            <View style={{ flexDirection: "column" }}>
                {/* topTabsViewController.view */}
                <TopTabsViewController/>
            </View>
        );
    }
}


// https://github.com/cliqz/user-agent-ios/blob/develop/Client/Frontend/Browser/BrowserViewController.swift#L110
class WebViewContainerBackdrop extends React.Component<ViewProps, {}> {
    render(){
        const { style, children, ...rest } = this.props;

        return (
            // UIView()
            <View
                style={StyleSheet.compose(
                    {
                        flexDirection: "column",
                        width: "100%",
                        height: "100%",
                    },
                    style
                )}
                // opacity={0.5}
                // backgroundColor={"purple"}
                {...rest}
            />
        );
    }
}

interface WebViewContainerProps {
    scrollY: Animated.Value<number>,
    scrollEndDragVelocity: Animated.Value<number>,
    snapOffset: Animated.Value<number>,
    animatedNavBarTranslateY: Animated.Node<number>,
    animatedTitleOpacity: Animated.Node<number>,

    barsState: WholeStoreState["bars"],
    activeTab: string,
    tabs: TabStateRecord,
    updateUrlBarText: typeof updateUrlBarText,
    setProgressOnWebView: typeof setProgressOnWebView,
    // setHeaderRetraction: typeof setHeaderRetraction,
    // setFooterRetraction: typeof setFooterRetraction,
    setBarsRetraction: typeof setBarsRetraction,
}

const IosWebView = WebView as React.ComponentClass<IOSWebViewProps>;
const AnimatedIosWebView = Animated.createAnimatedComponent(IosWebView) as React.ComponentClass<IOSWebViewProps>;
const DRAG_END_INITIAL: number = 10000000;
const NAV_BAR_HEIGHT: number = 44;

// https://github.com/rgommezz/reanimated-collapsible-navbar/blob/master/App.js#L36
function runSpring({
    clock,
    from,
    velocity,
    toValue,
    scrollEndDragVelocity,
    snapOffset,
    diffClampNode,
}) {
    const state = {
        finished: new Animated.Value(0),
        velocity: new Animated.Value(0),
        position: new Animated.Value(0),
        time: new Animated.Value(0),
    };

    const config = {
        damping: 1,
        mass: 1,
        stiffness: 50,
        overshootClamping: true,
        restSpeedThreshold: 0.001,
        restDisplacementThreshold: 0.001,
        toValue: new Animated.Value(0),
    };

    return [
        cond(clockRunning(clock), 0, [
            set(state.finished, 0),
            set(state.velocity, velocity),
            set(state.position, from),
            set(config.toValue, toValue),
            startClock(clock),
        ]),
        spring(clock, state, config),
        cond(state.finished, [
            set(scrollEndDragVelocity, DRAG_END_INITIAL),
            set(
                snapOffset,
                cond(
                    eq(toValue, 0),
                    // SnapOffset acts as an accumulator.
                    // We need to keep track of the previous offsets applied.
                    add(snapOffset, multiply(diffClampNode, -1)),
                    add(snapOffset, sub(NAV_BAR_HEIGHT, diffClampNode)),
                ),
            ),
            stopClock(clock),
        ]),
        state.position,
    ];
}

class WebViewContainer extends React.Component<WebViewContainerProps & ViewProps, { }> {
    private readonly onBarRetractionRecommendation = (e) => {
        // console.log(`WebView onBarRetractionRecommendation ${Object.keys(e)}`);
        
        if(e.nativeEvent.recommendation === "retract"){
            // Gesture flings the scrollView upwards (scrolls downwards)
            this.props.setBarsRetraction({ bars: "both", animated: true, retraction: RetractionState.retracted });
        } else {
            this.props.setBarsRetraction({ bars: "both", animated: true, retraction: RetractionState.revealed });
        }
    };

    private readonly onLoadStarted = (event: WebViewNavigationEvent) => {
        const { url, navigationType } = event.nativeEvent;

        console.log(`[WebView onLoadStarted] url ${url} navigationType ${navigationType}`);
        
        // TODO: handle errors
    };

    private readonly onLoadCommitted = (event: WebViewNavigationEvent) => {
        const { url, navigationType } = event.nativeEvent;

        console.log(`[WebView onLoadCommitted] url ${url} navigationType ${navigationType}`);

        if(Platform.OS === "ios" || Platform.OS === "macos"){
            /* iOS seems to fire loading events on the non-main frame, so onLoadCommitted event is the best one on which to update the main-frame URL.
             * This event doesn't exist on Android to my knowledge, so I haven't hooked it up in BetterWebView. */
            this.props.updateUrlBarText(url);
        }
    };

    private readonly onLoadFinished = (event: WebViewNavigationEvent) => {
        const { url, navigationType } = event.nativeEvent;

        console.log(`[WebView onLoadFinished] url ${url} navigationType ${navigationType}`);

        // TODO: handle errors

        if(Platform.OS === "android"){
            /* TODO: check whether Android fires onLoadFinished at sensible moments for updating the URL bar text. */
            this.props.updateUrlBarText(url);
        }
    };

    private readonly onProgress = (event: WebViewProgressEvent) => {
        const { url, progress } = event.nativeEvent;
        console.log(`[WebView onLoadProgress] progress ${progress}`);

        this.props.setProgressOnWebView({ progress, tab: this.props.activeTab });
    };

    // const MyWebView = ({ children, ...rest }) => React.createElement(WebView, props, children);

    render(){
        const { activeTab, tabs, barsState, style, children, ...rest } = this.props;

        return (
            // UIView()
            <View
                style={StyleSheet.compose(
                    {
                        flexDirection: "column",
                        width: "100%",
                        height: "100%",
                    },
                    style
                )}
                {...rest}
            >
                <AnimatedIosWebView
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                    source={{
                        uri: tabs[activeTab].url,
                    }}
                    // TODO: will have to solve how best to build one webView for each tab, give it a unique ref, and allow animation between tabs.
                    ref={webViews.get(activeTab)}
                    // onPan={this.onPan}
                    // onRetractBarsRecommendation={this.onBarRetractionRecommendation}
                    onScroll={reanimatedEvent(
                        [
                            {
                                nativeEvent: {
                                    panGestureTranslationInWebView: {
                                        // y: this.props.scrollY,
                                        y: (y) => {
                                            return Animated.block([
                                                Animated.cond(
                                                    /* We won't update scrollY if there was no panGesture movement.
                                                     * This is necessary because onScroll is called without gestures
                                                     * sometimes, e.g. due to autolayout when first initialising. */
                                                    Animated.neq(y, 0),
                                                       
                                                    /* We always receive a gesture relative to 0.
                                                    * e.g. when panning down (scrolling up): +3, 9, 12, 20.
                                                    * It needs to be added to the current this.props.scrollY to make sense. */
                                                    Animated.set(
                                                        this.props.scrollY,
                                                        Animated.max(
                                                            -HEADER_RETRACTION_DISTANCE,
                                                            Animated.min(
                                                                HEADER_RETRACTION_DISTANCE,
                                                                Animated.add(
                                                                    this.props.scrollY,
                                                                    y,
                                                                )
                                                            ),
                                                        ),
                                                    ),
                                                ),
                                                Animated.call(
                                                    [y],
                                                    (r) => {
                                                        console.log(`Reanimated got arg`, r[0]);
                                                    }
                                                )
                                            ]);
                                        }
                                    }
                                }
                            }
                        ],
                        {
                            useNativeDriver: true
                        }
                    )}
                    onScrollEndDrag={reanimatedEvent(
                        [
                            {
                                nativeEvent: {
                                    velocity: {
                                        y: this.props.scrollEndDragVelocity
                                    }
                                }
                            }
                        ],
                        {
                            useNativeDriver: true
                        }
                    )}
                    onLoadStart={this.onLoadStarted}
                    onLoadCommit={this.onLoadCommitted}
                    onLoadEnd={this.onLoadFinished}
                    onLoadProgress={this.onProgress}
                    // Feeding in either bar's state is sufficient for now, unless we find a reason to start retracting them independently.
                    // barRetractionState={barsState.footer.retraction}
                />
            </View>
        );
    }
}

const WebViewContainerConnected = connect(
    (wholeStoreState: WholeStoreState) => {
        // console.log(`wholeStoreState`, wholeStoreState);
        return {
            barsState: wholeStoreState.bars,
            activeTab: wholeStoreState.navigation.activeTab,
            tabs: wholeStoreState.navigation.tabs,
        };
    },
    {
        updateUrlBarText,
        setProgressOnWebView,
        // setHeaderRetraction,
        // setFooterRetraction,
        setBarsRetraction,
    },
)(WebViewContainer);

// https://github.com/cliqz/user-agent-ios/blob/develop/Client/Frontend/Browser/BrowserViewController.swift#L104
/**
 * TopTouchArea serves as an opaque status bar that can be tapped to scroll
 * back to the top of any scrollview that is made its subordinate in some way.
 */
class TopTouchArea extends React.Component<TouchableWithoutFeedbackProps, {}> {
    private readonly onPress = (e) => {
        console.log(`[TopTouchArea.onTap]`);
    };
    
    render(){
        const { children, ...rest } = this.props;

        // A Button would be more semantic, but is restricted to the Safe Area.

        return (
            <TouchableWithoutFeedback
                style={{
                    backgroundColor: "red",
                    // The trick here is that this background colour overflows beyond the safe area.
                    width: "100%",
                    height: 0,
                }}
                {...rest}
                onPress={this.onPress}
                // row={0}
            />
        );
    }
}

// https://github.com/cliqz/user-agent-ios/blob/develop/Client/Frontend/Browser/BrowserViewController.swift#L70
class AlertStackView extends React.Component<ViewProps, {}> {
    render(){
        const { style, children, ...rest } = this.props;

        return (
            <View
                style={StyleSheet.compose(
                    {
                        flexDirection: "column",
                    },
                    style
                )}
                {...rest}
            />
        );
    }
}

// https://github.com/cliqz/user-agent-ios/blob/develop/Client/Frontend/Browser/BrowserViewController.swift#L65
class OverlayBackground extends React.Component<ViewProps, {}> {
    render(){
        const { style, ...rest } = this.props;

        return (
            // UIVisualEffectView()
            <View
                style={StyleSheet.compose(
                    {
                        flexDirection: "column",
                    },
                    style
                )}
            />
        );
    }
}

interface Props {
    orientation: "portrait"|"landscape"|"unknown",
}

interface State {

}

export class BrowserViewController extends React.Component<Props, State> {
    private readonly scrollY = new Animated.Value(HEADER_RETRACTION_DISTANCE);
    private readonly scrollEndDragVelocity = new Animated.Value(DRAG_END_INITIAL);
    private readonly snapOffset = new Animated.Value(0);
    private readonly animatedNavBarTranslateY: Animated.Node<number>;
    private readonly animatedTitleOpacity: Animated.Node<number>;

    constructor(props: Props){
        super(props);

        // const diffClampNode = diffClamp(
        //     add(this.scrollY, this.snapOffset),
        //     0,
        //     NAV_BAR_HEIGHT,
        // );
        // const inverseDiffClampNode = multiply(diffClampNode, -1);

        // const clock = new Clock();

        // const snapPoint = cond(
        //     lessThan(diffClampNode, NAV_BAR_HEIGHT / 2),
        //     0,
        //     -NAV_BAR_HEIGHT,
        // );

        // this.animatedNavBarTranslateY = cond(
        //     // Condition to detect if we stopped scrolling
        //     neq(this.scrollEndDragVelocity, DRAG_END_INITIAL),
        //     runSpring({
        //         clock,
        //         from: inverseDiffClampNode,
        //         velocity: 0,
        //         toValue: snapPoint,
        //         scrollEndDragVelocity: this.scrollEndDragVelocity,
        //         snapOffset: this.snapOffset,
        //         diffClampNode,
        //     }),
        //     inverseDiffClampNode,
        // );

        this.animatedNavBarTranslateY = interpolate(this.scrollY, {
            // -y means finger is moving upwards (so bar should retract)
            inputRange: [-(HEADER_RETRACTION_DISTANCE), (HEADER_RETRACTION_DISTANCE)],
            outputRange: [HEADER_RETRACTED_HEIGHT, HEADER_REVEALED_HEIGHT],

            /* To disable header retraction */
            // outputRange: [HEADER_REVEALED_HEIGHT, HEADER_REVEALED_HEIGHT],
            
            extrapolate: Extrapolate.CLAMP,
        });

        this.animatedTitleOpacity = interpolate(this.scrollY, {
            inputRange: [-(HEADER_RETRACTION_DISTANCE), (HEADER_RETRACTION_DISTANCE)],
            outputRange: [0, 1],
            extrapolate: Extrapolate.CLAMP,
        });
    }

    render(){
        const { orientation } = this.props;
        // Visibility of certain components changes when switching app (if in private browsing mode)
        // https://github.com/cliqz/user-agent-ios/blob/develop/Client/Frontend/Browser/BrowserViewController.swift#L343

        return (
            <View
                // stretchLastChild={true}
                style={{
                    flex: 1,
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                }}
            >
                <RetractibleHeaderConnected
                    scrollY={this.scrollY}
                    animatedTitleOpacity={this.animatedTitleOpacity}
                    animatedNavBarTranslateY={this.animatedNavBarTranslateY}
                    orientation={orientation}
                />

                <View
                    // dock={"bottom"}
                    // stretchLastChild={true}
                    style={{
                        flex: 1,
                        width: "100%",
                        height: "100%",
                        flexGrow: 1,
                        alignItems:"center",
                        // justifyContent: "flex-start",
                        backgroundColor:"green",
                        flexDirection: "column",
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                            flexDirection: "column",
                            width: "100%",
                            // height: "100%",
                            // flexGrow: 1,
                        }}
                    >
                        <WebViewContainerBackdrop
                            style={{
                                backgroundColor: "gold",
                                position: "absolute",
                            }}
                        />
                        <WebViewContainerConnected
                            style={{
                                position: "absolute",
                                flexGrow: 1,
                            }}
                            scrollY={this.scrollY}
                            scrollEndDragVelocity={this.scrollEndDragVelocity}
                            snapOffset={this.snapOffset}
                            animatedNavBarTranslateY={this.animatedNavBarTranslateY}
                            animatedTitleOpacity={this.animatedTitleOpacity}
                        />
                    </View>

                    <FooterConnected
                        scrollY={this.scrollY}
                        orientation={orientation}
                        showToolbar={true}
                    />
                </View>
            </View>
        );
    }
}