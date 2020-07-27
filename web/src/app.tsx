import { FunctionalComponent, h } from "preact";
import { Route, Router, RouterOnChangeArgs } from "preact-router";

import Home from "./routes/home";
import Profile from "./routes/profile";
import NotFoundPage from "./routes/notfound";
import { Header } from "./components/header";
import SynctubeRoom from "./routes/room-synctube";
import Room from "./routes/room";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((module as any).hot) {
    // tslint:disable-next-line:no-var-requires
    require("preact/debug");
}

const App: FunctionalComponent = () => {
    let currentUrl: string;
    const handleRoute = (e: RouterOnChangeArgs) => {
        currentUrl = e.url;
    };

    return (
        <div id="app">
            <Header />
            <Router onChange={handleRoute}>
                <Route path="/" component={Home} />
                <Route path="/profile/" component={Profile} user="me" />
                <Route path="/profile/:user" component={Profile} />
                <Route path="synctube/:roomID" component={SynctubeRoom} />
                <Route path="room/:roomID" component={Room} />
                <NotFoundPage default />
            </Router>
        </div>
    );
};

export default App;
