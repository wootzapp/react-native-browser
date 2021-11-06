import * as React from "react";
import { connect } from 'react-redux';
import { WholeStoreState } from "../../store/store";
import { View, Animated, ViewProps } from "react-native";

interface GradientProgressBarOwnProps {
    trackColor?: string,
}

interface GradientProgressBarConnectedProps {
    progress: number,
}

export type GradientProgressBarProps = GradientProgressBarOwnProps & GradientProgressBarConnectedProps & ViewProps;
export type GradientProgressBarType = (props: GradientProgressBarOwnProps) => React.ReactNode;
export const defaultGradientProgressBar = (props: GradientProgressBarOwnProps) => <GradientProgressBarConnected {...props}/>;

interface State {
    // Both between 0 and 1
    barOpacity: Animated.Value,
    barWidth: Animated.Value,
}

export const GRADIENT_PROGRESS_BAR_HEIGHT: number = 2;

// https://github.com/cliqz/user-agent-ios/blob/develop/Client/Frontend/Browser/TabLocationView.swift
class GradientProgressBar extends React.Component<GradientProgressBarProps, State>{
    constructor(props: GradientProgressBarProps){
        super(props);

        this.state = {
            barWidth: new Animated.Value(props.progress),
            barOpacity: new Animated.Value(props.progress === 1 ? 0 : 1)
        };
    }

    shouldComponentUpdate(nextProps: Readonly<GradientProgressBarProps>, nextState: Readonly<State>, nextContext: any): boolean {
        // console.log(`[GradientProgressBar] shouldComponentUpdate with this.props.progress ${this.props.progress}, nextProps.progress ${nextProps.progress},`);
        if(this.props.progress !== nextProps.progress){
            if(nextProps.progress === 1){
                nextState.barOpacity.stopAnimation(
                    () => {
                        Animated.timing(nextState.barOpacity, {
                            toValue: 0,
                            duration: 500
                        })
                        .start();
                    }
                );
            }
            if(nextProps.progress < this.props.progress){
                nextState.barWidth.stopAnimation(() => {
                    nextState.barWidth.setValue(nextProps.progress);
                    nextState.barOpacity.setValue(1);
                });
            } else {
                nextState.barWidth.stopAnimation(() => {
                    Animated.timing(nextState.barWidth, {
                        toValue: nextProps.progress,
                        duration: 10,
                    })
                    .start();
                });
            }
        }

        return true;
    }

    render(){
        const { progress, trackColor = "blue", ...rest } = this.props;

        // console.log(`[GradientProgressBar] rendering with progress ${progress}`);

        return (
            <Animated.View
                style={{
                    flexDirection: "row",
                    // Or is it justifyContent?
                    alignItems: "flex-start",
                    width: "100%",
                    height: "auto",
                    backgroundColor: "transparent",
                }}

                // This is declared in app/components/AppContainer.scss
                // className={progress === 1 ? "fade-out-anim" : ""}
                {...rest}
            >
                <Animated.View
                    style={{
                        height: GRADIENT_PROGRESS_BAR_HEIGHT,
                        backgroundColor: trackColor,
                        width: this.state.barWidth.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                        }),
                        opacity: this.state.barOpacity.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                        }),
                        // opacity: progress === 1 ? 0 : 1,
                    }}
                />
            </Animated.View>
        );
    }
}

export const GradientProgressBarConnected = connect(
    (wholeStoreState: WholeStoreState) => {
        console.log(`wholeStoreState`, wholeStoreState);
        const { activeTab, tabs } = wholeStoreState.navigation1;

        return {
            progress: tabs[activeTab].loadProgress,
        };
    },
    {},
)(GradientProgressBar);