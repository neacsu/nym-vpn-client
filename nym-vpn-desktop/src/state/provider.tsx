import { invoke } from '@tauri-apps/api';
import React, { useEffect, useReducer } from 'react';
import { MainDispatchContext, MainStateContext } from '../contexts';
import { sleep } from '../helpers';
import { Cli } from '../types';
import init from './init';
import { initialState, reducer } from './main';
import { useTauriEvents } from './useTauriEvents';

type Props = {
  children?: React.ReactNode;
};

export function MainStateProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useTauriEvents(dispatch);

  // initialize app state
  useEffect(() => {
    init(dispatch).then(async () => {
      dispatch({ type: 'init-done' });
      const args = await invoke<Cli>(`cli_args`);
      // skip the animation if NOSPLASH is set
      if (import.meta.env.APP_NOSPLASH || args?.nosplash) {
        return;
      }
      // wait for the splash screen to be visible for a short time as
      // init phase is very fast, avoiding flashing the splash screen
      // note: the real duration of splashscreen is this value minus the one
      // declared in `App.tsx`, that is 700 - 100 → 600ms
      await sleep(700);
      const splash = document.getElementById('splash');
      if (splash) {
        // starts the fade out animation
        splash.style.opacity = '0';
        // fade out animation duration is set to 150ms, so we wait 300ms
        // to ensure it's done before removing the splash screen
        await sleep(300);
        splash.remove();
      }
    });
  }, []);

  return (
    <MainStateContext.Provider value={state}>
      <MainDispatchContext.Provider value={dispatch}>
        {children}
      </MainDispatchContext.Provider>
    </MainStateContext.Provider>
  );
}
