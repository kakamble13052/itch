// This file is the entry point for renderer processes

let rt;
if (process.env.ITCH_TIME_REQUIRE === "2") {
  rt = require("require-times")([".js", ".ts", ".tsx"]);
  rt.start();
}

import "./os/sf";
import env from "./env";

if (env.name !== "production") {
  require("bluebird").config({
    longStackTraces: true,
    warnings: true,
  });

  require("source-map-support").install({
    hookRequire: true,
  });
}

import "./boot/time-ago-locales";

import * as os from "./os";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";

import store from "./store/chrome-store";
import * as actions from "./actions";

if (process.env.ITCH_WHY_UPDATE === "1") {
  const { whyDidYouUpdate } = require("why-did-you-update");
  whyDidYouUpdate(React, { exclude: [/[^a-zA-Z0-9]/, /^Connect/] });
}

import setupShortcuts from "./shortcuts";
setupShortcuts(store);

import * as globalStyles from "./components/global-styles";
globalStyles.inject();

let AppContainer: React.ComponentClass<{}> = null;
try {
  const rhl = require("react-hot-loader");
  AppContainer = rhl.AppContainer;
} catch (e) {
  /* muffin */
}

import * as electron from "electron";
import App from "./components/app";

let appNode: Element;

function render(RealApp: typeof App) {
  if (rt) {
    rt.end();
    rt = null;
  }

  document.querySelector("body").classList.remove("loading");
  appNode = document.querySelector("#app");

  let rootComponent: JSX.Element;
  if (AppContainer) {
    rootComponent = (
      <AppContainer>
        <RealApp />
      </AppContainer>
    );
  } else {
    rootComponent = <RealApp />;
  }
  ReactDOM.render(
    <Provider store={store}>
      {rootComponent}
    </Provider>,
    appNode,
  );
}

if (env.name === "test") {
  window.onerror = (evt, source, line, column, err) => {
    console.error(`Unhandled error: ${err.stack}`);
    os.exit(1);
  };
}

window.addEventListener("beforeunload", () => {
  if (appNode) {
    ReactDOM.unmountComponentAtNode(appNode);
    appNode = null;
  }
});

// open actual link elements in external browser

document.addEventListener("click", (e: MouseEvent) => {
  let target = e.target as Element;

  while (target && target.tagName !== "A") {
    target = target.parentNode as Element;
  }

  if (target) {
    e.preventDefault();
    electron.remote.shell.openExternal((target as HTMLLinkElement).href);
    return false;
  }
});

// disable two-finger zoom on macOS

if (os.platform() === "darwin") {
  try {
    electron.webFrame.setVisualZoomLevelLimits(1, 1);
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.log(`couldn't disable two-finger zoom: ${e.stack || e}`);
  }
}

async function start() {
  let lang = navigator.language;
  if (env.name === "test") {
    lang = "en";
  }
  store.dispatch(actions.languageSniffed({ lang }));

  render(App);

  if ((module as any).hot) {
    (module as any).hot.accept(() => {
      const NextApp = require("./components/app").default;
      render(NextApp);
    });
  }
}

start();
