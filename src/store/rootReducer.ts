import { combineReducers } from "@reduxjs/toolkit";
import { navigationSliceReducer } from "./navigationState";
import { uiSliceReducer } from "./uiState";
import navigationSagareducer from "./reducer"

export const rootReducer = combineReducers({
    ui: uiSliceReducer, 
    // navigation: navigationSliceReducer,
    navigation1: navigationSagareducer
});

export type RootReducer = ReturnType<typeof rootReducer>;