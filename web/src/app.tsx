import { FunctionalComponent, h } from "preact";
import { Route, Router, RouterOnChangeArgs } from "preact-router";

import Home from "./routes/home";
import Login from "./routes/login";
import Profile from "./routes/profile";
import NotFoundPage from "./routes/notfound";
import { Header } from "./components/Header";
import Room from "./routes/room";
import { useGoogleLoginAPI, GAPIContext } from "./utils/GAPI";
import { RenderAllNotifications } from "./components/Notification";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((module as any).hot) {
    // tslint:disable-next-line:no-var-requires
    require("preact/debug");
}

const App: FunctionalComponent = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let currentUrl: string;
    const handleRoute = (e: RouterOnChangeArgs): void => {
        currentUrl = e.url;
    };

    const GAPI = useGoogleLoginAPI();

    return (
        <GAPIContext.Provider value={GAPI}>
            <div id="app">
                <Header />
                <RenderAllNotifications />
                <Router onChange={handleRoute}>
                    <Route path="/" component={Home} />
                    <Route path="/profile" component={Profile} />
                    <Route path="/login" component={Login} />
                    <Route path="room/:roomID" component={Room} />
                    <NotFoundPage default />
                </Router>
            </div>
        </GAPIContext.Provider>
    );
};

export default App;
