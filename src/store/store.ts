import { configureStore } from "@reduxjs/toolkit";
import { rootReducer, RootReducer ,} from "./rootReducer";
import thunk, { ThunkAction } from "redux-thunk";
import { Action, createStore,applyMiddleware } from 'redux';
import {persistStore,persistReducer} from "redux-persist";
import * as SecureStore from 'expo-secure-store';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import createSecureStore from '@neverdull-agency/expo-unlimited-secure-store';
import createSagaMiddleware from 'redux-saga'
import root from "./navigationsatateBysaga";
import {createLogger} from "redux-logger";


const logger = createLogger({
    timestamp : true,
    diff : false,
});

const storage = createSecureStore();
const sagaMiddleware = createSagaMiddleware()

const persistConfig = {
    key: 'root',
    storage:storage
}
  
const persistedReducer = persistReducer(persistConfig, rootReducer)
// export const store = configureStore({
//     reducer: rootReducer,
//     middleware: [thunk],
// });

// }
let store = createStore(persistedReducer,applyMiddleware(sagaMiddleware,logger));

sagaMiddleware.run(root);


export default () => {
   
    let persistor = persistStore(store)
    return { store, persistor}
  }


// export type WholeStoreState = RootReducer;
// // https://redux.js.org/recipes/usage-with-typescript/#usage-with-redux-thunk
// export type AppThunk<ReturnType = void> = ThunkAction<
//     ReturnType,
//     WholeStoreState,
//     null,
//     Action<string>
// >;